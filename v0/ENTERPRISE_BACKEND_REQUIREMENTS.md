# JECAPH HOSTEL MANAGEMENT SYSTEM
## Enterprise Backend Requirements & Specifications

**Version**: 2.0 (Enterprise Edition)  
**Last Updated**: January 2025  
**Status**: Production-Ready with Multi-User Support

---

## 🎯 CRITICAL ENTERPRISE FEATURES

### 1. Multi-Tenancy & Hostel Context

**Overview**: The system now supports multiple hostels with complete data isolation.

**Implementation Requirements**:

```typescript
// Every API request must include hostel context
headers: {
  'X-Hostel-ID': string  // UUID of the hostel
  'Authorization': Bearer {token}
}
```

**Database Changes Required**:
- Add `hostel_id` column to ALL tables (users, rooms, bookings, payments, etc.)
- Create compound indexes: `(hostel_id, id)` for faster lookups
- Add Row-Level Security (RLS) policies to enforce data isolation

```sql
-- Example for bookings table
ALTER TABLE bookings ADD COLUMN hostel_id UUID REFERENCES hostels(id);
CREATE INDEX idx_bookings_hostel ON bookings(hostel_id, id);

-- RLS Policy Example
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY hostel_isolation ON bookings
  FOR ALL
  USING (hostel_id = current_setting('app.current_hostel_id')::UUID);
```

**All API Endpoints Must**:
- Validate `X-Hostel-ID` header on every request
- Filter all queries by `hostel_id`
- Return 403 if user attempts to access data from different hostel
- Include `hostel_id` in all audit logs

---

### 2. Optimistic Locking & Concurrent User Handling

**Problem**: Multiple users editing the same record simultaneously causes conflicts.

**Solution**: Version-based optimistic locking

**Database Schema Updates**:
```sql
-- Add version column to tables that support editing
ALTER TABLE rooms ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE maintenance_requests ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1;

-- Create trigger to auto-increment version
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rooms_version
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION increment_version();
```

**API Changes for All UPDATE Endpoints**:

```http
PUT /api/bookings/:id
Headers:
  Authorization: Bearer {token}
  X-Hostel-ID: {hostel_id}
  If-Match: {version}  // <-- REQUIRED for optimistic locking

Body:
{
  "status": "approved",
  "version": 5  // <-- Current version from frontend
}

Success Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "version": 6,  // <-- Incremented version
    "updated_at": "2025-01-20T10:30:00Z"
  }
}

Conflict Response (409):
{
  "success": false,
  "code": "VERSION_CONFLICT",
  "message": "This record has been modified by another user",
  "data": {
    "current_version": 7,  // Latest version in DB
    "your_version": 5,     // Version client tried to update
    "latest_data": { /* full latest record */ }
  }
}
```

**Business Logic**:
1. Client sends current `version` with update request
2. Backend checks: `WHERE id = :id AND version = :version`
3. If no rows affected → version mismatch → return 409
4. If successful → auto-increment version and return new version
5. Frontend shows conflict resolution dialog to user

---

### 3. WebSocket Real-Time Updates

**Overview**: Enable real-time synchronization across all connected clients.

**WebSocket Server Requirements**:

```typescript
// WebSocket connection URL
ws://api.jecaph.com/ws

// Connection authentication
{
  type: 'auth',
  token: 'Bearer {access_token}',
  hostel_id: 'uuid'
}

// Server confirms authentication
{
  type: 'auth_success',
  user_id: 'uuid',
  hostel_id: 'uuid'
}
```

**Event Types to Broadcast**:

```typescript
// Room updates (availability changes, new rooms, price changes)
{
  type: 'room.updated' | 'room.created' | 'room.deleted',
  hostel_id: 'uuid',
  data: { /* room object */ },
  timestamp: 'ISO8601'
}

// Booking events
{
  type: 'booking.created' | 'booking.updated' | 'booking.approved' | 'booking.cancelled',
  hostel_id: 'uuid',
  user_id: 'uuid',  // Only send to this user
  data: { /* booking object */ },
  timestamp: 'ISO8601'
}

// Payment events
{
  type: 'payment.completed' | 'payment.failed',
  hostel_id: 'uuid',
  user_id: 'uuid',  // Only send to this user
  data: { /* payment object */ },
  timestamp: 'ISO8601'
}

// Maintenance updates
{
  type: 'maintenance.created' | 'maintenance.updated' | 'maintenance.completed',
  hostel_id: 'uuid',
  user_id: 'uuid',  // Only send to requester
  data: { /* maintenance object */ },
  timestamp: 'ISO8601'
}

// Shuttle updates
{
  type: 'shuttle.updated' | 'shuttle.seats_changed',
  hostel_id: 'uuid',
  data: { /* shuttle route object */ },
  timestamp: 'ISO8601'
}

// Notifications
{
  type: 'notification.new',
  hostel_id: 'uuid',
  user_id: 'uuid',  // Only send to this user
  data: {
    title: 'string',
    message: 'string',
    priority: 'low' | 'medium' | 'high',
    action_url: 'string'
  },
  timestamp: 'ISO8601'
}
```

**Broadcasting Rules**:
- **Public Events**: Broadcast to all users in the same hostel (room updates, shuttle changes)
- **Private Events**: Only send to specific user_id (payments, bookings, notifications)
- **Room-Based**: All clients must join a "room" for their hostel_id
- **Reconnection**: Client must re-authenticate on reconnect

**Implementation**:
```javascript
// When data changes in database
await broadcastToHostel(hostel_id, {
  type: 'room.updated',
  hostel_id,
  data: updatedRoom
});

// For user-specific events
await broadcastToUser(user_id, hostel_id, {
  type: 'payment.completed',
  hostel_id,
  user_id,
  data: payment
});
```

---

### 4. Enhanced Authentication & Token Management

**Token Refresh Flow**:

```http
POST /api/auth/refresh-token
Headers:
  Content-Type: application/json

Body:
{
  "refresh_token": "string"
}

Success Response (200):
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}

Error Responses:
- 401: { "success": false, "code": "INVALID_REFRESH_TOKEN", "message": "Refresh token is invalid or expired" }
- 401: { "success": false, "code": "TOKEN_REVOKED", "message": "Token has been revoked" }
```

**Token Storage**:
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES hostels(id),
  token_hash VARCHAR(255) NOT NULL,  -- Hash the refresh token
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  device_info JSONB,  -- Store device details
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

**Session Management**:
- Store active sessions with device info
- Allow users to view and revoke sessions from profile
- Auto-revoke tokens on password change
- Implement token rotation (new refresh token on each use)

---

### 5. Rate Limiting & Security

**Rate Limit Rules**:

```typescript
// Per endpoint rate limits
const rateLimits = {
  // Authentication endpoints (stricter limits)
  'POST /api/auth/login': '5 requests per 15 minutes per IP',
  'POST /api/auth/register': '3 requests per hour per IP',
  'POST /api/auth/forgot-password': '3 requests per hour per IP',
  'POST /api/auth/verify-otp': '5 attempts per 10 minutes per email',
  'POST /api/auth/resend-otp': '3 requests per hour per email',
  
  // General API endpoints
  'GET /api/*': '100 requests per minute per user',
  'POST /api/*': '30 requests per minute per user',
  'PUT /api/*': '30 requests per minute per user',
  'DELETE /api/*': '10 requests per minute per user',
  
  // Specific endpoints
  'POST /api/bookings': '5 requests per hour per user',
  'POST /api/payments/initialize': '10 requests per hour per user',
  'POST /api/maintenance/submit': '10 requests per day per user'
};
```

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200  // Unix timestamp
```

**Rate Limit Exceeded Response (429)**:
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "data": {
    "retry_after": 300,  // Seconds until reset
    "limit": 100,
    "reset_at": "2025-01-20T11:00:00Z"
  }
}
```

**Implementation**:
```javascript
// Use Redis for rate limiting
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each user to 100 requests per windowMs
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests'
    });
  }
});
```

---

### 6. Permission-Based Access Control (RBAC)

**Role Hierarchy**:
```typescript
enum Role {
  STUDENT = 'student',      // Basic user, can book rooms, view own data
  STAFF = 'staff',          // Can handle maintenance requests
  MANAGER = 'manager',      // Can manage rooms, approve bookings
  ADMIN = 'admin',          // Full hostel management access
  SUPER_ADMIN = 'super_admin'  // System-wide access
}

// Permissions matrix
const permissions = {
  // Bookings
  'bookings:create': ['student', 'admin', 'manager', 'super_admin'],
  'bookings:read:own': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'bookings:read:all': ['admin', 'manager', 'super_admin'],
  'bookings:update': ['admin', 'manager', 'super_admin'],
  'bookings:approve': ['manager', 'admin', 'super_admin'],
  'bookings:delete': ['admin', 'super_admin'],
  
  // Rooms
  'rooms:read': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'rooms:create': ['manager', 'admin', 'super_admin'],
  'rooms:update': ['manager', 'admin', 'super_admin'],
  'rooms:delete': ['admin', 'super_admin'],
  
  // Payments
  'payments:create': ['student', 'admin', 'manager', 'super_admin'],
  'payments:read:own': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'payments:read:all': ['admin', 'manager', 'super_admin'],
  'payments:refund': ['admin', 'super_admin'],
  
  // Maintenance
  'maintenance:create': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'maintenance:read:own': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'maintenance:read:all': ['staff', 'admin', 'manager', 'super_admin'],
  'maintenance:update': ['staff', 'admin', 'manager', 'super_admin'],
  'maintenance:assign': ['manager', 'admin', 'super_admin'],
  
  // Users
  'users:read:own': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'users:update:own': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'users:read:all': ['admin', 'manager', 'super_admin'],
  'users:update:any': ['admin', 'super_admin'],
  'users:delete': ['super_admin'],
  
  // Shuttle
  'shuttle:book': ['student', 'staff', 'admin', 'manager', 'super_admin'],
  'shuttle:manage': ['manager', 'admin', 'super_admin'],
  
  // Reports & Analytics
  'reports:view': ['admin', 'manager', 'super_admin'],
  'analytics:view': ['admin', 'manager', 'super_admin'],
  
  // System Settings
  'settings:read': ['admin', 'super_admin'],
  'settings:update': ['super_admin']
};
```

**Permission Checking Middleware**:
```javascript
const checkPermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!permissions[permission].includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action',
        data: {
          required_permission: permission,
          your_role: userRole
        }
      });
    }
    
    next();
  };
};

// Usage in routes
router.post('/bookings', 
  authenticate,
  checkPermission('bookings:create'),
  createBooking
);

router.put('/bookings/:id/approve',
  authenticate,
  checkPermission('bookings:approve'),
  approveBooking
);
```

**Ownership Validation**:
```javascript
// For endpoints that access user-specific data
const checkOwnership = async (req, res, next) => {
  const bookingId = req.params.id;
  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    return res.status(404).json({ 
      success: false, 
      message: 'Booking not found' 
    });
  }
  
  // Admins and managers can access any booking in their hostel
  if (['admin', 'manager', 'super_admin'].includes(req.user.role)) {
    // Still enforce hostel isolation
    if (booking.hostel_id !== req.hostelId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    return next();
  }
  
  // Students can only access their own bookings
  if (booking.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'You can only access your own bookings'
    });
  }
  
  next();
};

router.get('/bookings/:id',
  authenticate,
  checkOwnership,
  getBooking
);
```

---

### 7. Enhanced Validation with Zod Schemas

**All API endpoints must validate input using these exact schemas**:

```typescript
// Booking validation
const bookingCreateSchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
  check_in_date: z.string().refine((date) => {
    const checkIn = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkIn >= today;
  }, 'Check-in date must be today or in the future'),
  check_out_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  emergency_contact_name: z.string().min(2).max(100).optional(),
  emergency_contact_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  special_requests: z.string().max(500).optional(),
  terms_accepted: z.literal(true, { 
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  })
}).refine((data) => {
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  const diffMonths = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + 
                     (checkOut.getMonth() - checkIn.getMonth());
  return diffMonths >= 1;
}, {
  message: 'Minimum booking duration is 1 month',
  path: ['check_out_date']
});

// Maintenance request validation
const maintenanceRequestSchema = z.object({
  room_id: z.string().uuid().optional(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  category: z.enum(['plumbing', 'electrical', 'furniture', 'ac', 'cleaning', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  image_url: z.string().url().optional()
});

// Profile update validation
const profileUpdateSchema = z.object({
  first_name: z.string().min(2).max(50).optional(),
  last_name: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  emergency_contact: z.string().max(100).optional(),
  program: z.string().max(100).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Password change validation
const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character')
}).refine((data) => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password']
});
```

**Validation Error Response Format**:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    {
      "field": "check_in_date",
      "message": "Check-in date must be today or in the future"
    },
    {
      "field": "terms_accepted",
      "message": "You must accept the terms and conditions"
    }
  ]
}
```

---

### 8. Input Sanitization & XSS Prevention

**All text inputs must be sanitized before storage**:

```javascript
const DOMPurify = require('isomorphic-dompurify');

// Sanitize function
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove HTML tags and scripts
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],  // No HTML allowed
      ALLOWED_ATTR: []
    }).trim();
  }
  return input;
};

// Apply to all text fields before database insert/update
const createBooking = async (req, res) => {
  const { special_requests, emergency_contact_name } = req.body;
  
  const sanitizedData = {
    ...req.body,
    special_requests: sanitizeInput(special_requests),
    emergency_contact_name: sanitizeInput(emergency_contact_name)
  };
  
  // Continue with sanitized data...
};
```

**SQL Injection Prevention**:
- ALWAYS use parameterized queries
- NEVER concatenate user input into SQL strings

```javascript
// ❌ NEVER DO THIS
const query = `SELECT * FROM bookings WHERE id = '${req.params.id}'`;

// ✅ ALWAYS DO THIS
const query = 'SELECT * FROM bookings WHERE id = $1 AND hostel_id = $2';
const result = await db.query(query, [req.params.id, req.hostelId]);
```

---

### 9. Enhanced Error Handling & Logging

**Standardized Error Codes**:

```typescript
enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Conflicts & Concurrency
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  ROOM_UNAVAILABLE = 'ROOM_UNAVAILABLE',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  
  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  BOOKING_DEADLINE_PASSED = 'BOOKING_DEADLINE_PASSED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

**Error Response Format**:
```json
{
  "success": false,
  "code": "VERSION_CONFLICT",
  "message": "This record has been modified by another user",
  "data": {
    "current_version": 7,
    "your_version": 5,
    "latest_data": { /* full record */ }
  },
  "timestamp": "2025-01-20T10:30:00Z",
  "request_id": "req_abc123"  // For tracking in logs
}
```

**Logging Requirements**:

```javascript
// Log all errors with context
logger.error('Booking creation failed', {
  error: err.message,
  stack: err.stack,
  user_id: req.user?.id,
  hostel_id: req.hostelId,
  request_id: req.id,
  endpoint: req.originalUrl,
  method: req.method,
  ip: req.ip,
  user_agent: req.get('user-agent'),
  body: sanitizedBody  // Never log sensitive data
});

// Log all user actions
logger.info('Booking created', {
  user_id: req.user.id,
  hostel_id: req.hostelId,
  booking_id: booking.id,
  room_id: booking.room_id,
  action: 'CREATE_BOOKING',
  request_id: req.id,
  ip: req.ip
});

// Performance monitoring
logger.metric('api.response_time', {
  endpoint: '/api/bookings',
  method: 'POST',
  duration_ms: 245,
  status: 201
});
```

---

### 10. Performance Optimizations

**Caching Strategy**:

```javascript
// Redis caching for frequently accessed data
const cacheKeys = {
  rooms: (hostelId) => `rooms:${hostelId}:all`,
  room: (hostelId, roomId) => `room:${hostelId}:${roomId}`,
  userProfile: (userId) => `user:${userId}:profile`,
  shuttleRoutes: (hostelId) => `shuttle:${hostelId}:routes`
};

// Cache TTL
const cacheTTL = {
  rooms: 300,      // 5 minutes
  profile: 3600,   // 1 hour
  shuttle: 600,    // 10 minutes
  settings: 86400  // 24 hours
};

// Cache implementation
const getRooms = async (hostelId) => {
  const cacheKey = cacheKeys.rooms(hostelId);
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const rooms = await Room.findAll({ where: { hostel_id: hostelId } });
  
  // Store in cache
  await redis.setex(cacheKey, cacheTTL.rooms, JSON.stringify(rooms));
  
  return rooms;
};

// Invalidate cache on updates
const updateRoom = async (hostelId, roomId, data) => {
  const room = await Room.update(roomId, data);
  
  // Invalidate relevant caches
  await redis.del(cacheKeys.rooms(hostelId));
  await redis.del(cacheKeys.room(hostelId, roomId));
  
  // Broadcast WebSocket event
  await broadcastToHostel(hostelId, {
    type: 'room.updated',
    data: room
  });
  
  return room;
};
```

**Database Query Optimization**:

```sql
-- Use database query explain to find slow queries
EXPLAIN ANALYZE 
SELECT * FROM bookings 
WHERE hostel_id = '...' AND user_id = '...' 
ORDER BY created_at DESC;

-- Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_bookings_hostel_user 
  ON bookings(hostel_id, user_id, created_at DESC);

-- Use pagination for large result sets
SELECT * FROM bookings
WHERE hostel_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Use COUNT(*) OVER() for pagination without separate count query
SELECT *, COUNT(*) OVER() as total_count
FROM bookings
WHERE hostel_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

### 11. Monitoring & Observability

**Required Metrics**:

```javascript
// Track these metrics
const metrics = {
  // API Performance
  'api.request.count': 'counter',      // Total requests
  'api.request.duration': 'histogram', // Response times
  'api.request.errors': 'counter',     // Error count
  
  // Database
  'db.query.duration': 'histogram',    // Query execution time
  'db.connection.pool': 'gauge',       // Active connections
  'db.query.errors': 'counter',
  
  // Business Metrics
  'bookings.created': 'counter',
  'payments.completed': 'counter',
  'payments.failed': 'counter',
  'users.registered': 'counter',
  'maintenance.created': 'counter',
  
  // System
  'cache.hit.rate': 'gauge',
  'websocket.connections': 'gauge',
  'rate_limit.exceeded': 'counter'
};

// Example: Track API response time
const trackResponseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    metrics.histogram('api.request.duration', duration, {
      method: req.method,
      endpoint: req.route?.path,
      status: res.statusCode
    });
  });
  
  next();
};
```

**Health Check Endpoint**:

```http
GET /api/health

Response (200):
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "services": {
    "database": {
      "status": "up",
      "response_time_ms": 5
    },
    "redis": {
      "status": "up",
      "response_time_ms": 2
    },
    "websocket": {
      "status": "up",
      "active_connections": 42
    },
    "payment_gateway": {
      "status": "up",
      "last_check": "2025-01-20T10:29:00Z"
    }
  },
  "version": "2.0.0",
  "uptime_seconds": 86400
}
```

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 (Critical - Week 1-2):
1. ✅ Multi-tenancy & hostel context
2. ✅ Optimistic locking for concurrent users
3. ✅ Enhanced authentication with token refresh
4. ✅ Permission-based access control
5. ✅ Input validation with Zod

### Phase 2 (High Priority - Week 3-4):
1. ✅ WebSocket real-time updates
2. ✅ Rate limiting & security
3. ✅ Enhanced error handling
4. ✅ Audit logging
5. ✅ Cache implementation

### Phase 3 (Medium Priority - Week 5-6):
1. Performance monitoring
2. Advanced caching strategies
3. Database query optimization
4. Comprehensive testing
5. Documentation updates

---

## 📋 TESTING REQUIREMENTS

### Unit Tests:
- Test all validation schemas
- Test permission checks for each role
- Test optimistic locking conflict scenarios
- Test rate limiting

### Integration Tests:
- Test WebSocket event broadcasting
- Test concurrent user scenarios
- Test payment flow end-to-end
- Test booking conflicts

### Load Tests:
- 100+ concurrent users
- WebSocket connection handling
- Cache performance under load
- Database connection pool limits

---

## 🔒 SECURITY CHECKLIST

- [ ] All endpoints validate hostel context
- [ ] All UPDATE endpoints use optimistic locking
- [ ] All endpoints implement rate limiting
- [ ] All inputs are sanitized before storage
- [ ] All database queries use parameterized statements
- [ ] All sensitive data is encrypted at rest
- [ ] All API responses exclude sensitive fields
- [ ] All file uploads are validated and scanned
- [ ] All authentication tokens are securely hashed
- [ ] All user sessions can be revoked
- [ ] All admin actions are logged in audit trail
- [ ] All errors don't leak sensitive information

---

### 11. Feature Flags / Feature Rollout System

**Overview**: Admins can enable or disable individual features (e.g. shuttle booking, payments, feedback). When a feature is disabled, students see a "Coming Soon" placeholder instead of the feature page. The frontend currently persists flags in localStorage for demo purposes, but the backend **must** be the source of truth.

**Database Table**:

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(hostel_id, feature_key)
);

-- Seed with default flags (all features off except essentials)
INSERT INTO feature_flags (hostel_id, feature_key, enabled) VALUES
  ('<hostel_id>', 'room_booking', true),
  ('<hostel_id>', 'shuttle_booking', false),
  ('<hostel_id>', 'maintenance_requests', true),
  ('<hostel_id>', 'payments', true),
  ('<hostel_id>', 'feedback', true),
  ('<hostel_id>', 'support', true),
  ('<hostel_id>', 'notifications', true),
  ('<hostel_id>', 'profile_editing', true);
```

**API Endpoints**:

#### `GET /api/feature-flags`
Returns feature flags for the current hostel context. Used by the frontend on app load.

**Headers**: `Authorization: Bearer {token}`, `X-Hostel-ID: {hostel_uuid}`

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "room_booking": true,
    "shuttle_booking": false,
    "maintenance_requests": true,
    "payments": true,
    "feedback": true,
    "support": true,
    "notifications": true,
    "profile_editing": true
  }
}
```

#### `PUT /api/admin/feature-flags`
Admin-only endpoint to update feature flags for the current hostel.

**Headers**: `Authorization: Bearer {admin_token}`, `X-Hostel-ID: {hostel_uuid}`

**Request Body**:
```json
{
  "flags": {
    "shuttle_booking": true,
    "feedback": false
  }
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "room_booking": true,
    "shuttle_booking": true,
    "maintenance_requests": true,
    "payments": true,
    "feedback": false,
    "support": true,
    "notifications": true,
    "profile_editing": true
  },
  "message": "Feature flags updated successfully"
}
```

**Validation Rules**:
- Only users with `admin` or `manager` role can update flags
- `feature_key` must be one of the predefined keys listed above
- Changes are scoped to the hostel specified in `X-Hostel-ID`
- All flag changes should be logged in the audit trail with `updated_by`

**Frontend Integration**:
- On app load the frontend calls `GET /api/feature-flags` and caches the result
- The `FeatureFlagsProvider` context distributes flags to all components
- `FeatureGate` component wraps each feature page; renders "Coming Soon" when disabled
- Sidebar shows a "Soon" badge next to disabled features
- Dashboard sections show inline "Coming Soon" placeholders for disabled features
- Admin settings page has a "Features" tab with toggles for each feature, calling `PUT /api/admin/feature-flags` on save

**Allowed Feature Keys**:
| Key | Label | Default |
|-----|-------|---------|
| `room_booking` | Room Booking | `true` |
| `shuttle_booking` | Shuttle Booking | `false` |
| `maintenance_requests` | Maintenance Requests | `true` |
| `payments` | Online Payments | `true` |
| `feedback` | Feedback & Reviews | `true` |
| `support` | Support & Help | `true` |
| `notifications` | Notifications | `true` |
| `profile_editing` | Profile Editing | `true` |

**Security Checklist**:
- [ ] Only admin/manager roles can update flags
- [ ] Flags are scoped per hostel (multi-tenancy)
- [ ] Flag changes are recorded in audit log
- [ ] Student-facing API only returns the enabled/disabled boolean map (no metadata)
- [ ] Backend enforces feature gates on API routes too (e.g. reject shuttle booking API calls if `shuttle_booking` is `false`)

---

This document supersedes all previous backend specifications and must be implemented in full for the JECAPH Hostel Management System to function correctly with the enterprise-grade frontend.
