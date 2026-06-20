import { NextResponse, type NextRequest } from "next/server";
import { instantSignInOrUp } from "@/lib/auth/instant-auth";
import {
  validateSignupEmail,
  validateSignupPhone
} from "@/lib/auth/validate-signup";
import { notifyAdminNewUser } from "@/lib/admin/notify-new-user";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  let body: { email?: string; phone?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const phone = typeof body.phone === "string" ? body.phone : "";

  const emailError = validateSignupEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  const phoneError = validateSignupPhone(phone);
  if (phoneError) {
    return NextResponse.json({ error: phoneError }, { status: 400 });
  }

  const sessionResponse = NextResponse.json({ ok: true, isNew: false });
  const supabase = createRouteHandlerClient(request, sessionResponse);

  try {
    const result = await instantSignInOrUp(supabase, { email, phone });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.isNew) {
      const notifyResult = await notifyAdminNewUser({
        email: result.email,
        phone: result.phone,
        userId: result.userId
      });

      if (!notifyResult.sent) {
        console.warn(
          "[Peek] New user saved but admin email not sent:",
          notifyResult.reason
        );
      }
    }

    const outgoing = NextResponse.json({
      ok: true,
      isNew: result.isNew
    });

    sessionResponse.cookies.getAll().forEach((cookie) => {
      outgoing.cookies.set(cookie.name, cookie.value);
    });

    return outgoing;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create your account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
