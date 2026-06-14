"use server";

import { redirect } from "next/navigation";
import { MIN_BUDGET_GBP, MIN_BUDGET_MESSAGE } from "@/lib/constants";
import { notifyRequestWentLive } from "@/lib/notifications/send";
import {
  createPaymentForRequest,
  resolvePaymentForNewRequest
} from "@/lib/supabase/payments";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/post-request");
  }

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const budget = Number(formData.get("budget") ?? 0);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (!title || !location) {
    return { error: "Please fill in the task and location." };
  }

  if (Number.isNaN(budget) || budget < MIN_BUDGET_GBP) {
    return { error: MIN_BUDGET_MESSAGE };
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return {
      error: "Select a location from the address suggestions."
    };
  }

  const paymentPlan = await resolvePaymentForNewRequest(user.id);
  const { provider, status, isFreePromo } = paymentPlan;

  try {
    const { data, error } = await supabase
      .from("requests")
      .insert({
        title,
        location,
        latitude,
        longitude,
        budget,
        details: "Posted via Peek",
        status: "open",
        user_id: user.id
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Could not save request." };
    }

    const paymentResult = await createPaymentForRequest({
      requestId: data.id,
      amount: budget,
      currency: "GBP",
      provider,
      status
    });

    if (paymentResult.error) {
      return {
        error: paymentResult.error.includes("payments")
          ? "Run migration 012_generic_payments.sql in Supabase."
          : paymentResult.error
      };
    }

    const needsStripeCheckout = provider === "stripe";
    const needsPayPalCheckout = provider === "paypal";
    const needsManualPayment = provider === "manual";

    if (!needsStripeCheckout && !needsPayPalCheckout && !needsManualPayment) {
      await supabase.functions.invoke("notify-nearby-runners", {
        body: {
          request_id: data.id,
          title,
          budget,
          latitude,
          longitude
        }
      });
      await notifyRequestWentLive(data.id);
    }

    return {
      ok: true as const,
      requestId: data.id as string,
      needsStripeCheckout,
      needsPayPalCheckout,
      needsManualPayment,
      isFreePromo
    };
  } catch {
    return {
      error:
        "Could not save the request. Check your Supabase connection and schema."
    };
  }
}
