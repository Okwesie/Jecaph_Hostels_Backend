# JECAPH Hostel Management System - Backend API Specification

## Part 1: API Overview

**Base URL**: `https://api.jecaph.com/api` (or `http://localhost:3000/api` for local development)
**API Version**: v1
**Authentication**: JWT Bearer tokens
**Content-Type**: application/json
**Response Format**: Standardized JSON responses

---

## Part 2: Authentication Endpoints

### Endpoint: POST /auth/register

**Purpose**: Create a new student account

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation**:
- firstName: Required, 2-50 characters
- lastName: Required, 2-50 characters
- email: Required, valid email format, must be unique
- password: Required, min 8 chars, 1 uppercase, 1 number, 1 special character

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "data": {
    "userId": "user_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response (Error - 400)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email already registered"
    },
    {
      "field": "password",
      "message": "Password must contain uppercase letter"
    }
  ]
}
```

**Business Logic**:
1. Validate input fields
2. Check if email already exists
3. Hash password using bcrypt (salt rounds: 10)
4. Create user record with role='student', status='active'
5. Generate OTP code and store in database with 10-minute expiration
6. Send OTP via email
7. Return success response

**Error Cases**:
- Email already registered: 409
- Password too weak: 400
- Invalid email format: 400
- Validation failure: 400
- Database error: 500

---

### Endpoint: POST /auth/login

**Purpose**: Authenticate user and issue JWT tokens

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation**:
- email: Required, valid email format
- password: Required

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "profilePicture": "https://cdn.example.com/profiles/user_123.jpg"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Response (Error - 401)**:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Business Logic**:
1. Validate input
2. Find user by email
3. Verify password using bcrypt
4. Check if email is verified
5. Generate access token (1 hour expiration)
6. Generate refresh token (7 days expiration)
7. Store refresh token in database
8. Return tokens and user data

**Error Cases**:
- Invalid email/password: 401
- Email not verified: 403
- Account suspended: 403
- User not found: 401
- Database error: 500

---

### Endpoint: POST /auth/verify-otp

**Purpose**: Verify email with OTP code

**Request**:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Validation**:
- email: Required, valid email
- otp: Required, 6 digits

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "user_123",
      "email": "john@example.com",
      "emailVerified": true
    }
  }
}
```

**Response (Error - 400)**:
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**Business Logic**:
1. Find user by email
2. Verify OTP matches and hasn't expired
3. Mark email as verified (set email_verified_at)
4. Delete used OTP
5. Return success response

**Error Cases**:
- Invalid OTP: 400
- Expired OTP: 400
- User not found: 404
- Email already verified: 400

---

### Endpoint: POST /auth/resend-otp

**Purpose**: Resend OTP code to email

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Validation**:
- email: Required, valid email format

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Business Logic**:
1. Find user by email
2. Check if email already verified
3. Invalidate previous OTP
4. Generate new OTP
5. Store OTP with 10-minute expiration
6. Send via email
7. Return success

**Error Cases**:
- User not found: 404
- Email already verified: 400
- Too many requests: 429

---

### Endpoint: POST /auth/admin-login

**Purpose**: Authenticate admin user

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

**Response**: Same as POST /auth/login but with admin-level checks

**Business Logic**:
1. Validate input
2. Find user with role='admin' or 'super_admin'
3. Verify password
4. Generate tokens
5. Return user data and tokens

**Error Cases**:
- Not an admin: 403
- Invalid credentials: 401
- Account suspended: 403

---

### Endpoint: POST /auth/logout

**Purpose**: Logout user and invalidate tokens

**Authentication Required**: Yes (JWT)

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Business Logic**:
1. Verify JWT token
2. Add token to blacklist
3. Delete refresh token from database
4. Return success

---

### Endpoint: POST /auth/refresh-token

**Purpose**: Get new access token using refresh token

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Cases**:
- Invalid refresh token: 401
- Refresh token expired: 401

---

### Endpoint: POST /auth/forgot-password

**Purpose**: Request password reset

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

**Business Logic**:
1. Find user by email
2. Generate reset token (valid 1 hour)
3. Store reset token in database
4. Send reset link via email
5. Return success (don't reveal if email exists for security)

---

### Endpoint: POST /auth/reset-password

**Purpose**: Reset password with token

**Request**:
```json
{
  "token": "reset_token_123",
  "newPassword": "NewPass456!"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Business Logic**:
1. Verify reset token
2. Hash new password
3. Update user password
4. Invalidate reset token
5. Return success

**Error Cases**:
- Invalid token: 400
- Token expired: 400

---

## Part 3: User Endpoints

### Endpoint: GET /users/me

**Purpose**: Get current logged-in user profile

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+233XX XXXX XXXX",
    "role": "student",
    "status": "active",
    "profilePicture": "https://cdn.example.com/profiles/user_123.jpg",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

---

### Endpoint: PUT /users/me

**Purpose**: Update user profile information

**Authentication Required**: Yes

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+233XX XXXX XXXX",
  "emergencyContact": "Jane Doe",
  "program": "Computer Science"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+233XX XXXX XXXX",
    "updatedAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### Endpoint: PUT /users/me/password

**Purpose**: Change user password

**Authentication Required**: Yes

**Request**:
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Validation**:
- currentPassword: Must match stored password
- newPassword: Min 8 chars, complexity requirements

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Cases**:
- Current password incorrect: 401
- New password too weak: 400

---

### Endpoint: POST /users/upload-profile-picture

**Purpose**: Upload profile picture

**Authentication Required**: Yes

**Request**: Form data with file
```
POST /users/upload-profile-picture
Content-Type: multipart/form-data

file: [binary image data]
```

**Validation**:
- File types: jpg, png, gif
- Max size: 5MB
- Image dimensions: 100x100 to 2000x2000 pixels

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Profile picture uploaded",
  "data": {
    "profilePicture": "https://cdn.example.com/profiles/user_123.jpg"
  }
}
```

**Business Logic**:
1. Validate file type and size
2. Compress/optimize image
3. Generate unique filename
4. Upload to storage (S3/Cloudinary)
5. Store URL in user profile
6. Delete old image if exists
7. Return new image URL

---

## Part 4: Room Endpoints

### Endpoint: GET /rooms

**Purpose**: List all available rooms with filtering

**Query Parameters**:
```
GET /rooms?search=101&type=single&minPrice=100&maxPrice=1000&page=1&limit=12&sort=price_asc&amenities=wifi,ac
```

**Authentication Required**: No (public)

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "room_123",
        "roomNumber": "101",
        "type": "single",
        "capacity": 1,
        "pricePerMonth": 500,
        "currentOccupancy": 0,
        "amenities": ["wifi", "ac", "study_desk"],
        "image": "https://cdn.example.com/rooms/101.jpg",
        "rating": 4.5,
        "reviewCount": 12,
        "status": "available",
        "features": "Modern facilities, bright windows",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 52,
      "itemsPerPage": 12
    }
  }
}
```

**Filter Parameters**:
- search: Text search (room number, type, features)
- type: single, shared, suite, dormitory
- minPrice: Minimum monthly price
- maxPrice: Maximum monthly price
- amenities: Comma-separated list
- status: available, occupied, maintenance
- sort: price_asc, price_desc, rating_desc, newest

---

### Endpoint: GET /rooms/:id

**Purpose**: Get detailed information about a specific room

**Authentication Required**: No

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "id": "room_123",
    "roomNumber": "101",
    "type": "single",
    "capacity": 1,
    "pricePerMonth": 500,
    "currentOccupancy": 0,
    "availableBeds": 1,
    "amenities": ["wifi", "ac", "study_desk", "balcony"],
    "images": ["url1", "url2", "url3"],
    "rating": 4.5,
    "reviews": [
      {
        "studentName": "John",
        "rating": 5,
        "review": "Excellent room!",
        "date": "2024-01-10"
      }
    ],
    "features": "Modern facilities, bright windows, spacious",
    "rules": "No parties, quiet hours 10pm-7am",
    "status": "available",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Endpoint: POST /rooms (Admin)

**Purpose**: Create new room

**Authentication Required**: Yes (Admin)

**Request**:
```json
{
  "roomNumber": "102",
  "type": "single",
  "capacity": 1,
  "pricePerMonth": 550,
  "amenities": ["wifi", "ac", "study_desk"],
  "status": "available",
  "description": "Modern single room",
  "features": "Spacious with good lighting"
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "room_124",
    "roomNumber": "102",
    "type": "single",
    "pricePerMonth": 550
  }
}
```

---

### Endpoint: PUT /rooms/:id (Admin)

**Purpose**: Update room information

**Authentication Required**: Yes (Admin)

**Request**: Same as POST /rooms

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": { /* updated room data */ }
}
```

---

### Endpoint: DELETE /rooms/:id (Admin)

**Purpose**: Delete room

**Authentication Required**: Yes (Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

**Error Cases**:
- Room has active bookings: 409

---

## Part 5: Booking Endpoints

### Endpoint: POST /bookings

**Purpose**: Create new room booking

**Authentication Required**: Yes

**Request**:
```json
{
  "roomId": "room_123",
  "checkInDate": "2024-02-01",
  "checkOutDate": "2024-06-30",
  "notes": "Have pets"
}
```

**Validation**:
- roomId: Must exist and be available
- checkInDate: Cannot be in the past
- checkOutDate: Must be after checkInDate
- Duration: Minimum 1 month

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking_123",
    "roomId": "room_123",
    "studentId": "user_123",
    "checkInDate": "2024-02-01",
    "checkOutDate": "2024-06-30",
    "duration": 5,
    "status": "pending",
    "totalAmount": 2500,
    "createdAt": "2024-01-20T15:00:00Z"
  }
}
```

**Business Logic**:
1. Validate room availability
2. Check for conflicts with existing bookings
3. Calculate total amount (price * months)
4. Create booking with status='pending'
5. Send confirmation email
6. Return booking details

**Error Cases**:
- Room unavailable: 409
- Date conflict: 409
- Validation failure: 400

---

### Endpoint: GET /bookings

**Purpose**: Get user's bookings

**Authentication Required**: Yes

**Query Parameters**:
```
GET /bookings?status=active&page=1&limit=10
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "roomNumber": "101",
        "roomType": "single",
        "checkInDate": "2024-02-01",
        "checkOutDate": "2024-06-30",
        "duration": 5,
        "totalAmount": 2500,
        "status": "active",
        "amountPaid": 1500,
        "outstandingBalance": 1000,
        "createdAt": "2024-01-20T15:00:00Z"
      }
    ],
    "pagination": { /* pagination data */ }
  }
}
```

---

### Endpoint: GET /bookings/:id

**Purpose**: Get specific booking details

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "roomId": "room_123",
    "roomNumber": "101",
    "roomType": "single",
    "studentId": "user_123",
    "studentName": "John Doe",
    "checkInDate": "2024-02-01",
    "checkOutDate": "2024-06-30",
    "duration": 5,
    "totalAmount": 2500,
    "amountPaid": 1500,
    "outstandingBalance": 1000,
    "status": "active",
    "notes": "Have pets",
    "createdAt": "2024-01-20T15:00:00Z",
    "updatedAt": "2024-01-20T16:00:00Z"
  }
}
```

---

### Endpoint: PUT /bookings/:id (Admin)

**Purpose**: Approve or reject booking

**Authentication Required**: Yes (Admin)

**Request**:
```json
{
  "status": "approved",
  "notes": "Approved - payment pending"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Booking status updated",
  "data": { /* updated booking */ }
}
```

---

### Endpoint: DELETE /bookings/:id

**Purpose**: Cancel booking

**Authentication Required**: Yes (Student who booked or Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "refundAmount": 2500,
    "refundDate": "2024-01-21"
  }
}
```

**Business Logic**:
1. Check if booking can be cancelled (status check)
2. Calculate refund (full for early cancellation, partial for late)
3. Create refund transaction
4. Update booking status to 'cancelled'
5. Release room for other bookings
6. Send cancellation email
7. Return refund details

---

## Part 6: Shuttle Endpoints

### Endpoint: GET /shuttle/routes

**Purpose**: Get available shuttle routes

**Authentication Required**: Yes

**Query Parameters**:
```
GET /shuttle/routes?from=kampus&to=center&date=2024-01-21
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "route_123",
        "from": "Campus",
        "to": "City Center",
        "departureTime": "08:00",
        "arrivalTime": "08:45",
        "price": 10,
        "availableSeats": 5,
        "totalSeats": 20,
        "driver": "James Mensah",
        "vehicle": "Toyota Hiace",
        "frequency": "Daily"
      }
    ]
  }
}
```

---

### Endpoint: POST /shuttle/book

**Purpose**: Book shuttle seat

**Authentication Required**: Yes

**Request**:
```json
{
  "routeId": "route_123",
  "date": "2024-01-21",
  "seats": 1
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Shuttle booked successfully",
  "data": {
    "bookingId": "shuttle_booking_123",
    "routeId": "route_123",
    "from": "Campus",
    "to": "City Center",
    "departureTime": "08:00",
    "date": "2024-01-21",
    "seats": 1,
    "totalPrice": 10,
    "status": "confirmed",
    "qrCode": "data:image/png;base64,..."
  }
}
```

---

### Endpoint: GET /shuttle/bookings

**Purpose**: Get user's shuttle bookings

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "shuttle_booking_123",
        "routeId": "route_123",
        "from": "Campus",
        "to": "City Center",
        "departureTime": "08:00",
        "date": "2024-01-21",
        "seats": 1,
        "totalPrice": 10,
        "status": "confirmed",
        "qrCode": "data:image/png;base64,..."
      }
    ]
  }
}
```

---

### Endpoint: DELETE /shuttle/bookings/:id

**Purpose**: Cancel shuttle booking

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Booking cancelled",
  "data": {
    "refundAmount": 10
  }
}
```

---

## Part 7: Maintenance Endpoints

### Endpoint: POST /maintenance/submit

**Purpose**: Submit maintenance request

**Authentication Required**: Yes

**Request**:
```json
{
  "title": "Broken window",
  "category": "facility",
  "priority": "high",
  "description": "Window in room 101 is cracked",
  "roomId": "room_123"
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Maintenance request submitted",
  "data": {
    "id": "maintenance_123",
    "title": "Broken window",
    "category": "facility",
    "priority": "high",
    "status": "new",
    "createdAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### Endpoint: GET /maintenance/requests

**Purpose**: Get user's maintenance requests

**Authentication Required**: Yes

**Query Parameters**:
```
GET /maintenance/requests?status=new&priority=high
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "maintenance_123",
        "title": "Broken window",
        "category": "facility",
        "priority": "high",
        "status": "in_progress",
        "description": "Window in room 101 is cracked",
        "assignedTo": "John Smith",
        "response": "Will be fixed tomorrow",
        "createdAt": "2024-01-20T15:00:00Z",
        "updatedAt": "2024-01-20T16:00:00Z"
      }
    ]
  }
}
```

---

### Endpoint: PUT /maintenance/requests/:id (Admin)

**Purpose**: Update maintenance request status

**Authentication Required**: Yes (Admin)

**Request**:
```json
{
  "status": "in_progress",
  "assignedTo": "James",
  "response": "We'll fix this tomorrow morning"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Request updated",
  "data": { /* updated request */ }
}
```

---

## Part 8: Payment Endpoints

### Endpoint: POST /payments/initialize

**Purpose**: Initialize payment transaction

**Authentication Required**: Yes

**Request**:
```json
{
  "amount": 500,
  "type": "room_booking",
  "reference": "booking_123",
  "paymentMethod": "paystack"
}
```

**Validation**:
- amount: Positive number, not exceeding outstanding balance
- type: room_booking, other_fees
- reference: Must reference valid booking/invoice

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "paymentId": "payment_123",
    "amount": 500,
    "currency": "GHS",
    "status": "pending",
    "paymentLink": "https://checkout.paystack.com/...",
    "reference": "PAYSTACK_REF_123"
  }
}
```

**Business Logic**:
1. Validate amount and booking/invoice
2. Create payment record with status='pending'
3. Call Paystack API to initialize transaction
4. Return payment link
5. Send confirmation email

---

### Endpoint: POST /payments/verify

**Purpose**: Verify payment from payment gateway webhook

**Authentication Required**: No (Webhook)

**Request** (from Paystack):
```json
{
  "event": "charge.success",
  "data": {
    "reference": "PAYSTACK_REF_123",
    "status": "success",
    "amount": 50000,
    "customer": {
      "email": "john@example.com"
    }
  }
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Payment verified and processed"
}
```

**Business Logic**:
1. Verify webhook signature (Paystack secret key)
2. Find payment by reference
3. Verify amount matches
4. Update payment status to 'completed'
5. Update booking/invoice as paid
6. Send receipt email
7. Update outstanding balance
8. Send confirmation to student

---

### Endpoint: GET /payments/history

**Purpose**: Get user's payment history

**Authentication Required**: Yes

**Query Parameters**:
```
GET /payments/history?status=completed&startDate=2024-01-01&endDate=2024-01-31&page=1
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment_123",
        "amount": 500,
        "currency": "GHS",
        "type": "room_booking",
        "reference": "booking_123",
        "status": "completed",
        "paymentMethod": "paystack",
        "transactionReference": "PAYSTACK_REF_123",
        "date": "2024-01-20T15:00:00Z",
        "receiptUrl": "https://cdn.example.com/receipts/payment_123.pdf"
      }
    ],
    "summary": {
      "totalPaid": 1500,
      "outstandingBalance": 1000
    }
  }
}
```

---

### Endpoint: GET /payments/balance

**Purpose**: Get outstanding balance

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "outstandingBalance": 1000,
    "totalOwed": 2500,
    "amountPaid": 1500,
    "lastPaymentDate": "2024-01-20T15:00:00Z",
    "nextPaymentDue": "2024-02-20"
  }
}
```

---

## Part 9: Feedback Endpoints

### Endpoint: POST /feedback/submit

**Purpose**: Submit feedback about services

**Authentication Required**: Yes

**Request**:
```json
{
  "rating": 4,
  "category": "room_quality",
  "title": "Clean and comfortable",
  "feedback": "The room is very clean and well-maintained. Staff is helpful.",
  "anonymous": false
}
```

**Validation**:
- rating: 1-5
- category: Predefined options
- title: 5-100 characters
- feedback: 10-1000 characters

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": "feedback_123",
    "rating": 4,
    "category": "room_quality",
    "title": "Clean and comfortable",
    "status": "pending_response",
    "createdAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### Endpoint: GET /feedback/my-feedback

**Purpose**: Get user's feedback history

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "feedback": [
      {
        "id": "feedback_123",
        "rating": 4,
        "category": "room_quality",
        "title": "Clean and comfortable",
        "feedback": "The room is very clean...",
        "status": "responded",
        "adminResponse": "Thank you for your feedback! We're glad you're satisfied.",
        "createdAt": "2024-01-20T15:00:00Z",
        "respondedAt": "2024-01-21T10:00:00Z"
      }
    ]
  }
}
```

---

### Endpoint: GET /feedback (Admin)

**Purpose**: View all student feedback

**Authentication Required**: Yes (Admin)

**Query Parameters**:
```
GET /feedback?rating=5&category=room_quality&status=pending_response&page=1
```

**Response**: List of all feedback with filtering options

---

### Endpoint: PUT /feedback/:id/respond (Admin)

**Purpose**: Respond to feedback

**Authentication Required**: Yes (Admin)

**Request**:
```json
{
  "response": "Thank you for the feedback! We appreciate your kind words."
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Response added",
  "data": { /* updated feedback */ }
}
```

---

## Part 10: Support Ticket Endpoints

### Endpoint: POST /support/tickets

**Purpose**: Create support ticket

**Authentication Required**: Yes

**Request**:
```json
{
  "category": "technical",
  "priority": "high",
  "subject": "WiFi not working",
  "description": "WiFi connection is very slow and keeps disconnecting",
  "attachments": ["file_url_1", "file_url_2"]
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "id": "ticket_123",
    "ticketNumber": "TK-2024-001234",
    "category": "technical",
    "priority": "high",
    "subject": "WiFi not working",
    "status": "open",
    "createdAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### Endpoint: GET /support/tickets

**Purpose**: Get user's support tickets

**Authentication Required**: Yes

**Query Parameters**:
```
GET /support/tickets?status=open&priority=high&page=1
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_123",
        "ticketNumber": "TK-2024-001234",
        "category": "technical",
        "priority": "high",
        "subject": "WiFi not working",
        "status": "open",
        "assignedTo": "Support Team",
        "lastUpdated": "2024-01-20T16:00:00Z",
        "createdAt": "2024-01-20T15:00:00Z"
      }
    ]
  }
}
```

---

### Endpoint: GET /support/tickets/:id

**Purpose**: Get ticket details with chat history

**Authentication Required**: Yes

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "ticketNumber": "TK-2024-001234",
    "category": "technical",
    "priority": "high",
    "subject": "WiFi not working",
    "status": "open",
    "messages": [
      {
        "id": "msg_1",
        "sender": "student",
        "senderName": "John Doe",
        "message": "WiFi is not working in my room",
        "timestamp": "2024-01-20T15:00:00Z"
      },
      {
        "id": "msg_2",
        "sender": "support",
        "senderName": "Sarah Smith",
        "message": "We'll send someone to check it",
        "timestamp": "2024-01-20T15:30:00Z"
      }
    ],
    "createdAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### Endpoint: POST /support/tickets/:id/message

**Purpose**: Add message to ticket

**Authentication Required**: Yes

**Request**:
```json
{
  "message": "The issue has been resolved. WiFi is working now."
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Message added",
  "data": {
    "id": "msg_3",
    "sender": "student",
    "message": "The issue has been resolved. WiFi is working now.",
    "timestamp": "2024-01-20T16:00:00Z"
  }
}
```

---

### Endpoint: PUT /support/tickets/:id/close (Admin)

**Purpose**: Close support ticket

**Authentication Required**: Yes (Admin)

**Request**:
```json
{
  "resolution": "Issue resolved - WiFi restored"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Ticket closed",
  "data": { /* updated ticket */ }
}
```

---

## Part 11: Admin Dashboard Endpoints

### Endpoint: GET /admin/statistics

**Purpose**: Get dashboard statistics

**Authentication Required**: Yes (Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "totalStudents": 250,
    "totalRooms": 50,
    "occupiedRooms": 42,
    "occupancyRate": 0.84,
    "totalRevenue": 125000,
    "thisMonthRevenue": 12500,
    "pendingPayments": 8500,
    "activeBookings": 150,
    "pendingMaintenance": 5,
    "openSupportTickets": 3
  }
}
```

---

### Endpoint: GET /admin/analytics

**Purpose**: Get detailed analytics and charts

**Authentication Required**: Yes (Admin)

**Query Parameters**:
```
GET /admin/analytics?startDate=2024-01-01&endDate=2024-01-31&type=revenue
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "revenueByDay": [
      { "date": "2024-01-01", "amount": 5000 },
      { "date": "2024-01-02", "amount": 4500 }
    ],
    "occupancyByDay": [
      { "date": "2024-01-01", "rate": 0.80 },
      { "date": "2024-01-02", "rate": 0.82 }
    ],
    "paymentMethods": {
      "paystack": 8000,
      "mobile_money": 4500
    }
  }
}
```

---

### Endpoint: GET /admin/users

**Purpose**: List all users (Admin)

**Authentication Required**: Yes (Admin)

**Query Parameters**:
```
GET /admin/users?search=john&role=student&status=active&page=1&limit=20
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLogin": "2024-01-20T14:22:00Z"
      }
    ],
    "pagination": { /* pagination */ }
  }
}
```

---

### Endpoint: GET /admin/users/:id (Admin)

**Purpose**: Get user details with history

**Authentication Required**: Yes (Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "user": { /* user data */ },
    "bookings": [ /* user's bookings */ ],
    "payments": [ /* user's payments */ ],
    "loginHistory": [ /* login history */ ]
  }
}
```

---

### Endpoint: PUT /admin/users/:id (Admin)

**Purpose**: Update user (admin)

**Authentication Required**: Yes (Admin)

**Request**:
```json
{
  "status": "suspended",
  "reason": "Non-payment"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "User updated",
  "data": { /* updated user */ }
}
```

---

### Endpoint: DELETE /admin/users/:id (Super Admin)

**Purpose**: Delete user account

**Authentication Required**: Yes (Super Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Part 12: Admin Settings Endpoints

### Endpoint: GET /admin/settings

**Purpose**: Get system settings

**Authentication Required**: Yes (Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "general": {
      "appName": "JECAPH",
      "supportEmail": "support@jecaph.edu",
      "supportPhone": "+233XX XXXX XXXX",
      "hostelAddress": "Address here"
    },
    "hostel": {
      "hostelName": "JECAPH Hostel",
      "totalRooms": 50,
      "semesterStart": "2024-01-15",
      "semesterEnd": "2024-06-30",
      "baseMonthlyFee": 500
    },
    "notifications": {
      "emailNotifications": true,
      "smsNotifications": true,
      "pushNotifications": true
    },
    "security": {
      "passwordMinLength": 8,
      "passwordRequireSpecial": true,
      "twoFactorAuthRequired": false,
      "sessionTimeout": 3600
    }
  }
}
```

---

### Endpoint: PUT /admin/settings

**Purpose**: Update system settings

**Authentication Required**: Yes (Super Admin for critical settings, Admin for others)

**Request**:
```json
{
  "general": {
    "appName": "JECAPH",
    "supportEmail": "newemail@jecaph.edu"
  },
  "hostel": {
    "baseMonthlyFee": 600
  }
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": { /* updated settings */ }
}
```

---

## Part 13: Standard Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Unauthorized Error (401)
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or expired token"
}
```

### Forbidden Error (403)
```json
{
  "success": false,
  "message": "Forbidden - You don't have permission to access this resource"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "message": "Conflict - Email already exists"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "errorId": "ERR_123456"
}
```

---

## Part 14: Background Jobs

**Email Jobs**:
- Send OTP on signup
- Send booking confirmation
- Send payment receipts
- Send payment reminders (before due date)
- Send maintenance updates
- Send feedback response notifications

**Scheduled Tasks**:
- Clean up expired OTP codes (every 30 minutes)
- Clean up expired JWT tokens (every hour)
- Generate daily revenue reports (at 2 AM)
- Send payment reminders (at 8 AM daily)
- Archive old logs (weekly)

---

This Backend API Specification provides complete reference for implementing the backend system.
```

Now let me create the comprehensive SQL database schema:
