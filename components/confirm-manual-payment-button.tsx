"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmMyManualPayment } from "@/app/my-requests/actions";

type ConfirmManualPaymentButtonProps = {
  requestId: string;
  amount: number;
  currency: string;
};

export function ConfirmManualPaymentButton({
  requestId,
  amount,
  currency
}: ConfirmManualPaymentButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await confirmMyManualPayment(requestId);

      if (!result.ok) {
        setError(result.error ?? "Could not confirm payment.");
        return;
      }

      router.push("/my-requests?paid=1");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div>
        <p className="font-semibold text-amber-950">Payment required</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900">
          This request needs payment before it goes live for Peeks. For now,
          tap the button below once you&apos;re ready — we&apos;ll mark it as
          paid and publish your request.
        </p>
        <p className="mt-3 text-sm font-medium text-amber-950">
          Amount: {currency === "GBP" ? "£" : `${currency} `}
          {amount}
        </p>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending}
        className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Confirming…" : "Confirm payment"}
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
