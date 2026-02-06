/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Validates the campus/hostel context from request headers.
 * Uses Prisma to query the 'campuses' table.
 * Accepts both X-Hostel-ID and X-Campus-ID headers for flexibility.
 */
export const validateHostelContext = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Accept both X-Hostel-ID and X-Campus-ID headers
    const hostelId = (req.headers['x-hostel-id'] || req.headers['x-campus-id']) as string;

    if (!hostelId) {
      throw new AppError(
        'HOSTEL_CONTEXT_REQUIRED',
        'X-Hostel-ID or X-Campus-ID header is required',
        400
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(hostelId)) {
      throw new AppError(
        'INVALID_HOSTEL_ID',
        'Invalid hostel/campus ID format',
        400
      );
    }

    // Verify campus exists and is active using Prisma
    const campus = await prisma.campus.findUnique({
      where: { id: hostelId },
      select: { id: true, name: true, status: true }
    });

    if (!campus) {
      logger.error('Campus not found', { hostelId });
      throw new AppError(
        'HOSTEL_NOT_FOUND',
        'Campus/Hostel not found',
        404
      );
    }

    // Check status (values: 'active', 'inactive', 'maintenance')
    if (campus.status !== 'active') {
      throw new AppError(
        'HOSTEL_INACTIVE',
        `This campus is currently ${campus.status}`,
        403
      );
    }

    // If user is authenticated, optionally verify campus access
    const user = (req as any).user;
    if (user && user.campusId && user.campusId !== hostelId) {
      // Only block cross-campus access for students
      if (user.role === 'student') {
        logger.warn('Cross-campus access attempt', {
          userId: user.id,
          userCampusId: user.campusId,
          requestedCampusId: hostelId,
        });
        throw new AppError(
          'HOSTEL_ACCESS_DENIED',
          'You do not have access to this campus',
          403
        );
      }
    }

    // Attach campus info to request
    (req as any).hostelId = hostelId;
    (req as any).campusId = hostelId;
    (req as any).campus = campus;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional middleware - only validates if header is present.
 * Useful for endpoints that work both with and without campus context.
 */
export const optionalHostelContext = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const hostelId = (req.headers['x-hostel-id'] || req.headers['x-campus-id']) as string;
  
  if (!hostelId) {
    return next();
  }

  // Delegate to main validator
  return validateHostelContext(req, _res, next);
};
