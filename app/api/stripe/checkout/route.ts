import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentForRequest } from "@/lib/supabase/payments";
import { createClient } from "@/lib/supabase/server";
import { isStripeEnabled } from "@/lib/stripe/config";
import { createRequestCheckoutSession } from "@/lib/stripe/payments";

export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  let requestId = "";
  try {
    const body = await request.json();
    requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!requestId) {
    return NextResponse.json({ error: "Missing request id." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to pay." }, { status: 401 });
  }

  let { data: peekRequest, error } = await supabase
    .from("requests")
    .select("id, user_id, title, budget")
    .eq("id", requestId)
    .single();

  if (error && process.env.NODE_ENV === "development") {
    const admin = createAdminClient();
    const adminResult = await admin
      .from("requests")
      .select("id, user_id, title, budget")
      .eq("id", requestId)
      .single();
    peekRequest = adminResult.data;
    error = adminResult.error;
  }

  if (error || !peekRequest) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (peekRequest.user_id !== user.id) {
    return NextResponse.json({ error: "Not your request." }, { status: 403 });
  }

  const payment = await getPaymentForRequest(requestId);

  if (!payment || payment.status !== "pending" || payment.payment_provider !== "stripe") {
    return NextResponse.json(
      { error: "This request does not need payment." },
      { status: 400 }
    );
  }

  try {
    const session = await createRequestCheckoutSession({
      requestId,
      title: peekRequest.title,
      budgetGbp: Number(peekRequest.budget),
      customerEmail: user.email
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
