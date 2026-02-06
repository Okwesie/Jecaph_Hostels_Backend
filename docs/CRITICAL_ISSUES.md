# JECAPH Backend - Critical Issues Report

## 🚨 CRITICAL: Application Breaking Issues

These issues will prevent the application from functioning correctly and **MUST be fixed before any testing or deployment**.

---

## Issue #1: Database Client Export Mismatch (BLOCKER)

### Severity: 🔴 CRITICAL

### Location
`backend/src/config/database.ts`

### Problem
The file exports Supabase client, but all controllers import it expecting Prisma client API.

**Current Code:**
```typescript
// database.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient | null = createClient(...);
export default supabase;
```

**Controllers Expect:**
```typescript
// Every controller file
import prisma from '../config/database';

// Then uses Prisma API
await prisma.user.findUnique({ where: { email } });
```

### Impact
- **Application will crash** when any database operation is attempted
- All controllers call Prisma methods on Supabase client
- Error: `prisma.user.findUnique is not a function`

### Fix Required

**Option A: Use Prisma (Recommended)**
```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connection successful');
    return true;
  } catch (error: any) {
    logger.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default prisma;
```

**Option B: Update all controllers to use Supabase**
This requires rewriting all 10+ controllers with Supabase API.

### Recommended Action
- **Use Option A** - It's less work and Prisma schema is already defined
- Remove Supabase dependency if not needed elsewhere

---

## Issue #2: Hostel Context Queries Non-existent Table (BLOCKER)

### Severity: 🔴 CRITICAL

### Location
`backend/src/middleware/hostelContext.ts`

### Problem
The middleware queries a `hostels` table that doesn't exist in the database schema.

**Current Code:**
```typescript
// hostelContext.ts
const { data: hostel, error } = await supabase
  .from('hostels')  // ❌ This table doesn't exist!
  .select('id, is_active')
  .eq('id', hostelId)
  .single();
```

**Prisma Schema has:**
```prisma
model Campus {
  id          String   @id @default(uuid())
  name        String   @unique
  status      String   @default("inactive")  // Not is_active
  // ...
}
```

### Impact
- Every protected API request fails with "Hostel not found"
- Multi-tenancy validation completely broken
- All endpoints requiring `X-Hostel-ID` header will fail

### Fix Required

**Option A: Use Prisma and campuses table**
```typescript
// hostelContext.ts
import prisma from '../config/database';

export const validateHostelContext = async (req, res, next) => {
  try {
    const hostelId = req.headers['x-hostel-id'] as string;
    
    if (!hostelId) {
      throw new AppError('HOSTEL_CONTEXT_REQUIRED', 'X-Hostel-ID required', 400);
    }

    const campus = await prisma.campus.findUnique({
      where: { id: hostelId },
      select: { id: true, status: true }
    });

    if (!campus) {
      throw new AppError('HOSTEL_NOT_FOUND', 'Campus not found', 404);
    }

    if (campus.status !== 'active') {
      throw new AppError('HOSTEL_INACTIVE', 'Campus inactive', 403);
    }

    req.hostelId = hostelId;
    next();
  } catch (error) {
    next(error);
  }
};
```

**Option B: Remove multi-tenancy temporarily**
Comment out the middleware in `app.ts` until properly implemented.

**Option C: Create hostels table**
Add migration to create `hostels` table matching the expected structure.

---

## Issue #3: Missing Prisma Client Import

### Severity: 🔴 CRITICAL

### Location
`backend/src/controllers/authController.ts` (line 2) and all other controllers

### Problem
Controllers import from `../config/database` expecting Prisma, but they use a variable named `prisma`:

```typescript
import prisma from '../config/database';  // Actually imports supabase!
```

### Impact
- All database queries will fail
- TypeScript may not catch this if types are loose

### Fix Required
After fixing Issue #1, this will be resolved. The import path is correct, just the export is wrong.

---

## 🟠 HIGH PRIORITY: Security Issues

---

## Issue #4: Hardcoded Admin Credentials in Seed

### Severity: 🟠 HIGH

### Location
`backend/prisma/seed.ts`

### Problem
```typescript
const adminPassword = await bcrypt.hash('admin123', 10);
const admin = await prisma.user.upsert({
  where: { email: 'admin@jecaph.edu' },
  create: {
    email: 'admin@jecaph.edu',
    passwordHash: adminPassword,  // Weak, known password
    role: 'super_admin',
    // ...
  }
});
```

### Impact
- If seed runs in production, admin account has known weak password
- Security breach if credentials are not changed

### Fix Required
```typescript
// Generate random password or use environment variable
const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD 
  || require('crypto').randomBytes(16).toString('hex');

console.log(`Admin password: ${adminPassword}`); // Log only once for setup
```

---

## Issue #5: Missing Paystack Webhook Signature Verification

### Severity: 🟠 HIGH

### Location
`backend/src/controllers/paymentController.ts`

### Problem
The payment verification endpoint doesn't verify Paystack's webhook signature:

```typescript
export const verifyPaymentHandler = async (req: any, res: Response) => {
  const { reference } = req.query;  // Just trusts the reference!
  // No signature verification
};
```

### Impact
- Attackers can forge payment confirmations
- Financial fraud possible
- Booking balances can be manipulated

### Fix Required
```typescript
import crypto from 'crypto';

export const paystackWebhook = async (req: Request, res: Response) => {
  // Verify signature
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ message: 'Invalid signature' });
  }
  
  // Process webhook event
  const event = req.body;
  if (event.event === 'charge.success') {
    // Update payment
  }
  
  res.sendStatus(200);
};
```

---

## Issue #6: No Refresh Token Invalidation on Password Change

### Severity: 🟠 HIGH

### Location
`backend/src/controllers/userController.ts`

### Problem
When a user changes their password, old refresh tokens remain valid:

```typescript
export const changePassword = async (req: AuthRequest, res: Response) => {
  // ...
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  // No refresh token invalidation!
};
```

### Impact
- If account is compromised, attacker can maintain access
- Password change doesn't fully secure account

### Fix Required
```typescript
export const changePassword = async (req: AuthRequest, res: Response) => {
  // ... password change logic ...
  
  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user!.id }
  });
  
  return sendSuccess(res, null, 'Password changed. Please login again.');
};
```

---

## 🟡 MEDIUM PRIORITY: Functional Issues

---

## Issue #7: Redis Required for Rate Limiting

### Severity: 🟡 MEDIUM

### Location
`backend/src/middleware/rateLimiter.ts`

### Problem
Rate limiter requires Redis connection. If Redis is unavailable, the application may crash or rate limiting fails silently.

```typescript
import redis from '../config/redis';

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,  // Will fail if Redis not connected
    // ...
  }),
});
```

### Impact
- Application startup fails without Redis
- No fallback for development environments

### Fix Required
```typescript
import Redis from 'ioredis';

let redisClient: Redis | null = null;

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    // ...
  });
} catch (error) {
  console.warn('Redis not available, using memory store');
}

export const authLimiter = rateLimit({
  store: redisClient 
    ? new RedisStore({ client: redisClient }) 
    : undefined,  // Falls back to memory store
  // ...
});
```

---

## Issue #8: Missing Campus Endpoints

### Severity: 🟡 MEDIUM

### Location
Routes not created

### Problem
The `campuses` table exists in the database, but there are no CRUD endpoints for it.

### Impact
- Cannot create/manage campuses through API
- Must use direct database access or seed data

### Fix Required
Create `backend/src/routes/campusRoutes.ts` and `backend/src/controllers/campusController.ts` with standard CRUD operations.

---

## Issue #9: Audit Logs Never Written

### Severity: 🟡 MEDIUM

### Location
`backend/prisma/schema.prisma` - `AuditLog` model exists but unused

### Problem
The audit_logs table exists but no code writes to it.

### Impact
- No audit trail for security/compliance
- Cannot track user actions

### Fix Required
Create audit logging middleware or utility function:
```typescript
export const logAuditEvent = async (
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  changes: any,
  req: Request
) => {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }
  });
};
```

---

## Issue #10: Invoices Never Generated

### Severity: 🟡 MEDIUM

### Location
`backend/prisma/schema.prisma` - `Invoice` model exists but unused

### Problem
Invoices table exists but:
- No endpoints for invoices
- No auto-generation when bookings created
- No invoice number generator

### Impact
- Cannot provide invoices to students
- Missing financial documentation

---

## 🔵 LOW PRIORITY: Code Quality Issues

---

## Issue #11: Duplicate Password Hashing Libraries

### Location
`backend/package.json`

### Problem
Both `bcrypt` and `bcryptjs` are installed but only `bcrypt` is used.

### Fix
```bash
npm uninstall bcryptjs @types/bcryptjs
```

---

## Issue #12: Duplicate Redis Clients

### Location
`backend/package.json`

### Problem
Both `redis` and `ioredis` are installed but only `ioredis` is used.

### Fix
```bash
npm uninstall redis
```

---

## Issue #13: Unused SendGrid Dependency

### Location
`backend/package.json`

### Problem
`@sendgrid/mail` is installed but Nodemailer is used instead.

### Fix
```bash
npm uninstall @sendgrid/mail
```

---

## 📋 Fix Priority Checklist

### Immediate (Before Testing)
- [ ] Fix database.ts to export Prisma client
- [ ] Fix hostelContext.ts to query correct table
- [ ] Test all endpoints work with fixes

### Before Staging Deployment
- [ ] Add Paystack webhook signature verification
- [ ] Remove hardcoded admin credentials
- [ ] Add refresh token invalidation on password change
- [ ] Add Redis fallback for development

### Before Production
- [ ] Implement campus endpoints
- [ ] Add audit logging
- [ ] Remove unused dependencies
- [ ] Security audit
- [ ] Performance testing

---

## 🔧 Quick Fix Commands

```bash
# Step 1: Fix database.ts (manual edit required)
# See Issue #1 fix above

# Step 2: Remove unused dependencies
npm uninstall bcryptjs @types/bcryptjs redis @sendgrid/mail

# Step 3: Regenerate Prisma client
npm run db:generate

# Step 4: Test database connection
npm run dev

# Step 5: Run health check
curl http://localhost:3000/health
```

---

## 📞 Questions for Product Team

Before proceeding with fixes, clarify:

1. **Multi-tenancy approach:**
   - Should we use `campuses` table or create separate `hostels` table?
   - Is multi-tenancy required for MVP?

2. **Supabase vs Prisma:**
   - Is Supabase intended for future use (storage, auth)?
   - Should we keep Supabase dependency or remove entirely?

3. **Invoice requirements:**
   - Should invoices auto-generate on booking creation?
   - What invoice number format is required?

4. **Audit requirements:**
   - Which actions need to be audited?
   - What retention period for audit logs?

---

*Document generated: February 6, 2026*  
*Next review recommended after fixes applied*
