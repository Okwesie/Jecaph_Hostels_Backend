# JECAPH Backend - Dependencies Audit

## 📋 Overview

**Package File:** `backend/package.json`  
**Node.js Version:** 18.x or 20.x recommended  
**Last Audit:** February 6, 2026  
**Total Production Dependencies:** 27  
**Total Dev Dependencies:** 17

---

## 📦 Production Dependencies

### Core Framework

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| express | ^4.18.2 | Web framework | ✅ Current |
| typescript | ^5.3.3 | Type safety (runtime compilation with ts-node) | ✅ Current |

### Database & ORM

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| @prisma/client | ^5.7.1 | Prisma ORM client | ✅ Current |
| @supabase/supabase-js | ^2.39.0 | Supabase JavaScript client | ✅ Current |

**Note:** Both Prisma and Supabase clients are installed. The codebase has mixed usage which needs to be resolved.

### Caching & Real-time

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| redis | ^4.6.12 | Redis client (Node Redis) | ✅ Current |
| ioredis | ^5.3.2 | Redis client (IORedis) | ✅ Current |
| ws | ^8.16.0 | WebSocket server | ✅ Current |

**Note:** Both `redis` and `ioredis` are installed. The codebase uses `ioredis` (see rate limiter).

### Authentication & Security

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| jsonwebtoken | ^9.0.2 | JWT token generation/verification | ✅ Current |
| bcrypt | ^5.1.1 | Password hashing (native) | ✅ Current |
| bcryptjs | ^2.4.3 | Password hashing (pure JS) | ⚠️ Duplicate |
| helmet | ^7.1.0 | Security HTTP headers | ✅ Current |
| express-rate-limit | ^7.1.5 | Basic rate limiting | ✅ Current |
| rate-limit-redis | ^4.3.1 | Redis store for rate limiter | ✅ Current |
| isomorphic-dompurify | ^2.10.0 | XSS sanitization | ✅ Current |
| crypto-js | ^4.2.0 | Cryptographic functions | ✅ Current |

**Note:** Both `bcrypt` (native) and `bcryptjs` (pure JS) are installed. Only `bcrypt` is used.

### Validation

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| express-validator | ^7.0.1 | Request validation middleware | ✅ Current |
| zod | ^3.22.4 | Schema validation library | ✅ Current |

### Email Services

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| nodemailer | ^7.0.12 | Email sending (SMTP) | ✅ Current |
| @sendgrid/mail | ^8.1.0 | SendGrid email service | ✅ Current |

**Note:** Nodemailer is used as primary. SendGrid is configured but appears unused.

### Payment & External APIs

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| axios | ^1.6.2 | HTTP client (Paystack API) | ✅ Current |

### Utilities

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| uuid | ^9.0.1 | UUID generation | ✅ Current |
| date-fns | ^3.0.6 | Date manipulation | ✅ Current |
| qrcode | ^1.5.3 | QR code generation | ✅ Current |

### Logging & Monitoring

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| winston | ^3.11.0 | Logging framework | ✅ Current |
| winston-daily-rotate-file | ^5.0.0 | Log rotation | ✅ Current |
| morgan | ^1.10.0 | HTTP request logging | ✅ Current |
| prom-client | ^15.1.0 | Prometheus metrics | ✅ Current |

**Note:** `prom-client` is installed but no metrics endpoint is implemented.

### Middleware

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| cors | ^2.8.5 | CORS handling | ✅ Current |
| compression | ^1.7.4 | Response compression | ✅ Current |
| multer | ^2.0.0 | File upload handling | ✅ Current |
| dotenv | ^16.3.1 | Environment variables | ✅ Current |

---

## 🛠️ Dev Dependencies

### TypeScript & Type Definitions

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| typescript | ^5.3.3 | TypeScript compiler | ✅ Current |
| @types/node | ^20.10.6 | Node.js type definitions | ✅ Current |
| @types/express | ^4.17.21 | Express type definitions | ✅ Current |
| @types/bcrypt | ^5.0.2 | Bcrypt type definitions | ✅ Current |
| @types/bcryptjs | ^2.4.6 | Bcryptjs type definitions | ⚠️ Unused |
| @types/jsonwebtoken | ^9.0.5 | JWT type definitions | ✅ Current |
| @types/cors | ^2.8.17 | CORS type definitions | ✅ Current |
| @types/compression | ^1.7.5 | Compression type definitions | ✅ Current |
| @types/crypto-js | ^4.2.2 | Crypto-js type definitions | ✅ Current |
| @types/morgan | ^1.9.9 | Morgan type definitions | ✅ Current |
| @types/multer | ^1.4.12 | Multer type definitions | ✅ Current |
| @types/nodemailer | ^7.0.4 | Nodemailer type definitions | ✅ Current |
| @types/qrcode | ^1.5.5 | QRCode type definitions | ✅ Current |
| @types/uuid | ^9.0.7 | UUID type definitions | ✅ Current |
| @types/ws | ^8.5.10 | WebSocket type definitions | ✅ Current |

### Development Tools

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| nodemon | ^3.0.2 | Auto-restart on changes | ✅ Current |
| ts-node | ^10.9.2 | TypeScript execution | ✅ Current |
| ts-node-dev | ^2.0.0 | TypeScript dev server | ✅ Current |
| prisma | ^5.7.1 | Prisma CLI | ✅ Current |

### Code Quality

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| eslint | ^8.56.0 | JavaScript linting | ✅ Current |
| @typescript-eslint/eslint-plugin | ^6.16.0 | TypeScript ESLint rules | ✅ Current |
| @typescript-eslint/parser | ^6.16.0 | TypeScript ESLint parser | ✅ Current |
| prettier | ^3.1.1 | Code formatting | ✅ Current |

---

## ⚠️ Duplicate/Redundant Packages

### 1. bcrypt vs bcryptjs
**Issue:** Both native `bcrypt` and pure JS `bcryptjs` are installed.

```json
"bcrypt": "^5.1.1",
"bcryptjs": "^2.4.3",
```

**Current Usage:** Only `bcrypt` is used in `src/utils/password.ts`  
**Recommendation:** Remove `bcryptjs` and `@types/bcryptjs`

### 2. redis vs ioredis
**Issue:** Both `redis` (Node Redis) and `ioredis` are installed.

```json
"redis": "^4.6.12",
"ioredis": "^5.3.2",
```

**Current Usage:** `ioredis` is used in `src/config/redis.ts`  
**Recommendation:** Remove `redis` package if not needed

### 3. ts-node vs ts-node-dev
**Issue:** Both are installed for TypeScript execution.

```json
"ts-node": "^10.9.2",
"ts-node-dev": "^2.0.0",
```

**Current Usage:** Scripts use `nodemon` with `ts-node`  
**Recommendation:** Keep both - `ts-node` for scripts, `ts-node-dev` optional

---

## 🔍 Unused Packages

### Production
| Package | Reason |
|---------|--------|
| @sendgrid/mail | Installed but not used (nodemailer is primary) |
| prom-client | Metrics not implemented |
| isomorphic-dompurify | No DOMPurify usage found in code |
| crypto-js | Minimal usage, could use native crypto |

### Dev Dependencies
| Package | Reason |
|---------|--------|
| @types/bcryptjs | bcryptjs not used |

---

## 🔒 Security Audit

### Known Vulnerabilities

Run security audit:
```bash
npm audit
```

### Common Vulnerability Checks

| Package | Common CVEs | Status |
|---------|-------------|--------|
| express | XSS, prototype pollution | Review latest |
| jsonwebtoken | Algorithm confusion | Current version OK |
| axios | SSRF vulnerabilities | Review latest |
| multer | File upload vulnerabilities | Current version OK |
| ws | DoS vulnerabilities | Review latest |

### Recommendations

1. **Run regularly:**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Check for updates:**
   ```bash
   npm outdated
   ```

3. **Update critical packages:**
   ```bash
   npm update [package-name]
   ```

---

## 📊 Dependency Tree Summary

### By Category

| Category | Count | Packages |
|----------|-------|----------|
| Core Framework | 2 | express, typescript |
| Database | 2 | @prisma/client, @supabase/supabase-js |
| Cache/RT | 3 | redis, ioredis, ws |
| Auth/Security | 8 | jsonwebtoken, bcrypt, bcryptjs, helmet, express-rate-limit, rate-limit-redis, isomorphic-dompurify, crypto-js |
| Validation | 2 | express-validator, zod |
| Email | 2 | nodemailer, @sendgrid/mail |
| HTTP | 1 | axios |
| Utilities | 3 | uuid, date-fns, qrcode |
| Logging | 4 | winston, winston-daily-rotate-file, morgan, prom-client |
| Middleware | 4 | cors, compression, multer, dotenv |

### Bundle Size Impact (Estimated)

| Package | Size Impact |
|---------|-------------|
| @prisma/client | Large (~50MB with engine) |
| @supabase/supabase-js | Medium (~5MB) |
| bcrypt | Native compilation required |
| winston | Medium (~2MB) |
| date-fns | Tree-shakeable |
| zod | Small (~50KB) |

---

## 📋 Recommended Changes

### Remove Unused Packages

```bash
# Remove redundant packages
npm uninstall bcryptjs @types/bcryptjs redis @sendgrid/mail prom-client isomorphic-dompurify
```

### Update Package.json

After removal:
```json
{
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.2",
    "bcrypt": "^5.1.1",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "date-fns": "^3.0.6",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^2.0.0",
    "nodemailer": "^7.0.12",
    "qrcode": "^1.5.3",
    "rate-limit-redis": "^4.3.1",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^5.0.0",
    "ws": "^8.16.0",
    "zod": "^3.22.4"
  }
}
```

---

## 🔄 Update Schedule

### Critical Updates (Monthly)
- express
- jsonwebtoken
- bcrypt
- helmet
- axios

### Regular Updates (Quarterly)
- @prisma/client
- TypeScript
- All @types packages
- winston

### Low Priority (As Needed)
- date-fns
- uuid
- qrcode

---

## 📝 Package Usage Map

### Files Using Each Major Package

| Package | Files |
|---------|-------|
| express | app.ts, server.ts, all routes |
| @prisma/client | All controllers, database.ts |
| jsonwebtoken | jwt.ts, auth.ts |
| bcrypt | password.ts |
| helmet | app.ts |
| multer | upload.ts |
| winston | logger.ts |
| nodemailer | emailService.ts |
| axios | paymentService.ts |
| ioredis | redis.ts, rateLimiter.ts |
| ws | websocket/server.ts |
| zod | errorHandler.ts |
| qrcode | shuttleController.ts |

---

*Document generated: February 6, 2026*
