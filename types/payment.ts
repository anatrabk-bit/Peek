export type PaymentProvider = "stripe" | "paypal" | "manual" | "dev";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentRecord = {
  id: string;
  request_id: string;
  amount: number;
  currency: string;
  payment_provider: PaymentProvider;
  provider_transaction_id: string | null;
  status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
};

/** Request is visible to peeks once payment is secured */
export const PAYMENT_LIVE_STATUSES: PaymentStatus[] = [
  "authorized",
  "completed"
];

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment needed",
  authorized: "Card secured",
  completed: "Paid",
  failed: "Payment failed",
  cancelled: "Cancelled",
  refunded: "Refunded"
};

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  manual: "Manual",
  dev: "Dev mode"
};
