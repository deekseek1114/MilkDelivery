# Integration Setup Guide

This guide explains how to set up and integrate Nodemailer, Razorpay, and node-cron in your Milk Delivery Management System.

## 📧 Email Integration (Nodemailer)

### 1. Install Dependencies
Already installed:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Configure SMTP Settings

Add to `.env.local`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=Milk Delivery Service
SMTP_FROM_EMAIL=your-email@gmail.com
```

### 3. Gmail App Password Setup

1. Go to https://myaccount.google.com/
2. Click on "Security" → "2-Step Verification" (enable if not already)
3. Scroll down to "App passwords"
4. Select "Mail" and your device
5. Copy the generated 16-character password
6. Use this password in `SMTP_PASSWORD`

### 4. Test Email Sending

Create a test file or use the notifications API:
```bash
POST http://localhost:3000/api/notifications
{
  "userId": "user_id",
  "type": "Email",
  "category": "Reminder",
  "message": "Test email"
}
```

### 5. Email Templates

The system includes beautiful HTML email templates for:
- Monthly statements
- Payment reminders
- Payment success notifications
- Payment failure notifications

All templates are in `lib/email.ts`.

---

## 💳 Razorpay Integration

### 1. Install Dependencies
Already installed:
```bash
npm install razorpay crypto
```

### 2. Create Razorpay Account

1. Sign up at https://dashboard.razorpay.com/
2. Complete KYC verification (required for live mode)
3. Start with Test Mode for development

### 3. Get API Credentials

1. Go to Settings → API Keys
2. Generate Test Keys (or Live Keys for production)
3. Copy:
   - Key ID (starts with `rzp_test_` or `rzp_live_`)
   - Key Secret

Add to `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
```

### 4. Configure Webhook

1. Go to Settings → Webhooks
2. Click "Create New Webhook"
3. Enter webhook URL: `https://yourdomain.com/api/webhook/payment`
4. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
5. Set "Active" to ON
6. Copy the webhook secret

Add to `.env.local`:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 5. Test Payment Flow

#### Create a test bill:
```bash
POST http://localhost:3000/api/billing
{
  "userId": "user_id",
  "month": "11-2025"
}
```

This will:
1. Generate a Razorpay payment link
2. Send email with payment link
3. Return bill details

#### Test payment:
1. Click the payment link from the email
2. Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### 6. Webhook Testing (Local Development)

For local testing, use ngrok or similar:
```bash
ngrok http 3000
```

Then update webhook URL to:
```
https://your-ngrok-url.ngrok.io/api/webhook/payment
```

---

## ⏰ Cron Job Setup (node-cron)

### 1. Install Dependencies
Already installed:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

### 2. Cron Jobs Configured

The system has two cron jobs:

#### Monthly Billing (Last day of month at 11:59 PM)
- Generates bills for all companies
- Sends monthly statements via email
- Creates Razorpay payment links

#### Payment Reminders (Daily at 10:00 AM)
- Checks for pending payments
- Sends reminder emails for approaching due dates

### 3. Start Cron Jobs

#### Option A: Auto-start with Next.js (Recommended for Development)

Create `app/api/cron/start/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { startAllCronJobs } from "@/lib/cron";

let cronJobs: any = null;

export async function GET() {
    if (!cronJobs) {
        cronJobs = startAllCronJobs();
        return NextResponse.json({ message: "Cron jobs started" });
    }
    return NextResponse.json({ message: "Cron jobs already running" });
}
```

Then call once: `GET http://localhost:3000/api/cron/start`

#### Option B: Standalone Cron Service (Recommended for Production)

Create `scripts/cron-service.ts`:
```typescript
import { startAllCronJobs } from '../lib/cron';

console.log('Starting cron service...');
const jobs = startAllCronJobs();

// Keep the process running
process.on('SIGINT', () => {
    console.log('Stopping cron service...');
    Object.values(jobs).forEach((job: any) => job.stop());
    process.exit(0);
});
```

Run with:
```bash
ts-node scripts/cron-service.ts
```

#### Option C: External Cron Service (Recommended for Serverless)

Use external services like:
- **Vercel Cron**: Add to `vercel.json`
- **AWS EventBridge**: Schedule Lambda functions
- **GitHub Actions**: Schedule workflows
- **Cron-job.org**: Free cron service

Example for Vercel:
```json
{
  "crons": [{
    "path": "/api/cron/monthly-billing",
    "schedule": "59 23 28-31 * *"
  }]
}
```

### 4. Manual Trigger (Testing)

You can manually trigger the monthly billing:
```bash
GET http://localhost:3000/api/cron/monthly-billing
Authorization: Bearer your_cron_secret
```

---

## 🔒 Security Checklist

- [ ] Generate strong random secrets for `NEXTAUTH_SECRET` and `CRON_SECRET`
- [ ] Never commit `.env.local` to version control
- [ ] Use App Passwords for Gmail (not your actual password)
- [ ] Verify Razorpay webhook signatures
- [ ] Use HTTPS in production
- [ ] Rotate secrets periodically
- [ ] Use different credentials for development and production
- [ ] Enable Razorpay webhook signature verification
- [ ] Implement rate limiting on webhook endpoints

---

## 🧪 Testing Checklist

### Email Testing
- [ ] Send test email via notifications API
- [ ] Verify email delivery
- [ ] Check spam folder if not received
- [ ] Test all email templates (statement, reminder, success, failure)

### Razorpay Testing
- [ ] Create test bill
- [ ] Receive payment link via email
- [ ] Complete test payment (success case)
- [ ] Complete test payment (failure case)
- [ ] Verify webhook receives payment events
- [ ] Check bill status updates correctly
- [ ] Verify payment record creation

### Cron Jobs Testing
- [ ] Manually trigger monthly billing endpoint
- [ ] Verify bills are generated
- [ ] Check emails are sent
- [ ] Verify payment links are created
- [ ] Test cron schedule (wait for scheduled time or adjust for testing)

---

## 📊 Monitoring

### Logs to Monitor

1. **Email Logs**
   - `[EMAIL] Message sent: <messageId>`
   - `[EMAIL] Error sending email: <error>`

2. **Razorpay Logs**
   - `[RAZORPAY] Order created: <orderId>`
   - `[RAZORPAY] Signature verified successfully`
   - `[WEBHOOK] Payment successful/failed`

3. **Cron Logs**
   - `[CRON] Running monthly billing job...`
   - `[CRON] Monthly billing completed: <result>`

### Production Monitoring

Consider using:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: Application monitoring
- **CloudWatch**: AWS logs (if using AWS)

---

## 🚀 Production Deployment

### Environment Variables

Set all required environment variables in your hosting platform:

**Vercel:**
1. Go to Project Settings
2. Environment Variables
3. Add all variables from `.env.local`
4. Set for Production, Preview, and Development

**AWS/Docker:**
1. Use AWS Systems Manager Parameter Store
2. Or use `.env` file with docker-compose
3. Ensure secrets are encrypted at rest

### Webhook URL

Update Razorpay webhook URL to production:
```
https://yourdomain.com/api/webhook/payment
```

### Cron Jobs

Choose deployment strategy:
- Vercel Cron (if using Vercel)
- AWS EventBridge + Lambda
- Standalone cron service on EC2/VPS
- External cron service

---

## 🆘 Troubleshooting

### Email Not Sending

1. Check SMTP credentials
2. Verify Gmail App Password is correct
3. Check if 2-Step Verification is enabled
4. Try different SMTP provider (SendGrid, Mailgun)
5. Check firewall/network settings

### Razorpay Payment Failing

1. Verify API keys are correct
2. Check if using Test Mode keys for testing
3. Verify webhook URL is accessible
4. Check webhook signature verification
5. Review Razorpay dashboard logs

### Cron Jobs Not Running

1. Verify cron service is started
2. Check cron expression syntax
3. Verify timezone settings
4. Check CRON_SECRET is correct
5. Review application logs

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [node-cron Documentation](https://github.com/node-cron/node-cron)
- [Cron Expression Generator](https://crontab.guru/)

---

## ✅ Quick Start Summary

1. **Install dependencies** (already done)
2. **Configure `.env.local`** with all credentials
3. **Set up Gmail App Password**
4. **Create Razorpay account** and get API keys
5. **Configure Razorpay webhook**
6. **Start cron jobs** (choose method)
7. **Test each integration**
8. **Deploy to production**

Your system is now fully integrated with email, payments, and automated billing!
