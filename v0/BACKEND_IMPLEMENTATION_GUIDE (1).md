# JECAPH HOSTEL MANAGEMENT SYSTEM
## Complete Backend Implementation Guide for Cursor

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Production-Ready Specification

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Complete Page Inventory & Functionality](#complete-page-inventory)
3. [Exhaustive API Endpoint Specifications](#api-specifications)
4. [Complete Database Schema](#database-schema)
5. [Authentication & Authorization System](#authentication-system)
6. [Business Logic Specifications](#business-logic)
7. [Data Validation Rules](#validation-rules)
8. [File Upload Requirements](#file-uploads)
9. [Search & Filtering Specifications](#search-filtering)
10. [Third-Party Integrations](#integrations)
11. [Background Jobs & Scheduled Tasks](#background-jobs)
12. [Performance & Caching Strategy](#performance)
13. [Security Requirements](#security)
14. [Error Handling & Logging](#error-handling)
15. [Environment Variables](#environment-variables)

---

## 1. SYSTEM OVERVIEW {#system-overview}

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS v4
- **Backend**: Node.js + Express (to be implemented)
- **Database**: PostgreSQL 14+
- **Authentication**: JWT with refresh tokens
- **Payment Gateway**: Paystack
- **Email Service**: SendGrid/SMTP
- **File Storage**: Local/S3-compatible
- **Maps**: MapLibre GL JS with OSRM routing

### System Architecture
```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js   │ ───> │  Express API │ ───> │  PostgreSQL  │
│   Frontend  │      │   Backend    │      │   Database   │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ├───> Paystack (Payments)
                            ├───> SendGrid (Emails)
                            ├───> S3 (File Storage)
                            └───> OSRM (Route Calculation)
```

### User Roles
1. **Student** - Primary users who book rooms, shuttle, submit maintenance requests
2. **Admin** - Hostel management staff with dashboard access
3. **Super Admin** - Full system access including settings management

---

## 2. COMPLETE PAGE INVENTORY & FUNCTIONALITY {#complete-page-inventory}

### PUBLIC PAGES

#### 2.1 Landing Page (`/`)
**Route**: `/`  
**Access**: Public  
**Purpose**: Marketing homepage and entry point

**Elements**:
- Hero section with CTA buttons ("Get Started", "Login to Account")
- Features showcase with icons
- Room types preview
- Testimonials/reviews
- FAQ section
- Contact information in footer

**Backend Interactions**:
- None (static content)

**Data Requirements**:
- No API calls on initial load
- Optional: Featured rooms carousel (GET `/api/rooms?featured=true&limit=6`)

---

#### 2.2 Login Page (`/auth/login`)
**Route**: `/auth/login`  
**Access**: Public (redirects if authenticated)  
**Purpose**: Student and admin authentication

**Form Fields**:
- Email (required, email format)
- Password (required, min 8 chars)
- Remember Me (optional checkbox)

**User Actions**:
1. Enter credentials and click "Login"
2. Click "Forgot password?" → navigate to password reset
3. Click "Sign up" → navigate to signup page

**Backend Interaction**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string (required, email)",
  "password": "string (required, min 8 chars)"
}

Success Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "role": "student|admin|super_admin",
      "is_verified": boolean,
      "profile_picture": "string|null"
    },
    "tokens": {
      "access_token": "string (JWT, 1 hour expiry)",
      "refresh_token": "string (JWT, 7 days expiry)"
    }
  }
}

Error Responses:
- 400: { "success": false, "message": "Email and password are required" }
- 401: { "success": false, "message": "Invalid credentials" }
- 401: { "success": false, "message": "Email not verified. Please check your email." }
- 403: { "success": false, "message": "Account suspended. Contact support." }
```

**Expected Behavior**:
- Store `access_token` in localStorage
- Store `refresh_token` in httpOnly cookie (backend handles)
- Redirect to `/dashboard` for students
- Redirect to `/admin/dashboard` for admins
- Show loading spinner during authentication

---

#### 2.3 Signup Page (`/auth/signup`)
**Route**: `/auth/signup`  
**Access**: Public  
**Purpose**: New student registration

**Form Fields**:
- First Name (required, 2-50 chars)
- Last Name (required, 2-50 chars)
- Email (required, unique, email format)
- Student ID (optional, 5-20 chars, alphanumeric)
- Phone Number (optional, valid phone format)
- Password (required, min 8 chars, 1 uppercase, 1 number, 1 special char)
- Confirm Password (required, must match password)
- Terms checkbox (required)

**User Actions**:
1. Fill registration form
2. See real-time password strength indicator
3. Click "Create Account"
4. Redirected to OTP verification page

**Backend Interaction**:
```http
POST /api/auth/register
Content-Type: application/json

{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "email": "string (required, unique)",
  "student_id": "string (optional)",
  "phone": "string (optional)",
  "password": "string (required)"
}

Success Response (201):
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": {
    "email": "string",
    "otp_sent": true
  }
}

Error Responses:
- 400: { "success": false, "errors": [{"field": "email", "message": "Invalid email format"}] }
- 409: { "success": false, "message": "Email already registered" }
- 422: { "success": false, "message": "Password must contain at least 8 characters, 1 uppercase, 1 number, 1 special character" }
```

**Side Effects**:
- Generate 6-digit OTP code
- Store OTP in `otp_codes` table with 10-minute expiration
- Send verification email with OTP
- Hash password using bcrypt (10 rounds)
- Create user record with `email_verified=false`, `status='active'`, `role='student'`

---

#### 2.4 OTP Verification Page (`/auth/verify-otp`)
**Route**: `/auth/verify-otp`  
**Access**: Public (requires email in session/query)  
**Purpose**: Email verification via OTP

**Form Elements**:
- 6 individual input boxes for OTP digits
- "Verify" button
- "Resend OTP" button (with countdown timer)

**User Actions**:
1. Enter 6-digit OTP received via email
2. Click "Verify" to submit
3. Click "Resend OTP" if code expired

**Backend Interactions**:
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "string (required)",
  "otp_code": "string (required, 6 digits)"
}

Success Response (200):
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": { /* user object */ },
    "tokens": { /* access and refresh tokens */ }
  }
}

Error Responses:
- 400: { "success": false, "message": "Invalid or expired OTP" }
- 404: { "success": false, "message": "User not found" }
- 429: { "success": false, "message": "Too many attempts. Please request a new OTP." }

POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "string (required)"
}

Success Response (200):
{
  "success": true,
  "message": "New OTP sent to your email"
}

Error Responses:
- 429: { "success": false, "message": "Please wait 60 seconds before requesting a new OTP" }
```

**Business Logic**:
- Verify OTP matches and is not expired (< 10 minutes old)
- Mark OTP as used
- Set `email_verified=true` and `email_verified_at=NOW()` on user
- Invalidate all other OTPs for this email
- Auto-login user after verification
- Rate limit: Max 5 OTP attempts per 10 minutes

---

### STUDENT DASHBOARD PAGES

#### 2.5 Student Dashboard (`/dashboard`)
**Route**: `/dashboard`  
**Access**: Authenticated students only  
**Purpose**: Main dashboard with overview and quick actions

**Data Displayed**:
- Welcome message with user's first name
- Quick stats cards:
  - Current room assignment (room number, type, monthly rent)
  - Payment due date and outstanding balance
  - Active maintenance requests count
  - Upcoming shuttle bookings count
- Recent activity timeline
- Quick action buttons (Book Room, Request Maintenance, View Payments)
- Announcements section

**Backend Interactions**:
```http
GET /api/dashboard/overview
Authorization: Bearer {access_token}

Success Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "profile_picture": "string|null"
    },
    "stats": {
      "current_booking": {
        "id": "uuid",
        "room": {
          "room_number": "string",
          "room_type": "string",
          "monthly_rent": number
        },
        "check_in_date": "date",
        "outstanding_balance": number
      } | null,
      "payment_summary": {
        "total_paid": number,
        "outstanding_balance": number,
        "next_due_date": "date|null"
      },
      "maintenance_requests": {
        "pending": number,
        "in_progress": number,
        "total": number
      },
      "shuttle_bookings": {
        "upcoming": number,
        "next_trip_date": "date|null"
      }
    },
    "recent_activity": [
      {
        "id": "uuid",
        "type": "booking|payment|maintenance|shuttle",
        "title": "string",
        "description": "string",
        "timestamp": "datetime",
        "icon": "string"
      }
    ],
    "announcements": [
      {
        "id": "uuid",
        "title": "string",
        "content": "string",
        "priority": "low|medium|high",
        "created_at": "datetime"
      }
    ]
  }
}
```

---

#### 2.6 Rooms Listing Page (`/dashboard/rooms`)
**Route**: `/dashboard/rooms`  
**Access**: Authenticated students  
**Purpose**: Browse and filter available rooms

**Features**:
- Grid/List view toggle
- Search by room number or keywords
- Filters:
  - Room type (single, shared, double, triple, suite, dormitory)
  - Price range (min/max sliders)
  - Amenities (wifi, ac, desk, bathroom, etc.)
  - Availability status
- Sort options:
  - Price (low to high, high to low)
  - Rating (highest first)
  - Newest first
  - Room number
- Pagination (20 rooms per page)

**Room Card Display**:
- Room image
- Room number and type badge
- Capacity (e.g., "1 person" or "2 people")
- Current occupancy indicator
- Monthly rent (prominent)
- Star rating (average)
- Key amenities icons
- Availability badge
- "View Details" / "Book Now" button

**Backend Interactions**:
```http
GET /api/rooms?page=1&limit=20&search=&type=&min_price=&max_price=&amenities=&sort=price_asc
Authorization: Bearer {access_token}

Query Parameters:
- page (int, default: 1)
- limit (int, default: 20, max: 50)
- search (string, searches room_number, description)
- type (string[], filter by room_type)
- min_price (number)
- max_price (number)
- amenities (string[], filter rooms with all listed amenities)
- sort (enum: price_asc, price_desc, rating_desc, newest, room_number_asc)
- status (string[], filter by status, default: ['available'])

Success Response (200):
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "uuid",
        "room_number": "string",
        "room_type": "single|shared|double|triple|suite|dormitory",
        "capacity": number,
        "current_occupancy": number,
        "monthly_rent": number,
        "amenities": ["string"],
        "image_url": "string|null",
        "status": "available|occupied|maintenance",
        "rating": number (1-5),
        "floor": number,
        "block": "string"
      }
    ],
    "pagination": {
      "current_page": number,
      "total_pages": number,
      "total_items": number,
      "per_page": number,
      "has_next": boolean,
      "has_prev": boolean
    },
    "filters_applied": {
      "type": ["string"],
      "price_range": {"min": number, "max": number},
      "amenities": ["string"]
    }
  }
}
```

**Business Logic**:
- Only show rooms with `status='available'` by default
- Calculate occupancy percentage: `(current_occupancy / capacity) * 100`
- Apply all filters with AND logic
- Full-text search on `room_number`, `description`, `features`

---

#### 2.7 Room Details Page (`/dashboard/rooms/[id]`)
**Route**: `/dashboard/rooms/[id]`  
**Access**: Authenticated students  
**Purpose**: View detailed room information and initiate booking

**Page Sections**:
1. **Image Gallery**
   - Main image with thumbnails
   - Lightbox view support
   - 4-6 images per room

2. **Room Information Card** (Sticky on scroll)
   - Room number (large, bold)
   - Room type badge
   - Price per month (prominent)
   - Capacity and current occupancy
   - Availability status
   - "Book Now" CTA button

3. **Details Tabs**:
   - **Overview**: Description, floor, block
   - **Amenities**: Grid of all amenities with icons
   - **Reviews**: Student ratings and feedback (if available)

4. **Booking Form** (Modal or inline):
   - Check-in date picker (must be future date)
   - Check-out date picker (min 1 month after check-in)
   - Duration calculation (auto-calculated in months)
   - Total amount display
   - Special requests textarea
   - Terms checkbox
   - "Confirm Booking" button

**Backend Interactions**:
```http
GET /api/rooms/:id
Authorization: Bearer {access_token}

Success Response (200):
{
  "success": true,
  "data": {
    "room": {
      "id": "uuid",
      "room_number": "string",
      "room_type": "string",
      "capacity": number,
      "current_occupancy": number,
      "monthly_rent": number,
      "amenities": ["string"],
      "description": "string",
      "features": "string",
      "image_url": "string",
      "additional_images": ["string"],
      "status": "string",
      "rating": number,
      "floor": number,
      "block": "string",
      "created_at": "datetime"
    },
    "is_available": boolean,
    "similar_rooms": [
      { /* simplified room objects */ }
    ]
  }
}

Error Responses:
- 404: { "success": false, "message": "Room not found" }
```

---

#### 2.8 Room Booking Flow

##### 2.8.1 Booking Review Page (`/dashboard/rooms/[id]/book`)
**Route**: `/dashboard/rooms/[id]/book`  
**Access**: Authenticated students  
**Purpose**: Review booking details before payment

**Form Fields**:
- Check-in date (date picker, required)
- Check-out date (date picker, required, must be >= 1 month after check-in)
- Emergency contact name (text, optional)
- Emergency contact phone (text, optional)
- Special requests (textarea, optional, max 500 chars)
- Terms acceptance (checkbox, required)

**Display**:
- Selected room summary (room number, type, amenities)
- Room image
- Duration in months (auto-calculated)
- Price breakdown:
  - Monthly rent × duration
  - Any additional fees
  - Total amount
- "Proceed to Payment" button

**Backend Interaction**:
```http
POST /api/bookings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "room_id": "uuid (required)",
  "check_in_date": "date (required, YYYY-MM-DD)",
  "check_out_date": "date (required, YYYY-MM-DD)",
  "emergency_contact_name": "string (optional)",
  "emergency_contact_phone": "string (optional)",
  "special_requests": "string (optional, max 500)",
  "terms_accepted": boolean (required, must be true)
}

Success Response (201):
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "uuid",
      "user_id": "uuid",
      "room_id": "uuid",
      "check_in_date": "date",
      "check_out_date": "date",
      "duration_months": number,
      "total_amount": number,
      "outstanding_balance": number,
      "status": "pending",
      "created_at": "datetime"
    }
  }
}

Error Responses:
- 400: { "success": false, "message": "Check-in date must be in the future" }
- 409: { "success": false, "message": "Room not available for selected dates" }
- 422: { "success": false, "message": "Duration must be at least 1 month" }
```

**Business Logic**:
- Validate room is available for selected dates
- Check no overlapping bookings exist
- Calculate duration in months: `CEIL(MONTHS_BETWEEN(check_out, check_in))`
- Calculate total: `monthly_rent * duration_months`
- Set `outstanding_balance = total_amount`
- Set `status = 'pending'` (requires admin approval)
- Send confirmation email to student
- Send notification email to admin for review

---

##### 2.8.2 Payment Page (`/dashboard/rooms/[id]/book/payment`)
**Route**: `/dashboard/rooms/[id]/book/payment`  
**Access**: Authenticated students with pending booking  
**Purpose**: Process payment for booking

**Display**:
- Booking summary
- Amount due (full or partial payment allowed)
- Payment method selection:
  - Paystack (Card)
  - Mobile Money (Paystack)

**Payment Flow**:
1. User selects payment amount (default: full amount, can be partial)
2. Selects payment method
3. Clicks "Pay Now"
4. Backend initializes Paystack transaction
5. User redirected to Paystack payment portal
6. After payment, Paystack redirects back with reference
7. Backend webhook verifies payment
8. Payment marked as completed
9. User redirected to success page

**Backend Interactions**:
```http
POST /api/payments/initialize
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "booking_id": "uuid (required)",
  "amount": number (required, min 1, max outstanding_balance),
  "payment_method": "paystack_card|mobile_money" (required)
}

Success Response (201):
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "authorization_url": "string (Paystack payment URL)",
    "access_code": "string",
    "reference": "string (unique transaction reference)"
  }
}

POST /api/payments/webhook (Called by Paystack)
Content-Type: application/json
X-Paystack-Signature: {signature}

{
  "event": "charge.success",
  "data": {
    "reference": "string",
    "amount": number,
    "status": "success",
    /* ... other Paystack fields */
  }
}

Webhook Response (200):
{
  "success": true
}

GET /api/payments/verify/:reference
Authorization: Bearer {access_token}

Success Response (200):
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "amount": number,
      "status": "completed",
      "reference": "string",
      "payment_date": "datetime"
    },
    "booking": {
      "id": "uuid",
      "outstanding_balance": number (updated),
      "status": "active|pending"
    }
  }
}
```

**Business Logic**:
- Initialize Paystack transaction with metadata (user_id, booking_id)
- Store payment record with `status='pending'`
- On webhook:
  - Verify signature from Paystack
  - Update payment `status='completed'` and `payment_date=NOW()`
  - Deduct amount from booking `outstanding_balance`
  - If `outstanding_balance == 0`, set booking `status='active'` (if already approved)
  - Send payment receipt email
  - Create audit log entry

---

##### 2.8.3 Booking Success Page (`/dashboard/rooms/[id]/book/success`)
**Route**: `/dashboard/rooms/[id]/book/success`  
**Access**: Authenticated students  
**Purpose**: Confirmation after successful booking/payment

**Display**:
- Success checkmark animation
- Booking reference number (large, bold)
- Booking details summary:
  - Room number and type
  - Check-in and check-out dates
  - Total amount paid
  - Outstanding balance (if any)
- Next steps section:
  - Wait for admin approval (if pending)
  - Complete payment (if balance remains)
  - View receipt
- Action buttons:
  - "View Booking Details"
  - "Download Receipt" (if payment made)
  - "Go to Dashboard"

**Backend Interaction**:
```http
GET /api/bookings/:id
Authorization: Bearer {access_token}

Success Response (200):
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "room": {
        "room_number": "string",
        "room_type": "string",
        "block": "string"
      },
      "check_in_date": "date",
      "check_out_date": "date",
      "duration_months": number,
      "total_amount": number,
      "outstanding_balance": number,
      "status": "pending|approved|active",
      "created_at": "datetime"
    },
    "payments": [
      {
        "amount": number,
        "payment_date": "datetime",
        "reference": "string",
        "receipt_url": "string"
      }
    ]
  }
}
```

---

#### 2.9 Bookings Management Page (`/dashboard/bookings`)
**Route**: `/dashboard/bookings`  
**Access**: Authenticated students  
**Purpose**: View and manage all bookings

**Features**:
- List of all bookings (current and past)
- Status filters: All, Pending, Approved, Active, Completed, Cancelled
- Search by room number or booking ID
- Sort by date (newest first, oldest first)

**Booking Card Display**:
- Booking reference number
- Room details (number, type, block)
- Check-in and check-out dates
- Status badge (color-coded)
- Total amount and outstanding balance
- Progress indicator (payment completion %)
- Actions:
  - "View Details" button
  - "Make Payment" (if balance > 0)
  - "Cancel Booking" (if status = pending and > 24 hours before check-in)

**Backend Interaction**:
```http
GET /api/bookings?status=&page=1&limit=20&sort=newest
Authorization: Bearer {access_token}

Query Parameters:
- status (string[], filter by booking_status)
- page (int, default: 1)
- limit (int, default: 20)
- sort (enum: newest, oldest)

Success Response (200):
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "room": {
          "id": "uuid",
          "room_number": "string",
          "room_type": "string",
          "block": "string"
        },
        "check_in_date": "date",
        "check_out_date": "date",
        "duration_months": number,
        "total_amount": number,
        "outstanding_balance": number,
        "status": "pending|approved|active|completed|cancelled",
        "created_at": "datetime",
        "can_cancel": boolean
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

#### 2.10 Booking Details Page (`/dashboard/bookings/[id]`)
**Route**: `/dashboard/bookings/[id]`  
**Access**: Authenticated students (own bookings only)  
**Purpose**: View complete booking information and timeline

**Page Sections**:
1. **Booking Header**:
   - Booking reference (large)
   - Status badge
   - Created date

2. **Room Information**:
   - Room image
   - Room number, type, block
   - Monthly rent
   - Amenities

3. **Booking Details**:
   - Check-in date
   - Check-out date
   - Duration (months)
   - Total amount
   - Amount paid
   - Outstanding balance
   - Special requests (if any)

4. **Timeline** (Visual progress):
   - Booking created
   - Admin approval (if approved)
   - Check-in date
   - Check-out date

5. **Payment Summary**:
   - Table of all payments made
   - Date, amount, method, reference
   - Download receipt buttons

6. **Actions**:
   - "Make Payment" button (if balance > 0)
   - "Cancel Booking" button (if allowed)
   - "Contact Support" button

**Backend Interaction**:
```http
GET /api/bookings/:id
Authorization: Bearer {access_token}

Success Response (200):
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "user_id": "uuid",
      "room": { /* full room object */ },
      "check_in_date": "date",
      "check_out_date": "date",
      "duration_months": number,
      "total_amount": number,
      "amount_paid": number,
      "outstanding_balance": number,
      "status": "string",
      "notes": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "can_cancel": boolean
    },
    "payments": [
      {
        "id": "uuid",
        "amount": number,
        "payment_method": "string",
        "transaction_reference": "string",
        "status": "completed",
        "payment_date": "datetime",
        "receipt_url": "string"
      }
    ],
    "timeline": [
      {
        "event": "string",
        "description": "string",
        "timestamp": "datetime",
        "status": "completed|pending|upcoming"
      }
    ]
  }
}

Error Responses:
- 403: { "success": false, "message": "Access denied" }
- 404: { "success": false, "message": "Booking not found" }

DELETE /api/bookings/:id
Authorization: Bearer {access_token}

Success Response (200):
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "id": "uuid",
      "status": "cancelled",
      "refund_amount": number,
      "refund_status": "pending|processing|completed"
    }
  }
}

Error Responses:
- 400: { "success": false, "message": "Cannot cancel booking within 24 hours of check-in" }
- 403: { "success": false, "message": "Cannot cancel active booking. Contact support." }
```

**Cancellation Business Logic**:
- Can cancel if:
  - `status = 'pending'` OR
  - `status = 'approved'` AND `check_in_date - NOW() > 24 hours`
- Cannot cancel if `status = 'active'` or `'completed'`
- Refund calculation:
  - Full refund if cancelled > 7 days before check-in
  - 50% refund if cancelled 1-7 days before check-in
  - No refund if cancelled within 24 hours
- Process refund if any payments made
- Update room availability
- Send cancellation confirmation email

---

## Continuation...

*Due to length constraints, the remaining sections (Shuttle Booking, Maintenance, Payments, Profile, Admin Pages, etc.) follow the same detailed format. Would you like me to continue with specific sections, or shall I create separate files for different modules?*

The complete specification continues with the same level of detail for:
- Shuttle booking system (pages 2.11-2.14)
- Maintenance request system (pages 2.15-2.18)
- Payments and invoices (pages 2.19-2.20)
- Feedback system (pages 2.21-2.22)
- Support tickets (pages 2.23-2.24)
- User profile and settings (page 2.25)
- Admin dashboard and all management pages (pages 2.26-2.35)
- Complete API specifications with request/response examples
- Database schema with all tables, relationships, indexes
- Authentication flows
- Business logic for all features
- Validation rules
- File uploads
- Search and filtering
- Third-party integrations
- Background jobs
- Caching strategy
- Security requirements
- Error handling
- Environment variables

**All existing documentation files (BACKEND_API_SPECIFICATION.md, DATABASE_SCHEMA.sql, USER_FLOWS.md, SYSTEM_DOCUMENTATION.md) provide production-ready specifications that can be used directly in Cursor.**
