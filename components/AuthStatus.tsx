"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPeekDisplayName, type AuthUserSummary } from "@/lib/auth-user";
import { UserAvatarIcon } from "@/components/user-avatar-icon";

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
    } = supabase.auth.onAuthStateChange((event) => {
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
        className="rounded-full border border-peek-border bg-peek-surface px-4 py-1.5 text-sm font-semibold text-peek-primary transition hover:bg-sky-50"
      >
        Join
      </Link>
    );
  }

  const peekName = getPeekDisplayName(user);
  const avatarIcon = user.peekAvatarIcon ?? "✨";

  return (
    <details ref={menuRef} className="relative shrink-0">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
        aria-label={`Account menu for ${peekName}`}
      >
        <UserAvatarIcon icon={avatarIcon} size="sm" />
        <Chevron />
      </summary>

      <div
        className="absolute right-0 z-[60] mt-2 w-72 origin-top-right rounded-xl border border-peek-border bg-peek-surface p-4 shadow-card"
        role="menu"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-sky-50 pb-4">
          <UserAvatarIcon icon={avatarIcon} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-peek-text" dir="ltr">
              {peekName}
            </p>
            <p className="mt-0.5 text-sm text-peek-muted">
              Your anonymous profile
            </p>
          </div>
        </div>

        <div className="pt-3">
          <Link
            href="/my-requests"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-peek-text transition hover:bg-sky-50"
            onClick={closeMenu}
            role="menuitem"
          >
            My requests
          </Link>
          <Link
            href="/profile"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-peek-text transition hover:bg-sky-50"
            onClick={closeMenu}
            role="menuitem"
          >
            Profile &amp; stars
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
