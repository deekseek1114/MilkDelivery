import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import MilkOrder from "@/models/MilkOrder";
import PriceSettings from "@/models/PriceSettings";

/**
 * GET /api/orders
 * Fetch orders with optional filters (date, month)
 * - Company users: See only their own orders
 * - Admin users: See all orders
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
        const dateParam = searchParams.get("date");
        const monthParam = searchParams.get("month"); // Format: YYYY-MM

        // Build query based on user role
        let query: any = {};

        // Company users can only see their own orders
        if (session.user.role === "company") {
            query.userId = session.user.id;
        }

        // Filter by specific date
        if (dateParam) {
            const start = new Date(dateParam);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateParam);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }
        // Filter by month
        else if (monthParam) {
            const [year, monthIndex] = monthParam.split("-");
            const start = new Date(parseInt(year), parseInt(monthIndex) - 1, 1);
            const end = new Date(parseInt(year), parseInt(monthIndex), 0, 23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        // Fetch orders with user details
        const orders = await MilkOrder.find(query)
            .sort({ date: -1 })
            .populate("userId", "name email");

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { message: "Failed to fetch orders", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders
 * Create or update an order for a specific date
 * - Company users: Can only create orders for future dates (not today or past)
 * - Admin users: No restrictions
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
        const { date, quantity, status } = await req.json();

        // Validate required fields
        if (!date || !quantity) {
            return NextResponse.json(
                { message: "Date and quantity are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Normalize order date (remove time component)
        const orderDate = new Date(date);
        orderDate.setHours(0, 0, 0, 0);

        // RULE: Company users cannot modify orders for current date or past dates
        if (session.user.role === "company") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (orderDate <= today) {
                return NextResponse.json(
                    {
                        message: "Cannot modify orders for today or past dates. Orders must be scheduled at least 1 day in advance."
                    },
                    { status: 403 }
                );
            }
        }

        // Get current price per liter
        const currentPrice = await PriceSettings.findOne().sort({ effectiveDate: -1 });
        const pricePerUnit = currentPrice?.pricePerLiter || 0;

        // Create or update order (upsert)
        const order = await MilkOrder.findOneAndUpdate(
            { userId: session.user.id, date: orderDate },
            {
                userId: session.user.id,
                date: orderDate,
                quantity,
                status: status || "Pending",
                pricePerUnit,
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error creating/updating order:", error);
        return NextResponse.json(
            { message: "Failed to create/update order", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/orders
 * Update delivery status of an order (Admin only)
 * - Admin can only update orders from the current month
 * - Cannot edit orders from previous months
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
        const { orderId, status } = await req.json();

        // Validate status value
        const validStatuses = ['Pending', 'Delivered', 'Not Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the order
        const order = await MilkOrder.findById(orderId);
        if (!order) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        // RULE: Admin cannot edit orders from previous months
        const now = new Date();
        const orderDate = new Date(order.date);

        // Check if order is in the current month and year
        const isSameMonth =
            now.getMonth() === orderDate.getMonth() &&
            now.getFullYear() === orderDate.getFullYear();

        if (!isSameMonth) {
            return NextResponse.json(
                { message: "Cannot edit orders from previous months. Only current month orders can be updated." },
                { status: 403 }
            );
        }

        // Update the status
        order.status = status;
        await order.save();

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { message: "Failed to update order status", error: String(error) },
            { status: 500 }
        );
    }
}
