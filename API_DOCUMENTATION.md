# API Documentation

## Overview
This document provides comprehensive documentation for all backend API routes in the Milk Delivery Management System.

---

## Authentication
All API routes require authentication unless specified otherwise. Include the session cookie in requests.

**Roles:**
- `company`: Regular company users
- `admin`: Administrative users

---

## Orders API

### GET /api/orders
Fetch orders with optional filters.

**Authentication:** Required  
**Roles:** All authenticated users

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `month` (optional): Filter by month (YYYY-MM)

**Access Control:**
- Company users: See only their own orders
- Admin users: See all orders

**Response:**
```json
[
  {
    "_id": "order_id",
    "userId": { "_id": "user_id", "name": "Company Name", "email": "email@example.com" },
    "date": "2025-11-22T00:00:00.000Z",
    "quantity": 2,
    "status": "Pending",
    "pricePerUnit": 22,
    "createdAt": "2025-11-22T10:00:00.000Z",
    "updatedAt": "2025-11-22T10:00:00.000Z"
  }
]
```

---

### POST /api/orders
Create or update an order for a specific date.

**Authentication:** Required  
**Roles:** All authenticated users

**Request Body:**
```json
{
  "date": "2025-11-23",
  "quantity": 2,
  "status": "Pending" // optional
}
```

**Business Rules:**
- Company users: Cannot create/modify orders for today or past dates
- Admin users: No restrictions
- Orders must be scheduled at least 1 day in advance (for companies)

**Response:**
```json
{
  "_id": "order_id",
  "userId": "user_id",
  "date": "2025-11-23T00:00:00.000Z",
  "quantity": 2,
  "status": "Pending",
  "pricePerUnit": 22
}
```

---

### PATCH /api/orders
Update delivery status of an order (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Request Body:**
```json
{
  "orderId": "order_id",
  "status": "Delivered"
}
```

**Valid Status Values:**
- `Pending`
- `Delivered`
- `Not Delivered`
- `Cancelled`

**Business Rules:**
- Admin can only update orders from the current month
- Cannot edit orders from previous months

**Response:**
```json
{
  "_id": "order_id",
  "status": "Delivered",
  ...
}
```

---

## Billing API

### GET /api/billing
Fetch monthly bills.

**Authentication:** Required  
**Roles:** All authenticated users

**Query Parameters:**
- `month` (optional): Filter by month (MM-YYYY)
- `userId` (optional, admin only): Filter by specific user

**Access Control:**
- Company users: See only their own bills
- Admin users: See all bills or filter by userId

**Response:**
```json
[
  {
    "_id": "bill_id",
    "userId": { "_id": "user_id", "name": "Company Name", "email": "email@example.com" },
    "month": "11-2025",
    "totalLiters": 60,
    "totalAmount": 1320,
    "status": "Pending",
    "dueDate": "2025-12-07T00:00:00.000Z",
    "paymentLink": "http://localhost:3000/payment/user_id/11-2025"
  }
]
```

---

### POST /api/billing
Generate a monthly bill for a user (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Request Body:**
```json
{
  "userId": "user_id",
  "month": "11-2025"
}
```

**Process:**
1. Finds all delivered orders for the user in the specified month
2. Calculates total liters and amount
3. Creates or updates the monthly bill
4. Sets due date to 7 days after month end

**Response:**
```json
{
  "_id": "bill_id",
  "userId": "user_id",
  "month": "11-2025",
  "totalLiters": 60,
  "totalAmount": 1320,
  "status": "Pending",
  "dueDate": "2025-12-07T00:00:00.000Z",
  "paymentLink": "http://localhost:3000/payment/user_id/11-2025"
}
```

---

### PATCH /api/billing
Update payment status of a bill (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Request Body:**
```json
{
  "billId": "bill_id",
  "status": "Paid"
}
```

**Valid Status Values:**
- `Pending`
- `Paid`
- `Failed`

**Response:**
```json
{
  "_id": "bill_id",
  "status": "Paid",
  ...
}
```

---

## Notifications API

### POST /api/notifications
Send a notification to a user (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Request Body:**
```json
{
  "userId": "user_id",
  "type": "Email",
  "category": "Reminder",
  "message": "Your payment is due in 3 days"
}
```

**Valid Types:**
- `Email`
- `SMS`

**Valid Categories:**
- `Statement`: Monthly statement
- `Reminder`: Payment reminder
- `PaymentSuccess`: Payment successful notification
- `PaymentFailure`: Payment failed notification

**Response:**
```json
{
  "_id": "notification_id",
  "userId": "user_id",
  "type": "Email",
  "category": "Reminder",
  "message": "Your payment is due in 3 days",
  "status": "Sent",
  "sentAt": "2025-11-22T10:00:00.000Z"
}
```

---

### GET /api/notifications
Fetch notification history (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Query Parameters:**
- `userId` (optional): Filter by specific user

**Response:**
```json
[
  {
    "_id": "notification_id",
    "userId": { "_id": "user_id", "name": "Company Name", "email": "email@example.com" },
    "type": "Email",
    "category": "Reminder",
    "message": "Your payment is due in 3 days",
    "status": "Sent",
    "sentAt": "2025-11-22T10:00:00.000Z"
  }
]
```

---

## Pricing API

### GET /api/pricing
Get the current price per liter.

**Authentication:** Required  
**Roles:** All authenticated users

**Response:**
```json
{
  "_id": "price_id",
  "pricePerLiter": 22,
  "effectiveDate": "2025-11-01T00:00:00.000Z",
  "createdAt": "2025-11-01T10:00:00.000Z"
}
```

---

### POST /api/pricing
Create a new price setting (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Request Body:**
```json
{
  "pricePerLiter": 25,
  "effectiveDate": "2025-12-01" // optional, defaults to now
}
```

**Note:** Price changes only affect new orders. Existing orders retain their original price.

**Response:**
```json
{
  "_id": "price_id",
  "pricePerLiter": 25,
  "effectiveDate": "2025-12-01T00:00:00.000Z",
  "createdAt": "2025-11-22T10:00:00.000Z"
}
```

---

## Webhook API

### POST /api/webhook/payment
Payment gateway webhook handler.

**Authentication:** None (verified by signature)  
**Note:** In production, implement webhook signature verification

**Request Body:**
```json
{
  "billId": "bill_id",
  "transactionId": "TXN123456",
  "status": "success",
  "amount": 1320,
  "method": "UPI"
}
```

**Process:**
1. Verifies webhook signature (TODO: implement)
2. Updates bill status based on payment result
3. Creates payment record
4. Sends notification to user

**Response:**
```json
{
  "message": "Webhook processed successfully",
  "payment": {
    "_id": "payment_id",
    "billId": "bill_id",
    "userId": "user_id",
    "amount": 1320,
    "transactionId": "TXN123456",
    "status": "Success",
    "method": "UPI",
    "paymentDate": "2025-11-22T10:00:00.000Z"
  }
}
```

---

## Cron Jobs

### GET /api/cron/monthly-billing
Automated monthly billing generation.

**Authentication:** Required (CRON_SECRET)  
**Header:** `Authorization: Bearer {CRON_SECRET}`

**Schedule:** Last day of each month

**Process:**
1. Gets all company users
2. For each company:
   - Finds all delivered orders in current month
   - Calculates total liters and amount
   - Creates/updates monthly bill
   - Sends monthly statement and payment reminder

**Response:**
```json
{
  "message": "Monthly billing completed successfully",
  "month": "11-2025",
  "billsGenerated": 5,
  "results": [
    {
      "companyId": "user_id",
      "companyName": "Company Name",
      "totalLiters": 60,
      "totalAmount": 1320,
      "billId": "bill_id"
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in or invalid credentials)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

---

## ✅ Integrations Completed

### Email Integration (Nodemailer)
**Status:** ✅ Fully Integrated

The system now uses Nodemailer for sending emails via SMTP.

**Features:**
- Beautiful HTML email templates
- Monthly statements with bill details
- Payment reminders
- Payment success/failure notifications
- Automatic email sending on bill generation and payment events

**Configuration Required:**
Add to `.env.local`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=Milk Delivery Service
SMTP_FROM_EMAIL=your-email@gmail.com
```

**See:** `INTEGRATION_GUIDE.md` for detailed setup instructions

---

### Payment Gateway Integration (Razorpay)
**Status:** ✅ Fully Integrated

The system now uses Razorpay for payment processing.

**Features:**
- Automatic payment link generation
- Webhook signature verification
- Payment status tracking
- Automatic bill status updates
- Email notifications on payment success/failure

**Configuration Required:**
Add to `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Webhook Events Handled:**
- `payment.captured`: Updates bill to "Paid", sends success email
- `payment.failed`: Updates bill to "Failed", sends failure email

**See:** `INTEGRATION_GUIDE.md` for detailed setup instructions

---

### Cron Job Scheduler (node-cron)
**Status:** ✅ Fully Integrated

The system now uses node-cron for automated task scheduling.

**Scheduled Jobs:**

1. **Monthly Billing** (Last day of month at 11:59 PM)
   - Generates bills for all companies
   - Creates Razorpay payment links
   - Sends monthly statement emails

2. **Payment Reminders** (Daily at 10:00 AM)
   - Checks for pending payments
   - Sends reminder emails for approaching due dates

**Starting Cron Jobs:**

Option 1 - Admin Dashboard:
```
GET /api/cron/start
```

Option 2 - Auto-start on server launch:
See `INTEGRATION_GUIDE.md` for implementation details

**See:** `INTEGRATION_GUIDE.md` for detailed setup instructions

---

## Additional API Endpoints

### GET /api/cron/start
Start all cron jobs (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Response:**
```json
{
  "message": "Cron jobs started successfully",
  "status": "started",
  "jobs": {
    "monthlyBilling": "Last day of month at 11:59 PM",
    "paymentReminder": "Daily at 10:00 AM"
  }
}
```

### DELETE /api/cron/start
Stop all cron jobs (Admin only).

**Authentication:** Required  
**Roles:** Admin only

**Response:**
```json
{
  "message": "Cron jobs stopped successfully",
  "status": "stopped"
}
```

---

## Documentation Files

- **`API_DOCUMENTATION.md`**: Complete API reference (this file)
- **`INTEGRATION_GUIDE.md`**: Step-by-step integration setup guide
- **`ENV_SETUP_GUIDE.md`**: Environment variables configuration guide
- **`COMPLETE_IMPLEMENTATION.md`**: Full system implementation summary

---

## Quick Start

1. Install dependencies (already done)
2. Configure `.env.local` with all credentials (see `ENV_SETUP_GUIDE.md`)
3. Set up Gmail App Password for email
4. Create Razorpay account and get API keys
5. Configure Razorpay webhook
6. Start the development server: `npm run dev`
7. Start cron jobs: `GET /api/cron/start` (as admin)
8. Test each integration

**For detailed instructions, see `INTEGRATION_GUIDE.md`**

