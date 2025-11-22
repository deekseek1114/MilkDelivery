"use client";

import { useState, useEffect } from "react";

export default function PriceSettingsPage() {
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [newPrice, setNewPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("/api/admin/price")
            .then((res) => res.json())
            .then((data) => setCurrentPrice(data.price));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/price", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price: parseFloat(newPrice) }),
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentPrice(data.pricePerLiter);
                setNewPrice("");
                setMessage("Price updated successfully!");
            } else {
                setMessage("Failed to update price.");
            }
        } catch (error) {
            setMessage("Error updating price.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-bold mb-6">Price Settings</h1>

            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-medium text-blue-900">Current Price</h2>
                <p className="text-3xl font-bold text-blue-700 mt-2">
                    {currentPrice !== null ? `₹${currentPrice}/Liter` : "Loading..."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Price per Liter (₹)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Enter new price"
                        required
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? "Updating..." : "Update Price"}
                </button>
            </form>
        </div>
    );
}
