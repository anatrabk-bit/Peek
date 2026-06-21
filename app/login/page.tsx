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

const chips = ["Free to post", "Earn stars", "Stay anonymous"];

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage =
    searchParams.message ??
    (searchParams.error === "wrong_browser"
      ? "Open the link in the same browser where you requested it (not the Gmail app)."
      : searchParams.error === "auth" || searchParams.error === "auth_failed"
        ? (searchParams.message ??
          "That link didn't work. Try again or use Dev sign-in below.")
        : searchParams.error === "missing_code"
          ? "That sign-in link was incomplete. Request a new one."
          : searchParams.error === "missing_email"
            ? "Enter your email first."
            : null);

  const signedOut = searchParams.signed_out === "1";

  return (
    <section className="peek-auth-page page-container flex min-h-[calc(100vh-12rem)] items-center py-10">
      <ClearAuthOnSignout signedOut={signedOut} />
      <div className="mx-auto w-full max-w-md space-y-8 peek-fade-in">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
            👋
          </div>
          <div>
            <h1 className="heading-section text-3xl">Join Peek</h1>
            <p className="mx-auto mt-3 max-w-sm text-body">
              Help nearby or ask for a quick check.
              <br />
              You stay anonymous with a nickname, never your real name.
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
          <p className="peek-callout text-center">
            You&apos;re signed out. Sign in again below when you&apos;re ready.
          </p>
        )}

        <div className="peek-auth-card card-static">
          <div className="mb-5 border-b border-peek-border pb-4">
            <h2 className="text-lg font-semibold text-peek-text">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-peek-muted">
              Email and phone. You&apos;re in instantly.
              <br />
              No email link needed.
            </p>
          </div>
          <LoginForm
            errorMessage={errorMessage}
            redirectTo={searchParams.next}
          />
        </div>

        <p className="text-center text-sm text-peek-muted">
          <Link href="/" className="font-semibold text-peek-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
