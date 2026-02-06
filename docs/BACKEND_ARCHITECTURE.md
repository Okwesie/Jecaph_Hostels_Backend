# JECAPH Backend Architecture Documentation

## 📋 Project Overview

**Project Name:** JECAPH Hostel Management System Backend API  
**Version:** 1.0.0  
**Status:** Development Ready  
**Last Updated:** February 2026

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── database.ts            # Supabase client configuration
│   │   ├── env.ts                 # Environment variables loader
│   │   └── redis.ts               # Redis/IORedis configuration
│   │
│   ├── controllers/               # Request handlers (10 controllers)
│   │   ├── adminController.ts     # Admin dashboard & user management
│   │   ├── authController.ts      # Authentication (register, login, OTP)
│   │   ├── bookingController.ts   # Room booking management
│   │   ├── feedbackController.ts  # User feedback handling
│   │   ├── maintenanceController.ts # Maintenance request handling
│   │   ├── paymentController.ts   # Payment processing (Paystack)
│   │   ├── roomController.ts      # Room CRUD operations
│   │   ├── shuttleController.ts   # Shuttle booking system
│   │   ├── supportController.ts   # Support ticket system
│   │   └── userController.ts      # User profile management
│   │
│   ├── middleware/                # Express middleware
│   │   ├── auth.ts                # JWT authentication & authorization
│   │   ├── errorHandler.ts        # Global error handling
│   │   ├── hostelContext.ts       # Multi-tenancy hostel validation
│   │   ├── optimisticLock.ts      # Optimistic locking middleware
│   │   ├── rateLimiter.ts         # Rate limiting (Redis-backed)
│   │   ├── rbac.ts                # Role-based access control
│   │   ├── upload.ts              # File upload handling (Multer)
│   │   └── validation.ts          # Request validation middleware
│   │
│   ├── routes/                    # API routes (10 route files)
│   │   ├── adminRoutes.ts         # /api/admin/*
│   │   ├── authRoutes.ts          # /api/auth/*
│   │   ├── bookingRoutes.ts       # /api/bookings/*
│   │   ├── feedbackRoutes.ts      # /api/feedback/*
│   │   ├── maintenanceRoutes.ts   # /api/maintenance/*
│   │   ├── paymentRoutes.ts       # /api/payments/*
│   │   ├── roomRoutes.ts          # /api/rooms/*
│   │   ├── shuttleRoutes.ts       # /api/shuttle/*
│   │   ├── supportRoutes.ts       # /api/support/*
│   │   └── userRoutes.ts          # /api/users/*
│   │
│   ├── schemas/                   # Zod validation schemas
│   │   └── booking.schemas.ts     # Booking validation schemas
│   │
│   ├── services/                  # External service integrations
│   │   ├── cache.service.ts       # Redis caching service
│   │   ├── emailService.ts        # Email sending (Nodemailer/SMTP)
│   │   └── paymentService.ts      # Paystack payment integration
│   │
│   ├── types/                     # TypeScript type definitions
│   │   └── express.d.ts           # Express request extensions
│   │
│   ├── utils/                     # Utility functions
│   │   ├── errors.ts              # Custom error classes
│   │   ├── jwt.ts                 # JWT token handling
│   │   ├── logger.ts              # Winston logging configuration
│   │   ├── otp.ts                 # OTP generation
│   │   ├── password.ts            # Password hashing (bcrypt)
│   │   ├── response.ts            # Standardized API responses
│   │   └── validators.ts          # Express-validator helpers
│   │
│   ├── websocket/                 # WebSocket server
│   │   └── server.ts              # Real-time communication server
│   │
│   ├── app.ts                     # Express application setup
│   └── server.ts                  # Main entry point
│
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── seed.ts                    # Database seeding script
│   └── migrations/                # Prisma migrations
│       └── 20260103020933_m1/     # Initial migration
│
├── database/
│   └── migrations/
│       └── 001_enterprise_schema.sql  # Enterprise SQL migration
│
├── dist/                          # Compiled TypeScript output
├── logs/                          # Application logs directory
├── uploads/                       # File uploads directory
│
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── nodemon.json                   # Nodemon configuration
├── .env                           # Environment variables (not committed)
└── .env.example                   # Environment template
```

---

## 🛠️ Technology Stack

### Runtime & Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | JavaScript runtime |
| TypeScript | ^5.3.3 | Type-safe JavaScript |
| Express.js | ^4.18.2 | Web framework |

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Primary database |
| Prisma | ^5.7.1 | ORM & migrations |
| Supabase | ^2.39.0 | Cloud PostgreSQL (optional) |

### Caching & Real-time
| Technology | Version | Purpose |
|------------|---------|---------|
| Redis | 4.6.12 | Caching & rate limiting |
| IORedis | ^5.3.2 | Redis client |
| WebSocket (ws) | ^8.16.0 | Real-time communication |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| JWT (jsonwebtoken) | ^9.0.2 | Token-based auth |
| bcrypt | ^5.1.1 | Password hashing |
| Helmet | ^7.1.0 | Security headers |
| express-rate-limit | ^7.1.5 | Rate limiting |

### External Services
| Technology | Version | Purpose |
|------------|---------|---------|
| Paystack (axios) | ^1.6.2 | Payment processing |
| Nodemailer | ^7.0.12 | Email sending |
| SendGrid | ^8.1.0 | Email service (optional) |
| QRCode | ^1.5.3 | QR code generation |

### Validation & Logging
| Technology | Version | Purpose |
|------------|---------|---------|
| Zod | ^3.22.4 | Schema validation |
| express-validator | ^7.0.1 | Request validation |
| Winston | ^3.11.0 | Logging |
| Morgan | ^1.10.0 | HTTP request logging |

### File Handling
| Technology | Version | Purpose |
|------------|---------|---------|
| Multer | ^2.0.0 | File uploads |
| DOMPurify | ^2.10.0 | XSS sanitization |

---

## 🏗️ API Architecture

### RESTful API Structure
- **Base URL:** `/api`
- **Auth Routes:** `/api/auth/*` (public, rate limited)
- **Protected Routes:** `/api/*` (require auth + hostel context)

### Request/Response Format

#### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response payload
  }
}
```

#### Standard Error Response
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error description",
  "errors": [
    { "field": "fieldName", "message": "Validation error" }
  ],
  "timestamp": "2026-02-06T10:30:00.000Z",
  "request_id": "abc123"
}
```

### Middleware Stack (Order of Execution)
1. **Helmet** - Security headers
2. **CORS** - Cross-origin configuration
3. **Compression** - Response compression
4. **Body Parser** - JSON/URL-encoded parsing
5. **Morgan** - Request logging
6. **Rate Limiter** - Request throttling
7. **Auth Routes** - Public authentication endpoints
8. **Hostel Context** - Multi-tenancy validation
9. **Protected Routes** - Authenticated endpoints
10. **Error Handler** - Global error handling

---

## 🔐 Security Measures

### Password Security
- **Algorithm:** bcrypt with 10 salt rounds
- **Strength Requirements:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*(),.?":{}|<>)

### JWT Implementation
| Token Type | Expiry | Storage |
|------------|--------|---------|
| Access Token | 1 hour | Client memory |
| Refresh Token | 7 days | Database (refresh_tokens table) |

**Token Payload:**
```typescript
{
  userId: string;
  email: string;
  role: string;
}
```

### Rate Limiting
| Endpoint Type | Window | Max Requests |
|---------------|--------|--------------|
| Auth endpoints | 15 minutes | 5 requests |
| API endpoints | 1 minute | 100 requests |
| Booking creation | 1 hour | 5 bookings |
| Payment initialization | 1 hour | 10 payments |

### Input Validation
- **express-validator** for route-level validation
- **Zod** for schema validation
- **DOMPurify** for XSS sanitization
- Prisma prepared statements for SQL injection prevention

### Security Headers (Helmet)
- Content-Security-Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Download-Options
- X-Content-Type-Options
- Referrer-Policy
- Strict-Transport-Security

### CORS Configuration
```typescript
{
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Hostel-ID']
}
```

---

## 🔑 Authentication Flow

### Registration Process
1. User submits: firstName, lastName, email, password
2. Validate password strength
3. Check for existing email
4. Hash password with bcrypt
5. Create user with `emailVerified: false`
6. Generate 6-digit OTP
7. Store OTP in `otp_codes` table (10 min expiry)
8. Send OTP via email
9. Return success with user ID

### OTP Verification
1. User submits: email, otp
2. Find valid OTP (not expired, not used)
3. Mark OTP as used
4. Update user: `emailVerified: true`, `emailVerifiedAt: now()`
5. Return success

### Login Flow
1. User submits: email, password
2. Find user by email
3. Verify password hash
4. Check `emailVerified === true`
5. Check `status === 'active'`
6. Generate access token (1h) and refresh token (7d)
7. Store refresh token in database
8. Return tokens and user profile

### Admin Login
- Same as user login
- Additional check: `role in ['admin', 'super_admin']`
- No email verification requirement

### Token Refresh
1. Client sends refresh token
2. Verify token signature and expiry
3. Check token exists in database
4. Check user is still active
5. Generate new access token
6. Return new access token

### Password Reset
1. User requests reset with email
2. Generate UUID reset token
3. Store in `password_reset_tokens` (1h expiry)
4. Send reset link via email
5. User submits new password with token
6. Validate token (not expired, not used)
7. Update user password
8. Mark token as used

---

## 🏢 Multi-Tenancy Implementation

### Hostel Context Flow
1. Client sends `X-Hostel-ID` header with every request
2. Middleware validates UUID format
3. Query Supabase to verify hostel exists
4. Check hostel `is_active === true`
5. If user authenticated, verify user belongs to hostel
6. Attach `hostelId` to request object
7. Continue to route handler

### Data Isolation Strategy
- Users have `campusId` foreign key
- Hostel context validated at middleware level
- ⚠️ **Note:** Current implementation uses Supabase for hostel validation but Prisma for data operations - there's a disconnect here (see Critical Issues)

---

## 📊 Database Configuration

### Primary ORM: Prisma
- **Provider:** PostgreSQL
- **Connection:** `DATABASE_URL` environment variable
- **Migrations:** Prisma Migrate

### Secondary Client: Supabase
- Used in `hostelContext.ts` middleware
- Used in `database.ts` for connection testing
- ⚠️ **Mixed usage** - Some files import Prisma, others import Supabase

### Connection Handling
```typescript
// Prisma - Primary (most controllers)
import prisma from '../config/database';

// Supabase - Secondary (hostel context)
import { supabase } from '../config/database';
```

---

## 📝 Logging Configuration

### Winston Logger Setup
- **Log Levels:** error, warn, info, http, verbose, debug
- **Output Format:** JSON with timestamps
- **Log Files:**
  - `logs/error.log` - Error level only
  - `logs/combined.log` - All levels
- **Console:** Colorized output (non-production only)

### Log Format
```json
{
  "level": "info",
  "message": "User registered successfully",
  "timestamp": "2026-02-06 10:30:00",
  "service": "jecaph-backend"
}
```

---

## 🔌 WebSocket Server

### Configuration
- **Path:** `/ws`
- **Ping Interval:** 30 seconds
- **Max Connections:** 1000

### Authentication Flow
1. Client connects to `/ws`
2. Client sends auth message with JWT token and hostel_id
3. Server verifies JWT and hostel access
4. Client added to hostel-specific client list
5. Server can broadcast to all hostel clients or specific users

### Message Types
| Type | Direction | Purpose |
|------|-----------|---------|
| auth | Client → Server | Authenticate connection |
| auth_success | Server → Client | Authentication confirmed |
| auth_error | Server → Client | Authentication failed |
| ping | Client → Server | Keep-alive check |
| pong | Server → Client | Keep-alive response |

---

## 📧 Email Service

### Provider: Nodemailer (SMTP)
- **Configuration:** SMTP host, port, user, pass from env vars
- **Fallback:** SendGrid API (configured but not primary)

### Email Templates
| Template | Purpose | Trigger |
|----------|---------|---------|
| OTP Email | Email verification | Registration |
| Password Reset | Reset password link | Forgot password request |
| Booking Confirmation | Booking details | Booking created |
| Payment Receipt | Payment confirmation | Payment completed |

---

## 💳 Payment Integration

### Provider: Paystack
- **Base URL:** `https://api.paystack.co`
- **Currency:** GHS (Ghana Cedis)
- **Amount:** Converted to pesewas (amount × 100)

### Payment Flow
1. Initialize payment (create reference, call Paystack)
2. Redirect user to Paystack checkout
3. User completes payment
4. Paystack redirects to callback URL
5. Verify payment status
6. Update payment record
7. If booking payment, update booking balance
8. Send receipt email

---

## 📂 File Upload Configuration

### Multer Settings
| Setting | Value |
|---------|-------|
| Storage | Disk (`./uploads`) |
| Max File Size | 5MB (configurable) |
| Allowed Types | jpg, jpeg, png, pdf |
| Filename Format | `{fieldname}-{timestamp}-{random}.{ext}` |

### Upload Endpoints
- `POST /api/users/upload-profile-picture`
- `POST /api/maintenance/submit` (with attachment)
- `POST /api/support/tickets` (with attachment)

---

## 🔄 Error Handling Strategy

### Custom Error Classes
```typescript
AppError          // Base error class
├── ValidationError    // 400 - Validation failed
├── AuthenticationError // 401 - Unauthorized
├── AuthorizationError  // 403 - Forbidden
├── NotFoundError      // 404 - Resource not found
└── ConflictError      // 409 - Resource conflict
```

### Error Handler Features
- Zod validation error formatting
- JWT error handling (expired, invalid)
- Request ID tracking
- Stack trace hiding in production
- Structured JSON error responses

---

## 📈 Health Check

### Endpoint
`GET /health`

### Response
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## ⚠️ Architecture Concerns

### Mixed Database Clients
The codebase uses both Prisma and Supabase clients inconsistently:
- Controllers import `prisma from '../config/database'` but the export is `supabase`
- The `database.ts` file exports Supabase client, not Prisma
- Some middleware uses Supabase directly

### Hostel Table Mismatch
- `hostelContext.ts` queries a `hostels` table
- Prisma schema defines a `campuses` table
- These appear to be different tables with different structures

### Multi-tenancy Incomplete
- Hostel context validated but not consistently applied to queries
- Room and booking queries don't filter by hostel/campus

---

*Document generated: February 6, 2026*
