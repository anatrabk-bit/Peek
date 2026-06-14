import { createClient } from "@supabase/supabase-js";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};

type RequestPayload = {
  request_id: string;
  title: string;
  budget: number;
  latitude: number;
  longitude: number;
};

function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)}m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }

  return `${Math.round(distanceKm)}km`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestPayload;
    const { request_id, title, budget, latitude, longitude } = body;

    if (!request_id || !title || !latitude || !longitude) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    webpush.setVapidDetails("mailto:notifications@peek.app", vapidPublic, vapidPrivate);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: runners, error: runnersError } = await supabase
      .from("runner_profiles")
      .select("user_id, latitude, longitude, radius_km")
      .eq("notifications_enabled", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (runnersError) {
      throw runnersError;
    }

    let sent = 0;

    for (const runner of runners ?? []) {
      const distanceKm = getDistanceKm(
        runner.latitude,
        runner.longitude,
        latitude,
        longitude
      );

      if (distanceKm > Number(runner.radius_km)) {
        continue;
      }

      const notificationTitle = `New request ${formatDistanceKm(distanceKm)} away - ${title} £${budget}`;

      try {
        await supabase.from("user_notifications").insert({
          user_id: runner.user_id,
          request_id,
          event: "new_request_nearby",
          title: "New job nearby",
          body: `"${title}" is open — apply if you're nearby.`,
          url: `/requests/${request_id}`
        });
      } catch (insertError) {
        console.error("In-app notification insert failed:", insertError);
      }

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", runner.user_id);

      for (const sub of subscriptions ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify({
              title: notificationTitle,
              body: title,
              url: `/requests/${request_id}`
            })
          );
          sent += 1;
        } catch (pushError) {
          console.error("Push failed:", pushError);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
