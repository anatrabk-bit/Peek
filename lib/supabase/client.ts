import { createBrowserClient } from "@supabase/ssr";

// יוצר חיבור ל-Supabase מהדפדפן (צד הלקוח / client)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
