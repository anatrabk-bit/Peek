export const dynamic = "force-dynamic";
export const revalidate = 0;

import { AuthCodeHandler } from "@/components/auth-code-handler";
import AuthStatus from "@/components/AuthStatus";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { InstallAppPrompt } from "@/components/install-app-prompt";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PwaRegister } from "@/components/pwa-register";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AppProviders } from "@/components/app-providers";
import { Footer } from "@/components/footer";
import { getUserSummary } from "@/lib/auth-user";
import {
  getRecentNotifications,
  getUnreadNotificationCount
} from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Peek - Skip the trip. Ask a Peek.",
  description:
    "Post a request when you need help in person. Become a Peek and earn helping nearby.",
  applicationName: "Peek",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Peek"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // השרת קורא את ה-cookies ויודע אם המשתמש מחובר — לפני שהדפדפן עושה כלום
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [unreadCount, recentNotifications] = user
    ? await Promise.all([
        getUnreadNotificationCount(user.id),
        getRecentNotifications(user.id)
      ])
    : [0, []];

  const notificationShell = (
    <>
      <AuthCodeHandler />
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold text-peek-primary transition hover:opacity-80 sm:text-xl"
          >
            Peek
          </Link>

          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <div className="hidden min-w-0 items-center gap-4 text-sm font-medium text-peek-muted sm:flex sm:gap-5">
              <Link href="/post-request" className="nav-link">
                Post a request
              </Link>
              {user && (
                <Link href="/my-requests" className="nav-link whitespace-nowrap">
                  My requests
                </Link>
              )}
              <Link href="/requests" className="nav-link whitespace-nowrap">
                Find work
              </Link>
              <Link href="/profile" className="nav-link">
                Profile
              </Link>
            </div>

            {user && (
              <NotificationBell
                initialUnreadCount={unreadCount}
                initialNotifications={recentNotifications}
              />
            )}

            <AuthStatus
              initialSignedIn={!!user}
              initialUser={getUserSummary(user)}
            />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <AppProviders>{children}</AppProviders>
      </main>
      <Footer className="peek-site-footer" />
      <MobileBottomNav signedIn={!!user} />
    </>
  );

  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <PwaRegister />
        {user ? (
          <NotificationProvider
            userId={user.id}
            initialUnreadCount={unreadCount}
            initialNotifications={recentNotifications}
          >
            {notificationShell}
          </NotificationProvider>
        ) : (
          notificationShell
        )}
        <InstallAppPrompt />
      </body>
    </html>
  );
}
