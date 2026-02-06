-- JECAPH Hostel Management System - Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  student_id VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  role VARCHAR(20) DEFAULT 'student', -- 'student', 'admin', 'staff'
  is_verified BOOLEAN DEFAULT FALSE,
  profile_visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'roommates'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_student_id (student_id),
  INDEX idx_role (role)
);

-- OTP Codes Table
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_user_id (user_id)
);

-- Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number VARCHAR(50) UNIQUE NOT NULL,
  block VARCHAR(50) NOT NULL,
  room_type VARCHAR(20) NOT NULL, -- 'single', 'shared', 'double', 'triple'
  floor INTEGER,
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  amenities JSON, -- ["WiFi", "AC", "Desk"]
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'reserved'
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_block (block),
  INDEX idx_room_type (room_type),
  INDEX idx_status (status)
);

-- Room Bookings Table
CREATE TABLE room_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  booking_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  booking_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  INDEX idx_user_id (user_id),
  INDEX idx_room_id (room_id),
  INDEX idx_booking_status (booking_status),
  INDEX idx_check_in_date (check_in_date)
);

-- Shuttle Routes Table
CREATE TABLE shuttle_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  departure_point VARCHAR(200) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  total_seats INTEGER NOT NULL,
  price_per_seat DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(30) NOT NULL, -- 'daily', 'weekly', 'twice_daily', 'every_2_hours'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_destination (destination),
  INDEX idx_status (status)
);

-- Shuttle Bookings Table
CREATE TABLE shuttle_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  route_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  number_of_seats INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  booking_status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed', 'no_show'
  qr_code VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES shuttle_routes(id),
  INDEX idx_user_id (user_id),
  INDEX idx_route_id (route_id),
  INDEX idx_booking_date (booking_date)
);

-- Maintenance Requests Table
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  room_id UUID,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'emergency'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'cancelled'
  assigned_to UUID,
  submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  booking_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL, -- 'paystack_card', 'mobile_money', 'bank_transfer'
  transaction_id VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  description VARCHAR(500),
  receipt_number VARCHAR(100),
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES room_bookings(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id)
);

-- Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  issue_date DATE NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
  description TEXT,
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_payment_status (payment_status)
);

-- Feedback Table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'acknowledged', 'action_taken', 'closed'
  management_response TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_category (category)
);

-- Support Tickets Table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  subject VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
);

-- Create indexes for better performance
CREATE INDEX idx_room_bookings_check_in ON room_bookings(check_in_date);
CREATE INDEX idx_room_bookings_check_out ON room_bookings(check_out_date);
CREATE INDEX idx_shuttle_bookings_booking_date ON shuttle_bookings(booking_date);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Create views for common queries
CREATE VIEW student_dashboard_stats AS
SELECT 
  u.id,
  (SELECT COUNT(*) FROM room_bookings WHERE user_id = u.id AND booking_status IN ('confirmed', 'checked_in')) as active_bookings,
  (SELECT COUNT(*) FROM maintenance_requests WHERE user_id = u.id AND status IN ('pending', 'in_progress')) as pending_maintenance,
  (SELECT COUNT(*) FROM shuttle_bookings WHERE user_id = u.id AND booking_status IN ('confirmed', 'completed')) as total_shuttle_bookings,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE user_id = u.id AND payment_status != 'paid') as outstanding_balance
FROM users u
WHERE u.role = 'student' AND u.deleted_at IS NULL;

-- Sample Data for Testing (optional)
-- INSERT INTO users (email, password_hash, first_name, last_name, phone, student_id, role, is_verified)
-- VALUES (
--   'admin@jecaph.com',
--   '$2b$10$...',  -- hashed password
--   'Admin',
--   'User',
--   '+233501234567',
--   NULL,
--   'admin',
--   true
-- );
