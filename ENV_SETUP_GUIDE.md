# Environment Variables Configuration Guide

## Required Environment Variables

### Database Configuration
```env
MONGODB_URI=mongodb://localhost:27017/milk-delivery-app
```

### NextAuth Configuration
```env
NEXTAUTH_SECRET=your-super-secret-random-string-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

### Cron Job Secret
```env
CRON_SECRET=your-cron-secret-key-change-this-in-production
```

### Email Configuration (Nodemailer SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=Milk Delivery Service
SMTP_FROM_EMAIL=your-email@gmail.com
```

**Gmail Setup Instructions:**
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an "App Password" for Mail
4. Use the generated password in `SMTP_PASSWORD`

### Razorpay Configuration
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

**Razorpay Setup Instructions:**
1. Sign up at https://dashboard.razorpay.com/
2. Go to Settings → API Keys
3. Generate Test/Live keys
4. Copy Key ID and Key Secret
5. For webhook secret, go to Settings → Webhooks
6. Create a new webhook with URL: `https://yourdomain.com/api/webhook/payment`
7. Select events: `payment.captured` and `payment.failed`
8. Copy the webhook secret

## Security Notes

1. **Never commit `.env.local` to version control**
2. Generate strong random strings for secrets using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Use different secrets for development and production
4. Rotate secrets periodically
5. Use environment-specific configurations

## Production Deployment

For production, set these environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- AWS: Systems Manager → Parameter Store
- Docker: Use `.env` file or docker-compose environment section
