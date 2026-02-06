import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';
import { AppError } from '../utils/errors';
import { Request, Response, NextFunction } from 'express';

// Helper to create Redis store with ioredis
// rate-limit-redis v4+ requires sendCommand function
const createRedisStore = (prefix: string) => {
  return new RedisStore({
    // @ts-expect-error - rate-limit-redis types expect sendCommand but ioredis uses call
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix
  });
};

// Check if Redis is available, fallback to memory store if not
const isRedisAvailable = () => {
  try {
    return redis && redis.status === 'ready';
  } catch {
    return false;
  }
};

// Auth endpoints (stricter)
export const authLimiter = rateLimit({
  store: isRedisAvailable() ? createRedisStore('rl:auth:') : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts. Please try again later.',
      429,
      {
        retry_after: 900, // 15 minutes in seconds
        limit: 5
      }
    ));
  },
  skip: () => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  }
});

// General API endpoints
export const apiLimiter = rateLimit({
  store: isRedisAvailable() ? createRedisStore('rl:api:') : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req: Request) => (req as any).user?.id || req.ip || 'unknown',
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please slow down.',
      429,
      {
        retry_after: 60,
        limit: 100
      }
    ));
  },
  skip: () => process.env.NODE_ENV === 'test'
});

// Booking creation (prevent spam)
export const bookingLimiter = rateLimit({
  store: isRedisAvailable() ? createRedisStore('rl:booking:') : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req: Request) => (req as any).user?.id || req.ip || 'unknown',
  skipSuccessfulRequests: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(
      'RATE_LIMIT_EXCEEDED',
      'You can only create 5 bookings per hour.',
      429,
      {
        retry_after: 3600,
        limit: 5
      }
    ));
  },
  skip: (req: Request) => !(req as any).user || process.env.NODE_ENV === 'test'
});

// Payment initialization
export const paymentLimiter = rateLimit({
  store: isRedisAvailable() ? createRedisStore('rl:payment:') : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req: Request) => (req as any).user?.id || req.ip || 'unknown',
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(
      'RATE_LIMIT_EXCEEDED',
      'You can only initiate 10 payments per hour.',
      429,
      {
        retry_after: 3600,
        limit: 10
      }
    ));
  },
  skip: (req: Request) => !(req as any).user || process.env.NODE_ENV === 'test'
});
