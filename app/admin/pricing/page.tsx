"use client";

import { useState, useEffect } from "react";

interface PriceSetting {
    _id: string;
    pricePerLiter: number;
    effectiveDate: string;
    createdAt: string;
}

export default function AdminPricingPage() {
    const [currentPrice, setCurrentPrice] = useState<PriceSetting | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newPrice, setNewPrice] = useState("");
    const [effectiveDate, setEffectiveDate] = useState("");

    useEffect(() => {
        fetchCurrentPrice();
    }, []);

    const fetchCurrentPrice = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pricing");
            const data = await res.json();
            setCurrentPrice(data);
        } catch (error) {
            console.error("Failed to fetch price:", error);
        } finally {
            setLoading(false);
        }
    };

    const updatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pricePerLiter: parseFloat(newPrice),
                    effectiveDate: effectiveDate || undefined
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || "Failed to update price");
                return;
            }

            alert("Price updated successfully!");
            setNewPrice("");
            setEffectiveDate("");
            await fetchCurrentPrice();
        } catch (error) {
            alert("Failed to update price");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading pricing...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Pricing Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow-sm rounded-lg border p-6">
                    <h2 className="text-lg font-semibold mb-4">Current Price</h2>
                    {currentPrice ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                <span className="text-gray-700">Price per Liter</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    ₹{currentPrice.pricePerLiter.toFixed(2)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p><strong>Effective from:</strong> {new Date(currentPrice.effectiveDate).toLocaleDateString()}</p>
                                <p><strong>Last updated:</strong> {new Date(currentPrice.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No price set yet</p>
                    )}
                </div>

                <div className="bg-white shadow-sm rounded-lg border p-6">
                    <h2 className="text-lg font-semibold mb-4">Update Price</h2>
                    <form onSubmit={updatePrice} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Price per Liter (₹)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new price"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Effective Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty to make effective immediately
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            {saving ? "Updating..." : "Update Price"}
                        </button>
                    </form>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                            <strong>Note:</strong> Price changes will affect all new orders created after the effective date.
                            Existing orders will retain their original price.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
