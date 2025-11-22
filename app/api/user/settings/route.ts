import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select("preferences companyDetails");
    return NextResponse.json(user);
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { defaultQuantity, skipDays, address, phone, contactPerson } = await req.json();
    await dbConnect();

    const user = await User.findByIdAndUpdate(
        session.user.id,
        {
            $set: {
                "preferences.defaultQuantity": defaultQuantity,
                "preferences.skipDays": skipDays,
                "companyDetails.address": address,
                "companyDetails.phone": phone,
                "companyDetails.contactPerson": contactPerson,
            },
        },
        { new: true }
    );

    return NextResponse.json(user);
}
