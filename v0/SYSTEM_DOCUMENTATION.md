# JECAPH Hostel Management System - Complete Documentation

## 1. SYSTEM OVERVIEW

JECAPH is a comprehensive hostel management platform for university students, providing room booking, shuttle services, maintenance requests, payment tracking, and administrative features.

### Core Modules:
1. **Authentication System** - Student and Admin login/signup with OTP verification
2. **Room Management** - Browse, filter, and book available rooms
3. **Shuttle Booking** - Schedule transportation to campus and key locations
4. **Maintenance System** - Submit and track facility maintenance requests
5. **Payment System** - Track payments, invoices, and outstanding balances
6. **Feedback System** - Provide ratings and suggestions for improvement
7. **Admin Dashboard** - Manage rooms, bookings, and support tickets
8. **Profile Management** - Update personal information and security settings

---

## 2. DATABASE SCHEMA

### Users Table
```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR(255) UNIQUE NOT NULL,
  password_hash: VARCHAR(255) NOT NULL,
  first_name: VARCHAR(100),
  last_name: VARCHAR(100),
  phone: VARCHAR(20),
  student_id: VARCHAR(50) UNIQUE,
  date_of_birth: DATE,
  role: ENUM('student', 'admin') DEFAULT 'student',
  is_verified: BOOLEAN DEFAULT FALSE,
  profile_visibility: ENUM('private', 'public', 'roommates') DEFAULT 'private',
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  deleted_at: TIMESTAMP (soft delete)
)
```

### OTP Verification Table
```sql
otp_codes (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  email: VARCHAR(255) NOT NULL,
  code: VARCHAR(6) NOT NULL,
  is_used: BOOLEAN DEFAULT FALSE,
  expires_at: TIMESTAMP NOT NULL,
  created_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Rooms Table
```sql
rooms (
  id: UUID PRIMARY KEY,
  room_number: VARCHAR(50) UNIQUE NOT NULL,
  block: VARCHAR(50) NOT NULL,
  room_type: ENUM('single', 'shared', 'double', 'triple') NOT NULL,
  floor: INTEGER,
  capacity: INTEGER NOT NULL,
  current_occupancy: INTEGER DEFAULT 0,
  monthly_rent: DECIMAL(10, 2) NOT NULL,
  amenities: JSON (array of amenities),
  image_url: VARCHAR(500),
  status: ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
  rating: DECIMAL(3, 2) DEFAULT 0,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  deleted_at: TIMESTAMP (soft delete)
)
```

### Room Bookings Table
```sql
room_bookings (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  room_id: UUID NOT NULL,
  check_in_date: DATE NOT NULL,
  check_out_date: DATE,
  booking_status: ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  total_amount: DECIMAL(10, 2) NOT NULL,
  payment_status: ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  booking_date: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
)
```

### Shuttle Routes Table
```sql
shuttle_routes (
  id: UUID PRIMARY KEY,
  name: VARCHAR(200) NOT NULL,
  departure_point: VARCHAR(200) NOT NULL,
  destination: VARCHAR(200) NOT NULL,
  departure_time: TIME NOT NULL,
  arrival_time: TIME NOT NULL,
  total_seats: INTEGER NOT NULL,
  price_per_seat: DECIMAL(10, 2) NOT NULL,
  frequency: ENUM('daily', 'weekly', 'twice_daily', 'every_2_hours') NOT NULL,
  status: ENUM('active', 'inactive') DEFAULT 'active',
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  deleted_at: TIMESTAMP (soft delete)
)
```

### Shuttle Bookings Table
```sql
shuttle_bookings (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  route_id: UUID NOT NULL,
  booking_date: DATE NOT NULL,
  number_of_seats: INTEGER NOT NULL DEFAULT 1,
  total_amount: DECIMAL(10, 2) NOT NULL,
  booking_status: ENUM('confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'confirmed',
  qr_code: VARCHAR(500),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (route_id) REFERENCES shuttle_routes(id)
)
```

### Maintenance Requests Table
```sql
maintenance_requests (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  room_id: UUID,
  category: VARCHAR(100) NOT NULL,
  title: VARCHAR(200) NOT NULL,
  description: TEXT NOT NULL,
  priority: ENUM('low', 'medium', 'high', 'emergency') NOT NULL,
  status: ENUM('pending', 'in_progress', 'resolved', 'cancelled') DEFAULT 'pending',
  assigned_to: UUID,
  submitted_date: TIMESTAMP,
  resolved_date: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
)
```

### Payments Table
```sql
payments (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  booking_id: UUID,
  amount: DECIMAL(10, 2) NOT NULL,
  payment_method: ENUM('paystack_card', 'mobile_money', 'bank_transfer') NOT NULL,
  transaction_id: VARCHAR(200),
  status: ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  description: VARCHAR(500),
  receipt_number: VARCHAR(100),
  payment_date: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES room_bookings(id) ON DELETE SET NULL
)
```

### Invoices Table
```sql
invoices (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  invoice_number: VARCHAR(100) UNIQUE NOT NULL,
  amount: DECIMAL(10, 2) NOT NULL,
  due_date: DATE NOT NULL,
  issue_date: DATE NOT NULL,
  payment_status: ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
  description: TEXT,
  pdf_url: VARCHAR(500),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Feedback Table
```sql
feedback (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  category: VARCHAR(100) NOT NULL,
  title: VARCHAR(200) NOT NULL,
  rating: INTEGER (1-5) NOT NULL,
  feedback_text: TEXT NOT NULL,
  is_anonymous: BOOLEAN DEFAULT FALSE,
  status: ENUM('submitted', 'acknowledged', 'action_taken', 'closed') DEFAULT 'submitted',
  management_response: TEXT,
  responded_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
)
```

### Support Tickets Table
```sql
support_tickets (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  subject: VARCHAR(300) NOT NULL,
  description: TEXT NOT NULL,
  priority: ENUM('low', 'medium', 'high', 'urgent') NOT NULL,
  status: ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  assigned_to: UUID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  resolved_at: TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
)
```

---

## 3. API ENDPOINTS

### AUTHENTICATION ENDPOINTS

#### POST /api/auth/signup
**Description**: Register a new student account
**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+233501234567"
}
```
**Response**: `{ user: User, message: "Verification code sent to email" }`

#### POST /api/auth/verify-otp
**Description**: Verify OTP code sent to email
**Request Body**:
```json
{
  "email": "student@example.com",
  "code": "123456"
}
```
**Response**: `{ user: User, token: JWT }`

#### POST /api/auth/login
**Description**: Student login with email and password
**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```
**Response**: `{ user: User, token: JWT }`

#### POST /api/auth/resend-otp
**Description**: Resend OTP code
**Request Body**:
```json
{
  "email": "student@example.com"
}
```
**Response**: `{ message: "OTP sent successfully" }`

#### POST /api/auth/forgot-password
**Description**: Request password reset
**Request Body**:
```json
{
  "email": "student@example.com"
}
```
**Response**: `{ message: "Reset code sent to email" }`

#### POST /api/auth/reset-password
**Description**: Reset password with reset code
**Request Body**:
```json
{
  "email": "student@example.com",
  "reset_code": "123456",
  "new_password": "NewPassword123!"
}
```
**Response**: `{ message: "Password reset successful" }`

#### POST /api/auth/logout
**Description**: Logout user (invalidate token)
**Response**: `{ message: "Logout successful" }`

---

### ROOM MANAGEMENT ENDPOINTS

#### GET /api/rooms
**Description**: Get all available rooms with filtering
**Query Parameters**: 
- `room_type` (optional): 'single', 'shared', 'double', 'triple'
- `min_price` (optional): Minimum monthly rent
- `max_price` (optional): Maximum monthly rent
- `block` (optional): Filter by block
- `sort_by` (optional): 'price', 'rating', 'availability'
- `page` (optional): Pagination
- `limit` (optional): Results per page

**Response**:
```json
{
  "rooms": [
    {
      "id": "uuid",
      "room_number": "301",
      "block": "Block A",
      "room_type": "single",
      "capacity": 1,
      "current_occupancy": 0,
      "monthly_rent": 850,
      "amenities": ["WiFi", "AC", "Desk"],
      "image_url": "...",
      "status": "available",
      "rating": 4.5
    }
  ],
  "total": 50,
  "page": 1
}
```

#### GET /api/rooms/:id
**Description**: Get detailed room information
**Response**: `{ room: Room, reviews: Review[], occupants: User[] }`

#### POST /api/room-bookings
**Description**: Create new room booking (requires auth)
**Request Body**:
```json
{
  "room_id": "uuid",
  "check_in_date": "2024-02-01",
  "check_out_date": "2024-06-30"
}
```
**Response**: `{ booking: RoomBooking, payment_url: String }`

#### GET /api/room-bookings
**Description**: Get user's room bookings (requires auth)
**Response**:
```json
{
  "bookings": [
    {
      "id": "uuid",
      "room": Room,
      "check_in_date": "2024-02-01",
      "check_out_date": "2024-06-30",
      "booking_status": "confirmed",
      "total_amount": 3400,
      "payment_status": "completed"
    }
  ]
}
```

#### GET /api/room-bookings/:id
**Description**: Get specific booking details
**Response**: `{ booking: RoomBooking }`

#### PUT /api/room-bookings/:id
**Description**: Update booking dates
**Request Body**:
```json
{
  "check_out_date": "2024-07-31"
}
```
**Response**: `{ booking: RoomBooking }`

#### DELETE /api/room-bookings/:id
**Description**: Cancel room booking
**Response**: `{ message: "Booking cancelled successfully", refund: Decimal }`

---

### SHUTTLE BOOKING ENDPOINTS

#### GET /api/shuttle-routes
**Description**: Get all available shuttle routes
**Query Parameters**:
- `destination` (optional): Filter by destination
- `date` (optional): Filter by specific date

**Response**:
```json
{
  "routes": [
    {
      "id": "uuid",
      "name": "Hostel → Main Campus",
      "departure_point": "Hostel Gate",
      "destination": "Main Campus",
      "departure_time": "07:00",
      "arrival_time": "07:30",
      "total_seats": 20,
      "available_seats": 8,
      "price_per_seat": 5,
      "frequency": "Daily"
    }
  ]
}
```

#### GET /api/shuttle-routes/:id/availability
**Description**: Get real-time seat availability for a route
**Query Parameters**:
- `date` (required): Date in YYYY-MM-DD format

**Response**:
```json
{
  "route_id": "uuid",
  "date": "2024-01-15",
  "total_seats": 20,
  "booked_seats": 12,
  "available_seats": 8,
  "occupancy_percent": 60
}
```

#### POST /api/shuttle-bookings
**Description**: Book shuttle seats (requires auth)
**Request Body**:
```json
{
  "route_id": "uuid",
  "booking_date": "2024-01-15",
  "number_of_seats": 2
}
```
**Response**: `{ booking: ShuttleBooking, qr_code: String, total_amount: Decimal }`

#### GET /api/shuttle-bookings
**Description**: Get user's shuttle bookings (requires auth)
**Response**:
```json
{
  "bookings": [
    {
      "id": "uuid",
      "route": ShuttleRoute,
      "booking_date": "2024-01-15",
      "number_of_seats": 2,
      "total_amount": 10,
      "booking_status": "confirmed",
      "qr_code": "..."
    }
  ]
}
```

#### DELETE /api/shuttle-bookings/:id
**Description**: Cancel shuttle booking
**Response**: `{ message: "Booking cancelled", refund: Decimal }`

---

### MAINTENANCE ENDPOINTS

#### POST /api/maintenance-requests
**Description**: Submit new maintenance request (requires auth)
**Request Body**:
```json
{
  "category": "Plumbing",
  "title": "Leaky faucet in room",
  "description": "Water keeps dripping from the sink faucet",
  "priority": "high",
  "room_id": "uuid" (optional)
}
```
**Response**: `{ request: MaintenanceRequest }`

#### GET /api/maintenance-requests
**Description**: Get user's maintenance requests (requires auth)
**Query Parameters**:
- `status` (optional): 'pending', 'in_progress', 'resolved'

**Response**:
```json
{
  "requests": [
    {
      "id": "MR001",
      "title": "Leaky faucet",
      "category": "Plumbing",
      "priority": "high",
      "status": "in_progress",
      "submitted_date": "2024-01-10",
      "assigned_to": "Kwesi Boateng"
    }
  ]
}
```

#### GET /api/maintenance-requests/:id
**Description**: Get detailed maintenance request
**Response**: `{ request: MaintenanceRequest, updates: Update[] }`

#### PUT /api/maintenance-requests/:id
**Description**: Update maintenance request status (admin only)
**Request Body**:
```json
{
  "status": "resolved",
  "assigned_to": "uuid"
}
```
**Response**: `{ request: MaintenanceRequest }`

---

### PAYMENT ENDPOINTS

#### POST /api/payments/initiate
**Description**: Initiate payment (returns Paystack URL)
**Request Body**:
```json
{
  "amount": 850,
  "type": "room_rent",
  "booking_id": "uuid"
}
```
**Response**: `{ authorization_url: String, reference: String }`

#### GET /api/payments/verify/:reference
**Description**: Verify payment status
**Response**: `{ status: "success", transaction: Payment }`

#### GET /api/payments/history
**Description**: Get user's payment history (requires auth)
**Response**:
```json
{
  "payments": [
    {
      "id": "uuid",
      "amount": 850,
      "status": "completed",
      "payment_date": "2024-01-15",
      "description": "Room Rent (January)",
      "receipt": "RCP001"
    }
  ]
}
```

#### GET /api/invoices
**Description**: Get user's invoices (requires auth)
**Response**:
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoice_number": "INV-2024-001",
      "amount": 850,
      "due_date": "2024-06-30",
      "payment_status": "unpaid",
      "pdf_url": "..."
    }
  ]
}
```

---

### FEEDBACK ENDPOINTS

#### POST /api/feedback
**Description**: Submit feedback (requires auth)
**Request Body**:
```json
{
  "category": "Room and facilities",
  "title": "Good room quality",
  "rating": 4,
  "feedback_text": "The room is clean and comfortable",
  "is_anonymous": false
}
```
**Response**: `{ feedback: Feedback }`

#### GET /api/feedback
**Description**: Get user's feedback submissions (requires auth)
**Response**: `{ feedback: Feedback[] }`

#### GET /api/feedback/admin
**Description**: Get all feedback (admin only)
**Query Parameters**:
- `status` (optional): 'submitted', 'acknowledged', 'action_taken'

**Response**: `{ feedback: Feedback[], total: Number }`

#### PUT /api/feedback/:id
**Description**: Add management response (admin only)
**Request Body**:
```json
{
  "status": "action_taken",
  "management_response": "We've increased cleaning frequency"
}
```
**Response**: `{ feedback: Feedback }`

---

### PROFILE ENDPOINTS

#### GET /api/profile
**Description**: Get user profile (requires auth)
**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+233501234567",
    "student_id": "STU001",
    "date_of_birth": "2002-01-15",
    "is_verified": true,
    "created_at": "2024-01-01"
  }
}
```

#### PUT /api/profile
**Description**: Update user profile (requires auth)
**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+233501234567",
  "date_of_birth": "2002-01-15"
}
```
**Response**: `{ user: User }`

#### PUT /api/profile/password
**Description**: Change password (requires auth)
**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```
**Response**: `{ message: "Password updated successfully" }`

#### PUT /api/profile/preferences
**Description**: Update notification and privacy preferences (requires auth)
**Request Body**:
```json
{
  "profile_visibility": "public",
  "notify_bookings": true,
  "notify_payments": true,
  "notify_maintenance": true,
  "notify_announcements": true
}
```
**Response**: `{ preferences: UserPreferences }`

---

### ADMIN ENDPOINTS

#### GET /api/admin/dashboard
**Description**: Get admin dashboard stats (admin only)
**Response**:
```json
{
  "total_students": 150,
  "total_rooms": 50,
  "occupancy_rate": 85,
  "revenue_this_month": 42500,
  "pending_maintenance": 5,
  "pending_payments": 12
}
```

#### GET /api/admin/rooms
**Description**: Get all rooms (admin only)
**Response**: `{ rooms: Room[], total: Number }`

#### POST /api/admin/rooms
**Description**: Add new room (admin only)
**Request Body**:
```json
{
  "room_number": "301",
  "block": "Block A",
  "room_type": "single",
  "floor": 3,
  "capacity": 1,
  "monthly_rent": 850,
  "amenities": ["WiFi", "AC"],
  "image_url": "..."
}
```
**Response**: `{ room: Room }`

#### PUT /api/admin/rooms/:id
**Description**: Update room details (admin only)
**Request Body**: Same as POST
**Response**: `{ room: Room }`

#### DELETE /api/admin/rooms/:id
**Description**: Delete/archive room (admin only)
**Response**: `{ message: "Room deleted" }`

#### GET /api/admin/bookings
**Description**: Get all bookings (admin only)
**Query Parameters**:
- `status` (optional)
- `date_from` (optional)
- `date_to` (optional)

**Response**: `{ bookings: RoomBooking[], total: Number }`

#### PUT /api/admin/bookings/:id
**Description**: Approve/reject booking (admin only)
**Request Body**:
```json
{
  "status": "confirmed"
}
```
**Response**: `{ booking: RoomBooking }`

#### GET /api/admin/support-tickets
**Description**: Get all support tickets (admin only)
**Response**: `{ tickets: SupportTicket[] }`

#### PUT /api/admin/support-tickets/:id
**Description**: Update support ticket (admin only)
**Request Body**:
```json
{
  "status": "resolved",
  "response": "Issue has been resolved"
}
```
**Response**: `{ ticket: SupportTicket }`

---

## 4. AUTHENTICATION FLOW

1. User signs up with email and password
2. Backend sends OTP to email
3. User verifies email with OTP code
4. Account is created and activated
5. User can now login with email/password
6. Backend returns JWT token
7. Token is stored in httpOnly cookie or secure storage
8. All subsequent requests include token in Authorization header

---

## 5. ERROR HANDLING

All API responses follow this format for errors:

```json
{
  "error": "Error code",
  "message": "Human-readable error message",
  "status": 400,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

Common error codes:
- `INVALID_CREDENTIALS` - Wrong email/password
- `USER_NOT_FOUND` - User doesn't exist
- `USER_ALREADY_EXISTS` - Email already registered
- `INVALID_OTP` - OTP code is wrong or expired
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `ROOM_NOT_AVAILABLE` - Room cannot be booked
- `INVALID_PAYMENT` - Payment processing failed
- `SERVER_ERROR` - Internal server error

---

## 6. ENVIRONMENT VARIABLES

Backend should have:
```
DATABASE_URL=postgresql://user:password@localhost:5432/jecaph
JWT_SECRET=your_jwt_secret_key
PAYSTACK_SECRET_KEY=paystack_secret
PAYSTACK_PUBLIC_KEY=paystack_public
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password
```

---

## 7. BACKEND TECH STACK RECOMMENDATIONS

- **Language**: Node.js (Express) or Python (Django/Flask)
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer or SendGrid
- **Payment**: Paystack API
- **File Storage**: AWS S3 or Cloudinary

---

## 8. SECURITY CONSIDERATIONS

1. **Password Security**: Use bcrypt with salt rounds ≥ 10
2. **Token Security**: Use JWT with 24-hour expiration
3. **CORS**: Enable only for frontend domain
4. **Rate Limiting**: Implement to prevent brute force attacks
5. **Input Validation**: Validate all inputs on backend
6. **SQL Injection**: Use parameterized queries
7. **HTTPS**: Use SSL/TLS in production
8. **Data Encryption**: Encrypt sensitive data at rest
9. **Audit Logging**: Log all admin actions
10. **Session Management**: Implement refresh token rotation

---

## 9. TESTING CHECKLIST

- [ ] User registration and email verification
- [ ] Login/logout functionality
- [ ] Room browsing and filtering
- [ ] Room booking workflow
- [ ] Payment integration with Paystack
- [ ] Shuttle booking system
- [ ] Maintenance request submission
- [ ] Feedback submission and management
- [ ] Profile update functionality
- [ ] Admin room management
- [ ] Admin booking management
- [ ] Admin support ticket system

```

Now let me create the SQL schema file:
