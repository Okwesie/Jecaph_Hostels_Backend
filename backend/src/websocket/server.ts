import { Server as WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { config } from '../config/env';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  hostelId?: string;
  isAlive?: boolean;
}

class WSServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (_info, cb) => {
        // Optional: Add origin verification
        cb(true);
      }
    });

    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      logger.info('New WebSocket connection attempt', { 
        ip: req.socket.remoteAddress 
      });

      ws.isAlive = true;

      // Handle messages from client
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message parse error', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
      });
    });

    // Ping clients every 30 seconds to check if alive
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, config.WS_PING_INTERVAL);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    switch (data.type) {
      case 'auth':
        this.authenticateClient(ws, data.token, data.hostel_id);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        logger.warn('Unknown WebSocket message type', { type: data.type });
    }
  }

  private async authenticateClient(
    ws: AuthenticatedWebSocket, 
    token: string, 
    hostelId: string
  ) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(
        token.replace('Bearer ', ''),
        config.JWT_SECRET
      ) as any;

      // Verify hostel access
      if (decoded.hostelId !== hostelId) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Invalid hostel access' 
        }));
        ws.close();
        return;
      }

      // Store auth info
      ws.userId = decoded.userId;
      ws.hostelId = hostelId;

      // Add to clients map
      if (!this.clients.has(hostelId)) {
        this.clients.set(hostelId, new Set());
      }
      this.clients.get(hostelId)!.add(ws);

      // Send success
      ws.send(JSON.stringify({ 
        type: 'auth_success',
        user_id: decoded.userId,
        hostel_id: hostelId
      }));

      logger.info('WebSocket client authenticated', { 
        userId: decoded.userId, 
        hostelId 
      });
    } catch (error) {
      logger.error('WebSocket auth failed', error);
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Authentication failed' 
      }));
      ws.close();
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.hostelId && ws.userId) {
      const hostelClients = this.clients.get(ws.hostelId);
      if (hostelClients) {
        hostelClients.delete(ws);
        if (hostelClients.size === 0) {
          this.clients.delete(ws.hostelId);
        }
      }
      logger.info('WebSocket client disconnected', { 
        userId: ws.userId, 
        hostelId: ws.hostelId 
      });
    }
  }

  // Broadcast to all clients in a hostel
  public broadcastToHostel(hostelId: string, data: any) {
    const hostelClients = this.clients.get(hostelId);
    if (hostelClients) {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      hostelClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Broadcast to specific user in a hostel
  public broadcastToUser(userId: string, hostelId: string, data: any) {
    const hostelClients = this.clients.get(hostelId);
    if (hostelClients) {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      hostelClients.forEach((client) => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Get connected clients count for a hostel
  public getHostelClientCount(hostelId: string): number {
    return this.clients.get(hostelId)?.size || 0;
  }

  // Get total connected clients
  public getTotalClientCount(): number {
    return this.wss.clients.size;
  }
}

export default WSServer;
