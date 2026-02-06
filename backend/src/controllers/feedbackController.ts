import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const submitFeedback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { rating, category, title, feedback: feedbackText, anonymous = false } = req.body;
    const userId = req.user!.id;

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        rating: parseInt(rating),
        category,
        title,
        feedbackText,
        anonymous,
        status: 'pending',
      },
      select: {
        id: true,
        rating: true,
        category: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, feedback, 'Feedback submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyFeedback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!.id;

    const feedbackList = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = feedbackList.map((fb) => ({
      id: fb.id,
      rating: fb.rating,
      category: fb.category,
      title: fb.title,
      feedback: fb.feedbackText,
      status: fb.status,
      adminResponse: fb.adminResponse,
      createdAt: fb.createdAt,
      respondedAt: fb.adminResponseDate,
    }));

    return sendSuccess(res, { feedback: formatted });
  } catch (error) {
    next(error);
  }
};

export const getAllFeedback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { rating, category, status, page = '1' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (rating) where.rating = parseInt(rating as string);
    if (category) where.category = category;
    if (status) where.status = status;

    const [feedbackList, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const formatted = feedbackList.map((fb) => ({
      id: fb.id,
      rating: fb.rating,
      category: fb.category,
      title: fb.title,
      feedback: fb.feedbackText,
      studentName: fb.anonymous ? 'Anonymous' : `${fb.user.firstName} ${fb.user.lastName}`,
      status: fb.status,
      adminResponse: fb.adminResponse,
      createdAt: fb.createdAt,
      respondedAt: fb.adminResponseDate,
    }));

    return sendSuccess(res, {
      feedback: formatted,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const respondToFeedback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return sendError(res, 'Feedback not found', 404);
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        adminResponse: response,
        adminResponseDate: new Date(),
        status: 'responded',
      },
    });

    return sendSuccess(res, updated, 'Response added');
  } catch (error) {
    next(error);
  }
};

