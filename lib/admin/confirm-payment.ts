import { confirmManualPaymentForRequest } from "@/lib/payments/confirm-manual-payment";

export async function confirmPaymentReceived(requestId: string) {
  return confirmManualPaymentForRequest(requestId, { useAdmin: true });
}
