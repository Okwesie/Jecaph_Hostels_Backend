# JECAPH Hostel Management System - Local Setup Guide

## Project Structure

```
jecaph-hostel-system/
├── app/
│   ├── (auth)/               # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify-otp/
│   ├── admin/                # Admin dashboard
│   │   ├── login/
│   │   └── dashboard/
│   ├── dashboard/            # Student dashboard
│   │   ├── rooms/
│   │   ├── shuttle/
│   │   ├── maintenance/
│   │   ├── payments/
│   │   ├── feedback/
│   │   └── profile/
│   ├── api/                  # API routes (to be created)
│   │   ├── auth/
│   │   ├── rooms/
│   │   ├── bookings/
│   │   ├── shuttle/
│   │   ├── maintenance/
│   │   ├── payments/
│   │   ├── feedback/
│   │   └── admin/
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/               # React components
│   ├── auth/
│   ├── dashboard/
│   ├── rooms/
│   └── ui/                   # shadcn/ui components
├── lib/                      # Utilities
│   ├── utils.ts
│   └── api.ts               # API client (to be created)
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
```

## Prerequisites

- Node.js 18+ (download from nodejs.org)
- npm or yarn package manager
- PostgreSQL 13+ (download from postgresql.org)
- Git (for version control)

## Frontend Setup

### 1. Clone or Download Project

```bash
cd jecaph-hostel-system
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Create Environment Variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open http://localhost:3000 in your browser.

Access points:
- Student Login: http://localhost:3000/auth/login
- Student Signup: http://localhost:3000/auth/signup
- Admin Login: http://localhost:3000/admin/login
- Student Dashboard: http://localhost:3000/dashboard
- Admin Dashboard: http://localhost:3000/admin/dashboard

## Backend Setup (Node.js/Express)

### 1. Create Backend Project

```bash
mkdir jecaph-backend
cd jecaph-backend
npm init -y
```

### 2. Install Backend Dependencies

```bash
npm install express cors dotenv pg bcryptjs jsonwebtoken nodemailer axios uuid

# Development dependencies
npm install --save-dev nodemon ts-node typescript @types/express @types/node
```

### 3. Create Project Structure

```
jecaph-backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── roomController.ts
│   │   ├── bookingController.ts
│   │   ├── shuttleController.ts
│   │   ├── maintenanceController.ts
│   │   ├── paymentController.ts
│   │   ├── feedbackController.ts
│   │   └── profileController.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── rooms.ts
│   │   ├── bookings.ts
│   │   ├── shuttle.ts
│   │   ├── maintenance.ts
│   │   ├── payments.ts
│   │   ├── feedback.ts
│   │   ├── profile.ts
│   │   └── admin.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Room.ts
│   │   ├── Booking.ts
│   │   └── ... (other models)
│   ├── utils/
│   │   ├── database.ts
│   │   ├── emailService.ts
│   │   ├── paystack.ts
│   │   └── jwt.ts
│   ├── config/
│   │   └── index.ts
│   └── app.ts
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

### 4. Create Environment File

Create `.env` in backend root:

```
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jecaph_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRES_IN=24h

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@jecaph.com

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# CORS
CORS_ORIGIN=http://localhost:3000

# File Storage (Optional - for AWS S3)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=jecaph-uploads
AWS_REGION=us-east-1
```

### 5. Setup PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE jecaph_db;

# Connect to database
\c jecaph_db

# Run the SQL schema
\i path/to/database.sql
```

Or using command line:

```bash
# Create database
createdb -U postgres jecaph_db

# Load schema
psql -U postgres -d jecaph_db -f database.sql
```

### 6. Create Basic Express Server

Create `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'Internal server error',
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### 7. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

### 8. Run Backend

```bash
npm run dev
```

Backend should run on http://localhost:3001

## Database Connection Test

Create a test file to verify database connection:

```typescript
// test-db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully:', res.rows[0]);
  }
  pool.end();
});
```

Run with: `npx ts-node test-db.ts`

## Testing API Endpoints

### Using cURL

```bash
# Check server health
curl http://localhost:3001/api/health

# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "Password123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Using Postman

1. Download Postman from postman.com
2. Import API collection (to be created)
3. Test each endpoint
4. Example request:
   - Method: POST
   - URL: http://localhost:3001/api/auth/login
   - Headers: Content-Type: application/json
   - Body: `{ "email": "...", "password": "..." }`

## Common Issues & Solutions

### Issue: "Cannot find module 'typescript'"

**Solution**:
```bash
npm install --save-dev typescript ts-node
npx tsc --init
```

### Issue: Database connection refused

**Solution**:
1. Check PostgreSQL is running: `psql --version`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -l`

### Issue: Port 3001 already in use

**Solution**:
```bash
# macOS/Linux: Find process using port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Windows: Find and kill
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Issue: CORS errors

**Solution**:
1. Ensure `CORS_ORIGIN` in `.env` matches frontend URL
2. Check backend is listening on correct port
3. Use browser console to see full error message

## Production Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy with one click

### Backend (Heroku/Railway)

1. Create Procfile:
```
web: npm start
```

2. Ensure TypeScript builds to `dist/`
3. Deploy to hosting platform
4. Set environment variables on platform

## Performance Optimization

1. **Frontend**: Enable Next.js image optimization
2. **Backend**: Use connection pooling for database
3. **Database**: Create proper indexes (already included in schema)
4. **Caching**: Implement Redis for session management
5. **API**: Use pagination for large data sets

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting on API
- [ ] Enable CORS only for trusted origins
- [ ] Use httpOnly cookies for tokens
- [ ] Validate all inputs on backend
- [ ] Enable SQL parameterization
- [ ] Keep dependencies updated
- [ ] Use strong database passwords

## Useful Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter

# Backend
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm start            # Run compiled code
npm test             # Run tests (if configured)

# Database
createdb jecaph_db   # Create database
dropdb jecaph_db     # Delete database
psql -l              # List databases
```

## API Documentation

Once backend is set up, generate API docs with Swagger:

```bash
npm install swagger-ui-express swagger-jsdoc
```

Then access: http://localhost:3001/api-docs

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions)
2. Create unit and integration tests
3. Set up monitoring and logging
4. Configure email notifications
5. Integrate payment gateway
6. Add file upload functionality
7. Create admin panel enhancements
8. Set up analytics tracking

## Support & Resources

- Documentation: See SYSTEM_DOCUMENTATION.md
- Database Schema: See database.sql
- Issue Tracking: Create issues on GitHub
- Email: support@jecaph.com

```

Now let me remove placeholder images and create the final project structure:
