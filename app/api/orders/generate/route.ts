import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import MilkOrder from "@/models/MilkOrder";
import User from "@/models/User";
import PriceSettings from "@/models/PriceSettings";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { startDate, days } = await req.json();
    await dbConnect();

    const user = await User.findById(session.user.id);
    const defaultQuantity = user?.preferences?.defaultQuantity || 1;
    const skipDays = user?.preferences?.skipDays || [0]; // Default skip Sunday (0)

    const currentPrice = await PriceSettings.findOne().sort({ effectiveDate: -1 });
    const pricePerUnit = currentPrice?.pricePerLiter || 0;

    const orders = [];
    const start = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        date.setHours(0, 0, 0, 0);

        // Skip if day is in skipDays
        if (skipDays.includes(date.getDay())) {
            continue;
        }

        // Check if order already exists
        const existingOrder = await MilkOrder.findOne({ userId: session.user.id, date });
        if (existingOrder) {
            continue;
        }

        orders.push({
            userId: session.user.id,
            date,
            quantity: defaultQuantity,
            status: "pending",
            pricePerUnit,
        });
    }

    if (orders.length > 0) {
        await MilkOrder.insertMany(orders);
    }

    return NextResponse.json({ message: `Generated ${orders.length} orders`, count: orders.length });
}
