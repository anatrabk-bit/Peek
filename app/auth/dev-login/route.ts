import { type NextRequest, NextResponse } from "next/server";
import { verifyDevLoginEmail } from "@/lib/auth/dev-login";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.redirect(
      new URL("/login?error=dev_only", request.url)
    );
  }

  const { origin } = new URL(request.url);
  let email = "";
  let name = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      email = typeof body.email === "string" ? body.email.trim() : "";
      name = typeof body.name === "string" ? body.name.trim() : "";
    } catch {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") ?? "").trim();
    name = String(formData.get("name") ?? "").trim();
  }

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=missing_email`);
  }

  const response = NextResponse.redirect(`${origin}/`);
  const supabase = createRouteHandlerClient(request, response);

  let result: Awaited<ReturnType<typeof verifyDevLoginEmail>>;
  try {
    result = await verifyDevLoginEmail(supabase, email, name);
  } catch (err) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth_failed");
    loginUrl.searchParams.set(
      "message",
      err instanceof Error
        ? err.message
        : "Dev login is not configured."
    );
    return NextResponse.redirect(loginUrl);
  }

  if ("error" in result) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth_failed");
    loginUrl.searchParams.set("message", result.error ?? "Login failed.");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
