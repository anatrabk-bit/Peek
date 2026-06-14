"use client";

import { useState } from "react";
import type { PaymentProvider } from "@/types/payment";

type CompletePaymentButtonProps = {
  requestId: string;
  provider: PaymentProvider;
};

export function CompletePaymentButton({
  requestId,
  provider
}: CompletePaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);

    const endpoint =
      provider === "paypal" ? "/api/paypal/checkout" : "/api/stripe/checkout";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start payment.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Could not connect to payment. Try again.");
      setLoading(false);
    }
  }

  const label =
    provider === "paypal" ? "Pay with card" : "Complete payment";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Opening checkout…" : label}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
