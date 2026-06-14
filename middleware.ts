import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");

  // token_hash או code שנחתו בדף הלא נכון — מפנה ל-/auth/confirm
  if (
    (token_hash || code) &&
    !url.pathname.startsWith("/auth/confirm") &&
    !url.pathname.startsWith("/auth/callback")
  ) {
    const confirmUrl = url.clone();
    confirmUrl.pathname = "/auth/confirm";
    return NextResponse.redirect(confirmUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
