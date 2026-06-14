"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// אחרי Sign out בשרת — מנקה שאריות session/PKCE בדפדפן כדי שההתחברות הבאה תעבוד
export function ClearAuthOnSignout({ signedOut }: { signedOut: boolean }) {
  useEffect(() => {
    if (!signedOut) return;

    const supabase = createClient();
    void supabase.auth.signOut({ scope: "global" });

    const url = new URL(window.location.href);
    url.searchParams.delete("signed_out");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [signedOut]);

  return null;
}
