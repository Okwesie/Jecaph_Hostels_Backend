import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';
import WSServer from './websocket/server';

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const wsServer = new WSServer(server);

// Export WebSocket server for use in controllers/services
export { wsServer };

// Start server
const PORT = config.PORT;

const startServer = async () => {
  try {
    // Test database connection first (only warn in dev, exit in production)
    logger.info('🔄 Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      if (config.NODE_ENV === 'production') {
        logger.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
      } else {
        logger.warn('⚠️  Database connection failed, but continuing in development mode.');
        logger.warn('💡 Make sure to configure your .env file with Supabase credentials.');
      }
    }

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📡 Environment: ${config.NODE_ENV}`);
      logger.info(`🌐 API Base URL: ${config.API_BASE_URL}`);
      logger.info(`🔌 WebSocket URL: ${config.WEBSOCKET_URL}`);
      logger.info(`📦 Health check: http://localhost:${PORT}/health`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Please kill the process using port ${PORT} or use a different port.`);
        logger.error(`💡 To find and kill the process: lsof -ti:${PORT} | xargs kill -9`);
        process.exit(1);
      } else {
        logger.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

