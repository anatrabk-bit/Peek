import Link from "next/link";
import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage =
    searchParams.error === "auth"
      ? "That link didn't work - try sending yourself a fresh one."
      : null;

  return (
    <section className="page-container">
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center sm:text-left">
          <h1 className="heading-section text-3xl">Welcome back</h1>
          <p className="mt-3 text-body">
            Pop in your email and we&apos;ll send a link. No password to remember.
          </p>
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
