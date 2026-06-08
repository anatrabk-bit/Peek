export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AppProviders } from "@/components/app-providers";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Peek - Skip the trip. Ask a Peek.",
  description:
    "Post a request when you need help in person. Become a Peek and earn helping nearby."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold text-peek-primary">
              Peek
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-peek-muted">
              <Link href="/post-request" className="hover:text-peek-primary">
                Post a request
              </Link>
              <Link href="/requests" className="hover:text-peek-primary">
                Find work
              </Link>
              <Link href="/profile" className="hover:text-peek-primary">
                Profile
              </Link>
              <Link
                href="/login"
                className="rounded-full border-2 border-peek-primary px-4 py-1.5 text-peek-primary transition hover:bg-sky-50"
              >
                Log in
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">
          <AppProviders>{children}</AppProviders>
        </main>

        <Footer />
      </body>
    </html>
  );
}
