import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MonthlyBill from "@/models/MonthlyBill";
import PaymentRecord from "@/models/PaymentRecord";
import User from "@/models/User";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendPaymentSuccess, sendPaymentFailure } from "@/lib/email";

/**
 * POST /api/webhook/payment
 * Razorpay payment webhook handler
 * - Receives payment status updates from Razorpay
 * - Verifies webhook signature for security
 * - Updates bill status automatically
 * - Creates payment record
 * - Sends email notifications to user
 */
export async function POST(req: Request) {
    try {
        // Get raw body for signature verification
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature') || '';

        // Verify Razorpay webhook signature
        if (!verifyWebhookSignature(body, signature)) {
            console.error('[WEBHOOK] Invalid signature');
            return NextResponse.json(
                { message: "Invalid signature" },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const payload = JSON.parse(body);
        const event = payload.event;

        // Handle payment.captured event
        if (event === 'payment.captured') {
            const payment = payload.payload.payment.entity;

            const billId = payment.notes?.billId;
            const userId = payment.notes?.userId;
            const transactionId = payment.id;
            const amount = payment.amount / 100; // Convert from paise to rupees
            const method = payment.method;

            if (!billId || !userId) {
                return NextResponse.json(
                    { message: "Missing billId or userId in payment notes" },
                    { status: 400 }
                );
            }

            await dbConnect();

            // Find the bill
            const bill = await MonthlyBill.findById(billId);
            if (!bill) {
                return NextResponse.json(
                    { message: "Bill not found" },
                    { status: 404 }
                );
            }

            // Update bill status to Paid
            bill.status = "Paid";
            await bill.save();

            // Create payment record
            const paymentRecord = await PaymentRecord.create({
                billId: bill._id,
                userId: bill.userId,
                amount,
                transactionId,
                status: "Success",
                method,
                paymentDate: new Date()
            });

            // Get user details for email
            const user = await User.findById(userId);
            if (user && user.email) {
                // Send success email
                await sendPaymentSuccess(
                    user.email,
                    user.name,
                    amount,
                    transactionId
                );
            }

            console.log(`[WEBHOOK] Payment successful for Bill ${billId}. Transaction: ${transactionId}`);

            return NextResponse.json(
                {
                    message: "Payment captured successfully",
                    payment: paymentRecord
                },
                { status: 200 }
            );
        }

        // Handle payment.failed event
        else if (event === 'payment.failed') {
            const payment = payload.payload.payment.entity;

            const billId = payment.notes?.billId;
            const userId = payment.notes?.userId;
            const transactionId = payment.id;
            const amount = payment.amount / 100;
            const method = payment.method;

            if (!billId || !userId) {
                return NextResponse.json(
                    { message: "Missing billId or userId in payment notes" },
                    { status: 400 }
                );
            }

            await dbConnect();

            // Find the bill
            const bill = await MonthlyBill.findById(billId);
            if (!bill) {
                return NextResponse.json(
                    { message: "Bill not found" },
                    { status: 404 }
                );
            }

            // Update bill status to Failed
            bill.status = "Failed";
            await bill.save();

            // Create payment record
            const paymentRecord = await PaymentRecord.create({
                billId: bill._id,
                userId: bill.userId,
                amount,
                transactionId,
                status: "Failed",
                method,
                paymentDate: new Date()
            });

            // Get user details for email
            const user = await User.findById(userId);
            if (user && user.email) {
                // Send failure email
                await sendPaymentFailure(
                    user.email,
                    user.name,
                    amount,
                    bill.paymentLink
                );
            }

            console.log(`[WEBHOOK] Payment failed for Bill ${billId}. Transaction: ${transactionId}`);

            return NextResponse.json(
                {
                    message: "Payment failure recorded",
                    payment: paymentRecord
                },
                { status: 200 }
            );
        }

        // Unknown event
        else {
            console.log(`[WEBHOOK] Unhandled event: ${event}`);
            return NextResponse.json(
                { message: `Event ${event} received but not handled` },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { message: "Webhook processing failed", error: String(error) },
            { status: 500 }
        );
    }
}
