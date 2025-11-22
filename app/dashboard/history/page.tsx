"use client";

import { useState, useEffect } from "react";

interface Order {
    _id: string;
    date: string;
    quantity: number;
    status: string;
    pricePerUnit: number;
}

interface Bill {
    _id: string;
    month: string;
    totalLiters: number;
    totalAmount: number;
    status: string;
    dueDate: string;
    paymentLink: string;
}

export default function HistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, [month]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch orders
            const ordersRes = await fetch(`/api/orders?month=${month}`);
            const ordersData = await ordersRes.json();
            setOrders(ordersData);

            // Fetch bills
            const billsRes = await fetch(`/api/billing`);
            const billsData = await billsRes.json();
            setBills(billsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalCost = orders.reduce((acc, order) => acc + (order.quantity * order.pricePerUnit), 0);

    // Find bill for current month
    const currentMonthBill = bills.find(bill => {
        const [billMonth, billYear] = bill.month.split('-');
        const [selectedYear, selectedMonth] = month.split('-');
        return billMonth === selectedMonth && billYear === selectedYear;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
            case 'not delivered':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Order History & Bills</h1>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            {/* Monthly Bill Summary */}
            {currentMonthBill && (
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Monthly Bill - {currentMonthBill.month}</h2>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Total Liters: <span className="font-medium text-gray-900">{currentMonthBill.totalLiters}L</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Due Date: <span className="font-medium text-gray-900">{new Date(currentMonthBill.dueDate).toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                            <p className="text-3xl font-bold text-green-600">₹{currentMonthBill.totalAmount.toFixed(2)}</p>
                            <span className={`mt-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(currentMonthBill.status)}`}>
                                {currentMonthBill.status}
                            </span>
                        </div>
                    </div>

                    {currentMonthBill.status === 'Pending' && (
                        <a
                            href={currentMonthBill.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                            Pay Now via Razorpay
                        </a>
                    )}

                    {currentMonthBill.status === 'Paid' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-green-800 font-medium">✓ Payment Completed</p>
                            <p className="text-sm text-green-600 mt-1">Thank you for your payment!</p>
                        </div>
                    )}

                    {currentMonthBill.status === 'Failed' && (
                        <a
                            href={currentMonthBill.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                            Retry Payment
                        </a>
                    )}
                </div>
            )}

            {/* Orders Summary */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex justify-between items-center">
                <div>
                    <p className="text-gray-500 text-sm">Total Orders</p>
                    <p className="text-xl font-bold">{orders.length}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-sm">Calculated Cost</p>
                    <p className="text-2xl font-bold text-gray-900">₹{totalCost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Based on all orders</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold">Order Details</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/L</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No orders found for this month.</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}L</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.pricePerUnit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₹{(order.quantity * order.pricePerUnit).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Bills are generated monthly based on delivered orders.
                    Only delivered orders are included in the final bill amount.
                    You will receive an email with the payment link when your monthly bill is ready.
                </p>
            </div>
        </div>
    );
}
