"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "peek-welcome-tour-done";

const STEPS = [
  {
    emoji: "👋",
    title: "Welcome to Peek",
    body: "Need a quick check somewhere nearby? Ask a Peek — open hours, stock, photos, and more. Posting a request is free."
  },
  {
    emoji: "🗺️",
    title: "Two ways to join in",
    body: "Post a request when you need help, or browse Help nearby and tap \"I'm on it\" when you're close enough to check."
  },
  {
    emoji: "⭐",
    title: "Stars & privacy",
    body: "Peeks earn stars — not money. You pick a fun nickname and icon; nobody sees your real name or email."
  }
] as const;

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      return;
    }
    setVisible(true);
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleNext() {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((current) => current + 1);
  }

  if (!visible) {
    return null;
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-peek-border bg-peek-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
            {current.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-peek-muted">
              {step + 1} of {STEPS.length}
            </p>
            <h2
              id="onboarding-title"
              className="mt-1 text-xl font-bold text-peek-text"
            >
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-peek-muted">
              {current.body}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full transition ${
                index === step ? "bg-peek-primary" : "bg-zinc-200"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary flex-1 sm:flex-none"
          >
            {isLast ? "Got it" : "Next"}
          </button>
          <button
            type="button"
            onClick={finish}
            className="text-sm font-semibold text-peek-muted transition hover:text-peek-text"
          >
            Skip
          </button>
          {isLast && (
            <Link
              href="/post-request"
              onClick={finish}
              className="ml-auto text-sm font-semibold text-peek-primary hover:underline"
            >
              Post a request →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
