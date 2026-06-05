"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl
      }
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Done - check your inbox and tap the link to sign in.");
  }

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
