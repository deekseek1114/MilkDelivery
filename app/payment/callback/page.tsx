"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyPayment = async () => {
            const paymentId = searchParams.get("razorpay_payment_id");
            const paymentLinkId = searchParams.get("razorpay_payment_link_id");
            const paymentStatus = searchParams.get("razorpay_payment_link_status");
            const signature = searchParams.get("razorpay_signature");

            if (!paymentId || !paymentStatus) {
                setStatus("failed");
                setMessage("Invalid payment response");
                return;
            }

            // Check payment status from URL
            if (paymentStatus === "paid") {
                // Verify payment and update bill status
                try {
                    const response = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            paymentId,
                            paymentLinkId
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setStatus("success");
                        setMessage("Payment completed successfully! Your bill has been updated to Paid status.");
                        console.log("[PAYMENT] Verification result:", result);
                    } else {
                        const error = await response.json();
                        console.error("[PAYMENT] Verification failed:", error);
                        setStatus("success"); // Still show success to user
                        setMessage("Payment completed! Bill status will be updated shortly.");
                    }
                } catch (error) {
                    console.error("[PAYMENT] Error verifying payment:", error);
                    setStatus("success"); // Still show success to user
                    setMessage("Payment completed! Bill status will be updated shortly.");
                }
            } else {
                setStatus("failed");
                setMessage("Payment was not completed. Please try again.");
            }

            // Log payment details for debugging
            console.log("Payment Callback:", {
                paymentId,
                paymentLinkId,
                paymentStatus,
                signature
            });
        };

        verifyPayment();
    }, [searchParams]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing payment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {status === "success" ? (
                    <>
                        {/* Success Icon */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <svg
                                className="h-10 w-10 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-center text-gray-600 mb-6">
                            {message}
                        </p>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-800">
                                <strong>Payment ID:</strong><br />
                                <span className="font-mono text-xs">{searchParams.get("razorpay_payment_id")}</span>
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/dashboard/history"
                                className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                            >
                                View Order History
                            </Link>
                            <Link
                                href="/dashboard"
                                className="block w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                            >
                                Go to Dashboard
                            </Link>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-6">
                            You will receive a confirmation email shortly.
                        </p>
                    </>
                ) : (
                    <>
                        {/* Failure Icon */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                            <svg
                                className="h-10 w-10 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            Payment Failed
                        </h1>
                        <p className="text-center text-gray-600 mb-6">
                            {message}
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800">
                                Your payment could not be processed. Please try again or contact support if the issue persists.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/dashboard/history"
                                className="block w-full text-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                Try Again
                            </Link>
                            <Link
                                href="/dashboard"
                                className="block w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
