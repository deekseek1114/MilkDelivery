import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import MonthlyBill from "@/models/MonthlyBill";
import PaymentRecord from "@/models/PaymentRecord";
import { fetchPayment } from "@/lib/razorpay";
import { sendPaymentSuccess } from "@/lib/email";
import User from "@/models/User";

/**
 * POST /api/payment/verify
 * Verify and record a payment (called from callback page)
 * This is used when webhooks can't reach localhost during development
 */
export async function POST(req: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        // Parse request body
        const { paymentId, paymentLinkId } = await req.json();

        if (!paymentId) {
            return NextResponse.json(
                { message: "Payment ID is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fetch payment details from Razorpay
        let paymentDetails;
        try {
            paymentDetails = await fetchPayment(paymentId);
        } catch (error) {
            console.error("[PAYMENT] Error fetching payment from Razorpay:", error);
            return NextResponse.json(
                { message: "Could not verify payment with Razorpay" },
                { status: 500 }
            );
        }

        // Extract bill information from payment notes
        const billId = paymentDetails.notes?.billId;
        const userId = paymentDetails.notes?.userId;

        if (!billId) {
            // If no billId in notes, try to find bill by user and current month
            const now = new Date();
            const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

            const bill = await MonthlyBill.findOne({
                userId: session.user.id,
                month: currentMonth,
                status: "Pending"
            });

            if (!bill) {
                return NextResponse.json(
                    { message: "Could not find associated bill" },
                    { status: 404 }
                );
            }

            // Update this bill
            return await updateBillAndCreateRecord(
                bill,
                paymentDetails,
                session.user.id
            );
        }

        // Find the bill by ID
        const bill = await MonthlyBill.findById(billId);
        if (!bill) {
            return NextResponse.json(
                { message: "Bill not found" },
                { status: 404 }
            );
        }

        // Verify user owns this bill (unless admin)
        if (session.user.role !== "admin" && bill.userId.toString() !== session.user.id) {
            return NextResponse.json(
                { message: "Unauthorized - Not your bill" },
                { status: 403 }
            );
        }

        return await updateBillAndCreateRecord(bill, paymentDetails, userId || session.user.id);

    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { message: "Payment verification failed", error: String(error) },
            { status: 500 }
        );
    }
}

async function updateBillAndCreateRecord(bill: any, paymentDetails: any, userId: string) {
    // Check if payment is successful
    if (paymentDetails.status !== "captured") {
        return NextResponse.json(
            { message: "Payment not successful", status: paymentDetails.status },
            { status: 400 }
        );
    }

    // Check if payment already recorded
    const existingPayment = await PaymentRecord.findOne({
        transactionId: paymentDetails.id
    });

    if (existingPayment) {
        return NextResponse.json({
            message: "Payment already recorded",
            bill: {
                _id: bill._id,
                status: bill.status
            }
        });
    }

    // Update bill status to Paid
    bill.status = "Paid";
    await bill.save();

    // Create payment record
    const paymentRecord = await PaymentRecord.create({
        billId: bill._id,
        userId: bill.userId,
        amount: paymentDetails.amount / 100, // Convert from paise to rupees
        transactionId: paymentDetails.id,
        status: "Success",
        method: paymentDetails.method,
        paymentDate: new Date(paymentDetails.created_at * 1000)
    });

    // Send success email
    try {
        const user = await User.findById(userId);
        if (user && user.email) {
            await sendPaymentSuccess(
                user.email,
                user.name,
                paymentDetails.amount / 100,
                paymentDetails.id
            );
        }
    } catch (emailError) {
        console.error("[EMAIL] Error sending payment success email:", emailError);
    }

    console.log(`[PAYMENT] Payment verified and recorded for Bill ${bill._id}. Transaction: ${paymentDetails.id}`);

    return NextResponse.json({
        message: "Payment verified successfully",
        bill: {
            _id: bill._id,
            status: bill.status,
            totalAmount: bill.totalAmount
        },
        payment: {
            _id: paymentRecord._id,
            transactionId: paymentRecord.transactionId,
            amount: paymentRecord.amount
        }
    });
}
