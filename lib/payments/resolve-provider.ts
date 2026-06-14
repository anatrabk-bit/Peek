import { isPayPalEnabled } from "@/lib/paypal/config";
import { isStripeEnabled } from "@/lib/stripe/config";
import type { PaymentProvider } from "@/types/payment";

/**
 * Paid checkout only — never the dev skip. Used from the 3rd posted request onward.
 * Priority: Stripe → PayPal → manual fallback.
 */
export function resolvePaidPaymentProvider(): PaymentProvider {
  if (isStripeEnabled()) return "stripe";
  if (isPayPalEnabled()) return "paypal";
  return "manual";
}

/**
 * Which provider collects payment from requesters (clients).
 * Priority: Stripe → PayPal → dev (local) → manual fallback.
 * Switching later = set env keys; no app code changes needed.
 */
export function resolveClientPaymentProvider(): PaymentProvider {
  if (isStripeEnabled()) return "stripe";
  if (isPayPalEnabled()) return "paypal";
  if (process.env.NODE_ENV === "development") return "dev";
  return "manual";
}

export function providerNeedsCheckout(provider: PaymentProvider): boolean {
  return provider === "stripe" || provider === "paypal";
}

export function providerStartsPending(provider: PaymentProvider): boolean {
  return provider === "stripe" || provider === "paypal" || provider === "manual";
}
