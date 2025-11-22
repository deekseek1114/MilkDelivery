import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MilkOrder from "@/models/MilkOrder";

// Migration script to update old status values to new capitalized format
export async function GET(req: Request) {
    try {
        await dbConnect();

        // Update all old lowercase status values to capitalized
        const updates = [
            { old: 'pending', new: 'Pending' },
            { old: 'delivered', new: 'Delivered' },
            { old: 'not delivered', new: 'Not Delivered' },
            { old: 'cancelled', new: 'Cancelled' },
            { old: 'skipped', new: 'Cancelled' }
        ];

        let totalUpdated = 0;

        for (const update of updates) {
            const result = await MilkOrder.updateMany(
                { status: update.old },
                { $set: { status: update.new } }
            );
            totalUpdated += result.modifiedCount || 0;
        }

        return NextResponse.json({
            message: "Migration completed successfully",
            recordsUpdated: totalUpdated
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { message: "Migration failed", error: String(error) },
            { status: 500 }
        );
    }
}
