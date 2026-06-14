"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDisplayName, type AuthUserSummary } from "@/lib/auth-user";
import { UserInitialsAvatar } from "@/components/user-initials-avatar";

type AuthStatusProps = {
  initialSignedIn: boolean;
  initialUser?: AuthUserSummary | null;
};

function Chevron() {
  return (
    <svg
      className="account-menu-chevron h-4 w-4 shrink-0 text-peek-muted transition-transform"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AuthStatus({
  initialSignedIn,
  initialUser = null
}: AuthStatusProps) {
  const signedIn = initialSignedIn;
  const user = initialUser;
  const menuRef = useRef<HTMLDetailsElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const menu = menuRef.current;
      if (!menu?.open) return;
      if (!menu.contains(event.target as Node)) {
        menu.open = false;
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  if (!signedIn || !user) {
    return (
      <Link
        href="/login"
        className="rounded-full border-2 border-peek-primary px-4 py-1.5 text-peek-primary transition hover:bg-sky-50"
      >
        Log in
      </Link>
    );
  }

  const displayName = getDisplayName(user) ?? "Account";

  return (
    <details ref={menuRef} className="relative shrink-0">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peek-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
        aria-label={`Account menu for ${displayName}`}
      >
        <UserInitialsAvatar initials={user.initials} size="sm" />
        <Chevron />
      </summary>

      <div
        className="absolute right-0 z-[60] mt-2 w-72 origin-top-right rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg"
        role="menu"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <UserInitialsAvatar initials={user.initials} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-peek-text" dir="ltr">
              {displayName}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-sm text-peek-muted" dir="ltr">
                {user.email}
              </p>
            )}
          </div>
        </div>

        <div className="pt-3">
          <Link
            href="/my-requests"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-peek-text transition hover:bg-zinc-50"
            onClick={closeMenu}
            role="menuitem"
          >
            My requests
          </Link>
          <Link
            href="/profile"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-peek-text transition hover:bg-zinc-50"
            onClick={closeMenu}
            role="menuitem"
          >
            Profile
          </Link>
          <Link
            href="/auth/signout"
            className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            role="menuitem"
          >
            Sign out
          </Link>
        </div>
      </div>
    </details>
  );
}
