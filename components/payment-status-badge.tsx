import type { PaymentProvider, PaymentStatus } from "@/types/payment";
import { PAYMENT_LABELS } from "@/types/payment";

const STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  authorized: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-zinc-100 text-zinc-700",
  refunded: "bg-zinc-100 text-zinc-600"
};

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  provider?: PaymentProvider | null;
};

export function PaymentStatusBadge({ status, provider }: PaymentStatusBadgeProps) {
  const label =
    status === "completed" && provider === "dev" ? "Free" : PAYMENT_LABELS[status];

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {label}
    </span>
  );
}
