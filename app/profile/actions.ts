"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_RADIUS_KM } from "@/lib/google-maps";

export async function updateDisplayName(name: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Log in to update your name." };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Please enter your name." };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      full_name: trimmed,
      name: trimmed
    }
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/");

  return { ok: true as const };
}

export async function getRunnerProfile() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("runner_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function updateRunnerProfile(input: {
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number;
  notifications_enabled?: boolean;
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Log in to update your Peek settings." };
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  if (input.latitude !== undefined) payload.latitude = input.latitude;
  if (input.longitude !== undefined) payload.longitude = input.longitude;
  if (input.radius_km !== undefined) payload.radius_km = input.radius_km;
  if (input.notifications_enabled !== undefined) {
    payload.notifications_enabled = input.notifications_enabled;
  }

  const { error } = await supabase.from("runner_profiles").upsert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/requests");

  return { ok: true as const };
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Log in to enable notifications." };
  }

  await supabase.from("runner_profiles").upsert({
    user_id: user.id,
    radius_km: DEFAULT_RADIUS_KM,
    notifications_enabled: true,
    updated_at: new Date().toISOString()
  });

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const };
}

export async function savePeekPayoutDetails(input: {
  payout_method: "wise" | "bank_transfer" | null;
  wise_email: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  bank_iban: string;
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Log in to save payout details." };
  }

  if (!input.payout_method) {
    return { error: "Choose how you want to get paid." };
  }

  if (input.payout_method === "wise") {
    const email = input.wise_email.trim();
    if (!email) {
      return { error: "Enter your Wise email." };
    }
  }

  if (input.payout_method === "bank_transfer") {
    const name = input.bank_account_name.trim();
    const hasUk =
      input.bank_sort_code.trim() && input.bank_account_number.trim();
    const hasIban = input.bank_iban.trim();

    if (!name) {
      return { error: "Enter the account holder name." };
    }

    if (!hasUk && !hasIban) {
      return {
        error: "Enter UK sort code + account number, or an IBAN."
      };
    }
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    payout_method: input.payout_method,
    wise_email:
      input.payout_method === "wise" ? input.wise_email.trim() : null,
    bank_account_name:
      input.payout_method === "bank_transfer"
        ? input.bank_account_name.trim()
        : null,
    bank_sort_code:
      input.payout_method === "bank_transfer"
        ? input.bank_sort_code.trim() || null
        : null,
    bank_account_number:
      input.payout_method === "bank_transfer"
        ? input.bank_account_number.trim() || null
        : null,
    bank_iban:
      input.payout_method === "bank_transfer"
        ? input.bank_iban.trim() || null
        : null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("runner_profiles").upsert(payload);

  if (error) {
    if (error.message.includes("payout_method")) {
      return {
        error: "Run migration 013_peek_payout_preferences.sql in Supabase."
      };
    }
    return { error: error.message };
  }

  revalidatePath("/profile");

  return { ok: true as const };
}

export async function removePushSubscriptions() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in." };
  }

  await supabase.from("push_subscriptions").delete().eq("user_id", user.id);

  return { ok: true as const };
}
