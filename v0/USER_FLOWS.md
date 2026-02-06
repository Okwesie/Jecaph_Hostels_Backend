# JECAPH Hostel Management System - Complete User Flows

## Flow 1: New Student Registration & Onboarding

```
Step 1: User lands on homepage
  ↓ Clicks "Get Started" or "Sign Up"
Step 2: Redirected to /auth/signup page
  ↓ Fills registration form (first name, last name, email, password, confirm password)
  ↓ Sees real-time password strength indicator
  ↓ Checks "I agree to terms & conditions"
  ↓ Clicks "Sign Up" button
  → POST /api/auth/register
Step 3: Account created, redirected to /auth/verify-otp
  ↓ System sends OTP to registered email
  ↓ User receives email with 6-digit OTP
  ↓ User enters OTP in form (6 input fields)
  ↓ Clicks "Verify" button
  → POST /api/auth/verify-otp
Step 4: Email verified, redirected to /dashboard
  ↓ User sees welcome message and quick actions
  ↓ System displays available rooms and quick stats
Step 5: User browses rooms
  ↓ Clicks "Browse Rooms" or goes to /dashboard/rooms
  ↓ Views room listings with filters (type, price, amenities)
  ↓ Clicks on room to see details or "Book Now"
  → GET /api/rooms?filters=...
Step 6: User selects room and initiates booking
  ↓ Selects check-in and check-out dates
  ↓ Clicks "Book Room"
  → POST /api/bookings
Step 7: Booking created, payment required
  ↓ Redirected to payment page
  ↓ User sees outstanding balance
  ↓ Enters payment amount and selects payment method (Paystack)
  ↓ Clicks "Pay Now"
  → POST /api/payments/initialize
Step 8: Redirected to Paystack payment gateway
  ↓ User completes payment on Paystack
Step 9: Payment webhook received and verified
  ↓ System marks payment as completed
  ↓ User receives payment receipt email
  ↓ User redirected back to /dashboard/payments
  → POST /api/payments/verify (webhook)
Step 10: Booking confirmed
  ↓ User can view booking details in /dashboard/bookings
  ↓ Booking status shows "active"
  ↓ User can view invoice and receipt
```

---

## Flow 2: Login & Access Dashboard

```
Step 1: Unauthenticated user arrives at homepage
  ↓ Clicks "Login" button
Step 2: Redirected to /auth/login
  ↓ Enters email and password
  ↓ Clicks "Login" button
  → POST /api/auth/login
Step 3: Credentials validated
  ↓ If email not verified: Error message with option to resend OTP
  ↓ If account suspended: Error message explaining suspension
  ↓ If credentials invalid: Error message
Step 4: Login successful
  ↓ JWT tokens generated and stored
  ↓ User redirected to /dashboard
  → Tokens: Access token (localStorage), Refresh token (httpOnly cookie)
Step 5: User on dashboard
  ↓ Can see personal stats: active bookings, pending payments, maintenance requests
  ↓ Can access all authenticated pages via sidebar
  ↓ Can navigate to rooms, shuttle, payments, feedback, support, profile
Step 6: User logs out
  ↓ Clicks profile dropdown in top-nav
  ↓ Clicks "Logout"
  ↓ Tokens cleared from storage
  ↓ Redirected to login page
  → POST /api/auth/logout
```

---

## Flow 3: Password Reset

```
Step 1: User on login page
  ↓ Clicks "Forgot password?" link
Step 2: Redirected to password reset request page (not fully built)
  ↓ Enters email address
  ↓ Clicks "Send Reset Link"
  → POST /api/auth/forgot-password
Step 3: Email sent with reset link
  ↓ User receives email with time-limited reset link
  ↓ User clicks link in email
Step 4: Redirected to password reset form
  ↓ Enters new password
  ↓ Confirms new password
  ↓ Clicks "Reset Password"
  → POST /api/auth/reset-password
Step 5: Password updated successfully
  ↓ Redirected to login page
  ↓ User can login with new password
```

---

## Flow 4: Complete Room Booking Process

```
Step 1: User on /dashboard/rooms
  ↓ Sees all available rooms in grid or list view
  ↓ Can filter by room type, price, amenities
  ↓ Can sort by price, rating, newest
  ↓ Can search by room number or keywords
  → GET /api/rooms?search=...&filters=...&sort=...
Step 2: User finds desired room
  ↓ Clicks on room card to see full details
  ↓ Sees room amenities, ratings, reviews, images
  ↓ Can see current occupancy and availability
Step 3: User initiates booking
  ↓ Clicks "Book Now" button
  ↓ Booking form appears (check-in date, check-out date, notes)
  ↓ System shows calculated total amount (price × months)
  ↓ User can see booking policy/terms
  ↓ Clicks "Confirm Booking"
  → POST /api/bookings
Step 4: Booking created and payment required
  ↓ Booking status: "pending"
  ↓ System sends confirmation email
  ↓ User redirected to /dashboard/bookings
  ↓ Can see new booking in list with status "pending"
Step 5: User makes payment
  ↓ Navigates to /dashboard/payments
  ↓ Sees outstanding balance
  ↓ Enters payment amount (can be partial or full)
  ↓ Selects payment method
  ↓ Clicks "Pay Now"
  → POST /api/payments/initialize
Step 6: Payment completion
  ↓ Redirected to payment gateway
  ↓ Completes payment
  ↓ Webhook received and processed
  ↓ Payment marked as completed
  ↓ User email notified
Step 7: Booking confirmed
  ↓ Booking status updated to "active" (if payment made in full)
  ↓ Or "partial" if payment is not complete
  ↓ User can now view booking details and receipt
  ↓ Can make additional payments for outstanding balance
  ↓ Can view room assignment details (room number, floor, access info)
```

---

## Flow 5: Submit Maintenance Request

```
Step 1: User on /dashboard/maintenance
  ↓ Sees form to submit new request
  ↓ Sees list of already submitted requests
Step 2: User fills maintenance request form
  ↓ Enters title of issue
  ↓ Selects category (plumbing, electrical, furniture, cleaning, other)
  ↓ Selects priority (low, medium, high, urgent)
  ↓ Enters detailed description
  ↓ Can optionally upload image/document
  ↓ Clicks "Submit Request"
  → POST /api/maintenance/submit
Step 3: Request submitted
  ↓ System generates request ID
  ↓ Status set to "new"
  ↓ User receives email confirmation
  ↓ Form resets and shows success message
Step 4: User can track request
  ↓ Views list of submitted requests
  ↓ Can filter by status (new, in progress, completed)
  ↓ Can filter by priority
  ↓ See submission date and last updated
Step 5: Admin reviews and processes
  ↓ Admin sees request on /admin/dashboard/maintenance
  ↓ Admin can view request details
  ↓ Can assign to maintenance staff
  ↓ Can update status and add response
  ↓ User receives email notification of status change
Step 6: Request completed
  ↓ Admin marks status as "completed"
  ↓ Admin provides resolution notes
  ↓ User notified via email
  ↓ User can rate/feedback on maintenance service
```

---

## Flow 6: Payment & Invoice Management

```
Step 1: User on /dashboard/payments
  ↓ Sees account balance summary (total owed, amount paid, outstanding)
  ↓ Sees payment due date
Step 2: View payment history
  ↓ Can see past transactions with date, amount, method, status
  ↓ Can download receipt/invoice for each payment
  ↓ Can filter by payment status (completed, failed, pending)
  ↓ Can see transaction references
  → GET /api/payments/history
Step 3: Make new payment
  ↓ Enters payment amount (default suggestions: full balance, half, custom)
  ↓ Selects payment method (Paystack, Mobile Money)
  ↓ Clicks "Pay Now"
  ↓ Payment initialized with Paystack
  → POST /api/payments/initialize
Step 4: Complete payment on Paystack
  ↓ Redirected to Paystack payment page
  ↓ Can pay via Paystack portal
  ↓ Paystack sends webhook confirmation
Step 5: Payment processed and verified
  ↓ System marks payment as completed
  ↓ Outstanding balance updated
  ↓ Receipt generated and emailed
  ↓ User can download receipt from /dashboard/payments
  → POST /api/payments/verify (webhook)
Step 6: Invoice tracking
  ↓ Invoices created for semester fees
  ↓ User can see invoice details
  ↓ Invoice marked as paid/partial/unpaid based on payments
  ↓ System sends reminder emails before due date
```

---

## Flow 7: Shuttle Booking

```
Step 1: User on /dashboard/shuttle
  ↓ Sees list of available routes
  ↓ Routes show: from, to, departure time, arrival time, available seats, price
Step 2: User selects route and books
  ↓ Sees route details
  ↓ Clicks "Book Ride"
  ↓ Confirmation modal appears
  ↓ Clicks "Confirm"
  → POST /api/shuttle/book
Step 3: Booking confirmed
  ↓ Gets booking reference number
  ↓ Gets QR code for check-in
  ↓ System shows seat assignment
  ↓ Email confirmation sent
Step 4: View booked shuttles
  ↓ Can see all upcoming shuttle bookings
  ↓ Each shows: from, to, departure time, date, reference, QR code
  ↓ Can cancel booking if needed (if not within 24 hours of departure)
  → GET /api/shuttle/bookings
Step 5: Cancel shuttle booking (if allowed)
  ↓ Clicks "Cancel" on booking
  ↓ Confirmation dialog appears
  ↓ Clicks confirm to cancel
  ↓ Refund processed
  → DELETE /api/shuttle/bookings/:id
```

---

## Flow 8: Feedback Submission

```
Step 1: User on /dashboard/feedback
  ↓ Sees form to submit feedback
  ↓ Sees list of previous feedback submissions
Step 2: User submits feedback
  ↓ Clicks on star rating (1-5)
  ↓ Selects feedback category (room quality, staff, amenities, food, cleanliness, other)
  ↓ Enters title for feedback
  ↓ Writes detailed feedback (min 10 chars)
  ↓ Can optionally check "submit anonymously"
  ↓ Clicks "Submit Feedback"
  → POST /api/feedback/submit
Step 3: Feedback submitted
  ↓ Shows success message
  ↓ Form resets
  ↓ Feedback added to list (if not anonymous)
  ↓ Feedback status: "pending_response"
Step 4: View feedback history
  ↓ Can see all submitted feedback
  ↓ Shows rating, category, date, status
  ↓ Can see admin response if available
Step 5: Admin responds
  ↓ Admin sees feedback on /admin/dashboard/feedback
  ↓ Can view all feedback with filters (rating, category, pending response)
  ↓ Clicks "Reply" on feedback
  ↓ Types response message
  ↓ Clicks "Send Response"
  → PUT /api/feedback/:id/respond
Step 6: User notified of response
  ↓ User receives email with admin response
  ↓ Feedback status updated to "responded"
  ↓ User can see response on /dashboard/feedback
```

---

## Flow 9: Support Ticket Management

```
Step 1: User on /dashboard/support
  ↓ Sees quick contact options (phone, email, live chat)
  ↓ Sees form to submit support ticket
  ↓ Sees list of submitted tickets
Step 2: User submits support ticket
  ↓ Selects category (technical, billing, facility, other)
  ↓ Selects priority (low, medium, high)
  ↓ Enters subject
  ↓ Enters detailed description
  ↓ Can optionally upload file
  ↓ Clicks "Submit Ticket"
  → POST /api/support/tickets
Step 3: Ticket created
  ↓ Gets ticket number (TK-2024-XXXX)
  ↓ Shows success message
  ↓ Email confirmation sent
  ↓ Ticket status: "open"
Step 4: View ticket list
  ↓ Shows all submitted tickets
  ↓ Can filter by status (open, in progress, resolved, closed)
  ↓ Shows priority and date submitted
  ↓ Shows last updated and response count
  → GET /api/support/tickets
Step 5: View ticket details and chat
  ↓ Clicks on ticket to see full details
  ↓ Shows complete chat history with support team
  ↓ Sees all previous messages and responses
  ↓ Can add new message to ticket
  ↓ Clicks "Add Message"
  → POST /api/support/tickets/:id/message
Step 6: Support team responds
  ↓ Admin sees ticket on /admin/dashboard/support
  ↓ Can view full ticket details and chat
  ↓ Can assign to support staff
  ↓ Can add messages/responses
  ↓ User gets email notification of new message
Step 7: Ticket resolved and closed
  ↓ Support team marks status as "resolved"
  ↓ Provides final response/solution
  ↓ Optionally closes ticket
  ↓ User notified and can rate support experience
```

---

## Flow 10: Profile Management

```
Step 1: User clicks profile icon in top-nav
  ↓ Dropdown menu appears
  ↓ Clicks "Profile" or "Settings"
Step 2: Navigated to /dashboard/profile
  ↓ Shows tabs: Personal Info, Account Settings, Security, Notifications
Step 3: Update personal information
  ↓ Can upload/change profile picture
  ↓ Can edit first name, last name
  ↓ Can edit phone number
  ↓ Can add emergency contact
  ↓ Can add program/course information
  ↓ Clicks "Save Changes"
  → PUT /api/users/me
Step 4: Account settings
  ↓ Shows student ID (read-only)
  ↓ Shows email (read-only)
  ↓ Can change theme preference (light/dark)
  ↓ Can change language preference
  ↓ Saves preferences
  → PUT /api/users/me
Step 5: Security settings
  ↓ Can change password
  ↓ Enters current password, new password, confirm password
  ↓ Clicks "Change Password"
  → PUT /api/users/me/password
  ↓ Can enable/disable 2-factor authentication
  ↓ Can view login history (date, time, device, IP)
  ↓ Can view and manage active sessions
  ↓ Can logout from all other sessions
Step 6: Notification preferences
  ↓ Can toggle email notifications
  ↓ Can toggle SMS notifications
  ↓ Can select notification types:
    - Booking confirmations
    - Maintenance updates
    - Payment reminders
    - Support responses
    - Hostel announcements
  ↓ Clicks "Save Preferences"
  → PUT /api/users/me/preferences
```

---

## Flow 11: Admin User Management

```
Step 1: Admin logs in to /admin/login
  ↓ Enters admin email and password
  ↓ Clicks "Admin Login"
  → POST /api/auth/admin-login
Step 2: Redirected to /admin/dashboard
  ↓ Sees dashboard with key metrics
  ↓ Sees recent activities and alerts
  ↓ Sidebar shows admin menu items
Step 3: Navigate to user management
  ↓ Clicks "Users" (if implemented) or via other sections
  ↓ Can view all users with search and filters
  ↓ Can search by name, email, role
  ↓ Can filter by role (student, admin), status (active, suspended)
  → GET /api/admin/users
Step 4: View user details
  ↓ Clicks on user to see details
  ↓ Shows user profile info
  ↓ Shows user's bookings, payments, activity
  ↓ Shows login history
  → GET /api/admin/users/:id
Step 5: Manage user (admin)
  ↓ Can change user status (active, suspended)
  ↓ Can add notes about user
  ↓ Can view and manage user account
  ↓ Clicks "Update" to save changes
  → PUT /api/admin/users/:id
```

---

## Flow 12: Admin Room Management

```
Step 1: Admin on /admin/dashboard/rooms
  ↓ Sees all rooms in table/grid view
  ↓ Shows room number, type, capacity, occupancy, price, status
  ↓ Can search, filter, and sort rooms
Step 2: Add new room
  ↓ Clicks "Add New Room" button
  ↓ Modal/form opens with fields:
    - Room number
    - Room type
    - Capacity
    - Price per month
    - Amenities
    - Status
    - Description
  ↓ Fills all required fields
  ↓ Clicks "Save Room"
  → POST /api/rooms
Step 3: Room created
  ↓ Shows success message
  ↓ Room added to list
  ↓ Can now be booked by students
Step 4: Edit room
  ↓ Clicks "Edit" on room row
  ↓ Form opens with current room data
  ↓ Admin can update any field
  ↓ Clicks "Update Room"
  → PUT /api/rooms/:id
Step 5: Delete room
  ↓ Clicks "Delete" on room row
  ↓ Confirmation dialog appears
  ↓ Admin confirms deletion
  → DELETE /api/rooms/:id
  ↓ Room removed from system
```

---

## Flow 13: Admin Booking Management

```
Step 1: Admin on /admin/dashboard/bookings
  ↓ Sees all bookings in table
  ↓ Can filter by status (pending, approved, completed, cancelled)
  ↓ Can search by booking ID, student name, room
  ↓ Can see dates, amount, status
Step 2: Approve pending booking
  ↓ Sees "Pending" tab with pending bookings
  ↓ Clicks booking to view details
  ↓ Reviews student info, room, dates, amount
  ↓ Clicks "Approve" button
  ↓ Booking status changes to "approved"
  → PUT /api/admin/bookings/:id/approve
  ↓ Student notified via email
Step 3: Reject booking
  ↓ Clicks "Reject" button
  ↓ Dialog opens to enter rejection reason
  ↓ Enters reason and confirms
  ↓ Booking status changes to "rejected"
  → PUT /api/admin/bookings/:id/reject
  ↓ Student notified with reason
  ↓ Room released for other bookings
```

---

## Flow 14: Admin Payment Processing

```
Step 1: Admin on /admin/dashboard/payments
  ↓ Sees revenue summary and charts
  ↓ Sees payment transactions in table
Step 2: View payment details
  ↓ Can see all student payments
  ↓ Filter by status (completed, pending, failed)
  ↓ Filter by payment method
  ↓ Filter by date range
  → GET /api/admin/payments/transactions
Step 3: View transaction receipt
  ↓ Clicks transaction row
  ↓ Can view receipt details
  ↓ Can download receipt as PDF
Step 4: Process refund (if needed)
  ↓ Clicks "Refund" on failed/disputed payment
  ↓ Dialog opens with refund details
  ↓ Confirms refund
  ↓ Refund processed and student notified
  → PUT /api/admin/payments/:id/refund
```

---

## Flow 15: Admin Maintenance Management

```
Step 1: Admin on /admin/dashboard/maintenance
  ↓ Sees all maintenance requests
  ↓ Filter by status (new, in progress, completed)
  ↓ Filter by priority (low, medium, high, urgent)
  ↓ Can search by request ID, student, room
Step 2: View request details
  ↓ Clicks request to see full details
  ↓ Sees student info, room, category, priority
  ↓ Sees description and attachments
  ↓ Sees previous responses (if any)
Step 3: Assign to staff
  ↓ Clicks "Assign Staff"
  ↓ Dropdown shows available maintenance staff
  ↓ Selects staff member
  ↓ Staff member notified
  → PUT /api/admin/maintenance/:id
Step 4: Update status
  ↓ Clicks status dropdown
  ↓ Changes status (new → in_progress → completed)
  ↓ Can add response/notes
  ↓ Student notified of status change
  → PUT /api/admin/maintenance/:id/status
Step 5: Mark complete
  ↓ When work done, admin sets status to "completed"
  ↓ Adds final notes/resolution
  ↓ Student receives completion notification
  ↓ Student can then provide feedback on the service
```

---

## Flow 16: Admin Support Ticket Management

```
Step 1: Admin on /admin/dashboard/support
  ↓ Sees all support tickets
  ↓ Filter by status (open, in progress, resolved)
  ↓ Filter by priority, category
  ↓ Shows ticket number, subject, student, priority
Step 2: View ticket and chat
  ↓ Clicks ticket to open detail modal
  ↓ Shows full chat history
  ↓ Can see all messages from student and support team
Step 3: Respond to ticket
  ↓ Types message in input field
  ↓ Clicks "Send" to add response
  ↓ Message added to chat
  → POST /api/admin/support/tickets/:id/message
  ↓ Student notified of response
Step 4: Assign ticket
  ↓ Can assign to specific support staff member
  ↓ Staff member notified
Step 5: Close ticket
  ↓ When resolved, admin clicks "Close Ticket"
  ↓ Can add final notes
  ↓ Ticket marked as "closed"
  → PUT /api/admin/support/tickets/:id/close
  ↓ Student notified of closure
```

---

## Flow 17: Admin Settings Management (Super Admin Only)

```
Step 1: Super Admin on /admin/dashboard/settings
  ↓ Sees settings tabs: General, Hostel, Notifications, Security, Logs
Step 2: Update general settings
  ↓ Can edit app name
  ↓ Can edit support email and phone
  ↓ Can edit hostel address
  ↓ Clicks "Save Changes"
  → PUT /api/admin/settings
Step 3: Configure hostel settings
  ↓ Can set hostel name
  ↓ Can set total rooms count
  ↓ Can set semester dates
  ↓ Can set base monthly fees
  ↓ Changes saved
Step 4: Configure notifications
  ↓ Can enable/disable email notifications
  ↓ Can enable/disable SMS notifications
  ↓ Can manage email templates
  ↓ Can test email system
  ↓ Changes saved
Step 5: Security settings
  ↓ Can set password policy requirements
  ↓ Can configure 2FA settings
  ↓ Can set session timeout
  ↓ Can set login attempt limits
  ↓ Changes saved
Step 6: View system logs
  ↓ Can view audit logs
  ↓ Filter by log level, action, date
  ↓ Can search logs
  ↓ Can export logs for audit
```

---

## Flow 18: Error Handling & Retry Flows

```
Network Error Scenario:
  ↓ User takes action (book room, make payment, submit form)
  ↓ Network error occurs
  ↓ System detects error and shows error toast
  ↓ Toast shows "Failed, click to retry" or with retry button
  ↓ User clicks retry
  ↓ Action is retried
  ↓ If successful: success toast shown
  ↓ If still fails: user can try again or contact support

Validation Error Scenario:
  ↓ User submits form with invalid data
  ↓ Client-side validation shows inline error messages
  ↓ User corrects errors
  ↓ Resubmits form
  ↓ If still invalid on server: server returns validation error
  ↓ Error messages displayed below fields
  ↓ User corrects and resubmits

Authentication Error Scenario:
  ↓ User's JWT token expired
  ↓ API returns 401 Unauthorized
  ↓ System automatically tries to refresh token using refresh token
  ↓ If refresh successful: request retried with new token
  ↓ If refresh fails: user redirected to login page
  ↓ Session cleared
  ↓ User must login again
```

---

This documentation provides complete reference for all major user flows and interactions in the system.
```

Perfect! I've created comprehensive documentation files covering everything. Now let me create one final document with local setup instructions:
