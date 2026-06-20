"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  signedIn: boolean;
};

const guestTabs = [
  { href: "/", label: "Home" },
  { href: "/requests", label: "Help" },
  { href: "/login", label: "Join" }
] as const;

const userTabs = [
  { href: "/", label: "Home" },
  { href: "/requests", label: "Help" },
  { href: "/post-request", label: "Post" },
  { href: "/my-requests", label: "Mine" },
  { href: "/profile", label: "Profile" }
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
              className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-lg px-1 py-2 text-center text-[11px] font-semibold transition ${
                active
                  ? "text-peek-primary"
                  : "text-peek-muted hover:text-peek-text"
              }`}
            >
              <span
                className={`mb-1 h-0.5 w-6 rounded-full ${
                  active ? "bg-peek-primary" : "bg-transparent"
                }`}
                aria-hidden
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
