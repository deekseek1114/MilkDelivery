import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import MilkOrder from "@/models/MilkOrder";
import PriceSettings from "@/models/PriceSettings";
import { redirect } from "next/navigation";

export default async function CompanyDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "company") {
        redirect("/login");
    }

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysOrder = await MilkOrder.findOne({
        userId: session.user.id,
        date: { $gte: today, $lt: tomorrow },
    });

    const currentPrice = await PriceSettings.findOne().sort({ effectiveDate: -1 });

    // Calculate current month total
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyOrders = await MilkOrder.find({
        userId: session.user.id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'cancelled' }
    });

    const totalLiters = monthlyOrders.reduce((acc, order) => acc + order.quantity, 0);
    const estimatedBill = monthlyOrders.reduce((acc, order) => acc + (order.quantity * order.pricePerUnit), 0);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Welcome, {session.user.name}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Milk</h3>
                    <p className="text-3xl font-bold mt-2">
                        {todaysOrder ? `${todaysOrder.quantity}L` : "Not Scheduled"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Status: <span className="capitalize">{todaysOrder?.status || "N/A"}</span>
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Month Consumption</h3>
                    <p className="text-3xl font-bold mt-2">{totalLiters}L</p>
                    <p className="text-sm text-gray-500 mt-1">Total liters this month</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Estimated Bill</h3>
                    <p className="text-3xl font-bold mt-2">₹{estimatedBill}</p>
                    <p className="text-sm text-gray-500 mt-1">Current price: ₹{currentPrice?.pricePerLiter || 0}/L</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Manage Delivery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/dashboard/schedule" className="block p-4 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition">
                        <h3 className="font-medium text-green-700">Schedule Delivery</h3>
                        <p className="text-sm text-green-600 mt-1">Change quantity, skip days, or cancel.</p>
                    </a>
                    <a href="/dashboard/history" className="block p-4 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100 transition">
                        <h3 className="font-medium text-yellow-700">Order History</h3>
                        <p className="text-sm text-yellow-600 mt-1">View past orders and payments.</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
