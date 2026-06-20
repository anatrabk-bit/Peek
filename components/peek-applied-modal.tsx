"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markNotificationRead } from "@/app/notifications/actions";
import { UserProfilePreview } from "@/components/user-profile-preview";
import type { PublicPeekDisplay } from "@/lib/supabase/peek-profile";
import type { UserNotification } from "@/types/notification";

type PendingPeekPayload = {
  requestId: string;
  requestTitle: string;
  runnerId: string;
  peek: PublicPeekDisplay;
  jobsCompleted: number;
};

type PeekAppliedModalProps = {
  notification: UserNotification | null;
  onClose: () => void;
};

export function PeekAppliedModal({
  notification,
  onClose
}: PeekAppliedModalProps) {
  const [payload, setPayload] = useState<PendingPeekPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const open = !!notification?.request_id;

  useEffect(() => {
    if (!open || !notification?.request_id) {
      setPayload(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    async function loadPeek() {
      setLoadError(null);
      setPayload(null);

      try {
        const response = await fetch(
          `/api/requests/${notification!.request_id}/pending-peek`
        );

        if (!response.ok) {
          if (!cancelled) {
            setLoadError("This task may already be handled.");
          }
          return;
        }

        const data = (await response.json()) as PendingPeekPayload;
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load Peek profile.");
        }
      }
    }

    void loadPeek();

    if (notification && !notification.read_at) {
      void markNotificationRead(notification.id);
    }

    return () => {
      cancelled = true;
    };
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-applied-title"
        className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <span
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl"
            aria-hidden
          >
            ✓
          </span>
          <h2
            id="peek-applied-title"
            className="mt-4 text-2xl font-bold text-peek-text"
          >
            A Peek is on it
          </h2>
          <p className="mt-2 text-sm text-peek-muted">{notification.body}</p>
        </div>

        <div className="mt-6">
          {loadError ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {loadError}
            </p>
          ) : payload ? (
            <UserProfilePreview display={payload.peek} />
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-peek-muted">
              Loading…
            </div>
          )}
        </div>

        {payload && (
          <Link
            href={`/requests/${payload.requestId}`}
            onClick={onClose}
            className="btn-primary mt-6 inline-flex w-full justify-center"
          >
            View request
          </Link>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-sm font-medium text-peek-muted hover:text-peek-text"
        >
          Close
        </button>
      </div>
    </div>
  );
}
