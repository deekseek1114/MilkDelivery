"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        defaultQuantity: 1,
        skipDays: [] as number[],
        address: "",
        phone: "",
        contactPerson: "",
    });

    useEffect(() => {
        fetch("/api/user/settings")
            .then((res) => res.json())
            .then((data) => {
                setFormData({
                    defaultQuantity: data.preferences?.defaultQuantity || 1,
                    skipDays: data.preferences?.skipDays || [0],
                    address: data.companyDetails?.address || "",
                    phone: data.companyDetails?.phone || "",
                    contactPerson: data.companyDetails?.contactPerson || "",
                });
                setLoading(false);
            });
    }, []);

    const handleDayToggle = (day: number) => {
        const currentSkipDays = formData.skipDays;
        if (currentSkipDays.includes(day)) {
            setFormData({ ...formData, skipDays: currentSkipDays.filter((d) => d !== day) });
        } else {
            setFormData({ ...formData, skipDays: [...currentSkipDays, day] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                alert("Settings updated successfully!");
            } else {
                alert("Failed to update settings.");
            }
        } catch (error) {
            alert("Error updating settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
                <div>
                    <h2 className="text-lg font-medium mb-4 text-gray-900">Preferences</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Daily Quantity (L)</label>
                        <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={formData.defaultQuantity}
                            onChange={(e) => setFormData({ ...formData, defaultQuantity: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skip Delivery Days</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {daysOfWeek.map((day, index) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayToggle(index)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition ${formData.skipDays.includes(index)
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Selected days will be skipped by default.</p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900">Company Details</h2>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}
