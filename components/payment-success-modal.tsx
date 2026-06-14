"use client";

import { useEffect } from "react";

type PaymentSuccessModalProps = {
  open: boolean;
  onClose: () => void;
  variant: "paid" | "free";
};

const COPY = {
  paid: {
    title: "Payment received",
    body: "Your request is now live. Peeks nearby can see it and pick it up."
  },
  free: {
    title: "Your free starter request is live",
    body: "No payment was needed — this counted toward your 2 free starter requests. Peeks nearby can see it and pick it up now."
  }
} as const;

export function PaymentSuccessModal({
  open,
  onClose,
  variant
}: PaymentSuccessModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const copy = COPY[variant];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        className="w-full max-w-lg rounded-3xl border-2 border-emerald-200 bg-white p-8 text-center shadow-2xl sm:p-10"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl"
          aria-hidden
        >
          ✓
        </div>

        <h2
          id="payment-success-title"
          className="mt-6 text-2xl font-bold text-peek-text sm:text-3xl"
        >
          {copy.title}
        </h2>

        <p className="mt-4 text-base leading-relaxed text-peek-muted sm:text-lg">
          {copy.body}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="btn-primary btn-fun mt-8 w-full sm:w-auto"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
