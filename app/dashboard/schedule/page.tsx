"use client";

import { useState, useEffect } from "react";

interface ScheduleItem {
    date: string;
    quantity: number;
    status: string;
    isModified?: boolean;
}

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        const dates = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d.toISOString().split("T")[0]);
        }

        const requests = dates.map(date => fetch(`/api/orders?date=${date}`).then(r => r.json()));
        const results = await Promise.all(requests);

        const newSchedule = dates.map((date, index) => {
            const orders = results[index];
            const order = orders.length > 0 ? orders[0] : null;
            return {
                date,
                quantity: order ? order.quantity : 1, // Default 1L
                status: order ? order.status : "pending",
                isModified: false,
            };
        });

        setSchedule(newSchedule);
        setLoading(false);
    };

    const handleAutoFill = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            await fetch("/api/orders/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate: today, days: 7 }),
            });
            // Refresh schedule
            await fetchSchedule();
        } catch (error) {
            alert("Failed to auto-fill");
            setLoading(false);
        }
    };

    const handleUpdate = (index: number, field: keyof ScheduleItem, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value, isModified: true };
        setSchedule(newSchedule);
    };

    const saveChanges = async (index: number) => {
        setSaving(true);
        const item = schedule[index];

        try {
            await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: item.date,
                    quantity: item.quantity,
                    status: item.status,
                }),
            });

            const newSchedule = [...schedule];
            newSchedule[index].isModified = false;
            setSchedule(newSchedule);
        } catch (error) {
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading schedule...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Weekly Schedule</h1>
                <button
                    onClick={handleAutoFill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                    Auto-fill Defaults
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                <div className="divide-y divide-gray-200">
                    {schedule.map((item, index) => {
                        const dateObj = new Date(item.date);
                        const isSunday = dateObj.getDay() === 0;

                        // Check if this date is today or in the past
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const itemDate = new Date(item.date);
                        itemDate.setHours(0, 0, 0, 0);
                        const isPastOrToday = itemDate <= today;

                        return (
                            <div key={item.date} className={`p-6 flex items-center justify-between ${isSunday ? 'bg-gray-50' : ''} ${isPastOrToday ? 'opacity-60' : ''}`}>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {dateObj.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                    {isSunday && <span className="text-xs text-red-500 font-medium">Sunday (No Delivery)</span>}
                                    {isPastOrToday && !isSunday && <span className="text-xs text-gray-500 font-medium">Cannot modify past/current date</span>}
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm text-gray-500">Qty (L):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdate(index, "quantity", parseFloat(e.target.value))}
                                            className="w-20 px-2 py-1 border rounded focus:ring-green-500 focus:border-green-500"
                                            disabled={item.status === 'cancelled' || item.status === 'skipped' || isPastOrToday}
                                        />
                                    </div>

                                    <select
                                        value={item.status}
                                        onChange={(e) => handleUpdate(index, "status", e.target.value)}
                                        className="px-2 py-1 border rounded focus:ring-green-500 focus:border-green-500 text-sm"
                                        disabled={isPastOrToday}
                                    >
                                        <option value="pending">Standard</option>
                                        <option value="skipped">Skip</option>
                                        <option value="cancelled">Cancel</option>
                                    </select>

                                    {item.isModified && !isPastOrToday && (
                                        <button
                                            onClick={() => saveChanges(index)}
                                            disabled={saving}
                                            className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                                        >
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
