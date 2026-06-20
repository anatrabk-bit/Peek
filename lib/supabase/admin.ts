import { createClient } from "@supabase/supabase-js";

function getServiceRoleKey(): string | undefined {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  return key || undefined;
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getServiceRoleKey()
  );
}

export function missingServiceRoleMessage(): string {
  if (process.env.VERCEL) {
    return (
      "The live site is missing SUPABASE_SERVICE_ROLE_KEY. " +
      "Open Vercel → Peek → Settings → Environment Variables, add SUPABASE_SERVICE_ROLE_KEY " +
      "(copy service_role or Secret key from Supabase → Settings → API), save, then Redeploy. " +
      "Updating .env.local on your computer does not change peek-eta.vercel.app."
    );
  }

  return (
    "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (Supabase → Settings → API), " +
    "then stop and restart npm run dev."
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(missingServiceRoleMessage());
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
