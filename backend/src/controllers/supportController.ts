import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const generateTicketNumber = (): string => {
  const year = new Date().getFullYear();
  const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `TK-${year}-${number}`;
};

export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { category, priority, subject, description } = req.body;
    const userId = req.user!.id;

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let ticketNumber: string;
    let isUnique = false;
    while (!isUnique) {
      ticketNumber = generateTicketNumber();
      const existing = await prisma.supportTicket.findUnique({
        where: { ticketNumber },
      });
      if (!existing) isUnique = true;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        ticketNumber: ticketNumber!,
        category,
        priority,
        subject,
        description,
        status: 'open',
        attachmentUrl: fileUrl,
      },
      select: {
        id: true,
        ticketNumber: true,
        category: true,
        priority: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, ticket, 'Ticket created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { status, priority } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const formatted = tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      priority: ticket.priority,
      subject: ticket.subject,
      status: ticket.status,
      assignedTo: ticket.assignedUser ? `${ticket.assignedUser.firstName} ${ticket.assignedUser.lastName}` : null,
      lastUpdated: ticket.updatedAt,
      createdAt: ticket.createdAt,
    }));

    return sendSuccess(res, { tickets: formatted });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found', 404);
    }

    const formattedMessages = ticket.messages.map((msg) => ({
      id: msg.id,
      sender: msg.senderId === userId ? 'student' : 'support',
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      message: msg.messageText,
      timestamp: msg.createdAt,
    }));

    return sendSuccess(res, {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      priority: ticket.priority,
      subject: ticket.subject,
      status: ticket.status,
      messages: formattedMessages,
      createdAt: ticket.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const addMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user!.id;

    const ticket = await prisma.supportTicket.findFirst({
      where: { id },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found', 404);
    }

    // Check authorization (student who created ticket or admin)
    if (ticket.userId !== userId && !['admin', 'super_admin'].includes(req.user!.role)) {
      return sendError(res, 'You do not have permission to add messages to this ticket', 403);
    }

    const messageRecord = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        messageText: message,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update ticket updatedAt
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return sendSuccess(res, {
      id: messageRecord.id,
      sender: userId === ticket.userId ? 'student' : 'support',
      message: messageRecord.messageText,
      timestamp: messageRecord.createdAt,
    }, 'Message added', 201);
  } catch (error) {
    next(error);
  }
};

export const closeTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    // const { resolution } = req.body; // Not used in update

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found', 404);
    }

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'closed',
        resolvedAt: new Date(),
      },
    });

    return sendSuccess(res, null, 'Ticket closed');
  } catch (error) {
    next(error);
  }
};

