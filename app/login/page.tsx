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
          "That link didn't work - try Dev sign-in below.")
        : searchParams.error === "missing_code"
          ? "That sign-in link was incomplete - request a new one."
          : searchParams.error === "missing_email"
            ? "Enter your email first."
            : null);

  const signedOut = searchParams.signed_out === "1";

  return (
    <section className="page-container">
      <ClearAuthOnSignout signedOut={signedOut} />
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center sm:text-left">
          <h1 className="heading-section text-3xl">Welcome back</h1>
          <p className="mt-3 text-body">
            Enter your email and we&apos;ll send you a sign-in link.
          </p>
          {signedOut && (
            <p className="mt-3 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
              You&apos;re signed out. Sign in again below.
            </p>
          )}
        </div>

        <div className="card-static">
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
