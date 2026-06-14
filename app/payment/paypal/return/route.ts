import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyRequestWentLive } from "@/lib/notifications/send";
import { authorizePayPalOrder } from "@/lib/paypal/orders";
import { updatePayment } from "@/lib/supabase/payments";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("token");

  if (!orderId) {
    return NextResponse.redirect(
      new URL("/my-requests?payment_cancelled=1", request.url)
    );
  }

  try {
    const { authorizationId } = await authorizePayPalOrder(orderId);

    const admin = createAdminClient();
    const { data: payment } = await admin
      .from("payments")
      .select("request_id")
      .eq("provider_transaction_id", orderId)
      .maybeSingle();

    if (payment?.request_id) {
      await updatePayment(
        payment.request_id,
        {
          status: "authorized",
          payment_provider: "paypal",
          provider_transaction_id: authorizationId
        },
        { useAdmin: true }
      );

      const { data: peekRequest } = await admin
        .from("requests")
        .select("id, title, budget, latitude, longitude")
        .eq("id", payment.request_id)
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
          console.error("[Peek] notify after PayPal payment failed:", notifyError);
        }
        await notifyRequestWentLive(payment.request_id);
      }
    }

    return NextResponse.redirect(new URL("/my-requests?paid=1", request.url));
  } catch (error) {
    console.error("[Peek] PayPal return:", error);
    return NextResponse.redirect(
      new URL("/my-requests?payment_cancelled=1", request.url)
    );
  }
}
