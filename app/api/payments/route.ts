import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PaymentRecord from "@/models/PaymentRecord";
import MonthlyBill from "@/models/MonthlyBill";

/**
 * POST /api/payments
 * Create a manual payment record (Admin only)
 * This is typically used for cash/offline payments
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

        // Only admin can create manual payment records
        if (session.user.role !== "admin") {
            return NextResponse.json(
                { message: "Unauthorized - Admin access required" },
                { status: 401 }
            );
        }

        // Parse request body
        const { billId, amount, transactionId, method, status } = await req.json();

        // Validate required fields
        if (!billId || !amount || !transactionId) {
            return NextResponse.json(
                { message: "billId, amount, and transactionId are required" },
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

        // Create payment record
        const payment = await PaymentRecord.create({
            billId: bill._id,
            userId: bill.userId,
            amount,
            transactionId,
            status: status || "Success", // Default to Success for manual payments
            method: method || "Cash",
            paymentDate: new Date()
        });

        // Update bill status if payment is successful
        if (payment.status === "Success") {
            bill.status = "Paid";
            await bill.save();
        }

        console.log(`[PAYMENT] Manual payment recorded for Bill ${billId}. Transaction: ${transactionId}`);

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json(
            { message: "Failed to create payment", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/payments
 * Fetch payment records
 * - Company users: See only their own payments
 * - Admin users: See all payments or filter by userId
 */
export async function GET(req: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        await dbConnect();

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const userIdParam = searchParams.get("userId");
        const billIdParam = searchParams.get("billId");

        // Build query based on user role
        let query: any = {};

        // Company users can only see their own payments
        if (session.user.role === "company") {
            query.userId = session.user.id;
        }
        // Admin can filter by specific user
        else if (userIdParam) {
            query.userId = userIdParam;
        }

        // Filter by specific bill
        if (billIdParam) {
            query.billId = billIdParam;
        }

        // Fetch payments with user and bill details
        const payments = await PaymentRecord.find(query)
            .sort({ createdAt: -1 })
            .populate("userId", "name email")
            .populate("billId", "month totalAmount");

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json(
            { message: "Failed to fetch payments", error: String(error) },
            { status: 500 }
        );
    }
}
