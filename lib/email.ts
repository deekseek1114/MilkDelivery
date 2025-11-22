import nodemailer from 'nodemailer';

/**
 * Email Service using Nodemailer
 * Sends emails via SMTP
 */

// Create reusable transporter
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;

console.log('[EMAIL] Configuring transporter with:', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || '587',
    user: smtpUser ? `${smtpUser.substring(0, 3)}***@***` : 'undefined',
    passLength: smtpPass ? smtpPass.length : 0
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

/**
 * Send email
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text content (optional)
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
): Promise<boolean> {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Milk Delivery'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            text: text || '',
            html,
        });

        console.log('[EMAIL] Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('[EMAIL] Error sending email:', error);
        return false;
    }
}

/**
 * Send monthly statement email
 */
export async function sendMonthlyStatement(
    to: string,
    companyName: string,
    month: string,
    totalLiters: number,
    totalAmount: number,
    dueDate: Date,
    paymentLink: string
): Promise<boolean> {
    const subject = `Monthly Milk Delivery Statement - ${month}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9fafb; }
                .summary { background-color: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .total { font-size: 20px; font-weight: bold; color: #2563eb; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Monthly Statement</h1>
                    <p>${month}</p>
                </div>
                <div class="content">
                    <p>Dear ${companyName},</p>
                    <p>Here is your monthly milk delivery statement for ${month}:</p>
                    
                    <div class="summary">
                        <div class="summary-item">
                            <span>Total Liters Delivered:</span>
                            <strong>${totalLiters}L</strong>
                        </div>
                        <div class="summary-item">
                            <span>Total Amount:</span>
                            <strong class="total">₹${totalAmount.toFixed(2)}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Due Date:</span>
                            <strong>${dueDate.toLocaleDateString()}</strong>
                        </div>
                    </div>
                    
                    <p>Please make the payment before the due date to avoid any service interruption.</p>
                    
                    <center>
                        <a href="${paymentLink}" class="button">Pay Now</a>
                    </center>
                </div>
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(to, subject, html);
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder(
    to: string,
    companyName: string,
    amount: number,
    dueDate: Date,
    paymentLink: string
): Promise<boolean> {
    const subject = 'Payment Reminder - Milk Delivery Service';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #fffbeb; }
                .amount { font-size: 24px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Payment Reminder</h1>
                </div>
                <div class="content">
                    <p>Dear ${companyName},</p>
                    <p>This is a friendly reminder that your payment is due soon.</p>
                    
                    <div class="amount">₹${amount.toFixed(2)}</div>
                    
                    <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
                    
                    <p>Please make the payment at your earliest convenience to avoid any service interruption.</p>
                    
                    <center>
                        <a href="${paymentLink}" class="button">Pay Now</a>
                    </center>
                </div>
                <div class="footer">
                    <p>Thank you for your prompt attention to this matter.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(to, subject, html);
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccess(
    to: string,
    companyName: string,
    amount: number,
    transactionId: string
): Promise<boolean> {
    const subject = 'Payment Successful - Milk Delivery Service';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f0fdf4; }
                .amount { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
                .transaction { background-color: white; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Payment Successful!</h1>
                </div>
                <div class="content">
                    <p>Dear ${companyName},</p>
                    <p>We have successfully received your payment.</p>
                    
                    <div class="amount">₹${amount.toFixed(2)}</div>
                    
                    <div class="transaction">
                        <p><strong>Transaction ID:</strong></p>
                        <p style="font-family: monospace; color: #6b7280;">${transactionId}</p>
                    </div>
                    
                    <p>Thank you for your payment. Your service will continue uninterrupted.</p>
                </div>
                <div class="footer">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(to, subject, html);
}

/**
 * Send payment failure email
 */
export async function sendPaymentFailure(
    to: string,
    companyName: string,
    amount: number,
    paymentLink: string
): Promise<boolean> {
    const subject = 'Payment Failed - Milk Delivery Service';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #fef2f2; }
                .amount { font-size: 24px; font-weight: bold; color: #ef4444; text-align: center; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Payment Failed</h1>
                </div>
                <div class="content">
                    <p>Dear ${companyName},</p>
                    <p>Unfortunately, your recent payment attempt was unsuccessful.</p>
                    
                    <div class="amount">₹${amount.toFixed(2)}</div>
                    
                    <p>Please try again or contact your bank for assistance.</p>
                    
                    <center>
                        <a href="${paymentLink}" class="button">Try Again</a>
                    </center>
                </div>
                <div class="footer">
                    <p>If you continue to experience issues, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(to, subject, html);
}
