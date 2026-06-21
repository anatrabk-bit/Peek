import { NextResponse } from "next/server";
import { isAdminNotifyConfigured } from "@/lib/admin/notify-new-user";
import {
  isServiceRoleConfigured,
  missingServiceRoleMessage
} from "@/lib/supabase/admin";

/** Safe check: does not expose secrets. Helps verify Vercel env after deploy. */
export async function GET() {
  const serviceRoleConfigured = isServiceRoleConfigured();
  const adminNotifyConfigured = isAdminNotifyConfigured();

  return NextResponse.json({
    ok: serviceRoleConfigured,
    serviceRoleConfigured,
    adminNotifyConfigured,
    hint: serviceRoleConfigured
      ? "Server key is set. Signup should work."
      : missingServiceRoleMessage(),
    adminNotifyHint: adminNotifyConfigured
      ? "Admin email alerts are configured (Resend + ADMIN_EMAIL)."
      : "Set ADMIN_EMAIL and RESEND_API_KEY in Vercel, then redeploy. On Resend free tier, ADMIN_EMAIL must be the same email you used to sign up for Resend."
  });
}
