import { capturePayPalAuthorization } from "@/lib/paypal/orders";
import { captureRequestPayment } from "@/lib/stripe/payments";
import { updatePayment } from "@/lib/supabase/payments";
import type { PaymentRecord } from "@/types/payment";

export async function captureClientPaymentOnAnswer(
  requestId: string,
  payment: PaymentRecord
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (payment.payment_provider === "stripe") {
    if (payment.status !== "authorized" || !payment.provider_transaction_id) {
      return { ok: true };
    }

    try {
      await captureRequestPayment(payment.provider_transaction_id);
      const result = await updatePayment(
        requestId,
        { status: "completed" },
        { useAdmin: process.env.NODE_ENV === "development" }
      );

      if (result.error) {
        return { ok: false, error: result.error };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Stripe capture failed."
      };
    }
  }

  if (payment.payment_provider === "paypal") {
    if (payment.status !== "authorized" || !payment.provider_transaction_id) {
      return { ok: true };
    }

    try {
      await capturePayPalAuthorization(payment.provider_transaction_id);
      const result = await updatePayment(
        requestId,
        { status: "completed" },
        { useAdmin: process.env.NODE_ENV === "development" }
      );

      if (result.error) {
        return { ok: false, error: result.error };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "PayPal capture failed."
      };
    }
  }

  return { ok: true };
}
