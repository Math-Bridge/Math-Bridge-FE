# Manual Test Report for Math-Bridge-FE
**Website URL:** https://web.vibe88.tech/  
**Test Account:** lncaomy@gmail.com  
**Password:** Phineas2005!

## Change Log

| Effective Date | Version | Change Item | A/M/D* | Change Description | Reference |
|----------------|---------|-------------|---------|-------------------|-----------|
| 2025-11-13 | 1.0.0 | Test Plan Created | A | Initial comprehensive test plan for parent functionality testing | TEST-001 |

*A: Add, M: Modify, D: Delete

---

## Test Plan Overview

This document outlines comprehensive manual testing scenarios for the Math-Bridge-FE parent portal, covering both perfect (happy path) and error/edge case scenarios.

## 1. Login/Logout Testing

### 1.1 Login - Perfect Situations

**Test Case:** LOGIN-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Login with valid credentials  
**Type:** A (Add)  
**Description:**
- Navigate to https://web.vibe88.tech/
- Enter email: lncaomy@gmail.com
- Enter password: Phineas2005!
- Click Login button
- **Expected Result:** Successfully logged in and redirected to parent dashboard

**Reference:** User Story - Parent Authentication

---

### 1.2 Login - Error Situations

**Test Case:** LOGIN-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Login with invalid password  
**Type:** A (Add)  
**Description:**
- Navigate to https://web.vibe88.tech/
- Enter email: lncaomy@gmail.com
- Enter incorrect password: WrongPassword123
- Click Login button
- **Expected Result:** Error message displayed: "Invalid email or password"

**Reference:** Authentication Error Handling

---

**Test Case:** LOGIN-ERROR-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Login with invalid email format  
**Type:** A (Add)  
**Description:**
- Navigate to https://web.vibe88.tech/
- Enter invalid email: notanemail
- Enter any password
- Click Login button
- **Expected Result:** Validation error: "Please enter a valid email address"

**Reference:** Form Validation

---

**Test Case:** LOGIN-ERROR-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Login with empty fields  
**Type:** A (Add)  
**Description:**
- Navigate to https://web.vibe88.tech/
- Leave email and password fields empty
- Click Login button
- **Expected Result:** Validation error: "Email and password are required"

**Reference:** Form Validation

---

**Test Case:** LOGIN-ERROR-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Login with non-existent account  
**Type:** A (Add)  
**Description:**
- Navigate to https://web.vibe88.tech/
- Enter email: nonexistent@example.com
- Enter password: SomePassword123
- Click Login button
- **Expected Result:** Error message: "Account not found"

**Reference:** Authentication Error Handling

---

### 1.3 Logout Testing

**Test Case:** LOGOUT-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Standard logout  
**Type:** A (Add)  
**Description:**
- Log in with valid credentials
- Navigate to profile/settings menu
- Click Logout button
- **Expected Result:** 
  - Successfully logged out
  - Session cleared
  - Redirected to login page
  - Cannot access protected routes without re-authentication

**Reference:** User Session Management

---

**Test Case:** LOGOUT-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Session timeout  
**Type:** A (Add)  
**Description:**
- Log in with valid credentials
- Leave browser idle for extended period (session timeout duration)
- Attempt to perform any action
- **Expected Result:** 
  - Session expired message
  - Automatically redirected to login page
  - Must re-authenticate to continue

**Reference:** Session Timeout Handling

---

## 2. View All Tabs Testing

### 2.1 Navigation - Perfect Situations

**Test Case:** NAV-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access Dashboard tab  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Click on Dashboard tab/menu item
- **Expected Result:** 
  - Dashboard page loads successfully
  - Shows overview of children, contracts, and sessions
  - All widgets display correct data

**Reference:** Parent Dashboard Feature

---

**Test Case:** NAV-PERFECT-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access Children tab  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Click on Children/Kids tab/menu item
- **Expected Result:** 
  - Children list page loads successfully
  - Shows all registered children
  - Displays child details (name, age, grade, etc.)
  - "Add Child" button is visible

**Reference:** Child Management Feature

---

**Test Case:** NAV-PERFECT-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access Contracts tab  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Click on Contracts tab/menu item
- **Expected Result:** 
  - Contracts page loads successfully
  - Shows all active and past contracts
  - Displays contract details (tutor, subject, schedule, status)
  - "Create Contract" button is visible

**Reference:** Contract Management Feature

---

**Test Case:** NAV-PERFECT-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access Sessions tab  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Click on Sessions tab/menu item
- **Expected Result:** 
  - Sessions page loads successfully
  - Shows upcoming and past sessions
  - Displays session details (date, time, tutor, subject, status)

**Reference:** Session Management Feature

---

**Test Case:** NAV-PERFECT-005  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access Wallet/Payment tab  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Click on Wallet/Payment tab/menu item
- **Expected Result:** 
  - Wallet page loads successfully
  - Shows current balance
  - Displays transaction history
  - "Top Up" button is visible

**Reference:** Payment Management Feature

---

**Test Case:** NAV-PERFECT-006  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access Profile/Settings tab  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Click on Profile/Settings tab/menu item
- **Expected Result:** 
  - Profile page loads successfully
  - Shows parent information
  - Allows editing of profile details
  - Displays account settings

**Reference:** User Profile Feature

---

### 2.2 Navigation - Error Situations

**Test Case:** NAV-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Access protected route without authentication  
**Type:** A (Add)  
**Description:**
- Without logging in, attempt to access protected route directly via URL
- Example: https://web.vibe88.tech/dashboard
- **Expected Result:** 
  - Access denied
  - Redirected to login page
  - Error message: "Please login to access this page"

**Reference:** Route Protection

---

**Test Case:** NAV-ERROR-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Network error during page load  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Simulate network disconnection
- Click on any tab/menu item
- **Expected Result:** 
  - Error message: "Unable to load page. Please check your connection."
  - Option to retry
  - Previous page remains accessible

**Reference:** Error Handling

---

## 3. Create Child Testing

### 3.1 Create Child - Perfect Situations

**Test Case:** CHILD-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create child with all required fields  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Fill in all required fields:
  - First Name: John
  - Last Name: Doe
  - Date of Birth: 2015-05-15
  - Grade Level: 5
  - School: ABC Elementary
- Click "Save" button
- **Expected Result:** 
  - Child created successfully
  - Success message displayed
  - Child appears in children list
  - Can view child details

**Reference:** Child Management - Create

---

**Test Case:** CHILD-PERFECT-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create child with optional fields  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Fill in required and optional fields:
  - First Name: Jane
  - Last Name: Doe
  - Date of Birth: 2013-08-20
  - Grade Level: 7
  - School: XYZ Middle School
  - Interests: Math, Science
  - Notes: Prefers morning sessions
- Click "Save" button
- **Expected Result:** 
  - Child created successfully with all details
  - Optional information saved correctly
  - Child appears in children list with full details

**Reference:** Child Management - Create with Optional Data

---

### 3.2 Create Child - Error Situations

**Test Case:** CHILD-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create child with missing required fields  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Leave First Name field empty
- Fill other fields
- Click "Save" button
- **Expected Result:** 
  - Validation error: "First Name is required"
  - Form not submitted
  - Data remains in form for correction

**Reference:** Form Validation

---

**Test Case:** CHILD-ERROR-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create child with invalid date of birth  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Enter future date for Date of Birth
- Fill other fields
- Click "Save" button
- **Expected Result:** 
  - Validation error: "Date of birth cannot be in the future"
  - Form not submitted

**Reference:** Date Validation

---

**Test Case:** CHILD-ERROR-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create child with invalid grade level  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Enter invalid grade (e.g., negative number or text)
- Fill other fields
- Click "Save" button
- **Expected Result:** 
  - Validation error: "Please enter a valid grade level"
  - Form not submitted

**Reference:** Input Validation

---

**Test Case:** CHILD-ERROR-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create duplicate child  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Enter details matching an existing child
- Click "Save" button
- **Expected Result:** 
  - Warning message: "A child with similar details already exists"
  - Option to proceed or cancel
  - If proceeded, child created with unique identifier

**Reference:** Duplicate Handling

---

**Test Case:** CHILD-ERROR-005  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Network error during child creation  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Children page
- Click "Add Child" button
- Fill in all fields
- Simulate network disconnection
- Click "Save" button
- **Expected Result:** 
  - Error message: "Unable to create child. Please check your connection and try again."
  - Form data preserved
  - Option to retry

**Reference:** Network Error Handling

---

## 4. Create Contract Testing

### 4.1 Create Contract - Perfect Situations

**Test Case:** CONTRACT-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract with all required fields  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Contracts page
- Click "Create Contract" button
- Select child from dropdown
- Select subject (e.g., Mathematics)
- Select tutor (if applicable)
- Choose schedule (days and times)
- Enter number of sessions
- Enter rate/pricing
- Click "Create Contract" button
- **Expected Result:** 
  - Contract created successfully
  - Success message displayed
  - Contract appears in contracts list
  - Email notification sent to parent and tutor
  - Wallet balance checked for sufficient funds

**Reference:** Contract Management - Create

---

**Test Case:** CONTRACT-PERFECT-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract with package selection  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Contracts page
- Click "Create Contract" button
- Select child
- Choose from available packages
- Select preferred tutor
- Confirm schedule from package
- Click "Create Contract" button
- **Expected Result:** 
  - Contract created with package details
  - Package pricing applied
  - Contract appears in contracts list

**Reference:** Package-based Contracting

---

### 4.2 Create Contract - Error Situations

**Test Case:** CONTRACT-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract without selecting child  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Contracts page
- Click "Create Contract" button
- Leave child selection empty
- Fill other fields
- Click "Create Contract" button
- **Expected Result:** 
  - Validation error: "Please select a child"
  - Form not submitted

**Reference:** Form Validation

---

**Test Case:** CONTRACT-ERROR-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract with insufficient wallet balance  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Ensure wallet balance is insufficient for contract
- Navigate to Contracts page
- Click "Create Contract" button
- Fill all fields
- Click "Create Contract" button
- **Expected Result:** 
  - Error message: "Insufficient wallet balance. Please top up your wallet."
  - Link to wallet top-up page
  - Contract not created

**Reference:** Payment Validation

---

**Test Case:** CONTRACT-ERROR-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract with conflicting schedule  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Contracts page
- Click "Create Contract" button
- Fill all fields
- Select schedule that conflicts with existing contract
- Click "Create Contract" button
- **Expected Result:** 
  - Warning message: "Schedule conflicts with existing contract"
  - Show conflicting contract details
  - Option to modify schedule or proceed

**Reference:** Schedule Conflict Detection

---

**Test Case:** CONTRACT-ERROR-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract with invalid date range  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Contracts page
- Click "Create Contract" button
- Select start date in the past
- Fill other fields
- Click "Create Contract" button
- **Expected Result:** 
  - Validation error: "Start date cannot be in the past"
  - Form not submitted

**Reference:** Date Validation

---

**Test Case:** CONTRACT-ERROR-005  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Create contract with unavailable tutor  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Contracts page
- Click "Create Contract" button
- Select tutor who is not available for selected schedule
- Fill other fields
- Click "Create Contract" button
- **Expected Result:** 
  - Error message: "Selected tutor is not available for this schedule"
  - Option to choose different tutor or schedule

**Reference:** Tutor Availability Validation

---

## 5. Top Up Wallet Testing

### 5.1 Top Up Wallet - Perfect Situations

**Test Case:** WALLET-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet with valid amount  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Wallet page
- Click "Top Up" button
- Enter amount: $100
- Select payment method
- Click "Proceed to Payment" button
- Complete payment process
- **Expected Result:** 
  - Payment processed successfully
  - Wallet balance updated
  - Transaction appears in history
  - Confirmation email sent
  - Receipt generated

**Reference:** Payment Processing

**NOTE:** This test requires manual intervention - need to contact admin to add money during test execution.

---

**Test Case:** WALLET-PERFECT-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet with different payment methods  
**Type:** A (Add)  
**Description:**
- Test multiple payment methods:
  - Credit/Debit Card
  - Bank Transfer
  - Digital Wallet (if available)
- For each method:
  - Navigate to Wallet page
  - Click "Top Up" button
  - Enter amount
  - Select payment method
  - Complete payment
- **Expected Result:** 
  - All payment methods work correctly
  - Wallet balance updated for each transaction
  - Different transaction types recorded correctly

**Reference:** Multiple Payment Methods

---

### 5.2 Top Up Wallet - Error Situations

**Test Case:** WALLET-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet with invalid amount  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Wallet page
- Click "Top Up" button
- Enter invalid amount: $0 or negative value
- Click "Proceed to Payment" button
- **Expected Result:** 
  - Validation error: "Please enter a valid amount (minimum $10)"
  - Payment not processed

**Reference:** Amount Validation

---

**Test Case:** WALLET-ERROR-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet with amount exceeding limit  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Wallet page
- Click "Top Up" button
- Enter amount exceeding maximum: $10,000+
- Click "Proceed to Payment" button
- **Expected Result:** 
  - Validation error: "Amount exceeds maximum limit of $5,000"
  - Payment not processed

**Reference:** Amount Limit Validation

---

**Test Case:** WALLET-ERROR-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet with payment failure  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Wallet page
- Click "Top Up" button
- Enter valid amount
- Use invalid/declined payment method
- **Expected Result:** 
  - Error message: "Payment failed. Please check your payment details and try again."
  - Wallet balance not updated
  - Failed transaction logged
  - Option to retry

**Reference:** Payment Failure Handling

---

**Test Case:** WALLET-ERROR-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet with network error during payment  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Wallet page
- Click "Top Up" button
- Enter valid amount
- Simulate network disconnection during payment
- **Expected Result:** 
  - Error message: "Payment processing interrupted. Please check your wallet balance and contact support if amount was deducted."
  - Transaction status marked as pending
  - Option to verify transaction status

**Reference:** Network Error During Payment

---

**Test Case:** WALLET-ERROR-005  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Top up wallet without selecting payment method  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Wallet page
- Click "Top Up" button
- Enter valid amount
- Do not select payment method
- Click "Proceed to Payment" button
- **Expected Result:** 
  - Validation error: "Please select a payment method"
  - Payment not processed

**Reference:** Payment Method Validation

---

## 6. View Session Testing

### 6.1 View Sessions - Perfect Situations

**Test Case:** SESSION-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** View upcoming sessions list  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- **Expected Result:** 
  - All upcoming sessions displayed
  - Shows session details: date, time, tutor name, child name, subject
  - Sessions sorted by date (earliest first)
  - Each session shows status (scheduled, in progress, completed, cancelled)

**Reference:** Session View Feature

---

**Test Case:** SESSION-PERFECT-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** View session details  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- Click on a specific session
- **Expected Result:** 
  - Session detail page opens
  - Shows complete information:
    - Date and time
    - Duration
    - Tutor details
    - Child details
    - Subject/topic
    - Location (online/physical)
    - Meeting link (if online)
    - Notes from previous sessions
  - Options to reschedule or cancel

**Reference:** Session Details View

---

**Test Case:** SESSION-PERFECT-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** View past sessions  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- Click "Past Sessions" or filter by completed
- **Expected Result:** 
  - All completed sessions displayed
  - Shows session details with completion status
  - Can view session reports/notes
  - Can view payment status for each session

**Reference:** Historical Session Data

---

**Test Case:** SESSION-PERFECT-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Filter sessions by child  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- Use filter to select specific child
- **Expected Result:** 
  - Only sessions for selected child displayed
  - Filter can be cleared to show all
  - Can filter by multiple children

**Reference:** Session Filtering

---

**Test Case:** SESSION-PERFECT-005  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Filter sessions by date range  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- Select date range filter
- **Expected Result:** 
  - Only sessions within selected range displayed
  - Can customize start and end dates
  - Filter can be reset

**Reference:** Date Range Filtering

---

### 6.2 View Sessions - Error Situations

**Test Case:** SESSION-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** View sessions with no data  
**Type:** A (Add)  
**Description:**
- Log in as parent (new account with no sessions)
- Navigate to Sessions page
- **Expected Result:** 
  - Message displayed: "No sessions found"
  - Helpful message: "Create a contract to schedule your first session"
  - Link to create contract

**Reference:** Empty State Handling

---

**Test Case:** SESSION-ERROR-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** View session details with deleted/inactive data  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- Click on session where tutor or child has been removed
- **Expected Result:** 
  - Session details show with archived information
  - Indication that tutor/child is no longer active
  - Historical data preserved

**Reference:** Archived Data Handling

---

**Test Case:** SESSION-ERROR-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Load sessions with network error  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Simulate network disconnection
- Navigate to Sessions page
- **Expected Result:** 
  - Error message: "Unable to load sessions. Please check your connection."
  - Option to retry
  - Cached sessions displayed if available

**Reference:** Network Error Handling

---

**Test Case:** SESSION-ERROR-004  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** View sessions with invalid date filter  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Navigate to Sessions page
- Enter invalid date range (end date before start date)
- **Expected Result:** 
  - Validation error: "End date must be after start date"
  - Filter not applied

**Reference:** Filter Validation

---

## 7. Integration Testing

### 7.1 Complete User Journey - Perfect Situation

**Test Case:** INTEGRATION-PERFECT-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Complete parent workflow  
**Type:** A (Add)  
**Description:**
Complete end-to-end workflow:
1. Login with valid credentials
2. View dashboard overview
3. Navigate to Children page and create new child
4. Navigate to Wallet and top up balance
5. Navigate to Contracts and create new contract
6. Navigate to Sessions and verify scheduled sessions
7. View session details
8. Logout
- **Expected Result:** 
  - All steps complete successfully
  - Data consistent across all pages
  - Navigation smooth without errors
  - Session maintained throughout

**Reference:** End-to-End User Journey

---

### 7.2 Integration - Error Recovery

**Test Case:** INTEGRATION-ERROR-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Error recovery during workflow  
**Type:** A (Add)  
**Description:**
Test error recovery:
1. Login successfully
2. Create child successfully
3. Simulate network error during contract creation
4. Recover from error
5. Complete contract creation
6. Verify data consistency
- **Expected Result:** 
  - System recovers from network error gracefully
  - No data loss
  - User can continue from where they left off
  - All data remains consistent

**Reference:** Error Recovery

---

## 8. Security Testing

### 8.1 Security - Authentication & Authorization

**Test Case:** SECURITY-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Session security  
**Type:** A (Add)  
**Description:**
- Log in successfully
- Copy session token/cookie
- Logout
- Attempt to use copied session token
- **Expected Result:** 
  - Old session token invalidated
  - Access denied with old token
  - Must authenticate again

**Reference:** Session Security

---

**Test Case:** SECURITY-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** XSS prevention in input fields  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Attempt to create child with name: `<script>alert('XSS')</script>`
- Save and view child details
- **Expected Result:** 
  - Script tags sanitized/escaped
  - No JavaScript execution
  - Data displayed safely

**Reference:** XSS Protection

---

**Test Case:** SECURITY-003  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** SQL injection prevention  
**Type:** A (Add)  
**Description:**
- Log in as parent
- Attempt to use SQL injection in search/filter fields
- Example: `'; DROP TABLE children; --`
- **Expected Result:** 
  - Input sanitized
  - No SQL execution
  - Safe error handling

**Reference:** SQL Injection Protection

---

## 9. Performance Testing

### 9.1 Performance - Page Load Times

**Test Case:** PERFORMANCE-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Page load performance  
**Type:** A (Add)  
**Description:**
- Measure page load times for:
  - Login page
  - Dashboard
  - Children list
  - Contracts list
  - Sessions list
  - Wallet page
- **Expected Result:** 
  - All pages load within 3 seconds
  - Interactive within 1 second
  - Smooth animations and transitions

**Reference:** Performance Benchmarks

---

### 9.2 Performance - Large Data Sets

**Test Case:** PERFORMANCE-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Performance with many children  
**Type:** A (Add)  
**Description:**
- Test with account having 10+ children
- Navigate to Children page
- **Expected Result:** 
  - Page loads efficiently
  - Pagination/virtualization if needed
  - No lag or freeze

**Reference:** Data Handling Performance

---

## 10. Responsive Design Testing

### 10.1 Mobile Responsiveness

**Test Case:** RESPONSIVE-001  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Mobile device testing  
**Type:** A (Add)  
**Description:**
- Access website on mobile device (or simulate mobile view)
- Test all major features
- **Expected Result:** 
  - All pages responsive
  - Touch-friendly interface
  - Navigation accessible
  - Forms usable on mobile

**Reference:** Mobile Compatibility

---

### 10.2 Browser Compatibility

**Test Case:** RESPONSIVE-002  
**Effective Date:** 2025-11-13  
**Version:** 1.0.0  
**Change Item:** Cross-browser testing  
**Type:** A (Add)  
**Description:**
- Test on multiple browsers:
  - Chrome
  - Firefox
  - Safari
  - Edge
- **Expected Result:** 
  - Consistent functionality across all browsers
  - No browser-specific bugs
  - Consistent styling

**Reference:** Browser Compatibility

---

## Summary

This comprehensive test plan covers:
- ✅ Login/Logout functionality (4 perfect scenarios, 4 error scenarios)
- ✅ View all tabs (6 perfect scenarios, 2 error scenarios)
- ✅ Create child (2 perfect scenarios, 5 error scenarios)
- ✅ Create contract (2 perfect scenarios, 5 error scenarios)
- ✅ Top up wallet (2 perfect scenarios, 5 error scenarios) - **Requires manual intervention**
- ✅ View sessions (5 perfect scenarios, 4 error scenarios)
- ✅ Integration testing (1 perfect scenario, 1 error scenario)
- ✅ Security testing (3 test cases)
- ✅ Performance testing (2 test cases)
- ✅ Responsive design testing (2 test cases)

**Total Test Cases:** 53

## Next Steps

1. Execute all test cases manually at https://web.vibe88.tech/
2. Use credentials: lncaomy@gmail.com / Phineas2005!
3. Document actual results for each test case
4. Contact administrator when testing wallet top-up functionality
5. Report any bugs or issues found
6. Update this document with actual test execution results

## Notes

- All tests should be performed in a clean test environment
- Document any deviations from expected results
- Take screenshots for visual verification
- Record any performance metrics
- Note any accessibility issues encountered

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-13  
**Status:** Test Plan Created - Awaiting Manual Execution
