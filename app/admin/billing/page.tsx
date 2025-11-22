"use client";

import { useState, useEffect } from "react";

interface Bill {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    month: string;
    totalLiters: number;
    totalAmount: number;
    status: string;
    dueDate: string;
    paymentLink: string;
}

export default function AdminBillingPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("");

    useEffect(() => {
        const now = new Date();
        const month = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        setSelectedMonth(month);
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/billing");
            const data = await res.json();
            setBills(data);
        } catch (error) {
            console.error("Failed to fetch bills:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateBill = async (userId: string) => {
        setGenerating(true);
        try {
            const res = await fetch("/api/billing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, month: selectedMonth }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || "Failed to generate bill");
                return;
            }

            alert("Bill generated successfully!");
            await fetchBills();
        } catch (error) {
            alert("Failed to generate bill");
        } finally {
            setGenerating(false);
        }
    };

    const updatePaymentStatus = async (billId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/billing", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ billId, status: newStatus }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || "Failed to update status");
                return;
            }

            alert("Payment status updated successfully!");
            await fetchBills();
        } catch (error) {
            alert("Failed to update payment status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Paid": return "bg-green-100 text-green-800";
            case "Pending": return "bg-yellow-100 text-yellow-800";
            case "Failed": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const generateAllBills = async () => {
        if (!confirm(`Generate bills for all companies? This will process all delivered orders.`)) {
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch("/api/admin/generate-bills", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || "Failed to generate bills");
                return;
            }

            const result = await res.json();
            alert(`Success! Generated ${result.billsGenerated} bills for ${result.month}`);
            await fetchBills();
        } catch (error) {
            alert("Failed to generate bills. Check console for details.");
            console.error("Error generating bills:", error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading bills...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Monthly Billing</h1>
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="MM-YYYY"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Liters</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bills.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    No bills found
                                </td>
                            </tr>
                        ) : (
                            bills.map((bill) => (
                                <tr key={bill._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{bill.userId.name}</div>
                                        <div className="text-sm text-gray-500">{bill.userId.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {bill.month}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {bill.totalLiters}L
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        ₹{bill.totalAmount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {new Date(bill.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    {bill.status != 'Paid' ? (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <select
                                                value={bill.status}
                                                onChange={(e) => updatePaymentStatus(bill._id, e.target.value)}
                                                className="px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 text-xs"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Failed">Failed</option>
                                            </select>

                                            <a
                                                href={bill.paymentLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs"
                                            >
                                                View Link
                                            </a>
                                        </td>) : (<td></td>)}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Generate Monthly Bills</h3>
                <p className="text-xs text-blue-700 mb-3">
                    This will generate bills for all companies based on delivered orders.
                    Razorpay payment links will be created and emails will be sent automatically.
                </p>
                <button
                    onClick={generateAllBills}
                    disabled={generating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? "Generating..." : "Generate All Bills"}
                </button>
            </div>
        </div>
    );
}
