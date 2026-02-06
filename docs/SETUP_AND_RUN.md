# JECAPH Backend - Setup and Run Guide

## 📋 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or 20.x | JavaScript runtime |
| npm | 9.x+ | Package manager |
| PostgreSQL | 15+ | Database |
| Redis | 7+ | Caching & rate limiting |

### Optional Software

| Software | Version | Purpose |
|----------|---------|---------|
| Docker | Latest | Containerized database |
| Postman/Insomnia | Latest | API testing |

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.x or v20.x

# Check npm version
npm --version  # Should be 9.x+

# Check PostgreSQL (if installed locally)
psql --version

# Check Redis (if installed locally)
redis-server --version
```

---

## 📦 Installation Steps

### 1. Clone the Repository

```bash
# If not already cloned
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

---

## ⚙️ Environment Configuration

### 1. Create Environment File

```bash
# Copy example file
cp .env.example .env

# Or create new file
touch .env
```

### 2. Required Environment Variables

Create a `.env` file with the following variables:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000/api

# ===========================================
# DATABASE - PostgreSQL
# ===========================================
# Local PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/jecaph_db

# OR Supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# ===========================================
# SUPABASE (if using Supabase)
# ===========================================
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# ===========================================
# REDIS - Caching & Rate Limiting
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_ACCESS_TOKEN_EXPIRES_IN=1h
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# ===========================================
# EMAIL - SMTP Configuration
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@jecaph.edu
EMAIL_FROM_NAME=JECAPH Hostel Management

# OR SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@jecaph.edu
SENDGRID_FROM_NAME=JECAPH Hostels

# ===========================================
# PAYSTACK - Payment Gateway
# ===========================================
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
PAYSTACK_CALLBACK_URL=http://localhost:3000/api/payments/verify

# ===========================================
# FILE UPLOADS
# ===========================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# ===========================================
# OTP SETTINGS
# ===========================================
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# ===========================================
# PASSWORD RESET
# ===========================================
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=60

# ===========================================
# APPLICATION
# ===========================================
APP_NAME=JECAPH Hostel Management System
SUPPORT_EMAIL=support@jecaph.edu
SUPPORT_PHONE=+233 XX XXXX XXXX

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ===========================================
# FRONTEND
# ===========================================
FRONTEND_URL=http://localhost:5173
WEBSOCKET_URL=ws://localhost:3000

# ===========================================
# CACHE TTL (seconds)
# ===========================================
CACHE_TTL_ROOMS=300
CACHE_TTL_PROFILES=3600
CACHE_TTL_SETTINGS=86400

# ===========================================
# WEBSOCKET
# ===========================================
WS_PING_INTERVAL=30000
WS_MAX_CONNECTIONS=1000
```

### 3. Generate Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

---

## 🗄️ Database Setup

### Option A: Local PostgreSQL

#### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE jecaph_db;

# Create user (optional)
CREATE USER jecaph_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE jecaph_db TO jecaph_user;

# Exit
\q
```

#### 2. Update DATABASE_URL

```env
DATABASE_URL=postgresql://jecaph_user:your_password@localhost:5432/jecaph_db
```

### Option B: Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run --name jecaph-postgres \
  -e POSTGRES_DB=jecaph_db \
  -e POSTGRES_USER=jecaph_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Verify container is running
docker ps
```

### Option C: Supabase (Cloud)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings > Database
4. Update `DATABASE_URL` and Supabase keys in `.env`

---

## 🔴 Redis Setup

### Option A: Local Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Verify
redis-cli ping  # Should return PONG
```

### Option B: Docker Redis

```bash
docker run --name jecaph-redis \
  -p 6379:6379 \
  -d redis:7

# Verify
docker exec -it jecaph-redis redis-cli ping
```

### Option C: Skip Redis (Development Only)

If Redis is not available, rate limiting will fail. For development:
1. Comment out rate limiter imports in `app.ts`
2. Remove rate limiter middleware

---

## 🚀 Running the Application

### Run Migrations

```bash
# Run Prisma migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push
```

### Seed Database

```bash
npm run db:seed
```

This creates:
- Admin user: `admin@jecaph.edu` / `admin123`
- Sample campus
- Sample rooms
- System settings
- Shuttle routes

### Development Mode

```bash
npm run dev
```

Server starts with:
- Hot reload enabled
- Console logging
- Debug mode

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### View Database (Prisma Studio)

```bash
npm run db:studio
```

Opens browser GUI at `http://localhost:5555`

---

## ✅ Verifying Setup

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

### 3. Test Admin Login

```bash
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jecaph.edu",
    "password": "admin123"
  }'
```

### 4. Test Protected Endpoint

```bash
# Get token from login response, then:
curl http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Hostel-ID: YOUR_HOSTEL_UUID"
```

---

## 📁 Directory Structure After Setup

```
backend/
├── dist/              # Compiled JS (after build)
├── logs/              # Application logs (auto-created)
│   ├── error.log
│   └── combined.log
├── node_modules/      # Dependencies
├── prisma/
│   ├── migrations/    # Database migrations
│   └── schema.prisma  # Database schema
├── src/               # Source code
├── uploads/           # User uploads (auto-created)
├── .env               # Environment variables (created)
├── package.json
└── tsconfig.json
```

---

## 🔧 NPM Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon src/server.ts` | Start dev server with hot reload |
| `build` | `tsc` | Compile TypeScript to JS |
| `start` | `node dist/server.js` | Run production server |
| `db:generate` | `prisma generate` | Generate Prisma client |
| `db:migrate` | `prisma migrate dev` | Run migrations (dev) |
| `db:push` | `prisma db push` | Push schema to DB |
| `db:studio` | `prisma studio` | Open database GUI |
| `db:seed` | `ts-node prisma/seed.ts` | Seed database |
| `test` | `jest` | Run tests |
| `lint` | `eslint src/**/*.ts` | Lint source files |

---

## ⚠️ Troubleshooting

### Database Connection Failed

```
Error: P1001: Can't reach database server
```

**Solutions:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Verify database exists
4. Check network/firewall

### Redis Connection Failed

```
Error: Redis connection error: ECONNREFUSED
```

**Solutions:**
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_HOST and REDIS_PORT
3. If using password, verify REDIS_PASSWORD

### Port Already in Use

```
Error: EADDRINUSE: Port 3000 already in use
```

**Solutions:**
```bash
# Find process using port
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
PORT=3001
```

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npm run db:generate
```

### Migration Failed

```
Error: Migration failed to apply
```

**Solutions:**
1. Check DATABASE_URL
2. Reset database (WARNING: deletes data):
```bash
npx prisma migrate reset
```

### Email Not Sending

1. Check SMTP credentials
2. For Gmail, use App Password (not regular password)
3. Enable "Less secure app access" or use OAuth
4. Check spam folder

### Paystack Integration Issues

1. Verify using test keys for development
2. Check PAYSTACK_SECRET_KEY format (starts with `sk_test_` or `sk_live_`)
3. Verify callback URL is accessible

---

## 📞 Common Development Tasks

### Create New Admin User

```bash
# Using Prisma Studio
npm run db:studio
# Navigate to users table, add new record

# Or using psql
psql -d jecaph_db -c "
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'newadmin@jecaph.edu',
  '\$2b\$10\$...',  -- bcrypt hash of password
  'New',
  'Admin',
  'super_admin',
  'active',
  true,
  NOW(),
  NOW()
);"
```

### Reset User Password

```bash
# Generate hash
node -e "console.log(require('bcrypt').hashSync('NewPassword123!', 10))"

# Update in database
psql -d jecaph_db -c "UPDATE users SET password_hash = 'NEW_HASH' WHERE email = 'user@example.com';"
```

### View Logs

```bash
# Error logs
tail -f logs/error.log

# All logs
tail -f logs/combined.log
```

### Clear Rate Limits (Development)

```bash
redis-cli KEYS "rl:*" | xargs redis-cli DEL
```

---

## 🔐 Security Checklist for Production

Before deploying to production:

- [ ] Change JWT_SECRET to strong random value
- [ ] Use production Paystack keys
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS_ORIGIN
- [ ] Use secure SMTP configuration
- [ ] Enable HTTPS
- [ ] Change default admin password
- [ ] Review and restrict ALLOWED_FILE_TYPES
- [ ] Set appropriate rate limits
- [ ] Enable database SSL

---

*Document generated: February 6, 2026*
