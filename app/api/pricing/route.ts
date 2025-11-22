import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PriceSettings from "@/models/PriceSettings";

/**
 * GET /api/pricing
 * Get the current price per liter
 * - Returns the most recent price setting
 * - Available to all authenticated users
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

        // Get the most recent price setting
        const currentPrice = await PriceSettings.findOne().sort({ effectiveDate: -1 });

        if (!currentPrice) {
            return NextResponse.json(
                { message: "No price set yet. Please contact admin." },
                { status: 404 }
            );
        }

        return NextResponse.json(currentPrice);
    } catch (error) {
        console.error("Error fetching price:", error);
        return NextResponse.json(
            { message: "Failed to fetch price", error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * POST /api/pricing
 * Create a new price setting (Admin only)
 * - Sets a new price per liter
 * - Optional effective date (defaults to now)
 * - Price changes only affect new orders
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
        const { pricePerLiter, effectiveDate } = await req.json();

        // Validate price
        if (!pricePerLiter || pricePerLiter <= 0) {
            return NextResponse.json(
                { message: "Invalid price. Price must be greater than 0." },
                { status: 400 }
            );
        }

        await dbConnect();

        // Create new price setting
        const newPrice = await PriceSettings.create({
            pricePerLiter,
            effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
        });

        // Log the price change
        console.log(`[ADMIN] Price updated to ₹${pricePerLiter}/L effective from ${newPrice.effectiveDate}`);

        return NextResponse.json(newPrice, { status: 201 });
    } catch (error) {
        console.error("Error updating price:", error);
        return NextResponse.json(
            { message: "Failed to update price", error: String(error) },
            { status: 500 }
        );
    }
}
