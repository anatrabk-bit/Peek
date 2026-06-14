export type PaymentInstructions = {
  accountName: string;
  sortCode: string;
  accountNumber: string;
  referenceHint: string;
};

export function getPaymentInstructions(): PaymentInstructions | null {
  const accountName = process.env.PEEK_PAYMENT_ACCOUNT_NAME?.trim();
  const sortCode = process.env.PEEK_PAYMENT_SORT_CODE?.trim();
  const accountNumber = process.env.PEEK_PAYMENT_ACCOUNT_NUMBER?.trim();

  if (!accountName || !sortCode || !accountNumber) {
    return null;
  }

  return {
    accountName,
    sortCode,
    accountNumber,
    referenceHint:
      process.env.PEEK_PAYMENT_REFERENCE_HINT?.trim() ??
      "Use your request title as the payment reference."
  };
}

import { isPayPalEnabled } from "@/lib/paypal/config";
import { isStripeEnabled } from "@/lib/stripe/config";

export function isPaidCheckoutAvailable(): boolean {
  return isStripeEnabled() || isPayPalEnabled();
}
