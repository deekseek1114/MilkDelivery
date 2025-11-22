# Production Environment Variables Template

Copy the content below into a file named `.env.production` (or `.env` in your production environment like Vercel).

```env
# Database Connection
# Use your production MongoDB connection string (e.g., MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/milk-delivery-prod

# NextAuth Configuration
# URL of your deployed application (e.g., https://your-app.vercel.app)
NEXTAUTH_URL=https://your-production-domain.com
# Generate a secure random string: `openssl rand -base64 32`
NEXTAUTH_SECRET=generate_a_secure_random_secret_here

# Razorpay Payments (Production Keys)
# Get these from your Razorpay Dashboard > Settings > API Keys (Live Mode)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
# Set this in Razorpay Dashboard > Settings > Webhooks
RAZORPAY_WEBHOOK_SECRET=your_production_webhook_secret

# Email Configuration (SMTP)
# You can use the same Gmail App Password or a dedicated transactional email service (SendGrid, AWS SES, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME="Milk Delivery Service"

# Cron Job Security
# Secret key to secure your cron endpoints (e.g., /api/cron/monthly-billing)
# Use this same key when setting up cron jobs in Vercel or other schedulers
CRON_SECRET=generate_a_secure_cron_secret_here

# Public App URL
# Used for generating links in emails
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```
