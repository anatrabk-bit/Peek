"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markNotificationRead } from "@/app/notifications/actions";
import type { UserNotification } from "@/types/notification";

type PeekDecisionModalProps = {
  notification: UserNotification | null;
  onClose: () => void;
};

const COPY = {
  peek_approved: {
    emoji: "✓",
    ringClass: "bg-emerald-100 text-emerald-700",
    borderClass: "border-emerald-200",
    cta: "Start the job →",
    ctaClass: "btn-primary"
  },
  peek_declined: {
    emoji: "✕",
    ringClass: "bg-amber-100 text-amber-800",
    borderClass: "border-amber-200",
    cta: "Browse jobs →",
    ctaClass: "btn-secondary"
  }
} as const;

export function PeekDecisionModal({
  notification,
  onClose
}: PeekDecisionModalProps) {
  const router = useRouter();
  const open =
    notification?.event === "peek_approved" ||
    notification?.event === "peek_declined";

  useEffect(() => {
    if (!open || !notification || notification.read_at) return;
    void markNotificationRead(notification.id);
  }, [open, notification]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !notification) {
    return null;
  }

  const copy = COPY[notification.event as keyof typeof COPY];
  const href = notification.url ?? "/requests";

  function handlePrimaryAction() {
    onClose();
    router.push(href);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-decision-title"
        className={`w-full max-w-lg rounded-3xl border-2 ${copy.borderClass} bg-white p-8 text-center shadow-2xl sm:p-10`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${copy.ringClass}`}
          aria-hidden
        >
          {copy.emoji}
        </div>

        <h2
          id="peek-decision-title"
          className="mt-6 text-2xl font-bold text-peek-text sm:text-3xl"
        >
          {notification.title}
        </h2>

        <p className="mt-4 text-base leading-relaxed text-peek-muted sm:text-lg">
          {notification.body}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`${copy.ctaClass} w-full sm:w-auto`}
          >
            {copy.cta}
          </button>
          <Link
            href={href}
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-peek-text transition hover:bg-zinc-50 sm:w-auto"
          >
            View details
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm font-medium text-peek-muted hover:text-peek-text"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
