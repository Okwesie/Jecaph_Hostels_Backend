# JECAPH Backend - Complete API Endpoints Inventory

## 📋 Overview

**Base URL:** `http://localhost:3000`  
**API Prefix:** `/api`  
**Total Endpoints:** 49 documented endpoints  
**Authentication:** Bearer Token (JWT)  
**Multi-tenancy Header:** `X-Hostel-ID: <uuid>`

---

## 🔐 Authentication Endpoints (`/api/auth/*`)

### POST /api/auth/register
**Purpose:** Register a new student account  
**Authentication:** Not required  
**Rate Limit:** 5 requests per 15 minutes  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "firstName": "string (2-50 chars, required)",
  "lastName": "string (2-50 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (min 8 chars, uppercase, lowercase, number, special char)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Error Responses:**
- `400` - Validation failed (weak password, invalid email)
- `409` - Email already registered

**Business Logic:**
1. Validates password strength (8+ chars, uppercase, lowercase, number, special)
2. Checks for existing email
3. Hashes password with bcrypt
4. Creates user with `emailVerified: false`
5. Generates 6-digit OTP (expires in 10 minutes)
6. Sends OTP email

---

### POST /api/auth/login
**Purpose:** Authenticate user and get tokens  
**Authentication:** Not required  
**Rate Limit:** 5 requests per 15 minutes  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "profilePicture": "/uploads/profile.jpg"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**
- `401` - Invalid email or password
- `403` - Email not verified OR Account suspended/inactive

**Business Logic:**
1. Finds user by email
2. Verifies password hash
3. Checks email verified
4. Checks account status is active
5. Generates access token (1h) and refresh token (7d)
6. Stores refresh token in database

---

### POST /api/auth/verify-otp
**Purpose:** Verify email with OTP code  
**Authentication:** Not required  
**Rate Limit:** 5 requests per 15 minutes  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (6 digits, required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": true
    }
  }
}
```

**Error Responses:**
- `400` - Invalid or expired OTP / Email already verified
- `404` - User not found

---

### POST /api/auth/resend-otp
**Purpose:** Resend OTP verification code  
**Authentication:** Not required  
**Rate Limit:** 5 requests per 15 minutes  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Error Responses:**
- `400` - Email already verified
- `404` - User not found

---

### POST /api/auth/admin-login
**Purpose:** Authenticate admin users  
**Authentication:** Not required  
**Rate Limit:** 5 requests per 15 minutes  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
Same as `/api/auth/login`

**Error Responses:**
- `401` - Invalid credentials
- `403` - Access denied (not admin/super_admin) OR Account inactive

---

### POST /api/auth/logout
**Purpose:** Logout and invalidate refresh token  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/refresh-token
**Purpose:** Get new access token  
**Authentication:** Not required (but needs valid refresh token)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `400` - Refresh token required
- `401` - Invalid or expired refresh token
- `403` - Account suspended

---

### POST /api/auth/forgot-password
**Purpose:** Request password reset link  
**Authentication:** Not required  
**Rate Limit:** 5 requests per 15 minutes  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** Always returns success (doesn't reveal if email exists)

---

### POST /api/auth/reset-password
**Purpose:** Reset password with token  
**Authentication:** Not required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "token": "string (uuid, required)",
  "newPassword": "string (required, same rules as registration)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400` - Invalid/expired token OR Weak password

---

## 👤 User Endpoints (`/api/users/*`)

### GET /api/users/me
**Purpose:** Get current user profile  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Headers:**
```
Authorization: Bearer <access_token>
X-Hostel-ID: <hostel_uuid>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+233XXXXXXXXX",
    "role": "student",
    "status": "active",
    "profilePicture": "/uploads/profile.jpg",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-02-01T14:20:00.000Z"
  }
}
```

---

### PUT /api/users/me
**Purpose:** Update current user profile  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional, E.164 format)",
  "emergencyContact": "string (optional)",
  "program": "string (optional, max 100 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+233XXXXXXXXX",
    "updatedAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

### PUT /api/users/me/password
**Purpose:** Change password  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Weak new password
- `401` - Current password incorrect

---

### POST /api/users/upload-profile-picture
**Purpose:** Upload profile picture  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: Image file (jpg, jpeg, png, max 5MB)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile picture uploaded",
  "data": {
    "profilePicture": "/uploads/file-1707213000000-123456789.jpg"
  }
}
```

**Error Responses:**
- `400` - No file uploaded OR Invalid file type

---

## 🏠 Room Endpoints (`/api/rooms/*`)

### GET /api/rooms
**Purpose:** List rooms with filters  
**Authentication:** Not required for listing (but hostel context required)  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search room number, description, features |
| type | string | Room type: single, shared, suite, dormitory |
| minPrice | number | Minimum price per month |
| maxPrice | number | Maximum price per month |
| amenities | string | Comma-separated list |
| status | string | available, occupied, maintenance |
| sort | string | newest, price_asc, price_desc |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 12) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "uuid",
        "roomNumber": "101",
        "roomType": "single",
        "capacity": 1,
        "pricePerMonth": 500,
        "currentOccupancy": 0,
        "amenities": ["wifi", "ac", "desk"],
        "imageUrl": "/uploads/room-101.jpg",
        "status": "available",
        "features": "Spacious with window view",
        "description": "Single room on first floor",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 12
    }
  }
}
```

---

### GET /api/rooms/:id
**Purpose:** Get room details  
**Authentication:** Not required (hostel context required)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomNumber": "101",
    "roomType": "single",
    "capacity": 1,
    "pricePerMonth": 500,
    "currentOccupancy": 0,
    "availableBeds": 1,
    "amenities": ["wifi", "ac", "desk"],
    "imageUrl": "/uploads/room-101.jpg",
    "status": "available",
    "features": "Spacious with window view",
    "description": "Single room on first floor",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Room not found

---

### POST /api/rooms
**Purpose:** Create new room (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "roomNumber": "string (required)",
  "type": "string (single|shared|suite|dormitory, required)",
  "capacity": "number (min 1, required)",
  "pricePerMonth": "number (min 0, required)",
  "amenities": ["array of strings (optional)"],
  "status": "string (optional, default: available)",
  "description": "string (optional)",
  "features": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "uuid",
    "roomNumber": "103",
    "roomType": "single",
    "pricePerMonth": 500
  }
}
```

**Error Responses:**
- `403` - Insufficient permissions
- `409` - Room number already exists

---

### PUT /api/rooms/:id
**Purpose:** Update room (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Request Body:** (all fields optional)
```json
{
  "roomNumber": "string",
  "type": "string",
  "capacity": "number",
  "pricePerMonth": "number",
  "amenities": ["array"],
  "status": "string",
  "description": "string",
  "features": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": { /* updated room object */ }
}
```

---

### DELETE /api/rooms/:id
**Purpose:** Delete room (soft delete, Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

**Error Responses:**
- `404` - Room not found
- `409` - Cannot delete room with active bookings

---

## 📅 Booking Endpoints (`/api/bookings/*`)

### POST /api/bookings
**Purpose:** Create new room booking  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "roomId": "uuid (required)",
  "checkInDate": "ISO8601 date (required)",
  "checkOutDate": "ISO8601 date (required)",
  "notes": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "studentId": "uuid",
    "checkInDate": "2026-02-15",
    "checkOutDate": "2026-06-15",
    "duration": 4,
    "status": "pending",
    "totalAmount": 2000,
    "createdAt": "2026-02-06T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Check-in in past / Check-out before check-in / Duration < 1 month
- `404` - Room not found
- `409` - Room not available / Date conflict

**Business Logic:**
1. Validates dates (not in past, checkout > checkin)
2. Calculates duration in months (min 1)
3. Checks room availability
4. Checks for date conflicts with existing bookings
5. Calculates total amount
6. Creates booking with status "pending"
7. Sends confirmation email

---

### GET /api/bookings
**Purpose:** Get user's bookings  
**Authentication:** Required  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "roomNumber": "101",
        "roomType": "single",
        "checkInDate": "2026-02-15",
        "checkOutDate": "2026-06-15",
        "duration": 4,
        "totalAmount": 2000,
        "status": "pending",
        "amountPaid": 500,
        "outstandingBalance": 1500,
        "createdAt": "2026-02-06T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

---

### GET /api/bookings/:id
**Purpose:** Get booking details  
**Authentication:** Required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "roomNumber": "101",
    "roomType": "single",
    "studentId": "uuid",
    "studentName": "John Doe",
    "checkInDate": "2026-02-15",
    "checkOutDate": "2026-06-15",
    "duration": 4,
    "totalAmount": 2000,
    "amountPaid": 500,
    "outstandingBalance": 1500,
    "status": "pending",
    "notes": "Early check-in requested",
    "createdAt": "2026-02-06T10:30:00.000Z",
    "updatedAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

### PUT /api/bookings/:id
**Purpose:** Update booking status (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "string (pending|approved|rejected|active|completed|cancelled, required)",
  "notes": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking status updated",
  "data": { /* updated booking object */ }
}
```

---

### DELETE /api/bookings/:id
**Purpose:** Cancel booking  
**Authentication:** Required (owner or admin)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "refundAmount": 500,
    "refundDate": "2026-02-06"
  }
}
```

**Error Responses:**
- `400` - Cannot cancel (already cancelled/completed)
- `403` - Not authorized
- `404` - Booking not found

---

## 💳 Payment Endpoints (`/api/payments/*`)

### POST /api/payments/initialize
**Purpose:** Initialize Paystack payment  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "amount": "number (min 0.01, required)",
  "type": "string (room_booking|other_fees, required)",
  "reference": "string (optional - booking ID or reference)",
  "paymentMethod": "string (optional, default: paystack)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "paymentId": "uuid",
    "amount": 500,
    "currency": "GHS",
    "status": "pending",
    "paymentLink": "https://checkout.paystack.com/xxxxx",
    "reference": "PAY_1707213000000_ABC123"
  }
}
```

---

### POST /api/payments/verify
**Purpose:** Verify Paystack payment (callback/webhook)  
**Authentication:** Not required  
**Status:** ✅ Implemented

**Query Parameters:**
```
?reference=PAY_1707213000000_ABC123
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment verified and processed"
}
```

**Business Logic:**
1. Calls Paystack verify API
2. Updates payment status to "completed"
3. If booking payment, updates booking balance
4. Sends receipt email

---

### GET /api/payments/history
**Purpose:** Get user's payment history  
**Authentication:** Required  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| startDate | ISO8601 | Filter from date |
| endDate | ISO8601 | Filter to date |
| page | number | Page number (default: 1) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 500,
        "currency": "GHS",
        "type": "room_booking",
        "reference": "booking_id",
        "status": "completed",
        "paymentMethod": "paystack",
        "transactionReference": "PAY_xxxxx",
        "date": "2026-02-06T10:30:00.000Z",
        "receiptUrl": "/api/payments/uuid/receipt"
      }
    ],
    "summary": {
      "totalPaid": 5000,
      "outstandingBalance": 1500
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### GET /api/payments/balance
**Purpose:** Get user's payment balance summary  
**Authentication:** Required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "outstandingBalance": 1500,
    "totalOwed": 6500,
    "amountPaid": 5000,
    "lastPaymentDate": "2026-02-01T14:20:00.000Z",
    "nextPaymentDue": null
  }
}
```

---

## 🚌 Shuttle Endpoints (`/api/shuttle/*`)

### GET /api/shuttle/routes
**Purpose:** List available shuttle routes  
**Authentication:** Required  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| from | string | Filter by departure location |
| to | string | Filter by destination |
| date | ISO8601 | Check availability for date |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "uuid",
        "from": "Campus",
        "to": "City Center",
        "departureTime": "08:00",
        "arrivalTime": "08:45",
        "price": 10,
        "availableSeats": 15,
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

### POST /api/shuttle/book
**Purpose:** Book shuttle seats  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "routeId": "uuid (required)",
  "date": "ISO8601 date (required)",
  "seats": "number (min 1, default: 1, optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Shuttle booked successfully",
  "data": {
    "bookingId": "uuid",
    "routeId": "uuid",
    "from": "Campus",
    "to": "City Center",
    "departureTime": "08:00",
    "date": "2026-02-07",
    "seats": 2,
    "totalPrice": 20,
    "status": "confirmed",
    "qrCode": "data:image/png;base64,..."
  }
}
```

**Error Responses:**
- `404` - Route not found
- `409` - Not enough seats available

**Business Logic:**
1. Checks route exists
2. Calculates available seats for date
3. Creates booking with QR code
4. Returns QR code data URL

---

### GET /api/shuttle/bookings
**Purpose:** Get user's shuttle bookings  
**Authentication:** Required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "routeId": "uuid",
        "from": "Campus",
        "to": "City Center",
        "departureTime": "08:00",
        "date": "2026-02-07",
        "seats": 2,
        "totalPrice": 20,
        "status": "confirmed",
        "qrCode": "data:image/png;base64,..."
      }
    ]
  }
}
```

---

### DELETE /api/shuttle/bookings/:id
**Purpose:** Cancel shuttle booking  
**Authentication:** Required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled",
  "data": {
    "refundAmount": 20
  }
}
```

**Error Responses:**
- `400` - Already cancelled
- `404` - Booking not found

---

## 🔧 Maintenance Endpoints (`/api/maintenance/*`)

### POST /api/maintenance/submit
**Purpose:** Submit maintenance request  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | 5-100 characters |
| category | string | Yes | plumbing, electrical, furniture, cleaning, other |
| priority | string | Yes | low, medium, high, urgent |
| description | string | Yes | 10-500 characters |
| roomId | string | No | Room UUID |
| attachment | file | No | Image file |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Maintenance request submitted",
  "data": {
    "id": "uuid",
    "title": "Broken faucet",
    "category": "plumbing",
    "priority": "medium",
    "status": "new",
    "createdAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

### GET /api/maintenance/requests
**Purpose:** Get user's maintenance requests  
**Authentication:** Required  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | new, in_progress, completed, cancelled |
| priority | string | low, medium, high, urgent |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "title": "Broken faucet",
        "category": "plumbing",
        "priority": "medium",
        "status": "in_progress",
        "description": "The kitchen faucet is leaking",
        "assignedTo": "John Smith",
        "response": "Technician will visit tomorrow",
        "createdAt": "2026-02-01T10:00:00.000Z",
        "updatedAt": "2026-02-02T14:30:00.000Z"
      }
    ]
  }
}
```

---

### PUT /api/maintenance/requests/:id
**Purpose:** Update maintenance request (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "string (new|in_progress|completed|cancelled, optional)",
  "assignedTo": "uuid (optional)",
  "response": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Request updated",
  "data": { /* updated request object */ }
}
```

---

## 📝 Feedback Endpoints (`/api/feedback/*`)

### POST /api/feedback/submit
**Purpose:** Submit feedback  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "rating": "number (1-5, required)",
  "category": "string (room_quality|staff_service|amenities|food|cleanliness|other, required)",
  "title": "string (5-100 chars, required)",
  "feedback": "string (10-1000 chars, required)",
  "anonymous": "boolean (optional, default: false)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": "uuid",
    "rating": 4,
    "category": "room_quality",
    "title": "Great room",
    "status": "pending",
    "createdAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

### GET /api/feedback/my-feedback
**Purpose:** Get user's submitted feedback  
**Authentication:** Required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "feedback": [
      {
        "id": "uuid",
        "rating": 4,
        "category": "room_quality",
        "title": "Great room",
        "feedback": "The room is spacious and clean",
        "status": "responded",
        "adminResponse": "Thank you for your feedback!",
        "createdAt": "2026-02-01T10:00:00.000Z",
        "respondedAt": "2026-02-02T14:30:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/feedback
**Purpose:** Get all feedback (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| rating | number | Filter by rating (1-5) |
| category | string | Filter by category |
| status | string | pending, responded |
| page | number | Page number |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "feedback": [
      {
        "id": "uuid",
        "rating": 4,
        "category": "room_quality",
        "title": "Great room",
        "feedback": "The room is spacious",
        "studentName": "John Doe",
        "status": "pending",
        "adminResponse": null,
        "createdAt": "2026-02-01T10:00:00.000Z",
        "respondedAt": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100
    }
  }
}
```

---

### PUT /api/feedback/:id/respond
**Purpose:** Respond to feedback (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "response": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Response added",
  "data": { /* updated feedback with response */ }
}
```

---

## 🎫 Support Endpoints (`/api/support/*`)

### POST /api/support/tickets
**Purpose:** Create support ticket  
**Authentication:** Required  
**Status:** ✅ Implemented

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | Yes | technical, billing, facility, other |
| priority | string | Yes | low, medium, high |
| subject | string | Yes | 5-100 characters |
| description | string | Yes | 10-1000 characters |
| attachment | file | No | Image/document file |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "id": "uuid",
    "ticketNumber": "TK-2026-123456",
    "category": "billing",
    "priority": "medium",
    "subject": "Payment not reflected",
    "status": "open",
    "createdAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

### GET /api/support/tickets
**Purpose:** Get user's support tickets  
**Authentication:** Required  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | open, in_progress, closed |
| priority | string | low, medium, high |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "uuid",
        "ticketNumber": "TK-2026-123456",
        "category": "billing",
        "priority": "medium",
        "subject": "Payment not reflected",
        "status": "open",
        "assignedTo": "Support Agent",
        "lastUpdated": "2026-02-06T14:00:00.000Z",
        "createdAt": "2026-02-06T10:30:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/support/tickets/:id
**Purpose:** Get ticket details with messages  
**Authentication:** Required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNumber": "TK-2026-123456",
    "category": "billing",
    "priority": "medium",
    "subject": "Payment not reflected",
    "status": "open",
    "messages": [
      {
        "id": "uuid",
        "sender": "student",
        "senderName": "John Doe",
        "message": "I made a payment yesterday but it's not showing",
        "timestamp": "2026-02-06T10:30:00.000Z"
      },
      {
        "id": "uuid",
        "sender": "support",
        "senderName": "Support Agent",
        "message": "We're looking into this. Can you provide the transaction reference?",
        "timestamp": "2026-02-06T11:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

### POST /api/support/tickets/:id/message
**Purpose:** Add message to ticket  
**Authentication:** Required (ticket owner or admin)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "message": "string (required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message added",
  "data": {
    "id": "uuid",
    "sender": "student",
    "message": "Here is the transaction reference: PAY_xxx",
    "timestamp": "2026-02-06T11:30:00.000Z"
  }
}
```

---

### PUT /api/support/tickets/:id/close
**Purpose:** Close ticket (Admin only)  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ticket closed"
}
```

---

## 📊 Admin Endpoints (`/api/admin/*`)

### GET /api/admin/statistics
**Purpose:** Get dashboard statistics  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalRooms": 50,
    "occupiedRooms": 40,
    "occupancyRate": 0.8,
    "totalRevenue": 75000,
    "thisMonthRevenue": 15000,
    "pendingPayments": 5000,
    "activeBookings": 40,
    "pendingMaintenance": 5,
    "openSupportTickets": 3
  }
}
```

---

### GET /api/admin/analytics
**Purpose:** Get analytics data  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO8601 | Start date |
| endDate | ISO8601 | End date |
| type | string | revenue (default) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "revenueByDay": [
      { "date": "2026-02-01", "amount": 2500 },
      { "date": "2026-02-02", "amount": 3000 }
    ]
  }
}
```

---

### GET /api/admin/users
**Purpose:** List all users  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name/email |
| role | string | Filter by role |
| status | string | active, suspended |
| page | number | Page number |
| limit | number | Items per page (default: 20) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student",
        "status": "active",
        "createdAt": "2026-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 150,
      "itemsPerPage": 20
    }
  }
}
```

---

### GET /api/admin/users/:id
**Purpose:** Get user details  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "status": "active",
      "createdAt": "2026-01-15T10:00:00.000Z"
    },
    "bookings": [ /* last 10 bookings */ ],
    "payments": [ /* last 10 payments */ ]
  }
}
```

---

### PUT /api/admin/users/:id
**Purpose:** Update user status  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "string (active|suspended)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated",
  "data": { /* updated user */ }
}
```

---

### DELETE /api/admin/users/:id
**Purpose:** Delete user  
**Authentication:** Required (super_admin only)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### GET /api/admin/settings
**Purpose:** Get system settings  
**Authentication:** Required (admin/super_admin)  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "general": {
      "app_name": "JECAPH Hostel Management",
      "support_email": "support@jecaph.edu"
    },
    "hostel": {
      "hostel_name": "JECAPH Hostel",
      "base_monthly_fee": "500"
    },
    "notifications": {},
    "security": {}
  }
}
```

---

### PUT /api/admin/settings
**Purpose:** Update system settings  
**Authentication:** Required (super_admin only)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "general": {
    "app_name": "New App Name"
  },
  "hostel": {
    "base_monthly_fee": "600"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 🏥 Health Check Endpoint

### GET /health
**Purpose:** API health check  
**Authentication:** Not required  
**Status:** ✅ Implemented

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 📋 Endpoints Summary

| Category | Count | Status |
|----------|-------|--------|
| Authentication | 9 | ✅ All Implemented |
| Users | 4 | ✅ All Implemented |
| Rooms | 5 | ✅ All Implemented |
| Bookings | 5 | ✅ All Implemented |
| Payments | 4 | ✅ All Implemented |
| Shuttle | 4 | ✅ All Implemented |
| Maintenance | 3 | ✅ All Implemented |
| Feedback | 4 | ✅ All Implemented |
| Support | 5 | ✅ All Implemented |
| Admin | 8 | ✅ All Implemented |
| Health | 1 | ✅ Implemented |
| **TOTAL** | **52** | **✅ All Implemented** |

---

## ❌ Missing/Not Implemented Endpoints

The following expected endpoints are **NOT YET IMPLEMENTED**:

### Campuses/Hostels (`/api/campuses/*`)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /api/campuses | List all campuses | ❌ Missing |
| GET /api/campuses/:id | Get campus details | ❌ Missing |
| POST /api/campuses | Create campus (admin) | ❌ Missing |
| PUT /api/campuses/:id | Update campus (admin) | ❌ Missing |
| DELETE /api/campuses/:id | Delete campus (admin) | ❌ Missing |

### Notifications (`/api/notifications/*`)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /api/notifications | Get user notifications | ❌ Missing |
| GET /api/notifications/:id | Get notification | ❌ Missing |
| PUT /api/notifications/:id/read | Mark as read | ❌ Missing |
| PUT /api/notifications/read-all | Mark all as read | ❌ Missing |
| DELETE /api/notifications/:id | Delete notification | ❌ Missing |

### File Uploads (`/api/uploads/*`)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| POST /api/uploads/room-image | Upload room image | ❌ Missing |
| DELETE /api/uploads/:id | Delete uploaded file | ❌ Missing |

### Admin Reports (`/api/admin/reports/*`)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /api/admin/reports/bookings | Booking reports | ❌ Missing |
| GET /api/admin/reports/payments | Payment reports | ❌ Missing |
| GET /api/admin/reports/maintenance | Maintenance reports | ❌ Missing |

### Additional Missing
| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /api/rooms/:id/availability | Check room availability | ❌ Missing |
| GET /api/payments/:id | Get single payment | ❌ Missing |
| GET /api/payments/:id/receipt | Download receipt | ❌ Missing |
| POST /api/payments/webhook | Paystack webhook | ❌ Missing |

---

*Document generated: February 6, 2026*
