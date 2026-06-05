"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_RADIUS_KM } from "@/lib/google-maps";

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
