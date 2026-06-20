"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  signedIn: boolean;
};

const guestTabs = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/requests", label: "Jobs", emoji: "🔍" },
  { href: "/login", label: "Join", emoji: "✨" }
] as const;

const userTabs = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/requests", label: "Jobs", emoji: "🔍" },
  { href: "/post-request", label: "Post", emoji: "📝" },
  { href: "/my-requests", label: "Mine", emoji: "📋" },
  { href: "/profile", label: "Profile", emoji: "⭐" }
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav({ signedIn }: MobileBottomNavProps) {
  const pathname = usePathname();
  const tabs = signedIn ? userTabs : guestTabs;

  return (
    <nav className="peek-mobile-nav fixed inset-x-0 bottom-0 z-50 sm:hidden" aria-label="Main">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center text-[10px] font-extrabold transition ${
                active
                  ? "bg-gradient-to-t from-pink-100 to-peek-peach/60 text-peek-primary"
                  : "text-peek-muted hover:text-peek-text"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {tab.emoji}
              </span>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
