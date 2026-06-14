export type PayoutMethod = "wise" | "bank_transfer";

export type PeekPayoutDetails = {
  payout_method: PayoutMethod | null;
  wise_email: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
};

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  wise: "Wise",
  bank_transfer: "Bank transfer"
};
