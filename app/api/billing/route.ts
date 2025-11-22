import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import MilkOrder from "@/models/MilkOrder";
import MonthlyBill from "@/models/MonthlyBill";

/**
 * GET /api/billing
 * Fetch monthly bills
 * - Company users: See only their own bills
 * - Admin users: See all bills or filter by userId
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
        const monthParam = searchParams.get("month"); // Format: MM-YYYY
        const userIdParam = searchParams.get("userId");

        // Build query based on user role
        let query: any = {};

        // Company users can only see their own bills
        if (session.user.role === "company") {
            query.userId = session.user.id;
        }
        // Admin can filter by specific user
        else if (userIdParam) {
            query.userId = userIdParam;
        }

        // Filter by specific month
        if (monthParam) {
            query.month = monthParam;
        }

        // Fetch bills with user details
        const bills = await MonthlyBill.find(query)
            .sort({ createdAt: -1 })
            .populate("userId", "name email");

        return NextResponse.json(bills);
    } catch (error) {
        console.error("Error fetching bills:", error);
        return NextResponse.json(
            { message: "Failed to fetch bills", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * POST /api/billing
 * Generate a monthly bill for a user (Admin only)
 * - Calculates total from all delivered orders in the specified month
 * - Creates or updates the monthly bill record
 */
export async function POST(req: Request) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json(
                { message: "Unauthorized - Admin access required" },
                { status: 401 }
            );
        }

        // Parse request body
        const { userId, month } = await req.json(); // month format: MM-YYYY

        // Validate required fields
        if (!userId || !month) {
            return NextResponse.json(
                { message: "userId and month are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Parse month to get date range
        const [monthNum, year] = month.split("-");
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);

        // Get all delivered orders for this user in this month
        const deliveredOrders = await MilkOrder.find({
            userId,
            date: { $gte: startDate, $lte: endDate },
            status: "Delivered"
        });

        // Calculate totals
        const totalLiters = deliveredOrders.reduce((sum, order) => sum + order.quantity, 0);
        const totalAmount = deliveredOrders.reduce(
            (sum, order) => sum + (order.quantity * order.pricePerUnit),
            0
        );

        // Get user details for payment link
        const User = (await import("@/models/User")).default;
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Create Razorpay payment link
        let paymentLink = `${process.env.NEXTAUTH_URL}/payment/${userId}/${month}`;

        try {
            const { createPaymentLink } = await import("@/lib/razorpay");
            paymentLink = await createPaymentLink(
                totalAmount,
                `bill_${month}_${userId}`,
                userId,
                user.name,
                user.email,
                user.companyDetails?.phone
            );
        } catch (razorpayError) {
            console.error('[BILLING] Error creating Razorpay payment link:', razorpayError);
            // Continue with fallback link
        }

        // Create or update monthly bill
        const bill = await MonthlyBill.findOneAndUpdate(
            { userId, month },
            {
                userId,
                month,
                totalLiters,
                totalAmount,
                status: "Pending",
                dueDate: new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after month end
                paymentLink
            },
            { upsert: true, new: true }
        );

        // Send monthly statement email
        try {
            const { sendMonthlyStatement } = await import("@/lib/email");
            await sendMonthlyStatement(
                user.email,
                user.name,
                month,
                totalLiters,
                totalAmount,
                bill.dueDate,
                paymentLink
            );
            console.log(`[EMAIL] Monthly statement sent to ${user.email}`);
        } catch (emailError) {
            console.error('[EMAIL] Error sending monthly statement:', emailError);
        }

        console.log(`[BILLING] Bill generated for User ${userId} for ${month}. Total: ₹${totalAmount}`);

        return NextResponse.json(bill, { status: 201 });
    } catch (error) {
        console.error("Error generating bill:", error);
        return NextResponse.json(
            { message: "Failed to generate bill", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/billing
 * Update payment status of a bill (Admin only)
 * - Allows manual status updates: Pending, Paid, Failed
 */
export async function PATCH(req: Request) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json(
                { message: "Unauthorized - Admin access required" },
                { status: 401 }
            );
        }

        // Parse request body
        const { billId, status } = await req.json();

        // Validate status value
        const validStatuses = ['Pending', 'Paid', 'Failed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        await dbConnect();

        // Update bill status
        const bill = await MonthlyBill.findByIdAndUpdate(
            billId,
            { status },
            { new: true }
        );

        if (!bill) {
            return NextResponse.json(
                { message: "Bill not found" },
                { status: 404 }
            );
        }

        // Log notification (TODO: Integrate with actual email/SMS service)
        console.log(`[NOTIFICATION] Bill ${billId} status updated to ${status}`);

        return NextResponse.json(bill);
    } catch (error) {
        console.error("Error updating bill status:", error);
        return NextResponse.json(
            { message: "Failed to update bill status", error: String(error) },
            { status: 500 }
        );
    }
}
