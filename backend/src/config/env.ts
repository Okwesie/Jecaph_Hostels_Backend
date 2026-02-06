import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '1h',
  JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',

  // Email (SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@jecaphhostels.com',
  SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || 'Jecaph Hostels',
  
  // Email (SMTP fallback)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@jecaph.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'JECAPH Hostel Management',

  // Paystack
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  PAYSTACK_CALLBACK_URL: process.env.PAYSTACK_CALLBACK_URL || '',
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || '',

  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf',

  // OTP
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH || '6', 10),

  // Password Reset
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: parseInt(
    process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || '60',
    10
  ),

  // App
  APP_NAME: process.env.APP_NAME || 'JECAPH Hostel Management System',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@jecaph.com',
  SUPPORT_PHONE: process.env.SUPPORT_PHONE || '+233 XX XXXX XXXX',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Frontend URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:5000',
  
  // Cache TTL (seconds)
  CACHE_TTL_ROOMS: parseInt(process.env.CACHE_TTL_ROOMS || '300', 10),
  CACHE_TTL_PROFILES: parseInt(process.env.CACHE_TTL_PROFILES || '3600', 10),
  CACHE_TTL_SETTINGS: parseInt(process.env.CACHE_TTL_SETTINGS || '86400', 10),
  
  // WebSocket
  WS_PING_INTERVAL: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
  WS_MAX_CONNECTIONS: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
};

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'PAYSTACK_SECRET_KEY',
];

// Additional vars required for full functionality
const recommendedEnvVars = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'PAYSTACK_WEBHOOK_SECRET',
  'REDIS_HOST',
];

if (config.NODE_ENV === 'production') {
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  const missingRecommended = recommendedEnvVars.filter((varName) => !process.env[varName]);
  if (missingRecommended.length > 0) {
    console.warn(`Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
}

