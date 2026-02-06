import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { config } from './env';
import { logger } from '../utils/logger';

// Ensure dotenv is loaded
dotenv.config();

// ============================================
// PRISMA CLIENT (Primary ORM for all controllers)
// ============================================
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

// ============================================
// SUPABASE CLIENT (For Storage, Realtime, Auth)
// ============================================
export const supabase: SupabaseClient | null = 
  config.SUPABASE_URL && config.SUPABASE_SERVICE_KEY
    ? createClient(
        config.SUPABASE_URL,
        config.SUPABASE_SERVICE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

// Supabase client with anon key for client-side operations (if needed)
export const supabaseAnon = config.SUPABASE_ANON_KEY && config.SUPABASE_URL
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  : null;

// Test database connection using Prisma
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Test connection by querying campuses
    await prisma.$connect();
    const result = await prisma.campus.findFirst({
      select: { id: true }
    });
    
    logger.info('✅ Database connection successful');
    if (!result) {
      logger.warn('⚠️  No campuses found. Run seed data if needed.');
    }
    return true;
  } catch (err: any) {
    // Check if it's a connection error or missing table
    if (err.code === 'P2021') {
      logger.warn('⚠️  Tables not created yet. Run: npm run db:migrate');
      return false;
    }
    if (err.code === 'P1001' || err.code === 'P1002') {
      logger.error('❌ Cannot connect to database. Check DATABASE_URL in .env');
      return false;
    }
    logger.error('❌ Database connection error:', err.message);
    return false;
  }
};

// Helper function to handle database errors
export const handleDatabaseError = (error: any): never => {
  logger.error('Database error:', error);
  
  // Prisma error codes
  if (error.code === 'P2002') {
    throw new Error('A record with this value already exists');
  }
  
  if (error.code === 'P2025') {
    throw new Error('Record not found');
  }
  
  if (error.code === 'P2003') {
    throw new Error('Referenced record does not exist');
  }
  
  throw new Error(error.message || 'Database operation failed');
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export Prisma client as default (used by all controllers)
export default prisma;
