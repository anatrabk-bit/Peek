import type { PaymentInstructions } from "@/lib/payment-instructions";

type PaymentInstructionsCardProps = {
  amount: number;
  currency: string;
  requestTitle: string;
  instructions: PaymentInstructions;
};

export function PaymentInstructionsCard({
  amount,
  currency,
  requestTitle,
  instructions
}: PaymentInstructionsCardProps) {
  const symbol = currency === "GBP" ? "£" : `${currency} `;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <p className="font-semibold">Payment needed before your request goes live</p>
      <p className="mt-2 text-sm leading-relaxed">
        Send {symbol}
        {amount.toFixed(2)} using the details below. Your request will appear for
        Peeks once we confirm payment.
      </p>

      <dl className="mt-4 space-y-2 rounded-xl bg-white/70 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-peek-muted">Account name</dt>
          <dd className="font-semibold text-peek-text">{instructions.accountName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-peek-muted">Sort code</dt>
          <dd className="font-semibold text-peek-text">{instructions.sortCode}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-peek-muted">Account number</dt>
          <dd className="font-semibold text-peek-text">{instructions.accountNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-peek-muted">Amount</dt>
          <dd className="font-semibold text-peek-accent">
            {symbol}
            {amount.toFixed(2)}
          </dd>
        </div>
        <div className="border-t border-amber-100 pt-2">
          <dt className="text-peek-muted">Reference</dt>
          <dd className="mt-1 font-semibold text-peek-text">{requestTitle}</dd>
          <dd className="mt-1 text-xs text-peek-muted">{instructions.referenceHint}</dd>
        </div>
      </dl>
    </div>
  );
}
