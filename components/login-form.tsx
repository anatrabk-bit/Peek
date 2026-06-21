"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  errorMessage?: string | null;
  redirectTo?: string;
};

export function LoginForm({ errorMessage, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim()
        }),
        credentials: "same-origin"
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        isNew?: boolean;
      };

      if (!response.ok || data.error) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }

      const nextPath = data.isNew
        ? "/profile?setup=1"
        : redirectTo?.startsWith("/")
          ? redirectTo
          : "/";

      router.push(nextPath);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Check your connection and try again.");
    }
  }

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
          disabled={status === "loading"}
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
          disabled={status === "loading"}
          className="input-field"
        />
        <p className="text-xs text-peek-muted">
          Private. Only used to reach you about your requests.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Join Peek"}
      </button>

      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            status === "error"
              ? "border border-red-200 bg-red-50 text-red-800"
              : "peek-callout"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
