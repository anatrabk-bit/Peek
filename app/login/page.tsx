import Link from "next/link";
import { ClearAuthOnSignout } from "@/components/clear-auth-on-signout";
import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams: {
    error?: string;
    message?: string;
    next?: string;
    signed_out?: string;
  };
};

const chips = ["🌈 Free to post", "⭐ Earn stars", "🦊 Stay anonymous"];

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage =
    searchParams.message ??
    (searchParams.error === "wrong_browser"
      ? "Open the link in the same browser where you requested it (not the Gmail app)."
      : searchParams.error === "auth" || searchParams.error === "auth_failed"
        ? (searchParams.message ??
          "That link didn't work — try again or use Dev sign-in below.")
        : searchParams.error === "missing_code"
          ? "That sign-in link was incomplete — request a new one."
          : searchParams.error === "missing_email"
            ? "Enter your email first."
            : null);

  const signedOut = searchParams.signed_out === "1";

  return (
    <section className="peek-auth-page page-container flex min-h-[calc(100vh-12rem)] items-center py-10">
      <ClearAuthOnSignout signedOut={signedOut} />
      <div className="mx-auto w-full max-w-md space-y-8 peek-fade-in">
        <div className="space-y-5 text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-gradient-to-br from-pink-200 via-amber-100 to-violet-200 opacity-60" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-peek-primary via-peek-coral to-peek-sunny text-5xl shadow-bubbly ring-4 ring-white">
              ✨
            </div>
          </div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-peek-primary">
              Welcome to Peek
            </p>
            <h1 className="heading-section mt-2 text-3xl sm:text-4xl">
              Join the kindness crew
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-body">
              Help someone nearby, or ask for a quick check when you can&apos;t
              be there. Fun nickname — no real name ever.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((chip) => (
              <span key={chip} className="peek-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>

        {signedOut && (
          <p className="rounded-[1.25rem] border-2 border-peek-mint/40 bg-peek-mint/20 px-4 py-3 text-center text-sm font-semibold text-emerald-900">
            You&apos;re signed out. Jump back in below whenever you&apos;re ready 💛
          </p>
        )}

        <div className="peek-auth-card card-static">
          <div className="mb-5 border-b-2 border-peek-peach/50 pb-4">
            <h2 className="text-lg font-extrabold text-peek-text">
              Create your account
            </h2>
            <p className="mt-1 text-sm font-medium text-peek-muted">
              Email + phone, then one magic link. That&apos;s it.
            </p>
          </div>
          <LoginForm
            errorMessage={errorMessage}
            redirectTo={searchParams.next}
          />
        </div>

        <p className="text-center text-sm text-peek-muted">
          <Link
            href="/"
            className="font-bold text-peek-primary hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
