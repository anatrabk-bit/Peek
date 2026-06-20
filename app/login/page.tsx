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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-200 via-pink-100 to-sky-200 text-4xl shadow-md ring-4 ring-white/80">
            ✨
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-peek-primary">
              Welcome to Peek
            </p>
            <h1 className="heading-section mt-2 text-3xl sm:text-4xl">
              Join the kindness crew
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-body">
              Help someone nearby, or ask for a quick check when you can&apos;t
              be there. You stay anonymous — fun nickname, no real name.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {["🌈 Free to post", "⭐ Earn stars", "🦊 Stay anonymous"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-sky-100 bg-white/80 px-3 py-1 font-medium text-peek-text shadow-sm"
                >
                  {chip}
                </span>
              )
            )}
          </div>
        </div>

        {signedOut && (
          <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-center text-sm text-sky-900">
            You&apos;re signed out. Jump back in below whenever you&apos;re ready.
          </p>
        )}

        <div className="peek-auth-card card-static">
          <div className="mb-5 border-b border-sky-50 pb-4">
            <h2 className="text-lg font-semibold text-peek-text">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-peek-muted">
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
            className="font-semibold text-peek-primary hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
