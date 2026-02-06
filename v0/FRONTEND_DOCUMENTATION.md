# JECAPH Hostel Management System - Frontend Documentation

## Part 1: Application Overview

### 1.1 Application Details

**Application Name**: JECAPH Hostel Management System

**Purpose**: A comprehensive digital platform for managing hostel operations, enabling students to book rooms, arrange shuttles, track maintenance requests, manage payments, and provide feedback. Administrators can manage rooms, bookings, staff, payments, support tickets, and system settings.

**Core Value Proposition**: Streamlines hostel management through a centralized platform that eliminates manual processes, enables real-time booking and communication, and provides data-driven insights for hostel administrators.

### 1.2 User Types & Access Levels

1. **Public Users (Unauthenticated)**
   - Access: Landing page, login/signup pages
   - Actions: View hostel information, register, login

2. **Students (Authenticated Users)**
   - Access: Dashboard, rooms, bookings, shuttle, maintenance, payments, feedback, profile, support
   - Actions: Book rooms, arrange shuttles, submit maintenance requests, make payments, provide feedback, manage profile

3. **Administrators**
   - Access: Full admin dashboard with all management pages
   - Actions: Manage rooms, bookings, payments, support tickets, maintenance, users (limited)

4. **Super Administrators**
   - Access: All admin features + system settings
   - Actions: All admin actions + system configuration, user role management

---

## Part 2: Complete Page Inventory

### **Page 1: Landing Page**
**Route**: `/`
**Purpose**: Introduce JECAPH platform and encourage new users to sign up
**User Access**: Public (anyone can access)
**Authentication**: Not required

**Visual Layout**:
- Navigation bar with JECAPH logo (enlarged), nav links, login/signup buttons
- Hero section with gradient background, main headline, CTA button "Get Started"
- Features section: 6 feature cards with icons and descriptions
- How It Works section: 4-step process visualization
- Statistics section: Key metrics displayed on gradient background
- Testimonials section: Student reviews with ratings and avatars
- Call-to-action section: Final conversion push
- Footer: Contact info, company links, social media

**Interactive Elements**:
- "Get Started" button → redirects to signup page
- "Visit Official Website" button → opens external URL
- Navigation links → scroll to relevant sections or navigate to pages
- Logo → returns to home page
- Mobile hamburger menu → toggles mobile navigation

**Data Displayed**:
- Static content (no API calls)
- Features, testimonials, statistics hardcoded
- Logo image from `/images/gemini-generated-image-xi3fs6xi3fs6xi3f.png`

**User Actions**:
- Read platform information
- Click "Get Started" to register
- Click "Login" to access account
- Review testimonials and features

**Navigation Flow**:
- Landing page is entry point
- "Get Started" → Signup page
- "Login" → Login page
- Navigation links → Auth pages or external sites

**State Management**: None (static page)

---

### **Page 2: Authentication - Login**
**Route**: `/auth/login` (also accessible at `/login`)
**Purpose**: Allow registered students to sign into their accounts
**User Access**: Public (unauthenticated users only)
**Authentication**: Not required

**Visual Layout**:
- Split-panel design
- Left panel: Auth form section with "Welcome" heading, email/password inputs, login button, signup link, forgot password link
- Right panel: Branded illustration with JECAPH logo, info about recipient site, "Visit Official Website" button
- Animated gradient background on branded panel

**Interactive Elements**:
- Email input field with validation
- Password input field with visibility toggle button
- "Login" button → submits form, calls POST /api/auth/login
- "Sign Up" link → navigates to signup page
- "Forgot password?" link → navigates to password reset page
- Password visibility toggle → shows/hides password text
- Back arrow button (top-left) → navigates to home page

**Data Displayed**: None (form-based, no API data fetch)

**User Actions**:
- Enter email and password
- Click visibility toggle to show/hide password
- Submit login form
- Navigate to signup or forgot password pages

**Navigation Flow**:
- Users arrive from landing page "Login" button or signup confirmation
- On successful login → redirected to /dashboard
- On error → error toast notification shown, form remains
- "Sign Up" link → /auth/signup
- "Forgot password?" → /auth/forgot-password (not yet built)

**State Management**:
- Email and password form state (local component state)
- Loading state during login submission
- Error state for failed login

**Form Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Email | email | Yes | Valid email format | "Enter email" |
| Password | password | Yes | Min 6 characters | "Enter password" |

**Submit Button**:
- Text: "Login"
- Action: POST /api/auth/login with {email, password}
- Success: Redirect to /dashboard, store JWT token
- Error: Display error toast with API error message

---

### **Page 3: Authentication - Signup**
**Route**: `/auth/signup` (also accessible at `/signup`)
**Purpose**: Allow new students to create accounts
**User Access**: Public (unauthenticated users only)
**Authentication**: Not required

**Visual Layout**:
- Same split-panel design as login
- Left panel: Multi-field signup form with animated elements
- Right panel: Branded illustration with JECAPH logo
- Form includes name, email, password fields
- Real-time password strength indicator with color-coded strength levels

**Interactive Elements**:
- First name input field
- Last name input field
- Email input field with validation
- Password input field with visibility toggle
- Confirm password input field with visibility toggle
- Password strength meter (visual bar with text)
- Terms & conditions checkbox
- "Sign Up" button → submits form, calls POST /api/auth/register
- "Already have an account?" link → navigates to login page
- Back arrow button (top-left) → navigates to home page

**Data Displayed**: None (form-based)

**User Actions**:
- Enter personal information and credentials
- Watch password strength indicator update in real-time
- Check terms & conditions checkbox
- Submit signup form
- Navigate to login page if already have account

**Navigation Flow**:
- Users arrive from landing page "Get Started" button or login page
- On successful signup → redirected to /auth/verify-otp for email verification
- On error → error toast shown, form remains with data intact
- "Already have an account?" → /auth/login

**State Management**:
- Form fields (firstName, lastName, email, password, confirmPassword)
- Password strength calculation
- Form validation errors
- Loading state during submission
- Terms checkbox state

**Form Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| First Name | text | Yes | Min 2, Max 50 chars | "John" |
| Last Name | text | Yes | Min 2, Max 50 chars | "Doe" |
| Email | email | Yes | Valid email format | "john@example.com" |
| Password | password | Yes | Min 8 chars, 1 upper, 1 number, 1 special | "••••••••" |
| Confirm Password | password | Yes | Must match password | "••••••••" |
| Terms | checkbox | Yes | Must be checked | "" |

**Password Strength Indicator**:
- Weak: Red (0-2 criteria met)
- Fair: Orange (3 criteria met)
- Strong: Green (4-5 criteria met)
- Criteria: min 8 chars, uppercase, lowercase, number, special char

---

### **Page 4: Authentication - OTP Verification**
**Route**: `/auth/verify-otp`
**Purpose**: Verify student email address via OTP code
**User Access**: Only after signup (redirected here automatically)
**Authentication**: Not required (new user)

**Visual Layout**:
- Centered card with OTP verification form
- Heading: "Verify Your Email"
- Explanation text about OTP
- OTP input fields (6 separate single-digit inputs)
- "Send Code" button
- Timer showing OTP expiration countdown
- Resend link (shown after initial attempt)
- Back button to go back

**Interactive Elements**:
- OTP input fields (auto-focus next field on digit entry)
- Keyboard support for digit entry
- "Verify" button → submits OTP, calls POST /api/auth/verify-otp
- "Resend Code" link → calls POST /api/auth/resend-otp
- Countdown timer for OTP expiration
- Back button → returns to previous page

**Data Displayed**: None (form-based)

**User Actions**:
- Receive OTP via email
- Enter 6-digit OTP code
- Click verify to confirm email
- Click resend if code expired
- Go back if needed

**Navigation Flow**:
- Automatically redirected here after successful signup
- On successful verification → redirected to /dashboard
- On error → error message shown, form cleared, user can resend
- "Resend Code" → sends new OTP via email

**State Management**:
- OTP form fields (6 digits)
- OTP submitted flag (prevents double submission)
- Countdown timer state
- Resend available flag
- Error messages

---

### **Page 5: Student Dashboard**
**Route**: `/dashboard`
**Purpose**: Main hub for students with quick stats and action cards
**User Access**: Authenticated students only
**Authentication**: JWT token required

**Visual Layout**:
- Top navigation bar with JECAPH logo, nav links, profile dropdown, logout
- Sidebar navigation with menu items (Dashboard, Rooms, Bookings, Shuttle, Maintenance, Payments, Feedback, Support, Profile, Logout)
- Main content area:
  - Welcome message with student name
  - Statistics cards: Active Bookings, Pending Payments, Maintenance Requests, Support Tickets
  - Announcement banner
  - Quick action cards: Browse Rooms, Book Shuttle, Request Maintenance, Make Payment
  - Recent activity section
  - Bookings chart (upcoming vs past)

**Interactive Elements**:
- Sidebar toggle on mobile
- Navigation items → navigate to respective pages
- Profile dropdown → view profile or logout
- "Browse Rooms" button → navigate to /dashboard/rooms
- "Book Shuttle" button → navigate to /dashboard/shuttle
- "Request Maintenance" button → navigate to /dashboard/maintenance
- "Make Payment" button → navigate to /dashboard/payments
- Recent activity list

**Data Displayed**:
- User name from GET /api/users/me
- Dashboard stats from GET /api/dashboard/stats
- Recent activity from GET /api/dashboard/activity
- Bookings for chart from GET /api/bookings?status=active

**User Actions**:
- View dashboard overview
- Navigate to different sections
- Access profile settings
- Logout

**Navigation Flow**:
- Landing page on login success
- Can navigate to any authenticated page via sidebar
- Logout → redirected to login page

**State Management**:
- User data (name, email, profile picture)
- Dashboard stats
- Loading states for data fetch
- Active tab/section tracking

---

### **Page 6: Student - Room Booking**
**Route**: `/dashboard/rooms`
**Purpose**: Browse available hostel rooms and make bookings
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Header with filters and search
- Search input field
- Filter dropdowns: Room Type, Price Range, Amenities, Occupancy
- Sort dropdown: Price (Low-High, High-Low), Rating, Newest
- View toggle buttons: Grid view, List view
- Room listings:
  - Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
  - List: Full-width rows with room details
- Room card contains: Image, name, type, price, occupancy, rating, amenities, "Book Now" button

**Interactive Elements**:
- Search input → filters rooms by name/description (live)
- Filter dropdowns → apply filters to list
- Sort dropdown → changes room order
- View toggle → switches between grid/list
- "Book Now" button → opens booking modal or navigates to booking page
- Room card → expands to show more details or navigates to room detail page
- Pagination controls (if list is long)

**Data Displayed**:
- Available rooms from GET /api/rooms?filters=...&sort=...
- Room count, average rating displayed
- Room images, details, pricing
- Occupancy status (available beds count)

**User Actions**:
- Search for rooms by keyword
- Filter by room type, price, amenities
- Sort by different criteria
- Toggle between grid/list view
- Click room to see details
- Click "Book Now" to initiate booking
- View pagination and navigate pages

**Navigation Flow**:
- Sidebar link → /dashboard/rooms
- "Book Now" → modal opens or /dashboard/bookings page
- Room details → can view full room info before booking

**State Management**:
- Search query
- Applied filters object
- Sort order
- Current view mode (grid/list)
- Current page number
- Room list data
- Loading and error states

**Filters Available**:
| Filter | Type | Options |
|--------|------|---------|
| Room Type | Select | Single, Shared, Suite, Dormitory |
| Price Range | Slider | 0-10000 GHS |
| Amenities | Multi-select | WiFi, AC, Hot Water, Study Desk, Balcony |
| Occupancy | Select | Available, Partially Full, Full |

---

### **Page 7: Student - Room Bookings**
**Route**: `/dashboard/bookings`
**Purpose**: View and manage room bookings
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Tabs: Active Bookings, Pending, Completed, Cancelled
- Booking cards displaying:
  - Room name and image
  - Check-in and check-out dates
  - Booking status with color-coded badge
  - Booking reference number
  - Total amount paid
  - Action buttons: View Details, Cancel, Extend (if applicable)
- No bookings empty state with "Browse Rooms" CTA

**Interactive Elements**:
- Tab buttons → filter bookings by status
- "View Details" button → shows booking details in modal
- "Cancel Booking" button → opens confirmation dialog, calls DELETE /api/bookings/:id
- "Extend Booking" button → opens date picker modal
- Booking card → can click to expand details
- Refresh button → re-fetches latest bookings

**Data Displayed**:
- Student's bookings from GET /api/bookings?status=...
- Booking details: room, dates, price, status
- Transaction references
- Cancellation policies and rules

**User Actions**:
- View all bookings across different statuses
- Filter by booking status
- View detailed booking information
- Cancel active bookings (if permitted)
- Extend booking duration
- See cancellation policies

**Navigation Flow**:
- Sidebar link → /dashboard/bookings
- "View Details" → modal opens with full booking info
- Can navigate back to rooms to make new booking

**State Management**:
- Active tab (status filter)
- Bookings list
- Selected booking for modal display
- Loading states
- Error messages

---

### **Page 8: Student - Shuttle Booking**
**Route**: `/dashboard/shuttle`
**Purpose**: Browse and book shuttle routes
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Available routes section:
  - Route cards showing: Departure location, arrival location, departure time, available seats, price
  - Seat availability indicator (e.g., "5 seats left")
  - "Book Ride" button on each route
- My Shuttle Bookings section:
  - Booked rides with QR code, booking reference, status
  - Cancellation buttons
  - Pickup time and location details
- Empty state if no rides available

**Interactive Elements**:
- "Book Ride" button → opens booking confirmation modal
- Confirm button in modal → calls POST /api/shuttle/book
- "Cancel Ride" button → opens cancellation confirmation, calls DELETE /api/shuttle/bookings/:id
- QR code display → scannable for check-in
- Booking reference → copyable
- View details → expands booking information

**Data Displayed**:
- Available routes from GET /api/shuttle/routes
- Seat availability for each route
- Student's bookings from GET /api/shuttle/bookings
- QR code generated for booking
- Price per seat

**User Actions**:
- View available shuttle routes
- See available seats on each route
- Book a shuttle ride (select seats if applicable)
- View bookings and details
- Cancel bookings
- View and share QR code for check-in

**Navigation Flow**:
- Sidebar link → /dashboard/shuttle
- Book ride → confirmation modal → API call → success message
- Can go back to continue exploring

**State Management**:
- Available routes list
- User bookings list
- Selected route for booking
- Loading and error states
- Booking confirmation state

---

### **Page 9: Student - Maintenance Requests**
**Route**: `/dashboard/maintenance`
**Purpose**: Submit and track maintenance requests
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Submission form section:
  - Title/description field
  - Category dropdown (Plumbing, Electrical, Furniture, Cleaning, Other)
  - Priority dropdown (Low, Medium, High, Urgent)
  - Attachment field (upload images/documents)
  - "Submit Request" button
- Submitted requests section:
  - Filters: Status (New, In Progress, Completed)
  - Request cards showing: ID, category, priority, description, date, status, staff response
  - Status badge with color coding
  - Admin response text
  - Feedback button (once completed)

**Interactive Elements**:
- Form inputs → capture maintenance request details
- Category and priority dropdowns
- File upload → select and upload images
- "Submit Request" button → calls POST /api/maintenance/submit
- Status filter tabs → filter by request status
- Feedback button → opens feedback form
- Request card → expands to show full details and response

**Data Displayed**:
- Form fields (empty initially)
- Submitted requests from GET /api/maintenance/requests
- Request details: ID, category, priority, description, status
- Admin responses/notes
- Timestamps

**User Actions**:
- Fill out maintenance request form
- Select category and priority
- Upload supporting images/documents
- Submit request
- View submitted requests
- Filter by status
- View admin responses
- Provide feedback once completed
- Cancel requests (if status allows)

**Navigation Flow**:
- Sidebar link → /dashboard/maintenance
- Submit form → API call → success toast and form reset
- Can continue submitting more requests
- View list updates automatically

**State Management**:
- Form fields (title, category, priority, attachment)
- Submitted requests list
- Active status filter
- Loading states
- Success/error messages
- File upload progress

**Form Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Title | text | Yes | Min 5, Max 100 chars |
| Category | select | Yes | One of predefined options |
| Priority | select | Yes | Low, Medium, High, Urgent |
| Description | textarea | Yes | Min 10, Max 500 chars |
| Attachment | file | No | jpg, png, pdf, max 5MB |

---

### **Page 10: Student - Payments**
**Route**: `/dashboard/payments`
**Purpose**: Manage hostel fees and payments
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Summary section:
  - Outstanding balance
  - Total paid this semester
  - Next payment due date
  - Payment status indicator
- Payment initiation section:
  - Amount input field
  - Payment method selection (Paystack/Mobile Money)
  - "Pay Now" button
- Payment history section:
  - Table with: Date, Reference, Amount, Method, Status
  - Receipt download buttons
  - Filter by status
  - Pagination

**Interactive Elements**:
- Amount input → specify payment amount
- Payment method selection → choose payment gateway
- "Pay Now" button → calls POST /api/payments/initialize, redirects to payment gateway
- Receipt button → downloads/views invoice
- Status filter → shows only specific payment statuses
- Pagination controls

**Data Displayed**:
- Account balance from GET /api/payments/balance
- Payment history from GET /api/payments/history
- Transaction receipts with details
- Invoice documents

**User Actions**:
- View outstanding balance
- Initiate payment with custom amount
- Select payment method
- Make payment (redirected to payment gateway)
- View payment history
- Download receipts
- Track payment status

**Navigation Flow**:
- Sidebar link → /dashboard/payments
- "Pay Now" → POST /api/payments/initialize → redirect to Paystack
- After payment → webhook verification → back to dashboard
- Can view history and download receipts

**State Management**:
- Outstanding balance
- Payment amount input
- Selected payment method
- Payment history list
- Payment status filter
- Loading states
- Payment confirmation state

---

### **Page 11: Student - Feedback**
**Route**: `/dashboard/feedback`
**Purpose**: Provide feedback and ratings about hostel services
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Feedback submission form:
  - Starred rating (1-5 stars)
  - Category dropdown (Room Quality, Staff Service, Amenities, Food, Cleanliness, Other)
  - Title field
  - Detailed feedback textarea
  - "Submit Feedback" button
  - Anonymous submission checkbox
- Submitted feedback list:
  - Cards showing: Category, title, rating, submission date, admin response (if any)
  - Response from hostel staff
  - Edit/delete buttons (if own feedback)

**Interactive Elements**:
- Star rating input → click to select rating (1-5)
- Category dropdown
- Title and feedback text inputs
- "Submit Feedback" button → calls POST /api/feedback/submit
- Anonymous checkbox → toggles submission visibility
- Edit button (own feedback) → opens edit form
- Delete button (own feedback) → opens confirmation
- Feedback cards → expand to show full response

**Data Displayed**:
- Form fields (empty initially)
- Submitted feedback list from GET /api/feedback/my-feedback
- Admin responses to feedback
- Submission dates and ratings

**User Actions**:
- Rate services (1-5 stars)
- Select feedback category
- Write feedback title and description
- Choose anonymous submission option
- Submit feedback
- View feedback history
- View staff responses to feedback
- Edit own feedback
- Delete own feedback

**Navigation Flow**:
- Sidebar link → /dashboard/feedback
- Submit form → API call → success notification and form reset
- View feedback list updates
- Can edit/delete own feedback via action buttons

**State Management**:
- Form fields (rating, category, title, feedback, anonymous flag)
- Feedback list
- Selected feedback for editing
- Loading states
- Success/error messages
- Edit mode flag

**Form Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Rating | star select | Yes | 1-5 stars |
| Category | select | Yes | Predefined options |
| Title | text | Yes | Min 5, Max 100 chars |
| Feedback | textarea | Yes | Min 10, Max 1000 chars |
| Anonymous | checkbox | No | Default false |

---

### **Page 12: Student - Support**
**Route**: `/dashboard/support`
**Purpose**: Get help through support tickets and FAQ
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Quick contact section:
  - Contact cards: Phone, Email, Live Chat with availability status
- Support tickets section:
  - New ticket form: Category, priority, subject, description, file upload
  - "Submit Ticket" button
- My tickets list:
  - Filter tabs: Open, In Progress, Closed, All
  - Ticket cards: ID, subject, category, priority, status, last updated date
  - "View Details" button
  - Status badges with color coding
- FAQ section:
  - Expandable accordion with common questions
  - Questions organized by category
  - Search FAQ functionality

**Interactive Elements**:
- Contact buttons (Phone, Email, Live Chat) → trigger respective actions
- Form inputs for new ticket
- "Submit Ticket" button → calls POST /api/support/tickets
- Status filter tabs → filters ticket list
- "View Details" button → shows ticket details modal with chat history
- FAQ question accordion → expands to show answer
- FAQ search → filters questions

**Data Displayed**:
- Contact information
- Support ticket form fields
- User's tickets from GET /api/support/tickets?status=...
- Ticket details and support team responses
- FAQ list with questions and answers

**User Actions**:
- View contact options
- Submit new support ticket
- View ticket history and status
- Filter tickets by status
- View ticket details and responses
- Chat with support team (if live chat integrated)
- Search and read FAQ

**Navigation Flow**:
- Sidebar link → /dashboard/support
- Submit ticket → success message and form reset
- View details → modal opens with full ticket info
- FAQ → accordion expands/collapses

**State Management**:
- Ticket form fields
- Tickets list
- Selected status filter
- Selected ticket for detail view
- Loading and error states
- FAQ search query

**Form Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Category | select | Yes | Predefined options |
| Priority | select | Yes | Low, Medium, High |
| Subject | text | Yes | Min 5, Max 100 chars |
| Description | textarea | Yes | Min 10, Max 1000 chars |
| Attachment | file | No | jpg, png, pdf, max 5MB |

---

### **Page 13: Student - Profile**
**Route**: `/dashboard/profile`
**Purpose**: Manage account settings and personal information
**User Access**: Authenticated students
**Authentication**: JWT token required

**Visual Layout**:
- Tabs: Personal Info, Account Settings, Security, Notification Preferences
- Personal Info tab:
  - Profile picture upload
  - Name fields
  - Email display
  - Phone field
  - Emergency contact fields
  - "Save Changes" button
- Account Settings tab:
  - Student ID
  - Program/Course field
  - Hostel assignment
  - Account status
  - Theme preference (light/dark)
  - Language preference
- Security tab:
  - Current password verification
  - Change password form
  - Two-factor authentication toggle
  - Login history table
  - Active sessions with option to log out
- Notification Preferences tab:
  - Toggle for: Email notifications, SMS notifications, Push notifications
  - Notification type checkboxes: Booking confirmations, Maintenance updates, Payment reminders, Support responses, Hostel announcements

**Interactive Elements**:
- Profile picture upload → triggers file dialog, calls POST /api/users/upload-profile-picture
- Form fields → edit personal info
- "Save Changes" button → calls PUT /api/users/me
- Password change form → calls PUT /api/users/me/password
- 2FA toggle → enables/disables two-factor auth
- "Log out all sessions" button → logs out from all devices
- Notification toggles → updates preferences via PUT /api/users/me/preferences
- Delete account button → opens confirmation dialog (if implemented)

**Data Displayed**:
- User profile from GET /api/users/me
- Login history from GET /api/users/me/login-history
- Current notification preferences
- Security settings status

**User Actions**:
- Update profile picture
- Edit personal information
- Change password
- Enable/disable 2FA
- View login history
- Manage active sessions
- Configure notification preferences
- Manage theme and language settings

**Navigation Flow**:
- Sidebar link → /dashboard/profile
- Can switch between tabs
- All changes saved to backend
- Success notifications on save

**State Management**:
- Active tab
- Profile form fields
- Password change form fields
- Notification preferences
- Loading states during save
- Success/error messages
- Edit mode flags

**Form Fields** (Personal Info):
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| First Name | text | Yes | Min 2, Max 50 chars |
| Last Name | text | Yes | Min 2, Max 50 chars |
| Phone | tel | No | Valid phone format |
| Emergency Contact | text | No | Valid phone number |
| Program | text | No | Max 100 chars |

---

### **Page 14: Admin Login**
**Route**: `/admin/login`
**Purpose**: Authenticate administrators to access admin dashboard
**User Access**: Public (but should show admin warning)
**Authentication**: Not required

**Visual Layout**:
- Similar to student login but with "Admin Portal" branding
- Email and password input fields
- "Admin Login" button
- Warning/info about admin access
- Back to home link

**Interactive Elements**:
- Email input field
- Password input field with visibility toggle
- "Admin Login" button → calls POST /api/auth/admin-login
- "Back to Home" link → navigates to home page
- Visibility toggle → shows/hides password

**Data Displayed**: None (form-based)

**User Actions**:
- Enter admin credentials
- Submit login form
- Return to home if not an admin

**Navigation Flow**:
- Direct URL access to /admin/login
- On successful login → redirected to /admin/dashboard
- Invalid credentials → error message shown
- "Back to Home" → navigates to /

**State Management**:
- Email and password form fields
- Loading state during submission
- Error state for failed login

---

### **Page 15: Admin Dashboard**
**Route**: `/admin/dashboard`
**Purpose**: Main hub for administrators with system overview
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Top navigation bar with admin icon, admin name, notifications, logout
- Sidebar with admin menu items (Dashboard, Rooms, Bookings, Maintenance, Payments, Feedback, Support, Settings)
- Main content area:
  - Key metrics cards: Total Users, Total Revenue, Active Bookings, Pending Maintenance
  - Revenue chart (line/bar graph)
  - Occupancy rate chart
  - Recent bookings table
  - Recent support tickets
  - System alerts/announcements

**Interactive Elements**:
- Sidebar links → navigate to admin pages
- Admin dropdown → profile, settings, logout
- Navigation items → jump to different admin sections
- Chart controls → zoom, export, refresh
- Table rows → click to see details
- Refresh buttons → reload data

**Data Displayed**:
- Dashboard statistics from GET /api/admin/statistics
- Charts data from GET /api/admin/analytics
- Recent activity from GET /api/admin/recent-activity
- System alerts from GET /api/admin/alerts

**User Actions**:
- View system overview and key metrics
- Monitor revenue and occupancy
- View recent activities
- Access different admin sections
- Logout

**Navigation Flow**:
- Navigated after admin login
- Sidebar allows access to all admin pages
- Logout → redirected to admin login

**State Management**:
- Dashboard data (statistics, charts, activity)
- Active admin menu item
- Loading states
- Refresh intervals

---

### **Page 16: Admin - Manage Rooms**
**Route**: `/admin/dashboard/rooms`
**Purpose**: Create, read, update, and delete hostel rooms
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Header with filters, search, and "Add New Room" button
- Room list table:
  - Columns: Room Number, Type, Capacity, Current Occupancy, Price/Month, Status, Actions
  - Sortable columns
  - Pagination
- Room card view option (grid)
- No rooms empty state

**Interactive Elements**:
- "Add New Room" button → opens room creation modal/form
- Search input → filters rooms by number, type
- Filter dropdowns: Type, Status, Availability
- Sort dropdown → change sort order
- Room row → click to expand or edit
- Edit button → opens edit form modal
- Delete button → opens confirmation dialog
- Status toggle → changes room status
- Pagination controls

**Data Displayed**:
- All rooms from GET /api/admin/rooms
- Room details: number, type, capacity, current occupancy, price
- Room status (available, occupied, maintenance)
- Occupancy percentages

**User Actions**:
- View all rooms with details
- Filter and search rooms
- Create new room entry
- Edit room information
- Delete rooms
- Change room status
- View occupancy statistics
- Export room list

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/rooms
- Add/Edit room → modal/form → success → list updates
- Can manage all room operations

**State Management**:
- Rooms list
- Search query
- Applied filters
- Sort order
- Current page
- Selected room for editing
- Form state for create/edit
- Loading states

**Form Fields** (Create/Edit Room):
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Room Number | text | Yes | Unique, max 20 chars |
| Room Type | select | Yes | Single, Shared, Suite, etc. |
| Capacity | number | Yes | 1-10 |
| Price per Month | number | Yes | Positive number |
| Amenities | multi-select | No | Predefined options |
| Status | select | Yes | Available, Occupied, Maintenance |
| Description | textarea | No | Max 500 chars |

---

### **Page 17: Admin - Manage Bookings**
**Route**: `/admin/dashboard/bookings`
**Purpose**: View, approve, and manage student room bookings
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Header with filters, search
- Booking list table:
  - Columns: Booking ID, Student Name, Room, Check-in, Check-out, Duration, Amount, Status, Actions
  - Sortable columns
  - Pagination
- Filter tabs: All, Pending, Approved, Rejected, Completed, Cancelled
- Booking status legend

**Interactive Elements**:
- Search input → filters by booking ID, student name
- Filter tabs → filters by booking status
- Status filter dropdown → additional filtering
- Date range picker → filter by dates
- Booking row → click to view details modal
- Approve button → changes status to approved, calls PUT /api/admin/bookings/:id/approve
- Reject button → opens reason dialog, calls PUT /api/admin/bookings/:id/reject
- Cancel button → cancels booking, calls DELETE /api/admin/bookings/:id
- Export button → exports table to CSV/Excel
- Pagination controls

**Data Displayed**:
- All bookings from GET /api/admin/bookings?filters=...
- Booking details: ID, student, room, dates, duration, amount, status
- Student contact information
- Payment status

**User Actions**:
- View all bookings
- Filter by status, date range, student
- View booking details
- Approve pending bookings
- Reject bookings with reason
- Cancel bookings if needed
- Export booking data
- Track booking lifecycle

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/bookings
- Manage bookings and approve/reject as needed
- View details → modal opens
- All changes persist to database

**State Management**:
- Bookings list
- Active status filter
- Search query
- Date range filter
- Current page
- Selected booking for detail view
- Approval/rejection form state
- Loading states

---

### **Page 18: Admin - Manage Maintenance**
**Route**: `/admin/dashboard/maintenance`
**Purpose**: Track and manage student maintenance requests
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Header with status filter, search, assignment options
- Maintenance request list table:
  - Columns: Request ID, Student, Room, Category, Priority, Status, Date Submitted, Actions
  - Color-coded priority badges
  - Status badges
  - Sortable columns
  - Pagination
- Status tabs: All, New, In Progress, Completed, Cancelled

**Interactive Elements**:
- Search input → filters by request ID, student, room
- Status filter tabs → filters by request status
- Priority filter dropdown
- Request row → click to expand/view details
- "View Details" button → opens modal with full request info
- "Assign Staff" button → opens staff assignment modal
- "Update Status" dropdown → changes request status (calls PUT /api/admin/maintenance/:id/status)
- "Add Response" button → opens response form for replying to request
- "Close Request" button → marks as completed
- Pagination controls

**Data Displayed**:
- Maintenance requests from GET /api/admin/maintenance
- Request details: ID, student, room, category, priority, status, date
- Student contact info
- Request description and attachments
- Staff responses and timeline

**User Actions**:
- View all maintenance requests
- Filter by status and priority
- View request details and attachments
- Assign requests to maintenance staff
- Update request status
- Provide responses to students
- Close completed requests
- Track request timeline

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/maintenance
- View/manage requests as they come in
- Assign, respond, update status
- Close when completed

**State Management**:
- Requests list
- Active status filter
- Search query
- Priority filter
- Current page
- Selected request for details/editing
- Response form state
- Staff assignment form state
- Loading states

---

### **Page 19: Admin - Payment Tracking**
**Route**: `/admin/dashboard/payments`
**Purpose**: Monitor and manage student payments
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Summary section:
  - Total revenue this month
  - Outstanding payments
  - Payment rate (percentage of students who paid)
  - Average payment amount
- Charts section:
  - Monthly revenue trend (line chart)
  - Payment methods breakdown (pie chart)
  - Top rooms by revenue
- Payment transactions table:
  - Columns: Transaction ID, Student, Amount, Method, Status, Date, Actions
  - Filter and search options
  - Pagination
- Status filters: All, Pending, Completed, Failed, Refunded

**Interactive Elements**:
- Date range picker → filters transactions by date
- Status filter tabs → filters by payment status
- Student search → filters by student name/ID
- Transaction row → click to view receipt
- Export button → exports to CSV/Excel
- Chart controls → zoom, refresh
- Refund button (on failed/disputed payments) → opens refund dialog
- Pagination controls

**Data Displayed**:
- Payment summary from GET /api/admin/payments/summary
- Payment transactions from GET /api/admin/payments/transactions
- Charts data from GET /api/admin/payments/analytics
- Transaction receipts and invoices
- Payment method breakdown

**User Actions**:
- View payment overview and metrics
- Analyze revenue trends
- View payment transactions
- Filter by status, date, student
- View transaction details and receipts
- Process refunds (if applicable)
- Export payment reports
- Track outstanding payments

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/payments
- Monitor payment status and revenue
- Process refunds or updates as needed

**State Management**:
- Summary statistics
- Transactions list
- Date range filter
- Status filter
- Search query
- Current page
- Selected transaction for detail view
- Chart data and options
- Loading states

---

### **Page 20: Admin - Feedback & Reports**
**Route**: `/admin/dashboard/feedback`
**Purpose**: Review student feedback and manage reports
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Summary section:
  - Average rating
  - Total feedback count
  - Feedback breakdown by rating (1-5 stars)
  - Category breakdown
- Feedback list:
  - Feedback cards showing: Student, category, rating, date, preview of text
  - Status indicators (Responded/Pending Response)
  - Read/unread flags
- Rating distribution chart
- Feedback category breakdown chart

**Interactive Elements**:
- Filter tabs: All, Positive (4-5 stars), Neutral (3 stars), Negative (1-2 stars), Pending Response
- Category filter dropdown
- Date range picker
- Search input → filters by student name, feedback text
- Feedback card → click to expand full feedback
- "Reply" button → opens response form
- "Mark as Read" checkbox
- "Flag as Important" button
- Export reports button → exports feedback summary to PDF/CSV
- Pagination controls

**Data Displayed**:
- Feedback list from GET /api/admin/feedback
- Feedback details: rating, category, date, student, text
- Admin responses (if any)
- Feedback statistics and distribution
- Charts for rating breakdown

**User Actions**:
- View all student feedback
- Filter by rating, category, date
- Read full feedback text
- Reply to feedback to acknowledge/respond
- Mark feedback as read
- Flag important feedback for follow-up
- Export feedback reports
- Analyze feedback trends

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/feedback
- Review feedback and respond as needed
- Export reports for management review

**State Management**:
- Feedback list
- Rating filter
- Category filter
- Date range filter
- Search query
- Current page
- Selected feedback for detail/reply
- Reply form state
- Chart data
- Loading states

---

### **Page 21: Admin - Support Tickets**
**Route**: `/admin/dashboard/support`
**Purpose**: Manage student support tickets and live chat
**User Access**: Admin and Super Admin only
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Support ticket list:
  - Columns: Ticket ID, Student, Subject, Category, Priority, Status, Last Updated, Actions
  - Status badges with color coding
  - Priority badges
  - Filter and search options
  - Pagination
- Status tabs: All, Open, In Progress, Resolved, Closed
- Ticket detail modal with:
  - Full ticket information
  - Chat history between student and support
  - Message input for responding
  - Ticket status and assignment
  - Action buttons

**Interactive Elements**:
- Search input → filters by ticket ID, student, subject
- Status filter tabs → filters by ticket status
- Priority filter dropdown
- Assign To dropdown → assigns ticket to support staff
- Ticket row → click to open detail modal
- In modal: Message input → type response
- "Send" button → posts response, calls POST /api/admin/support/tickets/:id/message
- "Close Ticket" button → closes ticket, calls PUT /api/admin/support/tickets/:id/close
- "Reassign" button → changes assigned staff
- Pagination controls

**Data Displayed**:
- Support tickets from GET /api/admin/support/tickets
- Ticket details and chat history from GET /api/admin/support/tickets/:id
- Student information and contact details
- Ticket timeline and responses
- Assignment information

**User Actions**:
- View all support tickets
- Filter by status, priority, category
- View ticket details and full conversation
- Reply to tickets with messages
- Assign tickets to staff members
- Close resolved tickets
- Track ticket resolution time
- Monitor support performance

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/support
- Click ticket to open detail modal
- Reply to student messages
- Close when resolved

**State Management**:
- Tickets list
- Status filter
- Priority filter
- Search query
- Current page
- Selected ticket for detail view
- Message list for selected ticket
- Reply message input
- Loading states

---

### **Page 22: Admin - Settings**
**Route**: `/admin/dashboard/settings`
**Purpose**: Configure system settings and hostel parameters
**User Access**: Super Admin only (full access), Admin (limited access)
**Authentication**: JWT token with admin role required

**Visual Layout**:
- Settings tabs: General, Hostel Configuration, Notifications, Security, System Logs

**General Tab**:
- App name (editable)
- System email address
- Support contact information
- Hostel address and location

**Hostel Configuration Tab**:
- Hostel name
- Total rooms count
- Semester dates (start/end)
- Room categories and pricing
- Base monthly fee

**Notifications Tab**:
- Email notification settings
- SMS notification settings
- Email templates
- Notification schedule preferences

**Security Tab**:
- Password policy requirements
- Two-factor authentication settings
- Session timeout duration
- Login attempt limits
- IP whitelist/blacklist

**System Logs Tab**:
- System activity log viewer
- Log level filter (Info, Warning, Error)
- Date range filter
- Search log entries
- Export logs

**Interactive Elements**:
- Form inputs on each tab → edit settings
- "Save Changes" button → saves settings via PUT /api/admin/settings
- Email template buttons → preview/edit templates
- Notification toggles → enable/disable notifications
- Log export button → downloads logs
- Clear logs button → deletes old logs
- Test email button → sends test email
- Pagination in logs table

**Data Displayed**:
- Current settings from GET /api/admin/settings
- Hostel configuration
- Notification preferences
- Security policies
- System logs from GET /api/admin/logs

**User Actions**:
- Update hostel configuration
- Manage notification preferences and templates
- Configure security policies
- View system activity logs
- Export logs for audit
- Test email system
- Save all changes

**Navigation Flow**:
- Admin sidebar → /admin/dashboard/settings
- Switch between settings tabs
- Make changes and save
- Logout may be required if critical settings changed

**State Management**:
- Active settings tab
- Form fields for each tab
- Settings data from API
- Unsaved changes flag
- Loading states during save
- Success/error messages
- Logs list and filter state

**Form Fields** (General Settings):
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| App Name | text | Yes | Max 100 chars |
| Support Email | email | Yes | Valid email |
| Support Phone | tel | No | Valid phone |
| Hostel Address | textarea | Yes | Max 200 chars |

---

## Part 3: Complete Component Architecture

### Reusable Components

**Component: Button**
- **Purpose**: Versatile button for actions
- **Props**: variant, size, disabled, onClick, children, className
- **Used In**: All pages (navigation, forms, actions)
- **Variants**: default, destructive, outline, secondary, ghost, link, hero, heroOutline, gold

**Component: Card**
- **Purpose**: Container for content with consistent styling
- **Props**: children, className, onClick
- **Used In**: Dashboard, rooms, feedback, testimonials
- **Features**: Hover effects, animations

**Component: Modal/Dialog**
- **Purpose**: Display confirmation or detailed information
- **Props**: isOpen, onClose, title, children, actions
- **Used In**: Room booking, feedback, support tickets, deletions
- **Features**: Overlay, close button, action buttons

**Component: Table**
- **Purpose**: Display tabular data with sorting and pagination
- **Props**: columns, data, sortable, pagination, onSort, onPageChange
- **Used In**: Admin pages (bookings, payments, maintenance)
- **Features**: Sortable columns, pagination, filtering

**Component: Sidebar Navigation**
- **Purpose**: Main navigation for authenticated users
- **Props**: items, activeItem, onItemClick
- **Used In**: Dashboard and admin pages
- **Features**: Active state highlighting, mobile toggle

**Component: TopNav**
- **Purpose**: Top navigation bar with user profile
- **Props**: title, user, notifications, onLogout
- **Used In**: Dashboard and admin pages
- **Features**: Profile dropdown, notifications bell

**Component: Form Input**
- **Purpose**: Reusable form input with validation
- **Props**: label, type, value, onChange, error, required, placeholder
- **Used In**: All forms (login, signup, profiles, rooms, etc.)
- **Features**: Error display, validation indicators

**Component: Select Dropdown**
- **Purpose**: Reusable select/dropdown input
- **Props**: options, value, onChange, label, multiple
- **Used In**: Filters, category selection, status changes
- **Features**: Search, multi-select support

**Component: DatePicker**
- **Purpose**: Date selection component
- **Props**: value, onChange, minDate, maxDate, range (single or range)
- **Used In**: Booking dates, date filters, semester dates
- **Features**: Calendar view, date range selection

**Component: Toast Notification**
- **Purpose**: Display temporary notifications
- **Props**: message, type (success/error/info/warning), duration, onClose
- **Used In**: Success/error confirmations across all pages
- **Features**: Auto-dismiss, queue multiple toasts

**Component: Loading Skeleton**
- **Purpose**: Placeholder while content loads
- **Props**: width, height, count
- **Used In**: All data-fetching pages (rooms, bookings, admin pages)
- **Features**: Shimmer animation, responsive sizing

**Component: EmptyState**
- **Purpose**: Display when no data available
- **Props**: icon, title, message, actionButton
- **Used In**: Rooms (no results), bookings (no bookings), feedback
- **Features**: Helpful message with action CTA

**Component: Pagination**
- **Purpose**: Navigate through paginated data
- **Props**: currentPage, totalPages, onPageChange, itemsPerPage
- **Used In**: All listing pages (rooms, bookings, admin pages)
- **Features**: Previous/Next buttons, page numbers

**Component: RoomCard**
- **Purpose**: Display room information in grid/list
- **Props**: room, onBook, viewMode (grid/list)
- **Used In**: Room booking page
- **Features**: Image, amenities, rating, price, availability

**Component: QuickActionCard**
- **Purpose**: Quick action buttons on dashboard
- **Props**: icon, title, description, onClick, color
- **Used In**: Student dashboard
- **Features**: Hover animations, color variants

**Component: StatCard**
- **Purpose**: Display key metrics
- **Props**: icon, label, value, trend (up/down), trendValue
- **Used In**: Dashboards (student, admin)
- **Features**: Icon, trending indicators, animations

**Component: StatusBadge**
- **Purpose**: Display status with color coding
- **Props**: status, variant (small/medium/large)
- **Used In**: Bookings, payments, maintenance, support tickets
- **Features**: Color-coded by status type

**Component: RatingDisplay**
- **Purpose**: Show star ratings
- **Props**: rating, maxRating, size, showLabel
- **Used In**: Room listings, feedback, testimonials
- **Features**: Visual stars, optional label

**Component: PasswordStrengthMeter**
- **Purpose**: Display password strength feedback
- **Props**: password, showLabel
- **Used In**: Signup form
- **Features**: Color-coded strength, criteria checklist

**Component: FileUpload**
- **Purpose**: Handle file uploads
- **Props**: onFileSelect, acceptTypes, maxSize, multiple
- **Used In**: Profile picture, maintenance attachments, support tickets
- **Features**: Drag-and-drop, file validation, progress

**Component: Chart (Recharts based)**
- **Purpose**: Display data visualizations
- **Props**: data, type (line/bar/pie), labels, colors
- **Used In**: Admin dashboards (revenue, occupancy, payments)
- **Features**: Responsive, interactive tooltips, exports

**Component: Accordion**
- **Purpose**: Expandable FAQ items
- **Props**: items (question/answer pairs), allowMultiple
- **Used In**: Support FAQ section
- **Features**: Smooth expand/collapse, animated icons

**Component: Tabs**
- **Purpose**: Organize content into switchable sections
- **Props**: tabs (label/content), activeTab, onTabChange
- **Used In**: Profile (personal/account/security), bookings (status tabs)
- **Features**: Active indicator, smooth transitions

**Component: DropdownMenu**
- **Purpose**: Menu with multiple options
- **Props**: trigger, items, onSelect
- **Used In**: User profile menu, admin actions
- **Features**: Click-outside to close, keyboard navigation

**Component: SearchInput**
- **Purpose**: Search functionality with debouncing
- **Props**: onChange, onSearch, placeholder, debounceDelay
- **Used In**: Room search, user search, ticket search
- **Features**: Debounced input, clear button

**Component: FilterChip**
- **Purpose**: Applied filter display with remove button
- **Props**: label, onRemove
- **Used In**: Room filters, booking filters
- **Features**: Multiple chips, remove functionality

**Component: ConfirmationDialog**
- **Purpose**: Ask for user confirmation
- **Props**: title, message, onConfirm, onCancel, danger (boolean)
- **Used In**: Deletions, cancellations, destructive actions
- **Features**: Danger variant with red button

---

## Part 4: Form Specifications

### Form: Login
**Location**: `/auth/login`
**Purpose**: Authenticate existing users

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Email | email | Yes | Valid email format | "Enter email" |
| Password | password | Yes | Min 6 characters | "Enter password" |

**Submit Button**: "Login" → POST /api/auth/login → Redirect to /dashboard
**Features**: Password visibility toggle, Forgot password link
**Error Handling**: Show toast notification with error message

---

### Form: Sign Up
**Location**: `/auth/signup`
**Purpose**: Create new user accounts

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| First Name | text | Yes | Min 2, Max 50 chars | "John" |
| Last Name | text | Yes | Min 2, Max 50 chars | "Doe" |
| Email | email | Yes | Valid email, unique | "john@example.com" |
| Password | password | Yes | Min 8 chars, uppercase, number, special char | "••••••••" |
| Confirm Password | password | Yes | Must match password | "••••••••" |
| Terms & Conditions | checkbox | Yes | Must be checked | "" |

**Submit Button**: "Sign Up" → POST /api/auth/register → Redirect to /auth/verify-otp
**Features**: Real-time password strength indicator, terms link
**Validation**: Client-side + server-side

---

### Form: Maintenance Request
**Location**: `/dashboard/maintenance`
**Purpose**: Submit maintenance requests

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Title | text | Yes | Min 5, Max 100 chars | "Describe issue" |
| Category | select | Yes | Predefined options | "Select category" |
| Priority | select | Yes | Low/Medium/High/Urgent | "Select priority" |
| Description | textarea | Yes | Min 10, Max 500 chars | "Detailed description" |
| Attachment | file | No | jpg/png/pdf, max 5MB | "" |

**Submit Button**: "Submit Request" → POST /api/maintenance/submit → Toast notification
**Features**: File preview, category icons
**Validation**: Required fields, file size limit

---

### Form: Payment Initiation
**Location**: `/dashboard/payments`
**Purpose**: Initiate payment transactions

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Amount | number | Yes | Positive, not exceeding balance | "Enter amount" |
| Payment Method | select | Yes | Paystack / Mobile Money | "Select method" |
| Description | text | No | Max 200 chars | "For hostel fees" |

**Submit Button**: "Pay Now" → POST /api/payments/initialize → Redirect to payment gateway
**Features**: Amount suggestions (full balance, half payment, custom)
**Validation**: Amount must be positive and valid

---

### Form: Support Ticket
**Location**: `/dashboard/support`
**Purpose**: Create support tickets

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Category | select | Yes | Predefined options | "Select category" |
| Priority | select | Yes | Low/Medium/High | "Select priority" |
| Subject | text | Yes | Min 5, Max 100 chars | "Issue subject" |
| Description | textarea | Yes | Min 10, Max 1000 chars | "Describe the issue" |
| Attachment | file | No | jpg/png/pdf, max 5MB | "" |

**Submit Button**: "Submit Ticket" → POST /api/support/tickets → Toast notification
**Features**: Priority indicators, category-specific hints
**Validation**: Required fields, file type/size limits

---

### Form: Feedback
**Location**: `/dashboard/feedback`
**Purpose**: Provide service feedback

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Rating | star select | Yes | 1-5 stars | "" |
| Category | select | Yes | Room Quality/Staff/Amenities/etc | "Select category" |
| Title | text | Yes | Min 5, Max 100 chars | "Brief title" |
| Feedback | textarea | Yes | Min 10, Max 1000 chars | "Your feedback" |
| Anonymous | checkbox | No | Default false | "" |

**Submit Button**: "Submit Feedback" → POST /api/feedback/submit → Reset form
**Features**: Star rating input, category-specific help text
**Validation**: Rating required, text length checks

---

### Form: Profile Update
**Location**: `/dashboard/profile` (Personal Info tab)
**Purpose**: Update personal information

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| First Name | text | Yes | Min 2, Max 50 chars | "John" |
| Last Name | text | Yes | Min 2, Max 50 chars | "Doe" |
| Phone | tel | No | Valid phone format | "+233XX XXXX XXXX" |
| Emergency Contact | text | No | Valid phone or email | "Contact info" |
| Program | text | No | Max 100 chars | "Your program" |

**Submit Button**: "Save Changes" → PUT /api/users/me → Toast notification
**Features**: Profile picture upload section above
**Validation**: Phone format, character limits

---

### Form: Password Change
**Location**: `/dashboard/profile` (Security tab)
**Purpose**: Change account password

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Current Password | password | Yes | Must be correct | "Current password" |
| New Password | password | Yes | Min 8 chars, strength required | "New password" |
| Confirm Password | password | Yes | Must match new password | "Confirm password" |

**Submit Button**: "Change Password" → PUT /api/users/me/password → Toast notification
**Features**: Password strength indicator, visibility toggles
**Validation**: Current password verification, new password strength

---

### Form: Create/Edit Room (Admin)
**Location**: `/admin/dashboard/rooms`
**Purpose**: Manage hostel room inventory

**Fields**:
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Room Number | text | Yes | Unique, max 20 chars | "101" |
| Room Type | select | Yes | Single/Shared/Suite/Dorm | "Select type" |
| Capacity | number | Yes | 1-10 occupants | "1" |
| Price per Month | number | Yes | Positive number | "500" |
| Amenities | multi-select | No | Predefined list | "" |
| Status | select | Yes | Available/Occupied/Maintenance | "Available" |
| Description | textarea | No | Max 500 chars | "Room description" |
| Features | textarea | No | Max 500 chars | "Special features" |

**Submit Button**: "Save Room" (Create) / "Update Room" (Edit) → POST/PUT /api/admin/rooms
**Features**: Amenity checkboxes with icons, status color coding
**Validation**: Unique room number, numeric fields, required selections

---

### Form: Admin Settings
**Location**: `/admin/dashboard/settings`
**Purpose**: Configure system parameters

**Fields** (General Tab):
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| App Name | text | Yes | Max 100 chars | "JECAPH" |
| Support Email | email | Yes | Valid email | "support@jecaph.edu" |
| Support Phone | tel | No | Valid phone | "+233XX XXXX XXXX" |
| Hostel Address | textarea | Yes | Max 200 chars | "Full address" |

**Fields** (Hostel Configuration Tab):
| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|-----------|-------------|
| Hostel Name | text | Yes | Max 100 chars | "JECAPH Hostel" |
| Total Rooms | number | Yes | Positive | "50" |
| Semester Start | date | Yes | Valid date | "YYYY-MM-DD" |
| Semester End | date | Yes | After start date | "YYYY-MM-DD" |
| Base Monthly Fee | number | Yes | Positive | "500" |

**Submit Button**: "Save Changes" → PUT /api/admin/settings → Toast notification
**Features**: Date pickers, validation on related fields
**Validation**: Email format, date logic, numeric constraints

---

## Part 5: Search & Filter Functionality

### Page: Room Booking
**What's Being Searched**: Room name, description, room number

**Search Features**:
- Real-time search as user types
- Searches across: Room number, room type, description
- API endpoint: GET /api/rooms?search={query}

**Filter Options**:
| Filter | Type | Options | Default | Behavior |
|--------|------|---------|---------|----------|
| Room Type | Multi-select | Single, Shared, Suite, Dormitory | All | AND filter |
| Price Range | Range Slider | 0-10000 | 0-10000 | AND filter |
| Amenities | Multi-select | WiFi, AC, Hot Water, Desk, Balcony | All | AND filter |
| Occupancy | Select | Available, Partial, Full | All | Single select |
| Availability | Select | Available Now, Next Month, Custom Date | Now | Single select |

**Sort Options**:
- Price (Low-High, High-Low)
- Rating (Highest First)
- Newest Listed
- Occupancy (Available First)

**Pagination**:
- Items per page: 12 (grid), 20 (list)
- Style: Numbered pages + Load More button
- API params: ?page={page}&limit={limit}&...filters

---

### Page: Admin - Bookings
**What's Being Searched**: Booking ID, student name, room number

**Search Features**:
- Search input filters across: Booking ID, student name, room info
- API endpoint: GET /api/admin/bookings?search={query}

**Filter Options**:
| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Status | Tabs | All, Pending, Approved, Rejected, Completed, Cancelled | All |
| Date Range | Date picker | Booking date range | Last 30 days |
| Room Type | Select | Single, Shared, Suite, Dorm | All |
| Payment Status | Select | Paid, Partial, Unpaid | All |

**Sort Options**:
- Date (Newest First, Oldest First)
- Student Name (A-Z, Z-A)
- Amount (High-Low, Low-High)
- Status

**Pagination**:
- Items per page: 20
- Style: Numbered pages
- API params: ?page={page}&limit=20&...filters

---

### Page: Admin - Maintenance Requests
**What's Being Searched**: Request ID, student name, room number

**Search Features**:
- Searches across: Request ID, student, room, description
- API endpoint: GET /api/admin/maintenance?search={query}

**Filter Options**:
| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Status | Tabs | All, New, In Progress, Completed, Cancelled | All |
| Priority | Select | Low, Medium, High, Urgent | All |
| Category | Select | Plumbing, Electrical, Furniture, Cleaning, Other | All |
| Date Range | Date picker | Submission date range | Last 30 days |

**Sort Options**:
- Priority (Urgent First, Low Last)
- Date (Newest First, Oldest First)
- Status
- Assigned Staff

---

### Page: Admin - Support Tickets
**What's Being Searched**: Ticket ID, student name, subject

**Search Features**:
- Searches across: Ticket ID, student, subject, description
- API endpoint: GET /api/admin/support/tickets?search={query}

**Filter Options**:
| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Status | Tabs | All, Open, In Progress, Resolved, Closed | All |
| Priority | Select | Low, Medium, High | All |
| Category | Select | Technical, Billing, Facility, Other | All |
| Assigned To | Select | Support staff list | All |
| Date Range | Date picker | Created date range | Last 30 days |

**Sort Options**:
- Priority (Highest First)
- Date (Newest First, Oldest First)
- Status
- Response Time

---

## Part 6: Authentication & Authorization

**Authentication Method**: JWT (JSON Web Tokens)

**Token Storage**: HttpOnly secure cookies (refreshToken), localStorage (accessToken for API calls)

**Token Expiration**:
- Access Token: 1 hour
- Refresh Token: 7 days
- Refresh automatic on token near expiration

**Protected Routes**:
| Route Pattern | Public | Student | Admin | Super Admin |
|---------------|--------|---------|-------|------------|
| / | ✅ | ✅ | ✅ | ✅ |
| /auth/* | ✅ | ✅ | ✅ | ✅ |
| /dashboard/* | ❌ | ✅ | ✅ | ✅ |
| /admin/login | ✅ | ❌ | ✅ | ✅ |
| /admin/dashboard/* | ❌ | ❌ | ✅ | ✅ |
| /admin/dashboard/settings | ❌ | ❌ | ❌ | ✅ |

**Role-Based Access Control**:
- **Public Access**: Landing page, auth pages
- **Authenticated User**: Dashboard and all student pages
- **Admin Role**: Admin dashboard pages (except settings)
- **Super Admin Role**: All admin pages including settings

**Logout Behavior**:
- Clear JWT tokens from localStorage and cookies
- Redirect to login page
- Session invalidated on backend
- All API requests return 401 if token invalid

---

## Part 7: State Management

**Global State Stored**:
| State | Type | Purpose | Persisted | Storage |
|-------|------|---------|-----------|---------|
| user | Object | Current logged-in user | Yes | localStorage |
| auth | Object | Auth tokens and session | Yes | httpOnly Cookie |
| theme | String | UI theme (light/dark) | Yes | localStorage |
| notifications | Array | Toast notifications queue | No | Memory |
| dashboard | Object | Dashboard data and filters | No | Memory |
| adminFilters | Object | Admin page filters | No | Memory |

**Local Component State**:
- Form field values
- Loading/error states
- Modal open/close states
- Tab/accordion active states
- Pagination current page

---

## Part 8: Client-Side Validation

**Validation Rules**:

**Email**: Must be valid email format (RFC 5322)
**Password**: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
**Phone**: Valid international format starting with +233 for Ghana
**Text Fields**: Min/Max character limits as specified
**Numbers**: Positive values, max limits
**Required Fields**: Cannot be empty
**File Upload**: File type and size validation
**Dates**: Valid date format, logical constraints (end after start)

**Error Display**: Inline error messages below fields with red text and error icon
**Real-time Validation**: 
- Email: On blur
- Password strength: On change
- Matching fields: On blur of second field
- Other fields: On blur or submit

---

## Part 9: UI/UX Features

### Toast Notifications
- **Success**: Green background, "✓" icon, auto-dismiss 3 seconds
- **Error**: Red background, "✗" icon, stay until dismissed or 5 seconds
- **Info**: Blue background, "ℹ" icon, auto-dismiss 4 seconds
- **Warning**: Orange background, "⚠" icon, manual dismiss recommended
- **Position**: Top-right corner
- **Queue**: Max 3 visible, queue others

### Loading States
- Page level: Full-page skeleton/spinner
- Component level: Skeleton matching component height
- Button level: Loading spinner inside button, disabled state
- Inline: Shimmer animation on skeleton

### Empty States
- Room listing: "No rooms match your filters" with "Clear filters" button
- Bookings: "No bookings yet" with "Browse rooms" CTA
- Feedback: "No feedback submitted yet" with "Submit feedback" CTA
- Notifications: "All caught up!" message

### Confirmation Dialogs
- Used for: Delete operations, booking cancellations, refunds
- Features: Clear title, description, action buttons
- Danger variant: Red "Delete" button for destructive actions

### Modals/Dialogs
- Room details modal
- Booking confirmation modal
- Feedback submission modal
- Support ticket detail modal
- Settings/preference modals
- Error detail modals

### Hover Effects
- Cards lift with shadow increase
- Buttons change color/brightness
- Links underline or color change
- Icons scale or color change

### Animations
- Page transitions: Fade in, slide in
- Loading skeletons: Shimmer effect
- Toast notifications: Slide in from top/right, slide out
- Modal: Fade overlay + scale card
- Form elements: Subtle bounce on focus
- Chart: Line/bars animate on load
- List items: Stagger animation on load

---

## Part 10: Responsive Design Breakpoints

**Mobile**: < 640px
- Single column layouts
- Hamburger navigation
- Touch-friendly button sizing (48x48px minimum)
- Full-width modals
- Simplified forms

**Tablet**: 640px - 1024px
- Two-column layouts where applicable
- Sidebar visible but collapsible
- Adjusted font sizes
- Optimized spacing

**Desktop**: > 1024px
- Multi-column layouts (2-3 columns)
- Visible sidebar navigation
- Full feature set
- Optimized whitespace
- Wider content areas

---

This documentation provides a complete reference for the Jecaph Hostel Management System frontend.
```

Now let me create the comprehensive Backend API Specification:
