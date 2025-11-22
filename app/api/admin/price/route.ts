import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PriceSettings from "@/models/PriceSettings";

export async function GET() {
    await dbConnect();
    const price = await PriceSettings.findOne().sort({ effectiveDate: -1 });
    return NextResponse.json({ price: price?.pricePerLiter || 0 });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { price } = await req.json();

    await dbConnect();
    const newPrice = await PriceSettings.create({
        pricePerLiter: price,
        effectiveDate: new Date(),
    });

    return NextResponse.json(newPrice, { status: 201 });
}
