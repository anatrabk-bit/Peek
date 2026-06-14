"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  approvePeekForRequest,
  declinePeekForRequest
} from "@/app/requests/[id]/actions";
import { markNotificationRead } from "@/app/notifications/actions";
import { UserProfilePreview } from "@/components/user-profile-preview";
import type { AuthUserSummary } from "@/lib/auth-user";
import type { UserNotification } from "@/types/notification";
import type { UserRatingSummary } from "@/types/rating";

type PendingPeekPayload = {
  requestId: string;
  requestTitle: string;
  runnerId: string;
  peek: AuthUserSummary;
  peekRating: UserRatingSummary;
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
  const router = useRouter();
  const [payload, setPayload] = useState<PendingPeekPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = !!notification?.request_id;

  useEffect(() => {
    if (!open || !notification?.request_id) {
      setPayload(null);
      setLoadError(null);
      setActionError(null);
      return;
    }

    let cancelled = false;

    async function loadPendingPeek() {
      setLoadError(null);
      setPayload(null);

      try {
        const response = await fetch(
          `/api/requests/${notification!.request_id}/pending-peek`
        );

        if (!response.ok) {
          if (!cancelled) {
            setLoadError("This application is no longer waiting for approval.");
          }
          return;
        }

        const data = (await response.json()) as PendingPeekPayload;
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load the Peek profile. Try again from My requests.");
        }
      }
    }

    void loadPendingPeek();

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
      if (event.key === "Escape" && !isPending) {
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
  }, [open, isPending, onClose]);

  function handleApprove() {
    if (!payload) return;
    setActionError(null);

    startTransition(async () => {
      const result = await approvePeekForRequest(payload.requestId);
      if (!result.ok) {
        setActionError(result.error ?? "Could not approve this Peek.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function handleDecline() {
    if (!payload) return;
    setActionError(null);

    startTransition(async () => {
      const result = await declinePeekForRequest(payload.requestId);
      if (!result.ok) {
        setActionError(result.error ?? "Could not decline this Peek.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  if (!open || !notification) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/70 p-4 backdrop-blur-sm"
      onClick={isPending ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-applied-title"
        className="w-full max-w-lg rounded-3xl border border-violet-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <span
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-2xl"
            aria-hidden
          >
            👋
          </span>
          <h2
            id="peek-applied-title"
            className="mt-4 text-2xl font-bold text-peek-text"
          >
            A Peek wants your job
          </h2>
          <p className="mt-2 text-sm text-peek-muted">
            {notification.body}
          </p>
        </div>

        <div className="mt-6">
          {loadError ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {loadError}
            </p>
          ) : payload ? (
            <UserProfilePreview
              display={payload.peek}
              userId={payload.runnerId}
              role="peek"
              summary={payload.peekRating}
              metaLabel={
                payload.jobsCompleted > 0
                  ? `${payload.jobsCompleted} job${payload.jobsCompleted === 1 ? "" : "s"} completed`
                  : null
              }
              showProfileLink
            />
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-peek-muted">
              Loading Peek profile…
            </div>
          )}
        </div>

        {payload && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Approving…" : "Approve Peek"}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={isPending}
              className="btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Declining…" : "Decline"}
            </button>
          </div>
        )}

        {actionError && (
          <p className="mt-4 text-center text-sm text-red-600" role="alert">
            {actionError}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="mt-4 w-full text-center text-sm font-medium text-peek-muted hover:text-peek-text disabled:opacity-60"
        >
          Review later
        </button>
      </div>
    </div>
  );
}
