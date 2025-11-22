import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import NotificationLog from "@/models/NotificationLog";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/notifications
 * Send a notification to a user (Admin only)
 * - Supports Email and SMS types
 * - Categories: Statement, Reminder, PaymentSuccess, PaymentFailure
 * - Logs all notifications in the database
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
        const { userId, type, category, message } = await req.json();

        // Validate notification type
        const validTypes = ['Email', 'SMS'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate notification category
        const validCategories = ['Statement', 'Reminder', 'PaymentSuccess', 'PaymentFailure'];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { message: `Invalid notification category. Must be one of: ${validCategories.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!userId || !message) {
            return NextResponse.json(
                { message: "userId and message are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fetch user details to get email
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (!user.email) {
            return NextResponse.json(
                { message: "User has no email address" },
                { status: 400 }
            );
        }

        try {
            let success = false;

            // Send email using Nodemailer
            if (type === 'Email') {
                console.log(`[NOTIFICATIONS] Sending email to ${user.email} (${user.name})`);

                success = await sendEmail(
                    user.email,
                    `Notification: ${category}`,
                    `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #2563eb;">${category}</h2>
                        <p>Dear ${user.name},</p>
                        <p>${message}</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #666;">Milk Delivery Service</p>
                    </div>
                    `,
                    message
                );
            }
            // SMS integration (TODO: Add Twilio or similar)
            else if (type === 'SMS') {
                console.log(`[SMS] Sending ${category} to User ${userId}: ${message}`);
                success = true; // Mark as success for now
            }

            // Log notification
            const notification = await NotificationLog.create({
                userId,
                type,
                category,
                message,
                status: success ? "Sent" : "Failed",
                sentAt: new Date()
            });

            if (!success) {
                return NextResponse.json(
                    { message: "Notification failed to send", notification },
                    { status: 500 }
                );
            }

            return NextResponse.json(notification, { status: 201 });
        } catch (sendError) {
            console.error("Notification sending error:", sendError);

            // Log failed notification
            const notification = await NotificationLog.create({
                userId,
                type,
                category,
                message,
                status: "Failed",
                sentAt: new Date()
            });

            return NextResponse.json(
                { message: "Notification failed to send", notification },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error processing notification:", error);
        return NextResponse.json(
            { message: "Failed to process notification", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications
 * Fetch notification history (Admin only)
 * - Optional filter by userId
 * - Returns last 100 notifications, sorted by most recent
 */
export async function GET(req: Request) {
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

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const userIdParam = searchParams.get("userId");

        // Build query
        let query: any = {};
        if (userIdParam) {
            query.userId = userIdParam;
        }

        // Fetch notifications with user details
        const notifications = await NotificationLog.find(query)
            .sort({ sentAt: -1 })
            .limit(100)
            .populate("userId", "name email");

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { message: "Failed to fetch notifications", error: String(error) },
            { status: 500 }
        );
    }
}
