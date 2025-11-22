import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import MilkOrder from "@/models/MilkOrder";
import PriceSettings from "@/models/PriceSettings";
import { redirect } from "next/navigation";
import RemindersButton from "./components/RemindersButton";
import Link from "next/link";

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/login");
    }

    await dbConnect();

    const totalUsers = await User.countDocuments({ role: "company" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysOrders = await MilkOrder.countDocuments({
        date: { $gte: today, $lt: tomorrow },
    });

    const currentPrice = await PriceSettings.findOne().sort({ effectiveDate: -1 });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Total Companies</h3>
                    <p className="text-3xl font-bold mt-2">{totalUsers}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Orders</h3>
                    <p className="text-3xl font-bold mt-2">{todaysOrders}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Current Price</h3>
                    <p className="text-3xl font-bold mt-2">₹{currentPrice?.pricePerLiter || 0}/L</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/admin/prices" className="block p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition">
                        <h3 className="font-medium text-blue-700">Update Prices</h3>
                        <p className="text-sm text-blue-600 mt-1">Set the milk price per liter.</p>
                    </Link>
                    <Link href="/admin/orders" className="block p-4 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition">
                        <h3 className="font-medium text-indigo-700">View Orders</h3>
                        <p className="text-sm text-indigo-600 mt-1">Check daily milk delivery schedules.</p>
                    </Link>
                    <RemindersButton />
                </div>
            </div>
        </div>
    );
}
