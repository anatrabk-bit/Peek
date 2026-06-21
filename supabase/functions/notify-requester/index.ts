import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};

type NotifyPayload = {
  request_id: string;
  site_url?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as NotifyPayload;
    const { request_id, site_url } = body;

    if (!request_id) {
      return new Response(JSON.stringify({ error: "Missing request_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: "RESEND_API_KEY not set" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id, title, user_id")
      .eq("id", request_id)
      .single();

    if (requestError || !request?.user_id) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: "No requester on this request" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: requester, error: userError } =
      await supabase.auth.admin.getUserById(request.user_id);

    const requesterEmail = requester?.user?.email;
    if (userError || !requesterEmail) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: "Could not find requester email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = (site_url ?? "http://localhost:3001").replace(/\/$/, "");
    const viewUrl = `${baseUrl}/requests/${request_id}`;
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
        to: requesterEmail,
        subject: `Your Peek answer is ready: ${request.title}`,
        html: `
          <p>Good news. A Peek finished your request <strong>${request.title}</strong>.</p>
          <p><a href="${viewUrl}">View your answer on Peek</a></p>
          <p style="color:#666;font-size:14px;">Or open My requests in the app.</p>
        `
      })
    });

    if (!emailResponse.ok) {
      const detail = await emailResponse.text();
      throw new Error(`Resend failed: ${detail}`);
    }

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
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
