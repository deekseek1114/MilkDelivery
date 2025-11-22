# Milk Delivery Management System

A full-stack Next.js application for managing milk deliveries, orders, and billing.

## Features

- **Admin Dashboard**:
  - Manage milk prices.
  - View daily orders.
  - Manage registered companies.
  - Send monthly bill reminders (Email/SMS simulation).
- **Company Dashboard**:
  - View daily and monthly consumption.
  - Schedule weekly deliveries.
  - Auto-fill schedule based on preferences.
  - View order history and pay bills (Mock payment).
  - Manage company settings (Default quantity, Skip days).
- **Authentication**: Secure login/signup using NextAuth.js.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB (Mongoose)
- **Auth**: NextAuth.js

## Getting Started

1.  **Prerequisites**:
    - Node.js installed.
    - MongoDB installed and running locally (or use a cloud URI).

2.  **Environment Setup**:
    - The `.env` file is pre-configured for local development:
      ```env
      MONGODB_URI=mongodb://localhost:27017/milk-delivery-app
      NEXTAUTH_SECRET=supersecretkey123
      NEXTAUTH_URL=http://localhost:3000
      ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Run the Application**:
    ```bash
    npm run dev
    ```

5.  **Access the App**:
    - Open [http://localhost:3000](http://localhost:3000).

## Usage Guide

### Admin Access
- You need to manually change a user's role to `admin` in the database to access the Admin Dashboard.
- **Steps**:
  1. Sign up as a new user.
  2. Open MongoDB Compass or Shell.
  3. Find the user in the `users` collection.
  4. Update the `role` field to `"admin"`.
  5. Log out and log back in.

### Company Access
- Sign up via the registration page.
- Go to **Settings** to configure your default milk quantity and skip days (e.g., Sundays).
- Go to **Schedule** to plan your week. Use "Auto-fill Defaults" to quickly populate based on settings.
- Go to **History** to view past orders and pay your monthly bill.

## Notes
- **Payments**: This app uses a mock payment flow. Clicking "Pay Bill" will record a payment without processing real money.
- **Notifications**: Emails and SMS are logged to the server console for demonstration purposes.
