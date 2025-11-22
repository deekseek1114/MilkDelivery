"use client";

import { useState, useEffect, useRef } from "react";

interface Notification {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    type: string;
    category: string;
    message: string;
    status: string;
    sentAt: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Searchable dropdown state
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        userId: "",
        type: "Email",
        category: "Reminder",
        message: ""
    });

    useEffect(() => {
        fetchNotifications();
        fetchUsers();

        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const sendNotification = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.userId) {
            alert("Please select a company/user");
            return;
        }

        setSending(true);
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || "Failed to send notification");
                return;
            }

            alert("Notification sent successfully!");
            setFormData({ userId: "", type: "Email", category: "Reminder", message: "" });
            setSearchQuery(""); // Reset search
            await fetchNotifications();
        } catch (error) {
            alert("Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Statement": return "bg-blue-100 text-blue-800";
            case "Reminder": return "bg-yellow-100 text-yellow-800";
            case "PaymentSuccess": return "bg-green-100 text-green-800";
            case "PaymentFailure": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUserSelect = (user: User) => {
        setFormData({ ...formData, userId: user._id });
        setSearchQuery(user.name);
        setShowDropdown(false);
    };

    if (loading) return <div className="p-8 text-center">Loading notifications...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Notifications</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 bg-white shadow-sm rounded-lg border p-6">
                    <h2 className="text-lg font-semibold mb-4">Send Notification</h2>
                    <form onSubmit={sendNotification} className="space-y-4">
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company / User</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                    if (e.target.value === "") {
                                        setFormData({ ...formData, userId: "" });
                                    }
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Search company..."
                                required={!formData.userId} // Only required if no user selected
                            />

                            {/* Dropdown Results */}
                            {showDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                        <div className="px-4 py-2 text-sm text-gray-500">No companies found</div>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <div
                                                key={user._id}
                                                onClick={() => handleUserSelect(user)}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {formData.userId && (
                                <div className="mt-1 text-xs text-green-600">
                                    ✓ Selected
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Email">Email</option>
                                <option value="SMS">SMS</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Statement">Statement</option>
                                <option value="Reminder">Reminder</option>
                                <option value="PaymentSuccess">Payment Success</option>
                                <option value="PaymentFailure">Payment Failure</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Enter notification message"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            {sending ? "Sending..." : "Send Notification"}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold">Notification History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {notifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                            No notifications sent yet
                                        </td>
                                    </tr>
                                ) : (
                                    notifications.map((notif) => (
                                        <tr key={notif._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {new Date(notif.sentAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{notif.userId.name}</div>
                                                <div className="text-sm text-gray-500">{notif.userId.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {notif.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(notif.category)}`}>
                                                    {notif.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={notif.status === "Sent" ? "text-green-600" : "text-red-600"}>
                                                    {notif.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
