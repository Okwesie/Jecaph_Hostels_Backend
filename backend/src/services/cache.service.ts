import redis from '../config/redis';
import { logger } from '../utils/logger';

export class CacheService {
  // Cache key builders
  private static keys = {
    rooms: (hostelId: string) => `hostel:${hostelId}:rooms`,
    room: (hostelId: string, roomId: string) => `hostel:${hostelId}:room:${roomId}`,
    userProfile: (userId: string) => `user:${userId}:profile`,
    shuttleRoutes: (hostelId: string) => `hostel:${hostelId}:shuttle:routes`,
    bookings: (hostelId: string, userId: string) => `hostel:${hostelId}:user:${userId}:bookings`,
  };

  // Get from cache
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  // Set in cache with TTL
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  // Delete from cache
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  // Delete multiple keys by pattern
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
    }
  }

  // Invalidate all hostel caches
  static async invalidateHostel(hostelId: string): Promise<void> {
    await this.deletePattern(`hostel:${hostelId}:*`);
  }

  // Specific invalidation methods
  static async invalidateRooms(hostelId: string): Promise<void> {
    await this.delete(this.keys.rooms(hostelId));
    await this.deletePattern(`hostel:${hostelId}:room:*`);
  }

  static async invalidateUserBookings(hostelId: string, userId: string): Promise<void> {
    await this.delete(this.keys.bookings(hostelId, userId));
  }

  static async invalidateUserProfile(userId: string): Promise<void> {
    await this.delete(this.keys.userProfile(userId));
  }

  // Static key getters
  static getKeys() {
    return this.keys;
  }
}

export default CacheService;
