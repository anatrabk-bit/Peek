import { createClient } from "@/lib/supabase/server";

/** Change this to the email you use to log in to Peek. */
export const ADMIN_EMAIL = "anat@example.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? ADMIN_EMAIL).toLowerCase();
  return email.toLowerCase() === adminEmail;
}

export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user || !isAdminEmail(user.email)) {
    return null;
  }

  return user;
}
