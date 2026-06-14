import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

// גיבוי לזרימת PKCE (code) — אם המייל עדיין משתמש ב-ConfirmationURL הישן
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const nextFromQuery = searchParams.get("next");
  const nextFromCookie = request.cookies.get("peek_auth_next")?.value;
  const nextParam = nextFromQuery ?? (nextFromCookie ? decodeURIComponent(nextFromCookie) : "/");
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete("peek_auth_next");

  const supabase = createRouteHandlerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

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
