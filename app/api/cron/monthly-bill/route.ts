import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import MilkOrder from "@/models/MilkOrder";
import PriceSettings from "@/models/PriceSettings";

export async function POST(req: Request) {
    // In production, verify a secret key header to prevent unauthorized access
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    await dbConnect();

    const users = await User.find({ role: "company" });
    const currentPrice = await PriceSettings.findOne().sort({ effectiveDate: -1 });
    const pricePerLiter = currentPrice?.pricePerLiter || 0;

    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const monthString = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const results = [];

    for (const user of users) {
        const orders = await MilkOrder.find({
            userId: user._id,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $ne: 'cancelled' }
        });

        if (orders.length === 0) continue;

        const totalQuantity = orders.reduce((acc, order) => acc + order.quantity, 0);
        const totalAmount = orders.reduce((acc, order) => acc + (order.quantity * order.pricePerUnit), 0);

        // Mock Sending Email/SMS
        console.log(`[EMAIL] To: ${user.email}`);
        console.log(`Subject: Monthly Milk Bill for ${monthString}`);
        console.log(`Body: Dear ${user.name}, your total consumption is ${totalQuantity}L. Amount due: ₹${totalAmount}. Pay here: http://localhost:3000/dashboard/history`);

        console.log(`[SMS] To: ${user.companyDetails?.phone}`);
        console.log(`Msg: Milk Bill ${monthString}: ₹${totalAmount}. Pay now: http://localhost:3000/dashboard/history`);

        results.push({
            user: user.name,
            amount: totalAmount,
            status: "Sent"
        });
    }

    return NextResponse.json({ message: "Reminders sent", results });
}
