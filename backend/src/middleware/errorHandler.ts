/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response | void => {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.error('Validation error', {
      error: err.errors,
      request_id: requestId,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })),
      timestamp: new Date().toISOString(),
      request_id: requestId
    });
  }

  // Handle known AppError
  if (err instanceof AppError) {
    logger.error('Application error', {
      code: err.code,
      message: err.message,
      request_id: requestId,
      endpoint: req.originalUrl,
      user_id: (req as any).user?.id
    });

    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      data: err.data,
      timestamp: new Date().toISOString(),
      request_id: requestId
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
      request_id: requestId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
      timestamp: new Date().toISOString(),
      request_id: requestId
    });
  }

  // Handle unknown errors
  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    request_id: requestId,
    endpoint: req.originalUrl,
    method: req.method,
    user_id: (req as any).user?.id
  });

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    timestamp: new Date().toISOString(),
    request_id: requestId
  });
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};

