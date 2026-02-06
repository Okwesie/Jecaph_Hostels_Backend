# JECAPH Backend - Database Current State

## 📋 Overview

**Database Type:** PostgreSQL  
**ORM:** Prisma (v5.7.1)  
**Schema Location:** `backend/prisma/schema.prisma`  
**Migrations:** Prisma Migrate  
**Current Migration:** `20260103020933_m1` (Initial)

---

## 🗄️ Database Tables

### 1. campuses
**Purpose:** Store campus/hostel locations

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| name | VARCHAR(255) | UNIQUE, NOT NULL | - | Campus name |
| location | VARCHAR(255) | NOT NULL | - | Geographic location |
| address | TEXT | NOT NULL | - | Full address |
| description | TEXT | NULLABLE | - | Description |
| capacity | INTEGER | NOT NULL | 0 | Total capacity |
| total_rooms | INTEGER | NOT NULL | 0 | Number of rooms |
| image_url | VARCHAR(500) | NULLABLE | - | Image URL |
| status | VARCHAR(50) | NOT NULL | 'inactive' | active/inactive |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Indexes:**
- `campuses_status_idx` on (status)
- `campuses_name_idx` on (name)

**Relationships:**
- One-to-Many with `users`

---

### 2. users
**Purpose:** Store user accounts (students, admins)

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | - | Email address |
| password_hash | VARCHAR(255) | NOT NULL | - | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | - | First name |
| last_name | VARCHAR(100) | NOT NULL | - | Last name |
| phone | VARCHAR(20) | NULLABLE | - | Phone number |
| emergency_contact | VARCHAR(100) | NULLABLE | - | Emergency contact |
| program | VARCHAR(100) | NULLABLE | - | Academic program |
| campus_id | TEXT | FK, NULLABLE | - | Reference to campus |
| role | VARCHAR(50) | NOT NULL | 'student' | student/admin/super_admin |
| status | VARCHAR(50) | NOT NULL | 'active' | active/suspended |
| email_verified | BOOLEAN | NOT NULL | false | Email verification status |
| email_verified_at | TIMESTAMP | NULLABLE | - | Verification timestamp |
| profile_picture | VARCHAR(500) | NULLABLE | - | Profile picture URL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |
| deleted_at | TIMESTAMP | NULLABLE | - | Soft delete timestamp |

**Indexes:**
- `users_email_idx` on (email)
- `users_role_idx` on (role)
- `users_status_idx` on (status)
- `users_campus_id_idx` on (campus_id)
- `users_created_at_idx` on (created_at)

**Foreign Keys:**
- `campus_id` → `campuses(id)` ON DELETE SET NULL

**Relationships:**
- Many-to-One with `campuses`
- One-to-Many with `bookings`, `shuttle_bookings`, `maintenance_requests`, `payments`, `invoices`, `feedback`, `support_tickets`, `ticket_messages`, `password_reset_tokens`, `refresh_tokens`

---

### 3. rooms
**Purpose:** Store room inventory

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| room_number | VARCHAR(50) | UNIQUE, NOT NULL | - | Room number |
| room_type | VARCHAR(50) | NOT NULL | - | single/shared/suite/dormitory |
| capacity | INTEGER | NOT NULL | - | Max occupants |
| price_per_month | DECIMAL(10,2) | NOT NULL | - | Monthly rent |
| current_occupancy | INTEGER | NOT NULL | 0 | Current occupants |
| status | VARCHAR(50) | NOT NULL | 'available' | available/occupied/maintenance |
| amenities | TEXT[] | NOT NULL | - | Array of amenities |
| description | TEXT | NULLABLE | - | Room description |
| features | TEXT | NULLABLE | - | Special features |
| image_url | VARCHAR(500) | NULLABLE | - | Room image URL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |
| deleted_at | TIMESTAMP | NULLABLE | - | Soft delete timestamp |

**Indexes:**
- `rooms_room_number_idx` on (room_number)
- `rooms_room_type_idx` on (room_type)
- `rooms_status_idx` on (status)
- `rooms_price_per_month_idx` on (price_per_month)

**Relationships:**
- One-to-Many with `bookings`, `maintenance_requests`

---

### 4. bookings
**Purpose:** Store room booking records

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Reference to user |
| room_id | TEXT | FK, NOT NULL | - | Reference to room |
| check_in_date | DATE | NOT NULL | - | Check-in date |
| check_out_date | DATE | NOT NULL | - | Check-out date |
| duration_months | INTEGER | NOT NULL | - | Duration in months |
| total_amount | DECIMAL(10,2) | NOT NULL | - | Total booking cost |
| amount_paid | DECIMAL(10,2) | NOT NULL | 0 | Amount paid so far |
| outstanding_balance | DECIMAL(10,2) | NOT NULL | - | Remaining balance |
| status | VARCHAR(50) | NOT NULL | 'pending' | Booking status |
| notes | TEXT | NULLABLE | - | Additional notes |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Booking creation |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |
| deleted_at | TIMESTAMP | NULLABLE | - | Soft delete timestamp |

**Status Values:** pending, approved, rejected, active, completed, cancelled

**Indexes:**
- `bookings_user_id_idx` on (user_id)
- `bookings_room_id_idx` on (room_id)
- `bookings_status_idx` on (status)
- `bookings_check_in_date_idx` on (check_in_date)
- `bookings_created_at_idx` on (created_at)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `room_id` → `rooms(id)` ON DELETE RESTRICT

**Relationships:**
- Many-to-One with `users`, `rooms`
- One-to-Many with `payments`, `invoices`

---

### 5. shuttle_routes
**Purpose:** Store shuttle service routes

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| route_from | VARCHAR(100) | NOT NULL | - | Departure location |
| route_to | VARCHAR(100) | NOT NULL | - | Destination |
| departure_time | TIME | NOT NULL | - | Departure time |
| arrival_time | TIME | NOT NULL | - | Arrival time |
| price_per_seat | DECIMAL(8,2) | NOT NULL | - | Price per seat |
| total_seats | INTEGER | NOT NULL | - | Total seats available |
| driver_name | VARCHAR(100) | NULLABLE | - | Driver name |
| vehicle_type | VARCHAR(100) | NULLABLE | - | Vehicle type |
| frequency | VARCHAR(50) | NULLABLE | - | Schedule frequency |
| status | VARCHAR(50) | NOT NULL | 'active' | active/inactive |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Indexes:**
- `shuttle_routes_route_from_idx` on (route_from)
- `shuttle_routes_route_to_idx` on (route_to)
- `shuttle_routes_departure_time_idx` on (departure_time)

**Relationships:**
- One-to-Many with `shuttle_bookings`

---

### 6. shuttle_bookings
**Purpose:** Store shuttle booking records

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Reference to user |
| route_id | TEXT | FK, NOT NULL | - | Reference to route |
| booking_date | DATE | NOT NULL | - | Date of travel |
| seats_booked | INTEGER | NOT NULL | - | Number of seats |
| total_price | DECIMAL(10,2) | NOT NULL | - | Total price |
| status | VARCHAR(50) | NOT NULL | 'confirmed' | Booking status |
| qr_code | TEXT | NULLABLE | - | QR code data URL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Status Values:** confirmed, cancelled, used

**Indexes:**
- `shuttle_bookings_user_id_idx` on (user_id)
- `shuttle_bookings_route_id_idx` on (route_id)
- `shuttle_bookings_booking_date_idx` on (booking_date)
- `shuttle_bookings_status_idx` on (status)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `route_id` → `shuttle_routes(id)` ON DELETE RESTRICT

---

### 7. maintenance_requests
**Purpose:** Store maintenance request tickets

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Requesting user |
| room_id | TEXT | FK, NULLABLE | - | Related room |
| title | VARCHAR(255) | NOT NULL | - | Request title |
| category | VARCHAR(100) | NOT NULL | - | Request category |
| priority | VARCHAR(50) | NOT NULL | - | Priority level |
| description | TEXT | NOT NULL | - | Issue description |
| status | VARCHAR(50) | NOT NULL | 'new' | Request status |
| assigned_to | TEXT | FK, NULLABLE | - | Assigned staff |
| staff_response | TEXT | NULLABLE | - | Staff response |
| attachment_url | VARCHAR(500) | NULLABLE | - | Attachment URL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |
| completed_at | TIMESTAMP | NULLABLE | - | Completion date |

**Category Values:** plumbing, electrical, furniture, cleaning, other
**Priority Values:** low, medium, high, urgent
**Status Values:** new, in_progress, completed, cancelled

**Indexes:**
- `maintenance_requests_user_id_idx` on (user_id)
- `maintenance_requests_status_idx` on (status)
- `maintenance_requests_priority_idx` on (priority)
- `maintenance_requests_category_idx` on (category)
- `maintenance_requests_created_at_idx` on (created_at)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `room_id` → `rooms(id)` ON DELETE SET NULL
- `assigned_to` → `users(id)` ON DELETE SET NULL

---

### 8. payments
**Purpose:** Store payment transactions

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Paying user |
| booking_id | TEXT | FK, NULLABLE | - | Related booking |
| amount | DECIMAL(10,2) | NOT NULL | - | Payment amount |
| currency | VARCHAR(3) | NOT NULL | 'GHS' | Currency code |
| payment_method | VARCHAR(100) | NOT NULL | - | Payment method |
| status | VARCHAR(50) | NOT NULL | 'pending' | Payment status |
| transaction_reference | VARCHAR(255) | UNIQUE, NULLABLE | - | External reference |
| payment_type | VARCHAR(100) | NOT NULL | - | Payment category |
| reference_id | VARCHAR(255) | NULLABLE | - | Internal reference |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| completed_at | TIMESTAMP | NULLABLE | - | Completion date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Status Values:** pending, completed, failed, refunded

**Indexes:**
- `payments_user_id_idx` on (user_id)
- `payments_booking_id_idx` on (booking_id)
- `payments_status_idx` on (status)
- `payments_transaction_reference_idx` on (transaction_reference)
- `payments_created_at_idx` on (created_at)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `booking_id` → `bookings(id)` ON DELETE SET NULL

---

### 9. invoices
**Purpose:** Store invoice records

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Invoice owner |
| booking_id | TEXT | FK, NULLABLE | - | Related booking |
| invoice_number | VARCHAR(50) | UNIQUE, NOT NULL | - | Invoice number |
| amount_due | DECIMAL(10,2) | NOT NULL | - | Total amount due |
| amount_paid | DECIMAL(10,2) | NOT NULL | 0 | Amount paid |
| due_date | DATE | NOT NULL | - | Payment due date |
| status | VARCHAR(50) | NOT NULL | 'unpaid' | Invoice status |
| description | TEXT | NULLABLE | - | Description |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| paid_at | TIMESTAMP | NULLABLE | - | Payment date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Status Values:** unpaid, partial, paid, overdue

**Indexes:**
- `invoices_user_id_idx` on (user_id)
- `invoices_invoice_number_idx` on (invoice_number)
- `invoices_status_idx` on (status)
- `invoices_due_date_idx` on (due_date)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `booking_id` → `bookings(id)` ON DELETE SET NULL

---

### 10. feedback
**Purpose:** Store user feedback submissions

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Submitting user |
| rating | INTEGER | NOT NULL | - | Rating (1-5) |
| category | VARCHAR(100) | NOT NULL | - | Feedback category |
| title | VARCHAR(255) | NOT NULL | - | Feedback title |
| feedback_text | TEXT | NOT NULL | - | Feedback content |
| anonymous | BOOLEAN | NOT NULL | false | Anonymous flag |
| admin_response | TEXT | NULLABLE | - | Admin response |
| admin_response_date | TIMESTAMP | NULLABLE | - | Response date |
| status | VARCHAR(50) | NOT NULL | 'pending' | Feedback status |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Category Values:** room_quality, staff_service, amenities, food, cleanliness, other
**Status Values:** pending, responded

**Indexes:**
- `feedback_user_id_idx` on (user_id)
- `feedback_rating_idx` on (rating)
- `feedback_category_idx` on (category)
- `feedback_status_idx` on (status)
- `feedback_created_at_idx` on (created_at)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 11. support_tickets
**Purpose:** Store support ticket records

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Ticket creator |
| ticket_number | VARCHAR(50) | UNIQUE, NOT NULL | - | Ticket number |
| category | VARCHAR(100) | NOT NULL | - | Ticket category |
| priority | VARCHAR(50) | NOT NULL | - | Priority level |
| subject | VARCHAR(255) | NOT NULL | - | Subject line |
| description | TEXT | NOT NULL | - | Issue description |
| status | VARCHAR(50) | NOT NULL | 'open' | Ticket status |
| assigned_to | TEXT | FK, NULLABLE | - | Assigned agent |
| attachment_url | VARCHAR(500) | NULLABLE | - | Attachment URL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| resolved_at | TIMESTAMP | NULLABLE | - | Resolution date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Category Values:** technical, billing, facility, other
**Priority Values:** low, medium, high
**Status Values:** open, in_progress, closed

**Indexes:**
- `support_tickets_user_id_idx` on (user_id)
- `support_tickets_ticket_number_idx` on (ticket_number)
- `support_tickets_status_idx` on (status)
- `support_tickets_priority_idx` on (priority)
- `support_tickets_created_at_idx` on (created_at)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `assigned_to` → `users(id)` ON DELETE SET NULL

**Relationships:**
- One-to-Many with `ticket_messages`

---

### 12. ticket_messages
**Purpose:** Store support ticket conversation messages

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| ticket_id | TEXT | FK, NOT NULL | - | Parent ticket |
| sender_id | TEXT | FK, NOT NULL | - | Message sender |
| message_text | TEXT | NOT NULL | - | Message content |
| attachment_url | VARCHAR(500) | NULLABLE | - | Attachment URL |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Indexes:**
- `ticket_messages_ticket_id_idx` on (ticket_id)
- `ticket_messages_sender_id_idx` on (sender_id)
- `ticket_messages_created_at_idx` on (created_at)

**Foreign Keys:**
- `ticket_id` → `support_tickets(id)` ON DELETE CASCADE
- `sender_id` → `users(id)` ON DELETE RESTRICT

---

### 13. otp_codes
**Purpose:** Store OTP verification codes

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| email | VARCHAR(255) | NOT NULL | - | Email address |
| otp_code | VARCHAR(10) | NOT NULL | - | OTP code |
| expires_at | TIMESTAMP | NOT NULL | - | Expiration time |
| used | BOOLEAN | NOT NULL | false | Usage flag |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |

**Indexes:**
- `otp_codes_email_idx` on (email)
- `otp_codes_expires_at_idx` on (expires_at)

---

### 14. password_reset_tokens
**Purpose:** Store password reset tokens

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Token owner |
| token | TEXT | UNIQUE, NOT NULL | - | Reset token (UUID) |
| expires_at | TIMESTAMP | NOT NULL | - | Expiration time |
| used | BOOLEAN | NOT NULL | false | Usage flag |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |

**Indexes:**
- `password_reset_tokens_token_idx` on (token)
- `password_reset_tokens_expires_at_idx` on (expires_at)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 15. refresh_tokens
**Purpose:** Store JWT refresh tokens

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | FK, NOT NULL | - | Token owner |
| token | TEXT | UNIQUE, NOT NULL | - | Refresh token |
| expires_at | TIMESTAMP | NOT NULL | - | Expiration time |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Creation date |

**Indexes:**
- `refresh_tokens_token_idx` on (token)
- `refresh_tokens_expires_at_idx` on (expires_at)
- `refresh_tokens_user_id_idx` on (user_id)

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 16. system_settings
**Purpose:** Store application configuration

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| setting_key | VARCHAR(255) | UNIQUE, NOT NULL | - | Setting key |
| setting_value | TEXT | NULLABLE | - | Setting value |
| setting_type | VARCHAR(50) | NOT NULL | 'string' | Value type |
| updated_at | TIMESTAMP | NOT NULL | auto-updated | Last update |

**Indexes:**
- `system_settings_setting_key_idx` on (setting_key)

---

### 17. audit_logs
**Purpose:** Store audit trail records

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK, UUID | auto-generated | Unique identifier |
| user_id | TEXT | NULLABLE | - | Acting user |
| action | VARCHAR(255) | NOT NULL | - | Action performed |
| entity_type | VARCHAR(100) | NULLABLE | - | Entity type |
| entity_id | VARCHAR(255) | NULLABLE | - | Entity ID |
| changes | JSONB | NULLABLE | - | Change details |
| ip_address | VARCHAR(45) | NULLABLE | - | Client IP |
| user_agent | TEXT | NULLABLE | - | User agent string |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Action timestamp |

**Indexes:**
- `audit_logs_user_id_idx` on (user_id)
- `audit_logs_action_idx` on (action)
- `audit_logs_entity_type_idx` on (entity_type)
- `audit_logs_created_at_idx` on (created_at)

---

## 📊 Entity Relationship Diagram

```
┌─────────────────┐
│    campuses     │
├─────────────────┤
│ id              │───┐
│ name            │   │
│ status          │   │
└─────────────────┘   │
                      │ 1:N
┌─────────────────┐   │
│     users       │◄──┘
├─────────────────┤
│ id              │───────────────────────┬───────────────────┬──────────────────┐
│ campus_id (FK)  │                       │                   │                  │
│ email           │                       │                   │                  │
│ role            │                       │                   │                  │
└─────────────────┘                       │                   │                  │
       │ 1:N                              │ 1:N               │ 1:N              │ 1:N
       ▼                                  ▼                   ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    bookings     │  │shuttle_bookings │  │    feedback     │  │support_tickets  │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id              │  │ id              │  │ id              │  │ id              │
│ user_id (FK)    │  │ user_id (FK)    │  │ user_id (FK)    │  │ user_id (FK)    │
│ room_id (FK)    │  │ route_id (FK)   │  │ rating          │  │ ticket_number   │
│ total_amount    │  │ total_price     │  │ category        │  │ status          │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
       │ 1:N               ▲                                         │ 1:N
       ▼                   │                                         ▼
┌─────────────────┐  ┌─────────────────┐                      ┌─────────────────┐
│    payments     │  │ shuttle_routes  │                      │ ticket_messages │
├─────────────────┤  ├─────────────────┤                      ├─────────────────┤
│ id              │  │ id              │                      │ id              │
│ user_id (FK)    │  │ route_from      │                      │ ticket_id (FK)  │
│ booking_id (FK) │  │ route_to        │                      │ sender_id (FK)  │
│ amount          │  │ price_per_seat  │                      │ message_text    │
└─────────────────┘  └─────────────────┘                      └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     rooms       │  │maintenance_req  │  │    invoices     │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id              │  │ id              │  │ id              │
│ room_number     │◄─│ room_id (FK)    │  │ user_id (FK)    │
│ price_per_month │  │ user_id (FK)    │  │ booking_id (FK) │
│ status          │  │ assigned_to(FK) │  │ invoice_number  │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   otp_codes     │  │password_reset   │  │refresh_tokens   │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id              │  │ id              │  │ id              │
│ email           │  │ user_id (FK)    │  │ user_id (FK)    │
│ otp_code        │  │ token           │  │ token           │
│ expires_at      │  │ expires_at      │  │ expires_at      │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│system_settings  │  │   audit_logs    │
├─────────────────┤  ├─────────────────┤
│ id              │  │ id              │
│ setting_key     │  │ user_id         │
│ setting_value   │  │ action          │
│ setting_type    │  │ changes (JSONB) │
└─────────────────┘  └─────────────────┘
```

---

## 🔄 Migrations Status

### Current Migrations
| Migration | Date | Description | Status |
|-----------|------|-------------|--------|
| 20260103020933_m1 | Jan 3, 2026 | Initial schema | ✅ Applied |

### Migration Files
- `prisma/migrations/20260103020933_m1/migration.sql` - Full schema creation
- `prisma/migrations/migration_lock.toml` - Migration lock file

### How to Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run pending migrations (development)
npm run db:migrate

# Push schema without migrations (development)
npm run db:push

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 🌱 Seed Data

### Seed File
`prisma/seed.ts`

### Seed Data Contents

**1. Campus**
```javascript
{
  name: 'Takoradi Campus',
  location: 'Takoradi, Western Region',
  address: 'KNUST Road, Takoradi',
  description: 'Our main operational campus...',
  capacity: 200,
  totalRooms: 45,
  status: 'active'
}
```

**2. Admin User**
```javascript
{
  email: 'admin@jecaph.edu',
  password: 'admin123', // bcrypt hashed
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin',
  status: 'active',
  emailVerified: true
}
```

**3. Sample Rooms (5 rooms)**
- Room 101: Single, GHS 500/month
- Room 102: Single, GHS 500/month
- Room 201: Shared, GHS 350/month
- Room 202: Shared, GHS 350/month
- Room 301: Suite, GHS 450/month

**4. System Settings (7 settings)**
- app_name, support_email, support_phone
- hostel_name, semester dates, base_monthly_fee

**5. Shuttle Routes (2 routes)**
- Campus → City Center (08:00)
- City Center → Campus (17:00)

### How to Run Seed

```bash
npm run db:seed
```

---

## ⚠️ Database Issues Identified

### 1. Mixed ORM Usage
The codebase imports database clients inconsistently:

```typescript
// Controllers use Prisma
import prisma from '../config/database';

// But database.ts exports Supabase client
export const supabase: SupabaseClient | null = ...
export default supabase;
```

**Impact:** Controllers expect Prisma client but may receive Supabase client

### 2. Missing Hostel Table
- `hostelContext.ts` queries a `hostels` table
- Prisma schema only has `campuses` table
- These tables have different structures

### 3. No Multi-tenancy Filtering
- Rooms, bookings don't have hostel_id column
- Data is not isolated by hostel/campus
- Multi-tenancy validation exists but isn't enforced in queries

### 4. Audit Logs Not Used
- `audit_logs` table exists
- No code writes to this table
- Actions are not being audited

### 5. Invoice Generation Missing
- `invoices` table exists
- No endpoints or controllers for invoice management
- Invoices are never created

---

## 📋 Index Summary

| Table | Index Count | Purpose |
|-------|-------------|---------|
| campuses | 2 | Status, name lookups |
| users | 5 | Email, role, status, campus, created |
| rooms | 4 | Room number, type, status, price |
| bookings | 5 | User, room, status, check-in, created |
| shuttle_routes | 3 | From, to, departure time |
| shuttle_bookings | 4 | User, route, date, status |
| maintenance_requests | 5 | User, status, priority, category, created |
| payments | 5 | User, booking, status, reference, created |
| invoices | 4 | User, number, status, due date |
| feedback | 5 | User, rating, category, status, created |
| support_tickets | 5 | User, number, status, priority, created |
| ticket_messages | 3 | Ticket, sender, created |
| otp_codes | 2 | Email, expires |
| password_reset_tokens | 2 | Token, expires |
| refresh_tokens | 3 | Token, expires, user |
| system_settings | 1 | Setting key |
| audit_logs | 4 | User, action, entity, created |

**Total Indexes:** 62

---

*Document generated: February 6, 2026*
