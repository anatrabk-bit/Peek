"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

type LoginFormProps = {
  errorMessage?: string | null;
  redirectTo?: string;
};

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function LoginForm({ errorMessage, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!isValidPhone(trimmedPhone)) {
      setStatus("error");
      setMessage("Enter a valid phone number (at least 7 digits).");
      return;
    }

    const supabase = createClient();
    const nextPath = redirectTo?.startsWith("/") ? redirectTo : "/";
    const callbackUrl = `${getSiteUrl()}/auth/confirm`;

    document.cookie = `peek_auth_next=${encodeURIComponent(nextPath)}; path=/; max-age=3600; SameSite=Lax`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: callbackUrl,
        data: {
          phone: trimmedPhone
        }
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
    setMessage(
      "You're almost in! Check your inbox and tap the link to finish joining Peek."
    );
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
      if (phone.trim()) {
        body.set("phone", phone.trim());
      }

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
          Email
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

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-semibold text-peek-text">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="+44 7700 900123"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={status === "loading" || status === "sent"}
          className="input-field"
        />
        <p className="text-xs text-peek-muted">
          So we can reach you about your requests — never shown publicly.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? "Sending magic link…"
          : status === "sent"
            ? "Link sent ✨"
            : "Send me a magic link"}
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
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            status === "error"
              ? "bg-red-50 text-red-700"
              : status === "sent"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-sky-50 text-sky-900"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
