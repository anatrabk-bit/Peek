import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};

type NotifyPayload = {
  user_id: string;
  event: string;
  request_id: string;
  request_title?: string;
  site_url?: string;
  title: string;
  body: string;
  url: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as NotifyPayload;
    const { user_id, title, body: messageBody, url, site_url } = body;

    if (!user_id || !title || !messageBody) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const baseUrl = (site_url ?? "http://localhost:3001").replace(/\/$/, "");
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    let emailSent = false;
    let pushSent = 0;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(user_id);
      const email = userData?.user?.email;

      if (!userError && email) {
        const fromEmail =
          Deno.env.get("NOTIFY_FROM_EMAIL") ?? "Peek <onboarding@resend.dev>";

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: title,
            html: `
              <p>${messageBody}</p>
              <p><a href="${fullUrl}">Open in Peek</a></p>
            `
          })
        });

        emailSent = emailResponse.ok;
        if (!emailResponse.ok) {
          console.error("Resend failed:", await emailResponse.text());
        }
      }
    }

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(
        "mailto:notifications@peek.app",
        vapidPublic,
        vapidPrivate
      );

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", user_id);

      for (const sub of subscriptions ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify({
              title,
              body: messageBody,
              url
            })
          );
          pushSent += 1;
        } catch (pushError) {
          console.error("Push failed:", pushError);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, emailSent, pushSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
