import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const submitRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { title, category, priority, description, roomId } = req.body;
    const userId = req.user!.id;

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const request = await prisma.maintenanceRequest.create({
      data: {
        userId,
        roomId: roomId || null,
        title,
        category,
        priority,
        description,
        status: 'new',
        attachmentUrl: fileUrl,
      },
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, request, 'Maintenance request submitted', 201);
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { status, priority } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedToUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      title: req.title,
      category: req.category,
      priority: req.priority,
      status: req.status,
      description: req.description,
      assignedTo: req.assignedToUser ? `${req.assignedToUser.firstName} ${req.assignedToUser.lastName}` : null,
      response: req.staffResponse,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }));

    return sendSuccess(res, { requests: formattedRequests });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { status, assignedTo, response: staffResponse } = req.body;

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (staffResponse) updateData.staffResponse = staffResponse;
    if (status === 'completed') updateData.completedAt = new Date();

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, updated, 'Request updated');
  } catch (error) {
    next(error);
  }
};

