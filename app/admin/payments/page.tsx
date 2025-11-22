"use client";

import { useState, useEffect } from "react";

interface Payment {
    _id: string;
    userId: {
        name: string;
        email: string;
    };
    month: string;
    amount: number;
    status: string;
    transactionId: string;
    createdAt: string;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We need to update the payments API to populate user details
        // Currently /api/payments might not populate user if not explicitly handled
        // Let's check /api/payments/route.ts
        fetch("/api/payments")
            .then((res) => res.json())
            .then((data) => {
                setPayments(data);
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Payment Records</h1>

            <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No payments found.</td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{payment.userId?.name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500">{payment.userId?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.month}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹{payment.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.transactionId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
