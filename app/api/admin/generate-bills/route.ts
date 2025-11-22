import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import MilkOrder from "@/models/MilkOrder";
import MonthlyBill from "@/models/MonthlyBill";
import User from "@/models/User";

/**
 * POST /api/admin/generate-bills
 * Generate monthly bills for all companies (Admin only)
 * This is a wrapper around the billing logic for admin UI use
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

        await dbConnect();

        // Get current month details
        const now = new Date();
        const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Get all company users
        const companies = await User.find({ role: "company" });

        const results = [];

        // Process each company
        for (const company of companies) {
            // Get all delivered orders for this company in current month
            const deliveredOrders = await MilkOrder.find({
                userId: company._id,
                date: { $gte: monthStart, $lte: monthEnd },
                status: "Delivered"
            });

            // Skip if no delivered orders
            if (deliveredOrders.length === 0) {
                console.log(`[BILLING] No delivered orders for ${company.name} in ${currentMonth}`);
                continue;
            }

            // Calculate totals
            const totalLiters = deliveredOrders.reduce((sum, order) => sum + order.quantity, 0);
            const totalAmount = deliveredOrders.reduce(
                (sum, order) => sum + (order.quantity * order.pricePerUnit),
                0
            );

            // Create Razorpay payment link
            let paymentLink = `${process.env.NEXTAUTH_URL}/payment/${company._id}/${currentMonth}`;

            try {
                const { createPaymentLink } = await import("@/lib/razorpay");
                paymentLink = await createPaymentLink(
                    totalAmount,
                    `bill_${currentMonth}_${company._id}`,
                    company._id.toString(),
                    company.name,
                    company.email,
                    company.companyDetails?.phone
                );
            } catch (razorpayError) {
                console.error(`[BILLING] Error creating Razorpay payment link for ${company.name}:`, razorpayError);
                // Continue with fallback link
            }

            // Create or update monthly bill
            const bill = await MonthlyBill.findOneAndUpdate(
                { userId: company._id, month: currentMonth },
                {
                    userId: company._id,
                    month: currentMonth,
                    totalLiters,
                    totalAmount,
                    status: "Pending",
                    dueDate: new Date(monthEnd.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after month end
                    paymentLink
                },
                { upsert: true, new: true }
            );

            // Send monthly statement email
            try {
                const { sendMonthlyStatement } = await import("@/lib/email");
                await sendMonthlyStatement(
                    company.email,
                    company.name,
                    currentMonth,
                    totalLiters,
                    totalAmount,
                    bill.dueDate,
                    paymentLink
                );
                console.log(`[EMAIL] Monthly statement sent to ${company.email}`);
            } catch (emailError) {
                console.error(`[EMAIL] Error sending monthly statement to ${company.name}:`, emailError);
            }

            results.push({
                companyId: company._id,
                companyName: company.name,
                totalLiters,
                totalAmount,
                billId: bill._id
            });
        }

        return NextResponse.json({
            message: "Monthly billing completed successfully",
            month: currentMonth,
            billsGenerated: results.length,
            results
        });
    } catch (error) {
        console.error("Monthly billing error:", error);
        return NextResponse.json(
            { message: "Monthly billing failed", error: String(error) },
            { status: 500 }
        );
    }
}
