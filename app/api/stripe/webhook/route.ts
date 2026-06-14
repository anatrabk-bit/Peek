import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyRequestWentLive } from "@/lib/notifications/send";
import { updatePayment } from "@/lib/supabase/payments";
import { getStripe, isStripeEnabled } from "@/lib/stripe/config";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    console.error("[Peek] Stripe webhook:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.metadata?.request_id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (requestId && paymentIntentId) {
      const { payment, error } = await updatePayment(
        requestId,
        {
          status: "authorized",
          provider_transaction_id: paymentIntentId,
          payment_provider: "stripe"
        },
        { useAdmin: true }
      );

      if (error) {
        console.error("[Peek] webhook payment update failed:", error);
      } else if (payment) {
        const admin = createAdminClient();
        const { data: peekRequest } = await admin
          .from("requests")
          .select("id, title, budget, latitude, longitude")
          .eq("id", requestId)
          .single();

        if (peekRequest) {
          try {
            await admin.functions.invoke("notify-nearby-runners", {
              body: {
                request_id: peekRequest.id,
                title: peekRequest.title,
                budget: peekRequest.budget,
                latitude: peekRequest.latitude,
                longitude: peekRequest.longitude
              }
            });
          } catch (notifyError) {
            console.error("[Peek] notify after payment failed:", notifyError);
          }
          await notifyRequestWentLive(requestId);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
