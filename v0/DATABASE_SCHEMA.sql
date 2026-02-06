-- ============================================
-- JECAPH HOSTEL MANAGEMENT SYSTEM
-- Database Schema - PostgreSQL
-- ============================================

-- Drop existing database and create fresh
DROP DATABASE IF EXISTS jecaph_hostel CASCADE;
CREATE DATABASE jecaph_hostel
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

\c jecaph_hostel;

-- ============================================
-- TABLES
-- ============================================

-- Table: campuses
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  capacity INT NOT NULL DEFAULT 0,
  total_rooms INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_name (name)
);

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  emergency_contact VARCHAR(100),
  program VARCHAR(100),
  campus_id UUID REFERENCES campuses(id),
  role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  profile_picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_campus_id (campus_id),
  INDEX idx_created_at (created_at)
);

-- Table: rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(50) NOT NULL UNIQUE,
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('single', 'shared', 'suite', 'dormitory')),
  capacity INT NOT NULL CHECK (capacity > 0),
  price_per_month DECIMAL(10, 2) NOT NULL CHECK (price_per_month > 0),
  current_occupancy INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  amenities TEXT[],
  description TEXT,
  features TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  INDEX idx_room_number (room_number),
  INDEX idx_room_type (room_type),
  INDEX idx_status (status),
  INDEX idx_price (price_per_month)
);

-- Table: bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  duration_months INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  outstanding_balance DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
  
  INDEX idx_user_id (user_id),
  INDEX idx_room_id (room_id),
  INDEX idx_status (status),
  INDEX idx_check_in (check_in_date),
  INDEX idx_created_at (created_at)
);

-- Table: shuttle_routes
CREATE TABLE shuttle_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_from VARCHAR(100) NOT NULL,
  route_to VARCHAR(100) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  price_per_seat DECIMAL(8, 2) NOT NULL,
  total_seats INT NOT NULL CHECK (total_seats > 0),
  driver_name VARCHAR(100),
  vehicle_type VARCHAR(100),
  frequency VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_route_from (route_from),
  INDEX idx_route_to (route_to),
  INDEX idx_departure_time (departure_time)
);

-- Table: shuttle_bookings
CREATE TABLE shuttle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  route_id UUID NOT NULL REFERENCES shuttle_routes(id),
  booking_date DATE NOT NULL,
  seats_booked INT NOT NULL CHECK (seats_booked > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES shuttle_routes(id) ON DELETE RESTRICT,
  
  INDEX idx_user_id (user_id),
  INDEX idx_route_id (route_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status)
);

-- Table: maintenance_requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  room_id UUID REFERENCES rooms(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('plumbing', 'electrical', 'furniture', 'cleaning', 'other')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  staff_response TEXT,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);

-- Table: payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'GHS',
  payment_method VARCHAR(100) NOT NULL CHECK (payment_method IN ('paystack', 'mobile_money')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_reference VARCHAR(255) UNIQUE,
  payment_type VARCHAR(100) NOT NULL CHECK (payment_type IN ('room_booking', 'other_fees')),
  reference_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  
  INDEX idx_user_id (user_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  INDEX idx_transaction_ref (transaction_reference),
  INDEX idx_created_at (created_at)
);

-- Table: invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  amount_due DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  
  INDEX idx_user_id (user_id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);

-- Table: feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category VARCHAR(100) NOT NULL CHECK (category IN ('room_quality', 'staff_service', 'amenities', 'food', 'cleanliness', 'other')),
  title VARCHAR(255) NOT NULL,
  feedback_text TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT FALSE,
  admin_response TEXT,
  admin_response_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'responded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Table: support_tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL CHECK (category IN ('technical', 'billing', 'facility', 'other')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id),
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  
  INDEX idx_user_id (user_id),
  INDEX idx_ticket_number (ticket_number),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at)
);

-- Table: ticket_messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  message_text TEXT NOT NULL,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at)
);

-- Table: otp_codes
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);

-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- Table: system_settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_setting_key (setting_key)
);

-- Table: audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- VIEWS
-- ============================================

-- View: user_booking_summary
CREATE VIEW user_booking_summary AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) as active_bookings,
  SUM(CASE WHEN b.status IN ('active', 'completed') THEN b.total_amount ELSE 0 END) as total_spent
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- View: room_occupancy_status
CREATE VIEW room_occupancy_status AS
SELECT 
  r.id,
  r.room_number,
  r.capacity,
  r.current_occupancy,
  ROUND(CAST(r.current_occupancy AS NUMERIC) / r.capacity * 100, 2) as occupancy_rate,
  COUNT(DISTINCT b.id) as active_bookings
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'active'
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.room_number, r.capacity, r.current_occupancy;

-- View: outstanding_payments
CREATE VIEW outstanding_payments AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  COALESCE(SUM(b.outstanding_balance), 0) as total_outstanding,
  COUNT(DISTINCT b.id) as bookings_with_balance
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id AND b.status IN ('active', 'completed') AND b.outstanding_balance > 0
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_user_room ON bookings(user_id, room_id);
CREATE INDEX idx_payments_user_booking ON payments(user_id, booking_id);
CREATE INDEX idx_maintenance_assigned ON maintenance_requests(assigned_to);
CREATE INDEX idx_shuttle_bookings_user_route ON shuttle_bookings(user_id, route_id);
CREATE INDEX idx_feedback_user_category ON feedback(user_id, category);
CREATE INDEX idx_tickets_user_assigned ON support_tickets(user_id, assigned_to);

-- Full-text search indexes
CREATE INDEX idx_rooms_search ON rooms USING GIN(to_tsvector('english', description || ' ' || COALESCE(features, '')));
CREATE INDEX idx_feedback_search ON feedback USING GIN(to_tsvector('english', title || ' ' || feedback_text));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: update_updated_at_timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: update users.updated_at
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger: update rooms.updated_at
CREATE TRIGGER trigger_rooms_updated_at
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger: update bookings.updated_at
CREATE TRIGGER trigger_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger: update payments.updated_at
CREATE TRIGGER trigger_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger: update maintenance_requests.updated_at
CREATE TRIGGER trigger_maintenance_updated_at
BEFORE UPDATE ON maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger: update feedback.updated_at
CREATE TRIGGER trigger_feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger: update support_tickets.updated_at
CREATE TRIGGER trigger_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default super admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified, email_verified_at, campus_id)
VALUES (
  'admin@jecaph.edu',
  '$2b$10$YourBcryptHashHere', -- bcrypt hash of 'admin123'
  'Admin',
  'User',
  'super_admin',
  'active',
  TRUE,
  CURRENT_TIMESTAMP,
  (SELECT id FROM campuses WHERE name = 'Takoradi Campus')
);

-- Insert sample admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified, email_verified_at, campus_id)
VALUES (
  'staff@jecaph.edu',
  '$2b$10$YourBcryptHashHere', -- bcrypt hash of 'staff123'
  'Staff',
  'Member',
  'admin',
  'active',
  TRUE,
  CURRENT_TIMESTAMP,
  (SELECT id FROM campuses WHERE name = 'Takoradi Campus')
);

-- Insert sample rooms
INSERT INTO rooms (room_number, room_type, capacity, price_per_month, status, amenities, description, features)
VALUES
  ('101', 'single', 1, 500.00, 'available', ARRAY['wifi', 'ac', 'desk', 'bed'], 'Single room on first floor', 'Spacious with window view'),
  ('102', 'single', 1, 500.00, 'available', ARRAY['wifi', 'ac', 'desk', 'bed'], 'Single room on first floor', 'Modern facilities'),
  ('201', 'shared', 2, 350.00, 'available', ARRAY['wifi', 'ac', 'desk'], 'Shared room on second floor', 'Two beds, shared facilities'),
  ('202', 'shared', 2, 350.00, 'available', ARRAY['wifi', 'ac', 'desk'], 'Shared room on second floor', 'Recently renovated'),
  ('301', 'suite', 3, 450.00, 'available', ARRAY['wifi', 'ac', 'desk', 'bathroom'], 'Suite on third floor', 'Private bathroom, three beds');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES
  ('app_name', 'JECAPH Hostel Management', 'string'),
  ('support_email', 'support@jecaph.edu', 'string'),
  ('support_phone', '+233 XXX XXXX XXX', 'string'),
  ('hostel_name', 'JECAPH Hostel', 'string'),
  ('semester_start_date', '2024-01-15', 'date'),
  ('semester_end_date', '2024-06-30', 'date'),
  ('base_monthly_fee', '500', 'number'),
  ('max_login_attempts', '5', 'number'),
  ('session_timeout_minutes', '60', 'number');

-- Insert campus seed data (only Takoradi operational)
INSERT INTO campuses (name, location, address, description, capacity, total_rooms, status)
VALUES (
  'Takoradi Campus',
  'Takoradi, Western Region',
  'KNUST Road, Takoradi',
  'Our main operational campus with modern facilities and excellent amenities',
  200,
  45,
  'active'
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify relationships
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
