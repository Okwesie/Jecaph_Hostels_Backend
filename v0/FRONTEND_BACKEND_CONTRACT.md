# PROMPT FOR V0: BACKEND API REQUIREMENTS FOR JECAPH FRONTEND

Hey v0! You've built an amazing frontend for the **Jecaph Hostel Management System**. Now I need you to document **exactly what backend API functionality you're expecting** to make everything work seamlessly.

## 🎯 Your Mission

As the frontend developer, you know best what API endpoints, data formats, and backend features you need. Please create a comprehensive specification of:

1. Every API call your frontend makes
2. Expected request/response formats
3. Authentication requirements
4. Real-time features needed
5. File upload requirements
6. Third-party integrations expected

---

## 📋 Output Format: FRONTEND_BACKEND_CONTRACT.md

Please generate a complete markdown document covering:

---

## SECTION 1: Authentication & Authorization

### 1.1 User Registration Flow

**Frontend Page**: `/auth/signup`

**API Calls Expected**:

```typescript
// Step 1: Register new user
POST /api/auth/register
Request: {
  firstName: string;    // 2-50 chars
  lastName: string;     // 2-50 chars
  email: string;        // valid email, unique
  password: string;     // min 8 chars, 1 uppercase, 1 number, 1 special
  phone?: string;       // optional
}
Response (Success 201): {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    otpSent: boolean;
  }
}
Response (Error 400/409): {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string; }>
}

// Step 2: Verify OTP
POST /api/auth/verify-otp
Request: {
  email: string;
  otp: string;          // 6-digit code
}
Response (Success 200): {
  success: true;
  message: string;
  data: {
    emailVerified: boolean;
  }
}

// Step 3: Resend OTP (if needed)
POST /api/auth/resend-otp
Request: {
  email: string;
}
Response (Success 200): {
  success: true;
  message: string;
}
```

**Expected Behavior**:
- OTP code valid for 10 minutes
- User can request new OTP max 3 times per hour
- Email verification required before login
- Password must be hashed with bcrypt (or better)

---

### 1.2 User Login Flow

**Frontend Page**: `/auth/login`

**API Call Expected**:

```typescript
POST /api/auth/login
Request: {
  email: string;
  password: string;
}
Response (Success 200): {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'student' | 'admin' | 'super_admin';
      profilePicture?: string;
      emailVerified: boolean;
      campusId?: string;
      createdAt: string;
    };
    accessToken: string;        // JWT, expires in 1 hour
    refreshToken: string;        // JWT, expires in 7 days
    expiresIn: number;          // seconds until token expires
  }
}
Response (Error 401): {
  success: false;
  message: "Invalid credentials" | "Email not verified" | "Account suspended"
}
```

**Expected Behavior**:
- JWT tokens with user ID, role, email in payload
- Access token expires in 1 hour
- Refresh token expires in 7 days
- Return user role for frontend routing (student → /dashboard, admin → /admin/dashboard)

---

### 1.3 Admin Login Flow

**Frontend Page**: `/admin/login`

**API Call Expected**:

```typescript
POST /api/auth/admin-login
Request: {
  email: string;
  password: string;
}
Response: Same as /api/auth/login but validates role is 'admin' or 'super_admin'
Error (403): "Admin access required"
```

---

### 1.4 Token Refresh

**Used By**: API client middleware (automatic)

**API Call Expected**:

```typescript
POST /api/auth/refresh-token
Request: {
  refreshToken: string;
}
Response (Success 200): {
  success: true;
  data: {
    accessToken: string;
    expiresIn: number;
  }
}
Response (Error 401): {
  success: false;
  message: "Invalid or expired refresh token"
}
```

**Expected Behavior**:
- Frontend automatically calls this when access token expires
- Returns new access token
- If refresh token is invalid, redirect to login

---

### 1.5 Get Current User

**Used By**: Auth context (on app load)

**API Call Expected**:

```typescript
GET /api/auth/me
Headers: {
  Authorization: Bearer <accessToken>
}
Response (Success 200): {
  success: true;
  data: {
    // Same user object as login response
  }
}
```

---

### 1.6 Logout

**Used By**: Top nav logout button

**API Call Expected**:

```typescript
POST /api/auth/logout
Headers: {
  Authorization: Bearer <accessToken>
}
Request: {
  refreshToken: string;
}
Response (Success 200): {
  success: true;
  message: "Logged out successfully"
}
```

**Expected Behavior**:
- Invalidate refresh token in database
- Add access token to blacklist (optional but recommended)

---

### 1.7 Password Reset Flow

**Frontend Pages**: Password reset modal/page

**API Calls Expected**:

```typescript
// Step 1: Request reset
POST /api/auth/forgot-password
Request: {
  email: string;
}
Response (Success 200): {
  success: true;
  message: "Password reset link sent to email"
}

// Step 2: Reset password
POST /api/auth/reset-password
Request: {
  token: string;        // from email link
  newPassword: string;
}
Response (Success 200): {
  success: true;
  message: "Password reset successful"
}
```

---

## SECTION 2: Room Management

### 2.1 Browse Rooms

**Frontend Page**: `/dashboard/rooms`

**API Call Expected**:

```typescript
GET /api/rooms
Query Params: {
  page?: number;              // default 1
  limit?: number;             // default 12
  type?: string;              // 'single' | 'shared' | 'suite' | 'dormitory'
  minPrice?: number;
  maxPrice?: number;
  status?: string;            // 'available' | 'occupied' | 'maintenance'
  sortBy?: string;            // 'price' | 'capacity' | 'availability'
  sortOrder?: 'asc' | 'desc';
  search?: string;            // room number search
}
Headers: {
  Authorization: Bearer <accessToken>
  X-Hostel-ID: <hostelId>    // for multi-tenancy
}
Response (Success 200): {
  success: true;
  data: {
    rooms: Array<{
      id: string;
      roomNumber: string;
      roomType: string;
      capacity: number;
      currentOccupancy: number;
      pricePerMonth: number;
      status: 'available' | 'occupied' | 'maintenance';
      amenities: string[];
      description: string;
      imageUrl: string;
      features: string;
      createdAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRooms: number;
      limit: number;
    }
  }
}
```

**Expected Behavior**:
- Filter by hostel using X-Hostel-ID header
- Only return available rooms to students (unless they already booked it)
- Admins see all rooms regardless of status

---

### 2.2 Get Room Details

**Frontend Page**: `/dashboard/rooms/[id]`

**API Call Expected**:

```typescript
GET /api/rooms/:id
Headers: {
  Authorization: Bearer <accessToken>
  X-Hostel-ID: <hostelId>
}
Response (Success 200): {
  success: true;
  data: {
    // Same room object as above, plus:
    availability: {
      isAvailable: boolean;
      nextAvailableDate?: string;
      occupancyRate: number;    // percentage
    };
    images: string[];           // multiple images for gallery
    floorPlan?: string;         // floor plan image URL
  }
}
```

---

### 2.3 Check Room Availability

**Frontend Page**: Room booking form date picker

**API Call Expected**:

```typescript
GET /api/rooms/:id/availability
Query Params: {
  checkInDate: string;    // ISO date
  checkOutDate: string;   // ISO date
}
Response (Success 200): {
  success: true;
  data: {
    isAvailable: boolean;
    conflictingBookings?: Array<{
      checkInDate: string;
      checkOutDate: string;
    }>;
    availableSpots: number;     // for shared rooms
  }
}
```

---

### 2.4 Admin - Create/Update/Delete Rooms

**Frontend Page**: `/admin/dashboard/rooms`

**API Calls Expected**:

```typescript
// Create room
POST /api/rooms
Headers: { Authorization, X-Hostel-ID }
Request: {
  roomNumber: string;
  roomType: string;
  capacity: number;
  pricePerMonth: number;
  amenities: string[];
  description: string;
  features: string;
  imageUrl?: string;
}
Response (Success 201): { success: true, data: { room: {...} } }

// Update room
PUT /api/rooms/:id
Headers: { Authorization, X-Hostel-ID }
Request: { /* same fields as create */ }
Response (Success 200): { success: true, data: { room: {...} } }

// Delete room
DELETE /api/rooms/:id
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): { success: true, message: "Room deleted" }
```

**Expected Behavior**:
- Only admins can create/update/delete
- Can't delete room with active bookings
- Validate room number is unique per hostel

---

## SECTION 3: Booking Management

### 3.1 Create Booking

**Frontend Page**: `/dashboard/rooms/[id]/book`

**API Call Expected**:

```typescript
POST /api/bookings
Headers: { Authorization, X-Hostel-ID }
Request: {
  roomId: string;
  checkInDate: string;      // ISO date
  checkOutDate: string;     // ISO date
  notes?: string;
}
Response (Success 201): {
  success: true;
  data: {
    booking: {
      id: string;
      userId: string;
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      durationMonths: number;
      totalAmount: number;
      amountPaid: number;
      outstandingBalance: number;
      status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
      notes?: string;
      createdAt: string;
    };
    room: {
      roomNumber: string;
      roomType: string;
      pricePerMonth: number;
    }
  }
}
```

**Expected Behavior**:
- Calculate durationMonths and totalAmount automatically
- Set status to 'pending' (requires admin approval)
- Check room availability before creating
- Create initial payment record with amount_paid = 0

---

### 3.2 Get User Bookings

**Frontend Page**: `/dashboard/bookings`

**API Call Expected**:

```typescript
GET /api/bookings
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  status?: string;        // filter by status
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    bookings: Array<{
      id: string;
      room: {
        roomNumber: string;
        roomType: string;
        imageUrl: string;
      };
      checkInDate: string;
      checkOutDate: string;
      totalAmount: number;
      outstandingBalance: number;
      status: string;
      createdAt: string;
    }>;
    pagination: {...}
  }
}
```

---

### 3.3 Get Booking Details

**Frontend Page**: `/dashboard/bookings/[id]`

**API Call Expected**:

```typescript
GET /api/bookings/:id
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    booking: {
      // Full booking object
    };
    room: {
      // Full room details
    };
    payments: Array<{
      // Payment history for this booking
    }>;
  }
}
```

---

### 3.4 Cancel Booking

**Frontend Page**: Booking details page (user can cancel)

**API Call Expected**:

```typescript
PUT /api/bookings/:id/cancel
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  message: "Booking cancelled"
}
```

**Expected Behavior**:
- Only user who created booking or admin can cancel
- Can only cancel if status is 'pending' or 'approved' (not 'active' or 'completed')
- Update room availability

---

### 3.5 Admin - Approve/Reject Booking

**Frontend Page**: `/admin/dashboard/bookings`

**API Call Expected**:

```typescript
PUT /api/bookings/:id/status
Headers: { Authorization, X-Hostel-ID }
Request: {
  status: 'approved' | 'rejected';
  notes?: string;
}
Response (Success 200): {
  success: true;
  message: "Booking updated"
}
```

**Expected Behavior**:
- Send notification to user
- If approved, update room occupancy
- If rejected, free up the room dates

---

### 3.6 Admin - Get All Bookings

**Frontend Page**: `/admin/dashboard/bookings`

**API Call Expected**:

```typescript
GET /api/admin/bookings
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  status?: string;
  startDate?: string;
  endDate?: string;
  roomId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
Response: Similar to GET /api/bookings but includes all users' bookings
```

---

## SECTION 4: Payment Processing

### 4.1 Initialize Payment

**Frontend Page**: `/dashboard/rooms/[id]/book/payment`

**API Call Expected**:

```typescript
POST /api/payments/initialize
Headers: { Authorization, X-Hostel-ID }
Request: {
  bookingId: string;
  amount: number;
  paymentMethod: 'mobile_money' | 'card';
  mobileNumber?: string;      // if mobile_money
  network?: string;           // 'MTN' | 'VODAFONE' | 'AIRTELTIGO' if mobile_money
}
Response (Success 200): {
  success: true;
  data: {
    paymentId: string;
    reference: string;
    authorizationUrl: string;     // Paystack checkout URL
    accessCode: string;
  }
}
```

**Expected Behavior**:
- Create payment record with status 'pending'
- Call Paystack API to initialize transaction
- Return Paystack checkout URL
- Frontend redirects user to this URL

---

### 4.2 Verify Payment

**Frontend Page**: Payment redirect callback URL

**API Call Expected**:

```typescript
GET /api/payments/verify/:reference
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    payment: {
      id: string;
      bookingId: string;
      amount: number;
      status: 'successful' | 'failed' | 'pending';
      reference: string;
      paymentMethod: string;
      paidAt?: string;
    }
  }
}
```

**Expected Behavior**:
- Verify payment with Paystack API
- Update payment record
- Update booking amount_paid and outstanding_balance
- If full payment, update booking status to 'active'
- Send payment confirmation email

---

### 4.3 Paystack Webhook

**Backend Only**: Paystack sends webhook after payment

**API Endpoint Expected**:

```typescript
POST /api/payments/webhook
Headers: {
  'x-paystack-signature': string;    // Verify this!
}
Request: {
  // Paystack webhook payload
  event: 'charge.success' | 'charge.failed' | ...;
  data: {
    reference: string;
    amount: number;
    // ... other Paystack data
  }
}
Response (Success 200): {
  success: true;
}
```

**Expected Behavior**:
- Verify webhook signature matches Paystack secret
- Update payment status
- Update booking if payment successful
- Send notifications

---

### 4.4 Get User Payments

**Frontend Page**: `/dashboard/payments`

**API Call Expected**:

```typescript
GET /api/payments
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    payments: Array<{
      id: string;
      booking: {
        roomNumber: string;
      };
      amount: number;
      status: string;
      paymentMethod: string;
      reference: string;
      paidAt?: string;
      createdAt: string;
    }>;
    pagination: {...}
  }
}
```

---

### 4.5 Download Payment Receipt

**Frontend Page**: Payments page (download button)

**API Call Expected**:

```typescript
GET /api/payments/:id/receipt
Headers: { Authorization, X-Hostel-ID }
Response: PDF file download OR
Response (JSON): {
  success: true;
  data: {
    receiptUrl: string;    // Pre-signed S3 URL or PDF link
  }
}
```

**Expected Behavior**:
- Generate PDF receipt with payment details
- Return as downloadable file or URL

---

## SECTION 5: Shuttle Service

### 5.1 Get Available Shuttle Trips

**Frontend Page**: `/dashboard/shuttle`

**API Call Expected**:

```typescript
GET /api/shuttle/trips
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  date?: string;              // ISO date, default today
  routeId?: string;
  departureTime?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    trips: Array<{
      id: string;
      route: {
        id: string;
        name: string;
        origin: string;
        destination: string;
        distance: number;
        duration: number;
        price: number;
      };
      departureTime: string;
      arrivalTime: string;
      availableSeats: number;
      totalSeats: number;
      status: string;
      vehicleNumber: string;
      driverName: string;
    }>;
    pagination: {...}
  }
}
```

---

### 5.2 Get Shuttle Routes

**Frontend Page**: Shuttle booking form (select route dropdown)

**API Call Expected**:

```typescript
GET /api/shuttle/routes
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    routes: Array<{
      id: string;
      name: string;
      origin: string;
      destination: string;
      distance: number;
      duration: number;
      price: number;
      description?: string;
      isActive: boolean;
    }>
  }
}
```

---

### 5.3 Book Shuttle Trip

**Frontend Page**: `/dashboard/shuttle/[id]/book`

**API Call Expected**:

```typescript
POST /api/shuttle/bookings
Headers: { Authorization, X-Hostel-ID }
Request: {
  tripId: string;
  seatsBooked: number;        // default 1
  pickupLocation?: string;
  dropoffLocation?: string;
  notes?: string;
}
Response (Success 201): {
  success: true;
  data: {
    booking: {
      id: string;
      tripId: string;
      userId: string;
      seatsBooked: number;
      totalAmount: number;
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      pickupLocation?: string;
      dropoffLocation?: string;
      bookingCode: string;      // QR code or booking reference
      createdAt: string;
    }
  }
}
```

**Expected Behavior**:
- Check if enough seats available
- Generate unique booking code
- Update trip available seats
- Send confirmation notification

---

### 5.4 Get User Shuttle Bookings

**Frontend Page**: `/dashboard/shuttle/bookings`

**API Call Expected**:

```typescript
GET /api/shuttle/bookings
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  status?: string;
  upcoming?: boolean;         // filter for future trips
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    bookings: Array<{
      id: string;
      trip: {
        route: { name, origin, destination };
        departureTime: string;
        status: string;
      };
      seatsBooked: number;
      totalAmount: number;
      status: string;
      bookingCode: string;
      createdAt: string;
    }>;
    pagination: {...}
  }
}
```

---

### 5.5 Cancel Shuttle Booking

**Frontend Page**: Shuttle booking details page

**API Call Expected**:

```typescript
PUT /api/shuttle/bookings/:id/cancel
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  message: "Shuttle booking cancelled"
}
```

**Expected Behavior**:
- Can only cancel if trip is 'scheduled' (not in_progress/completed)
- Refund to user account (or process refund via Paystack)
- Update trip available seats

---

## SECTION 6: Maintenance Requests

### 6.1 Get User Maintenance Requests

**Frontend Page**: `/dashboard/maintenance`

**API Call Expected**:

```typescript
GET /api/maintenance
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  status?: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    requests: Array<{
      id: string;
      title: string;
      description: string;
      category: string;         // 'plumbing' | 'electrical' | 'furniture' | 'cleaning' | 'other'
      priority: string;
      status: string;
      roomId?: string;
      room?: {
        roomNumber: string;
      };
      images: string[];
      createdAt: string;
      updatedAt: string;
      resolvedAt?: string;
    }>;
    pagination: {...}
  }
}
```

---

### 6.2 Get Maintenance Request Details

**Frontend Page**: `/dashboard/maintenance/[id]`

**API Call Expected**:

```typescript
GET /api/maintenance/:id
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    request: {
      // Full request object
    };
    timeline: Array<{
      id: string;
      status: string;
      comment: string;
      updatedBy: {
        id: string;
        name: string;
        role: string;
      };
      createdAt: string;
    }>;
  }
}
```

---

### 6.3 Create Maintenance Request

**Frontend Page**: `/dashboard/maintenance/new`

**API Call Expected**:

```typescript
POST /api/maintenance
Headers: { Authorization, X-Hostel-ID }
Request: {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  roomId?: string;            // optional, if issue is room-specific
  images?: string[];          // array of image URLs (uploaded via /api/uploads first)
}
Response (Success 201): {
  success: true;
  data: {
    request: {
      id: string;
      // ... full request object
    }
  }
}
```

**Expected Behavior**:
- Set status to 'pending' by default
- Send notification to maintenance team
- If priority is 'urgent', send immediate alert

---

### 6.4 Add Comment/Update to Maintenance Request

**Frontend Page**: Maintenance request details page

**API Call Expected**:

```typescript
POST /api/maintenance/:id/comments
Headers: { Authorization, X-Hostel-ID }
Request: {
  comment: string;
  images?: string[];
}
Response (Success 201): {
  success: true;
  data: {
    comment: {
      id: string;
      comment: string;
      images: string[];
      createdBy: {
        id: string;
        name: string;
      };
      createdAt: string;
    }
  }
}
```

---

### 6.5 Admin - Update Maintenance Status

**Frontend Page**: `/admin/dashboard/maintenance`

**API Call Expected**:

```typescript
PUT /api/maintenance/:id/status
Headers: { Authorization, X-Hostel-ID }
Request: {
  status: 'in_progress' | 'resolved' | 'rejected';
  comment?: string;
  assignedTo?: string;        // maintenance staff user ID
}
Response (Success 200): {
  success: true;
  message: "Status updated"
}
```

**Expected Behavior**:
- Send notification to user
- Add to request timeline
- If resolved, set resolvedAt timestamp

---

## SECTION 7: Support Tickets

### 7.1 Get User Support Tickets

**Frontend Page**: `/dashboard/support`

**API Call Expected**:

```typescript
GET /api/support/tickets
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    tickets: Array<{
      id: string;
      subject: string;
      category: string;
      status: string;
      priority: string;
      lastMessageAt: string;
      createdAt: string;
      unreadMessages: number;
    }>;
    pagination: {...}
  }
}
```

---

### 7.2 Get Support Ticket Details

**Frontend Page**: Support ticket chat view

**API Call Expected**:

```typescript
GET /api/support/tickets/:id
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    ticket: {
      id: string;
      subject: string;
      category: string;
      status: string;
      priority: string;
      createdAt: string;
    };
    messages: Array<{
      id: string;
      message: string;
      sender: {
        id: string;
        name: string;
        role: string;
      };
      attachments: string[];
      createdAt: string;
      isRead: boolean;
    }>;
  }
}
```

---

### 7.3 Create Support Ticket

**Frontend Page**: Support page (new ticket form)

**API Call Expected**:

```typescript
POST /api/support/tickets
Headers: { Authorization, X-Hostel-ID }
Request: {
  subject: string;
  category: string;           // 'general' | 'booking' | 'payment' | 'technical' | 'other'
  message: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
}
Response (Success 201): {
  success: true;
  data: {
    ticket: {
      id: string;
      // ... full ticket object
    }
  }
}
```

---

### 7.4 Add Message to Support Ticket

**Frontend Page**: Support ticket chat

**API Call Expected**:

```typescript
POST /api/support/tickets/:id/messages
Headers: { Authorization, X-Hostel-ID }
Request: {
  message: string;
  attachments?: string[];
}
Response (Success 201): {
  success: true;
  data: {
    message: {
      id: string;
      message: string;
      sender: { id, name, role };
      attachments: string[];
      createdAt: string;
    }
  }
}
```

**Expected Behavior**:
- Send notification to ticket participants
- Update ticket lastMessageAt
- If ticket is 'closed', reopen it

---

## SECTION 8: Feedback System

### 8.1 Get User Feedback

**Frontend Page**: `/dashboard/feedback`

**API Call Expected**:

```typescript
GET /api/feedback
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    feedback: Array<{
      id: string;
      category: string;
      rating: number;
      comment: string;
      status: 'submitted' | 'reviewed' | 'addressed';
      createdAt: string;
    }>
  }
}
```

---

### 8.2 Submit Feedback

**Frontend Page**: Feedback form

**API Call Expected**:

```typescript
POST /api/feedback
Headers: { Authorization, X-Hostel-ID }
Request: {
  category: string;           // 'room' | 'shuttle' | 'maintenance' | 'staff' | 'general'
  rating: number;             // 1-5
  comment: string;
  anonymous: boolean;         // default false
}
Response (Success 201): {
  success: true;
  data: {
    feedback: {
      id: string;
      category: string;
      rating: number;
      comment: string;
      status: 'submitted';
      createdAt: string;
    }
  }
}
```

---

## SECTION 9: User Profile

### 9.1 Get User Profile

**Frontend Page**: `/dashboard/profile`

**API Call Expected**:

```typescript
GET /api/users/profile
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      emergencyContact?: string;
      program?: string;
      profilePicture?: string;
      campus?: {
        id: string;
        name: string;
      };
      createdAt: string;
    }
  }
}
```

---

### 9.2 Update User Profile

**Frontend Page**: Profile edit form

**API Call Expected**:

```typescript
PUT /api/users/profile
Headers: { Authorization, X-Hostel-ID }
Request: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  emergencyContact?: string;
  program?: string;
  profilePicture?: string;      // uploaded via /api/uploads first
}
Response (Success 200): {
  success: true;
  data: {
    user: {
      // Updated user object
    }
  }
}
```

---

### 9.3 Change Password

**Frontend Page**: Profile settings

**API Call Expected**:

```typescript
PUT /api/users/change-password
Headers: { Authorization, X-Hostel-ID }
Request: {
  currentPassword: string;
  newPassword: string;
}
Response (Success 200): {
  success: true;
  message: "Password changed successfully"
}
Response (Error 401): {
  success: false;
  message: "Current password is incorrect"
}
```

---

## SECTION 10: Notifications

### 10.1 Get User Notifications

**Frontend Page**: `/dashboard/notifications`

**API Call Expected**:

```typescript
GET /api/notifications
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  read?: boolean;             // filter read/unread
  type?: string;              // filter by notification type
  page?: number;
  limit?: number;
}
Response (Success 200): {
  success: true;
  data: {
    notifications: Array<{
      id: string;
      type: string;             // 'booking' | 'payment' | 'maintenance' | 'shuttle' | 'system'
      title: string;
      message: string;
      isRead: boolean;
      link?: string;            // frontend route to navigate to
      createdAt: string;
    }>;
    unreadCount: number;
    pagination: {...}
  }
}
```

---

### 10.2 Mark Notification as Read

**Frontend Page**: Notifications page (click notification)

**API Call Expected**:

```typescript
PUT /api/notifications/:id/read
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  message: "Notification marked as read"
}
```

---

### 10.3 Mark All Notifications as Read

**Frontend Page**: Notifications page ("Mark all as read" button)

**API Call Expected**:

```typescript
PUT /api/notifications/read-all
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  message: "All notifications marked as read"
}
```

---

## SECTION 11: File Uploads

### 11.1 Upload Profile Picture

**Frontend Page**: Profile page

**API Call Expected**:

```typescript
POST /api/uploads/profile-picture
Headers: {
  Authorization: Bearer <accessToken>
  Content-Type: multipart/form-data
}
Request: FormData with 'file' field
Response (Success 200): {
  success: true;
  data: {
    url: string;                // publicly accessible image URL
    filename: string;
    size: number;
  }
}
```

**Expected Behavior**:
- Accept: jpg, jpeg, png
- Max size: 5MB
- Resize/compress to max 800x800px
- Store in cloud storage (S3, Cloudinary, etc.)
- Return public URL

---

### 11.2 Upload Maintenance Request Image

**Frontend Page**: Maintenance request form

**API Call Expected**:

```typescript
POST /api/uploads/maintenance-image
Headers: { Authorization, Content-Type: multipart/form-data }
Request: FormData with 'file' field
Response (Success 200): {
  success: true;
  data: {
    url: string;
    filename: string;
    size: number;
  }
}
```

**Expected Behavior**:
- Accept: jpg, jpeg, png
- Max size: 10MB
- Can upload multiple images (call endpoint multiple times)

---

### 11.3 Upload Room Image (Admin)

**Frontend Page**: Admin room management

**API Call Expected**:

```typescript
POST /api/uploads/room-image
Headers: { Authorization, Content-Type: multipart/form-data }
Request: FormData with 'file' field
Response (Success 200): {
  success: true;
  data: {
    url: string;
    filename: string;
    size: number;
  }
}
```

---

## SECTION 12: Admin Analytics

### 12.1 Get Dashboard Stats

**Frontend Page**: `/admin/dashboard`

**API Call Expected**:

```typescript
GET /api/admin/dashboard/stats
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;          // percentage
    totalStudents: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingBookings: number;
    activeMaintenanceRequests: number;
    openSupportTickets: number;
  }
}
```

---

### 12.2 Get Revenue Data

**Frontend Page**: Admin dashboard (revenue chart)

**API Call Expected**:

```typescript
GET /api/admin/dashboard/revenue
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  period?: 'week' | 'month' | 'year';     // default 'month'
  startDate?: string;
  endDate?: string;
}
Response (Success 200): {
  success: true;
  data: {
    revenue: Array<{
      date: string;               // or month name
      revenue: number;
      expenses: number;
      profit: number;
    }>;
    totals: {
      totalRevenue: number;
      totalExpenses: number;
      totalProfit: number;
    }
  }
}
```

---

### 12.3 Get Occupancy Data

**Frontend Page**: Admin dashboard (occupancy chart)

**API Call Expected**:

```typescript
GET /api/admin/dashboard/occupancy
Headers: { Authorization, X-Hostel-ID }
Response (Success 200): {
  success: true;
  data: {
    occupancyByType: Array<{
      roomType: string;
      occupied: number;
      available: number;
      percentage: number;
    }>;
    occupancyByBlock?: Array<{
      block: string;
      occupied: number;
      total: number;
    }>;
  }
}
```

---

### 12.4 Get Recent Activity

**Frontend Page**: Admin dashboard (activity feed)

**API Call Expected**:

```typescript
GET /api/admin/dashboard/recent-activity
Headers: { Authorization, X-Hostel-ID }
Query Params: {
  limit?: number;             // default 10
}
Response (Success 200): {
  success: true;
  data: {
    activities: Array<{
      id: string;
      type: 'booking' | 'payment' | 'maintenance' | 'user';
      description: string;
      user?: {
        name: string;
      };
      timestamp: string;
    }>
  }
}
```

---

## SECTION 13: Campus/Hostel Management

### 13.1 Get All Campuses

**Frontend Page**: Admin campus selection, user signup

**API Call Expected**:

```typescript
GET /api/campuses
Headers: { Authorization }        // Optional for public access
Query Params: {
  status?: 'active' | 'inactive';
}
Response (Success 200): {
  success: true;
  data: {
    campuses: Array<{
      id: string;
      name: string;
      location: string;
      address: string;
      capacity: number;
      totalRooms: number;
      imageUrl?: string;
      status: string;
    }>
  }
}
```

---

### 13.2 Create Campus (Super Admin)

**Frontend Page**: Super admin settings

**API Call Expected**:

```typescript
POST /api/campuses
Headers: { Authorization }
Request: {
  name: string;
  location: string;
  address: string;
  capacity: number;
  totalRooms: number;
  description?: string;
  imageUrl?: string;
}
Response (Success 201): {
  success: true;
  data: {
    campus: {
      id: string;
      // ... full campus object
    }
  }
}
```

---

## SECTION 14: Real-Time Features (WebSocket)

### 14.1 WebSocket Connection

**Used By**: Frontend WebSocket hook

**Expected Behavior**:

```typescript
// Client connects to WebSocket
const ws = new WebSocket('wss://api.jecaph.com/ws?token=<accessToken>&hostelId=<hostelId>');

// Server sends events:
{
  type: 'notification',
  data: {
    // notification object
  }
}

{
  type: 'booking_update',
  data: {
    bookingId: string;
    status: string;
  }
}

{
  type: 'maintenance_update',
  data: {
    requestId: string;
    status: string;
  }
}

{
  type: 'payment_confirmed',
  data: {
    paymentId: string;
    bookingId: string;
  }
}
```

**Events Frontend Expects**:
- `notification` - New notification received
- `booking_update` - Booking status changed
- `maintenance_update` - Maintenance request updated
- `payment_confirmed` - Payment verified
- `support_message` - New support ticket message

---

## SECTION 15: Error Handling Standards

### Expected Error Response Format

All API errors should follow this format:

```typescript
{
  success: false;
  message: string;              // Human-readable error message
  error?: string;               // Error code (optional)
  errors?: Array<{              // Field-specific errors (for validation)
    field: string;
    message: string;
  }>;
  statusCode: number;
}
```

### Common HTTP Status Codes Expected

- **200** - Success
- **201** - Resource created
- **400** - Bad request / Validation error
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (valid token but insufficient permissions)
- **404** - Resource not found
- **409** - Conflict (e.g., email already exists)
- **429** - Too many requests (rate limit exceeded)
- **500** - Internal server error

---

## SECTION 16: Security Requirements

### Headers Expected by Frontend

```typescript
// Every authenticated request includes:
{
  'Authorization': 'Bearer <accessToken>',
  'X-Hostel-ID': '<hostelId>',           // For multi-tenancy
  'Content-Type': 'application/json'
}
```

### CORS Configuration Expected

```typescript
// Backend should allow:
{
  origin: [
    'http://localhost:3000',             // Dev
    'https://jecaph.com',                // Prod
    'https://www.jecaph.com'
  ],
  credentials: true,
  allowedHeaders: [
    'Authorization',
    'X-Hostel-ID',
    'Content-Type'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}
```

### JWT Token Requirements

- **Access Token**: Expires in 1 hour, contains userId, email, role
- **Refresh Token**: Expires in 7 days, stored in database
- Signed with strong secret (min 256 bits)

### Input Validation Requirements

- All user inputs sanitized to prevent XSS
- SQL injection prevention (use parameterized queries/ORM)
- File uploads validated (type, size)
- Email validation (proper regex)
- Password strength requirements enforced

### Rate Limiting Expected

- Login attempts: 5 per 15 minutes per IP
- OTP requests: 3 per hour per email
- API requests: 100 per minute per user (authenticated)
- File uploads: 10 per hour per user

---

## SECTION 17: Performance Requirements

### Response Time Expectations

- **GET requests**: < 200ms (simple queries)
- **POST/PUT requests**: < 500ms (with DB write)
- **File uploads**: < 5 seconds (depending on size)
- **Payment initialization**: < 2 seconds
- **Search/filter queries**: < 500ms

### Pagination

All list endpoints should support pagination:

```typescript
Query Params: {
  page: number;        // default 1
  limit: number;       // default 20, max 100
}

Response includes: {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
}
```

### Caching Strategy

- Campus list: Cache for 1 hour
- Room availability: Cache for 5 minutes
- User profile: Cache until updated
- Dashboard stats: Cache for 10 minutes

---

## SECTION 18: Environment Variables Expected

The backend should use these environment variables:

```env
# Server
PORT=3000
NODE_ENV=development | production
API_BASE_URL=https://api.jecaph.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/jecaph_hostel
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jecaph_hostel
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-min-256-bits
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx

# Email Service (SendGrid, Mailgun, etc.)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@jecaph.com
EMAIL_FROM_NAME=Jecaph Hostels

# File Storage (AWS S3, Cloudinary, etc.)
STORAGE_SERVICE=s3 | cloudinary | local
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=jecaph-uploads
# OR for Cloudinary
CLOUDINARY_URL=cloudinary://xxx

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000 | https://jecaph.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX=100                # requests per window

# WebSocket
WS_PORT=3001
WS_PATH=/ws
```

---

## SECTION 19: Testing Expectations

### API Testing Requirements

The backend should have tests for:

- **Unit tests**: Business logic, utilities
- **Integration tests**: API endpoints with database
- **Authentication tests**: Login, token refresh, permissions
- **Payment tests**: Paystack integration (use test keys)
- **Validation tests**: Input validation, error handling

### Test Coverage Expected

- Minimum 70% code coverage
- 100% coverage for authentication and payment flows
- All critical user flows tested (booking, payment, maintenance)

---

## SECTION 20: Deployment Checklist

Before deploying to production, ensure:

### Database
- [ ] Migrations run successfully
- [ ] Seed data populated (if needed)
- [ ] Database backups configured
- [ ] Connection pooling optimized

### Security
- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] JWT secrets are strong and unique
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Paystack webhook signature verification working

### Performance
- [ ] Database indexes created
- [ ] N+1 query problems resolved
- [ ] Caching implemented
- [ ] Logging configured
- [ ] Error monitoring set up (Sentry, etc.)

### Features
- [ ] All endpoints from this spec implemented
- [ ] File uploads working (to S3/Cloudinary)
- [ ] Email sending working
- [ ] Paystack payments working
- [ ] WebSocket connections working
- [ ] Notifications sending properly

### Documentation
- [ ] API documentation generated (Swagger/OpenAPI)
- [ ] Postman collection exported
- [ ] README.md with setup instructions
- [ ] Environment variables documented

---

## SECTION 21: Feature Flags / Feature Rollout

The frontend has a complete feature flag system. Admins toggle features on/off; students see "Coming Soon" for disabled features.

### 21.1 Get Feature Flags

**Used By**: `FeatureFlagsProvider` on app load, cached client-side

**API Call Expected**:

```typescript
GET /api/feature-flags
Headers: {
  Authorization: Bearer <accessToken>
  X-Hostel-ID: <hostelId>
}
Response (Success 200): {
  success: true;
  data: {
    room_booking: boolean;
    shuttle_booking: boolean;
    maintenance_requests: boolean;
    payments: boolean;
    feedback: boolean;
    support: boolean;
    notifications: boolean;
    profile_editing: boolean;
  }
}
```

**Expected Behavior**:
- Returns flags scoped to the hostel in `X-Hostel-ID`
- Student-facing response is a flat boolean map (no metadata)
- Frontend caches in localStorage and re-fetches on app load
- Default flags if no backend available: shuttle_booking=false, all others=true

---

### 21.2 Update Feature Flags (Admin Only)

**Frontend Page**: `/admin/dashboard/settings` (Features tab)

**API Call Expected**:

```typescript
PUT /api/admin/feature-flags
Headers: {
  Authorization: Bearer <adminToken>
  X-Hostel-ID: <hostelId>
}
Request: {
  flags: {
    shuttle_booking?: boolean;
    feedback?: boolean;
    // ... any subset of flag keys
  }
}
Response (Success 200): {
  success: true;
  data: {
    // Full updated flags map
    room_booking: boolean;
    shuttle_booking: boolean;
    maintenance_requests: boolean;
    payments: boolean;
    feedback: boolean;
    support: boolean;
    notifications: boolean;
    profile_editing: boolean;
  },
  message: "Feature flags updated successfully"
}
```

**Expected Behavior**:
- Only `admin` or `manager` roles can update
- Changes are scoped per hostel (multi-tenancy)
- All flag changes logged in audit trail with `updated_by` user ID
- Backend MUST also enforce feature gates on API routes (e.g. reject `POST /api/shuttle/bookings` if `shuttle_booking` is `false`, returning 403 with message "Feature not available")

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

---

## SECTION 22: Optimistic Locking & Concurrency

The frontend uses React Query with optimistic updates. The backend MUST support version-based conflict detection.

### 22.1 Version Header Convention

All mutable resources (rooms, bookings, maintenance requests) should include a `version` field (integer, auto-incremented on each update).

```typescript
// Frontend sends current version on updates:
PUT /api/rooms/:id
Headers: {
  Authorization: Bearer <accessToken>
  X-Hostel-ID: <hostelId>
}
Request: {
  version: number;        // Current version the client has
  // ... update fields
}

// Success: version incremented
Response (200): {
  success: true;
  data: {
    room: { ...updatedRoom, version: previousVersion + 1 }
  }
}

// Conflict: someone else modified first
Response (409): {
  success: false;
  message: "This resource was modified by another user. Please refresh and try again.";
  error: "VERSION_CONFLICT";
  data: {
    currentVersion: number;
    serverData: { ... }     // Latest server state so frontend can show diff
  }
}
```

**Expected Behavior**:
- Backend checks `WHERE id = :id AND version = :clientVersion` on UPDATE
- If 0 rows affected, return 409 with the current server state
- Frontend shows a conflict resolution dialog on 409
- Frontend automatically rolls back optimistic UI changes on error

### 22.2 Room Booking Race Condition

When two students try to book the same room simultaneously:

```typescript
// Student A books room-1 (succeeds)
POST /api/bookings → 201 Created

// Student B books room-1 (should fail)
POST /api/bookings → 409 Conflict
Response: {
  success: false;
  message: "This room was just booked by another student. Please choose a different room.";
  error: "ROOM_UNAVAILABLE";
}
```

The frontend handles this with optimistic rollback and a toast notification.

---

## SECTION 23: React Query Cache Invalidation Map

The frontend uses `@tanstack/react-query`. When the backend processes mutations, WebSocket events should be broadcast so all connected clients invalidate the correct cache keys.

| Backend Event | WebSocket Type | Frontend Query Keys Invalidated |
|---|---|---|
| Room created/updated/deleted | `ROOM_UPDATED` | `["rooms"]`, `["rooms", roomId]` |
| Booking created | `ROOM_BOOKED` | `["rooms"]`, `["rooms", roomId]`, `["bookings"]` |
| Booking status changed | `BOOKING_UPDATED` | `["bookings"]`, `["bookings", bookingId]` |
| Payment confirmed | `PAYMENT_CONFIRMED` | `["bookings"]`, `["payments"]` |
| Maintenance request updated | `MAINTENANCE_UPDATED` | `["maintenance"]`, `["maintenance", requestId]` |
| Shuttle schedule changed | `SHUTTLE_UPDATED` | `["shuttles"]`, `["shuttle-bookings"]` |
| New notification | `NOTIFICATION` | `["notifications"]` |
| Support message received | `SUPPORT_MESSAGE` | `["support-tickets"]`, `["support-tickets", ticketId]` |

---

## SECTION 24: Role-Based Access Control (RBAC)

The frontend enforces permissions client-side. The backend MUST enforce the same permissions server-side.

### Roles

| Role | Description |
|---|---|
| `student` | Regular hostel resident |
| `staff` | Hostel staff (maintenance, front desk) |
| `manager` | Hostel manager (reporting, approvals) |
| `admin` | Full system admin (all permissions) |

### Permission Matrix

| Permission | student | staff | manager | admin |
|---|---|---|---|---|
| `view_rooms` | Y | Y | Y | Y |
| `book_room` | Y | - | - | - |
| `manage_rooms` | - | - | Y | Y |
| `view_bookings` | Y | Y | Y | Y |
| `manage_bookings` | - | - | Y | Y |
| `view_payments` | Y | Y | Y | Y |
| `manage_payments` | - | - | Y | Y |
| `view_maintenance` | Y | Y | Y | Y |
| `create_maintenance` | Y | - | - | - |
| `manage_maintenance` | - | Y | Y | Y |
| `view_users` | - | Y | Y | Y |
| `manage_users` | - | - | - | Y |
| `view_reports` | - | - | Y | Y |
| `manage_settings` | - | - | - | Y |

**Backend Enforcement**:
- Every API endpoint must check the user's role against the required permission
- Return `403 Forbidden` with message `"Insufficient permissions"` if unauthorized
- The `User` object returned from `/api/auth/me` must include `role` field

---

## SECTION 25: WebSocket Event Types (Exact Specification)

The frontend WebSocket hook (`useWebSocket`) expects these exact event types:

```typescript
// WebSocket message envelope
interface WebSocketMessage {
  type: 'ROOM_BOOKED' | 'PAYMENT_CONFIRMED' | 'MAINTENANCE_UPDATED' | 'SHUTTLE_UPDATED' | 'NOTIFICATION';
  data: Record<string, any>;
  timestamp: string;
}
```

### Event Details

```typescript
// ROOM_BOOKED - When any student books a room
{
  type: "ROOM_BOOKED",
  data: {
    room_id: string;
    room_number: string;
    user_id: string;      // So frontend can check if it's current user
    booking_id: string;
  }
}

// PAYMENT_CONFIRMED - When a payment is verified
{
  type: "PAYMENT_CONFIRMED",
  data: {
    payment_id: string;
    booking_id: string;
    user_id: string;
    amount: number;
  }
}

// MAINTENANCE_UPDATED - When a maintenance request status changes
{
  type: "MAINTENANCE_UPDATED",
  data: {
    request_id: string;
    user_id: string;
    status: string;       // 'in_progress' | 'resolved' | 'rejected'
  }
}

// SHUTTLE_UPDATED - When shuttle schedule changes
{
  type: "SHUTTLE_UPDATED",
  data: {
    trip_id?: string;
    message: string;
  }
}

// NOTIFICATION - Generic notification
{
  type: "NOTIFICATION",
  data: {
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    link?: string;
  }
}
```

### Connection URL

```
wss://<API_HOST>/ws?token=<accessToken>&hostel_id=<hostelId>
```

Frontend env var: `NEXT_PUBLIC_WS_URL` (defaults to `ws://localhost:3001`)

---

## Summary

This document specifies the **complete backend API contract** that the Jecaph frontend expects. Every endpoint, request format, response format, authentication flow, and third-party integration is defined here.

**Total Endpoints Expected**: ~90+ endpoints across:
- 10 Authentication endpoints
- 15 Room/Booking endpoints
- 10 Payment endpoints
- 12 Shuttle endpoints
- 10 Maintenance endpoints
- 10 Support endpoints
- 5 Feedback endpoints
- 8 User/Profile endpoints
- 8 Notification endpoints
- 5 File upload endpoints
- 8 Admin analytics endpoints
- 5 Campus management endpoints
- 2 Feature flag endpoints

**Third-Party Integrations Required**:
- Paystack (payments)
- Email service (SendGrid/Mailgun)
- File storage (S3/Cloudinary)
- WebSocket server

**Enterprise Features Required**:
- JWT authentication with refresh token rotation
- Role-based access control (student/staff/manager/admin)
- Feature flags per hostel (multi-tenancy)
- Optimistic locking with version-based conflict detection (409 responses)
- WebSocket real-time events for cache invalidation
- Input validation and sanitization
- Rate limiting per endpoint category
- CORS configuration
- Password hashing (bcrypt)
- Audit logging for admin actions

If the backend implements all of these endpoints with the specified formats and behaviors, the frontend will work seamlessly.
