import { NextResponse, type NextRequest } from "next/server";
import { verifyDevLoginEmail } from "@/lib/auth/dev-login";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

// רק ב-development: מתחבר מיידית בלי מייל ובלי redirect ל-Vercel
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  let email: string;
  let name: string;
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim() : "";
    name = typeof body.name === "string" ? body.name.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    let response = NextResponse.json({ success: true });
    const supabase = createRouteHandlerClient(request, response);
    const result = await verifyDevLoginEmail(supabase, email, name);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Dev login is not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
