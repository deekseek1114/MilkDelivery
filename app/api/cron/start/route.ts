import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Store cron jobs in memory
let cronJobs: any = null;

/**
 * GET /api/cron/start
 * Start all cron jobs (Admin only)
 * This endpoint should be called once to initialize the cron scheduler
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

        // Check if cron jobs are already running
        if (cronJobs) {
            return NextResponse.json({
                message: "Cron jobs are already running",
                status: "active"
            });
        }

        // Start all cron jobs
        const { startAllCronJobs } = await import("@/lib/cron");
        cronJobs = startAllCronJobs();

        return NextResponse.json({
            message: "Cron jobs started successfully",
            status: "started",
            jobs: {
                monthlyBilling: "Last day of month at 11:59 PM",
                paymentReminder: "Daily at 10:00 AM"
            }
        });
    } catch (error) {
        console.error("Error starting cron jobs:", error);
        return NextResponse.json(
            { message: "Failed to start cron jobs", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/cron/start
 * Stop all cron jobs (Admin only)
 */
export async function DELETE(req: Request) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json(
                { message: "Unauthorized - Admin access required" },
                { status: 401 }
            );
        }

        // Check if cron jobs are running
        if (!cronJobs) {
            return NextResponse.json({
                message: "No cron jobs are currently running",
                status: "inactive"
            });
        }

        // Stop all cron jobs
        const { stopAllCronJobs } = await import("@/lib/cron");
        stopAllCronJobs(cronJobs);
        cronJobs = null;

        return NextResponse.json({
            message: "Cron jobs stopped successfully",
            status: "stopped"
        });
    } catch (error) {
        console.error("Error stopping cron jobs:", error);
        return NextResponse.json(
            { message: "Failed to stop cron jobs", error: String(error) },
            { status: 500 }
        );
    }
}
