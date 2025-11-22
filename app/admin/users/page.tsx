"use client";

import { useState, useEffect } from "react";

interface User {
    _id: string;
    name: string;
    email: string;
    companyDetails: {
        address: string;
        phone: string;
        contactPerson: string;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/users")
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Company Management</h1>

            <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No companies registered yet.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.companyDetails?.contactPerson}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.companyDetails?.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.companyDetails?.address}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
