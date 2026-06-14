"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

type LoginFormProps = {
  errorMessage?: string | null;
  redirectTo?: string;
};

export function LoginForm({ errorMessage, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const nextPath = redirectTo?.startsWith("/") ? redirectTo : "/";

    // כתובת קבועה מה-env — לא תלויה בפורט אקראי (3000/3001/3002)
    const callbackUrl = `${getSiteUrl()}/auth/confirm`;

    document.cookie = `peek_auth_next=${encodeURIComponent(nextPath)}; path=/; max-age=3600; SameSite=Lax`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl
      }
    });

    if (error) {
      setStatus("error");
      setMessage(
        error.message.toLowerCase().includes("rate limit")
          ? "Email rate limit reached — use the dev sign-in button below (no email needed)."
          : error.message
      );
      return;
    }

    setStatus("sent");
    setMessage("Done - check your inbox and tap the link to sign in.");
  }

  async function handleDevLogin() {
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter your email first, then tap Dev sign-in.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const body = new FormData();
      body.set("email", trimmed);

      const response = await fetch("/auth/dev-login", {
        method: "POST",
        body,
        credentials: "same-origin",
        redirect: "follow"
      });

      if (response.url.includes("/login")) {
        window.location.href = response.url;
        return;
      }

      window.location.href = redirectTo?.startsWith("/") ? redirectTo : "/";
    } catch {
      setStatus("error");
      setMessage(
        "Dev sign-in could not reach the server. Check that npm run dev is running on your PC and the tunnel is still open."
      );
    }
  }

  const isDev = process.env.NODE_ENV === "development";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-peek-text">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "loading" || status === "sent"}
          className="input-field"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Email me a sign-in link"}
      </button>

      {isDev && (
        <button
          type="button"
          onClick={handleDevLogin}
          disabled={status === "loading" || status === "sent"}
          className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Signing in…" : "Dev: sign in instantly (no email)"}
        </button>
      )}

      {message && (
        <p
          className={`text-sm leading-relaxed ${
            status === "error" ? "text-red-600" : "text-peek-muted"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
