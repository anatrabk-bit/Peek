"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// אם ה-code נחת בדף הלא נכון — הדפדפן מחליף אותו ל-session (יש לו את מפתח ה-PKCE)
export function AuthCodeHandler() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code || window.location.pathname.startsWith("/auth/")) return;

    handled.current = true;

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      if (!error) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
