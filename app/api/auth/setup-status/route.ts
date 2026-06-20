import { NextResponse } from "next/server";
import {
  isServiceRoleConfigured,
  missingServiceRoleMessage
} from "@/lib/supabase/admin";

/** Safe check: does not expose secrets. Helps verify Vercel env after deploy. */
export async function GET() {
  const configured = isServiceRoleConfigured();

  return NextResponse.json({
    ok: configured,
    serviceRoleConfigured: configured,
    hint: configured
      ? "Server key is set — signup should work."
      : missingServiceRoleMessage()
  });
}
