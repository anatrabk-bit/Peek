import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

// נקודת סיום להתחברות מהמייל — תומך גם ב-token_hash וגם ב-code
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const nextFromCookie = request.cookies.get("peek_auth_next")?.value;
  const nextParam = nextFromCookie ? decodeURIComponent(nextFromCookie) : "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (!token_hash && !code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete("peek_auth_next");

  const supabase = createRouteHandlerClient(request, response);

  const { error } = token_hash && type
    ? await supabase.auth.verifyOtp({ token_hash, type })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    const errorCode =
      error.message.toLowerCase().includes("pkce") ||
      error.message.toLowerCase().includes("code verifier")
        ? "wrong_browser"
        : "auth_failed";

    return NextResponse.redirect(`${origin}/login?error=${errorCode}`);
  }

  return response;
}
