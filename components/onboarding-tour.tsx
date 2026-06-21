"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "peek-welcome-tour-done";

const STEPS = [
  {
    emoji: "👀",
    badgeClass: "peek-icon-badge-sky",
    title: "Quick checks, nearby",
    lines: ["Open hours · stock · photos", "Free to post — ask in seconds"]
  },
  {
    emoji: "🗺️",
    badgeClass: "peek-icon-badge-emerald",
    title: "Two simple paths",
    cards: [
      { label: "Post a request", hint: "When you need an answer" },
      { label: "Help nearby", hint: "Tap I'm on it when you're close" }
    ]
  },
  {
    emoji: "⭐",
    badgeClass: "peek-icon-badge-amber",
    title: "Stars & privacy",
    lines: ["Peeks earn stars — not money", "Pick a nickname · no real names"]
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
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/35 p-4 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onClick={finish}
    >
      <div
        className="peek-fade-in w-full max-w-sm overflow-hidden rounded-3xl border border-white/80 bg-peek-surface shadow-[0_24px_60px_-12px_rgba(2,132,199,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 to-cyan-700 px-6 pb-8 pt-5 text-white">
          <div className="peek-blob peek-blob-a opacity-40" aria-hidden />
          <button
            type="button"
            onClick={finish}
            className="absolute right-4 top-4 rounded-full p-1.5 text-sky-100 transition hover:bg-white/15 hover:text-white"
            aria-label="Skip intro"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          <p className="text-xs font-semibold uppercase tracking-widest text-sky-100/90">
            {step + 1} / {STEPS.length}
          </p>

          <div
            key={step}
            className="relative mt-5 peek-fade-in"
          >
            <div
              className={`peek-icon-badge mb-4 ${current.badgeClass} !h-14 !w-14 !rounded-2xl !text-3xl`}
            >
              {current.emoji}
            </div>
            <h2
              id="onboarding-title"
              className="text-2xl font-bold tracking-tight text-white"
            >
              {current.title}
            </h2>
          </div>

          <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div key={`body-${step}`} className="space-y-4 px-6 py-5 peek-fade-in">
          {"lines" in current &&
            current.lines.map((line) => (
              <p
                key={line}
                className="text-sm leading-relaxed text-peek-muted"
              >
                {line}
              </p>
            ))}

          {"cards" in current &&
            current.cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-zinc-100 bg-peek-warm px-4 py-3"
              >
                <p className="font-semibold text-peek-text">{card.label}</p>
                <p className="mt-0.5 text-sm text-peek-muted">{card.hint}</p>
              </div>
            ))}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1 justify-center py-2.5"
            >
              {isLast ? "Start exploring" : "Next"}
            </button>
            {!isLast && (
              <button
                type="button"
                onClick={finish}
                className="shrink-0 px-2 text-sm font-semibold text-peek-muted transition hover:text-peek-text"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
