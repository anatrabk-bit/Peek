import { createAdminClient } from "@/lib/supabase/admin";
import { notifyRequestWentLive } from "@/lib/notifications/send";
import { updatePayment } from "@/lib/supabase/payments";import { createClient } from "@/lib/supabase/server";

async function notifyNearbyRunners(
  supabase: ReturnType<typeof createClient>,
  request: {
    id: string;
    title: string;
    budget: number;
    latitude: number | null;
    longitude: number | null;
    status: string;
  }
) {
  if (request.status !== "open") return;

  try {
    await supabase.functions.invoke("notify-nearby-runners", {
      body: {
        request_id: request.id,
        title: request.title,
        budget: request.budget,
        latitude: request.latitude,
        longitude: request.longitude
      }
    });
  } catch (notifyError) {
    console.error("[Peek] notify after payment confirm failed:", notifyError);
  }
}

export async function confirmManualPaymentForRequest(
  requestId: string,
  options?: { ownerUserId?: string; useAdmin?: boolean }
) {
  const supabase = options?.useAdmin ? createAdminClient() : createClient();

  const { data: peekRequest, error: requestError } = await supabase
    .from("requests")
    .select("id, user_id, title, budget, latitude, longitude, status")
    .eq("id", requestId)
    .single();

  if (requestError || !peekRequest) {
    return { ok: false as const, error: "Request not found." };
  }

  if (options?.ownerUserId && peekRequest.user_id !== options.ownerUserId) {
    return { ok: false as const, error: "Not your request." };
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, status, payment_provider, request_id")
    .eq("request_id", requestId)
    .single();

  if (paymentError || !payment) {
    return { ok: false as const, error: "Payment record not found." };
  }

  if (payment.payment_provider !== "manual") {
    return {
      ok: false as const,
      error: "This request does not use manual payment confirmation."
    };
  }

  if (payment.status !== "pending") {
    return { ok: false as const, error: "Payment is not waiting for confirmation." };
  }

  const updateResult = await updatePayment(
    requestId,
    { status: "completed" },
    { useAdmin: options?.useAdmin ?? false }
  );

  if (updateResult.error) {
    return { ok: false as const, error: updateResult.error };
  }

  await notifyNearbyRunners(supabase, peekRequest);
  await notifyRequestWentLive(requestId);

  return { ok: true as const };
}
