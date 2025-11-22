import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Razorpay Payment Service
 * Handles payment creation and verification
 */

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Create a Razorpay payment order
 * @param amount - Amount in rupees (will be converted to paise)
 * @param billId - Bill ID for reference
 * @param userId - User ID for reference
 */
export async function createPaymentOrder(
    amount: number,
    billId: string,
    userId: string
): Promise<any> {
    try {
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `bill_${billId}`,
            notes: {
                billId,
                userId,
            },
        };

        const order = await razorpay.orders.create(options);
        console.log('[RAZORPAY] Order created:', order.id);
        return order;
    } catch (error) {
        console.error('[RAZORPAY] Error creating order:', error);
        throw error;
    }
}

/**
 * Verify Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    try {
        const text = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(text)
            .digest('hex');

        const isValid = expectedSignature === signature;

        if (isValid) {
            console.log('[RAZORPAY] Signature verified successfully');
        } else {
            console.error('[RAZORPAY] Invalid signature');
        }

        return isValid;
    } catch (error) {
        console.error('[RAZORPAY] Error verifying signature:', error);
        return false;
    }
}

/**
 * Verify webhook signature
 * @param body - Webhook request body (as string)
 * @param signature - Razorpay webhook signature from header
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
            .update(body)
            .digest('hex');

        const isValid = expectedSignature === signature;

        if (isValid) {
            console.log('[RAZORPAY] Webhook signature verified successfully');
        } else {
            console.error('[RAZORPAY] Invalid webhook signature');
        }

        return isValid;
    } catch (error) {
        console.error('[RAZORPAY] Error verifying webhook signature:', error);
        return false;
    }
}

/**
 * Fetch payment details
 * @param paymentId - Razorpay payment ID
 */
export async function fetchPayment(paymentId: string): Promise<any> {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('[RAZORPAY] Error fetching payment:', error);
        throw error;
    }
}

/**
 * Generate payment link
 * @param amount - Amount in rupees
 * @param billId - Bill ID
 * @param userId - User ID
 * @param customerName - Customer name
 * @param customerEmail - Customer email
 * @param customerPhone - Customer phone (optional)
 */
export async function createPaymentLink(
    amount: number,
    billId: string,
    userId: string,
    customerName: string,
    customerEmail: string,
    customerPhone?: string
): Promise<string> {
    try {
        const options: any = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            description: `Monthly Milk Delivery Bill - ${billId}`,
            customer: {
                name: customerName,
                email: customerEmail,
            },
            notify: {
                sms: true,
                email: true,
            },
            reminder_enable: true,
            notes: {
                billId,
                userId,
            },
            callback_url: `${process.env.NEXTAUTH_URL}/payment/callback`,
            callback_method: 'get',
        };

        if (customerPhone) {
            options.customer.contact = customerPhone;
        }

        const paymentLink = await razorpay.paymentLink.create(options);
        console.log('[RAZORPAY] Payment link created:', paymentLink.short_url);
        return paymentLink.short_url;
    } catch (error) {
        console.error('[RAZORPAY] Error creating payment link:', error);
        throw error;
    }
}
