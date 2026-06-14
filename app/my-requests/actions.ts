"use server";

import { revalidatePath } from "next/cache";
import { confirmManualPaymentForRequest } from "@/lib/payments/confirm-manual-payment";
import { createClient } from "@/lib/supabase/server";

export async function confirmMyManualPayment(requestId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Log in to confirm payment." };
  }

  let result = await confirmManualPaymentForRequest(requestId, {
    ownerUserId: user.id
  });

  if (!result.ok && process.env.NODE_ENV === "development") {
    result = await confirmManualPaymentForRequest(requestId, {
      ownerUserId: user.id,
      useAdmin: true
    });
  }

  if (!result.ok) {
    return result;
  }

  revalidatePath("/my-requests");
  revalidatePath("/requests");

  return { ok: true as const };
}
