import { getSiteUrl } from "@/lib/site-url";
import { getStripe, gbpToPence } from "@/lib/stripe/config";

type CreateCheckoutInput = {
  requestId: string;
  title: string;
  budgetGbp: number;
  customerEmail?: string | null;
};

export async function createRequestCheckoutSession({
  requestId,
  title,
  budgetGbp,
  customerEmail
}: CreateCheckoutInput) {
  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: gbpToPence(budgetGbp),
          product_data: {
            name: `Peek request: ${title.slice(0, 80)}`,
            description:
              "Card hold when you post — charged only when your Peek delivers the answer."
          }
        }
      }
    ],
    payment_intent_data: {
      capture_method: "manual",
      metadata: {
        request_id: requestId
      }
    },
    metadata: {
      request_id: requestId
    },
    success_url: `${siteUrl}/my-requests?paid=1`,
    cancel_url: `${siteUrl}/my-requests?payment_cancelled=1`
  });
}

export async function captureRequestPayment(paymentIntentId: string) {
  const stripe = getStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
}
