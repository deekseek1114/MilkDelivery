"use client";

import { useState, useEffect } from "react";

interface Order {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    date: string;
    quantity: number;
    status: string;
    pricePerUnit: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [sortField, setSortField] = useState<"date" | "quantity" | "amount">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        // Set current month as default
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(month);
        fetchOrders(month);
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const fetchOrders = async (month: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders?month=${month}`);
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAndSortedOrders = () => {
        let filtered = [...orders];

        // Filter by company
        if (selectedCompany) {
            filtered = filtered.filter(order => order.userId._id === selectedCompany);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            if (sortField === "date") {
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
            } else if (sortField === "quantity") {
                aValue = a.quantity;
                bValue = b.quantity;
            } else if (sortField === "amount") {
                aValue = a.quantity * a.pricePerUnit;
                bValue = b.quantity * b.pricePerUnit;
            }

            if (sortOrder === "asc") {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        return filtered;
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || "Failed to update order");
                return;
            }

            // Refresh orders
            await fetchOrders(selectedMonth);
            alert("Order status updated successfully!");
        } catch (error) {
            alert("Failed to update order status");
        } finally {
            setUpdating(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Delivered": return "bg-green-100 text-green-800";
            case "Pending": return "bg-yellow-100 text-yellow-800";
            case "Not Delivered": return "bg-red-100 text-red-800";
            case "Cancelled": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const canEditOrder = (orderDate: string) => {
        const now = new Date();
        const order = new Date(orderDate);
        return now.getMonth() === order.getMonth() && now.getFullYear() === order.getFullYear();
    };

    if (loading) return <div className="p-8 text-center">Loading orders...</div>;

    const filteredOrders = getFilteredAndSortedOrders();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Orders</h1>
            </div>

            {/* Filters and Sorting */}
            <div className="bg-white shadow-sm rounded-lg border p-4 mb-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(e.target.value);
                            fetchOrders(e.target.value);
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Companies</option>
                        {users.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as "date" | "quantity" | "amount")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Date</option>
                        <option value="quantity">Quantity</option>
                        <option value="amount">Amount</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No orders found for this month
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const editable = canEditOrder(order.date);
                                return (
                                    <tr key={order._id} className={!editable ? 'bg-gray-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {new Date(order.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.userId.name}</div>
                                            <div className="text-sm text-gray-500">{order.userId.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {order.quantity}L
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ₹{(order.quantity * order.pricePerUnit).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {editable ? (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                    disabled={updating === order._id}
                                                    className="px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Not Delivered">Not Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Cannot edit (previous month)</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
