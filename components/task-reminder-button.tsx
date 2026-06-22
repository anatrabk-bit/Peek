"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  subscribeTaskReminderAction,
  unsubscribeTaskReminderAction
} from "@/app/requests/[id]/actions";

type TaskReminderButtonProps = {
  requestId: string;
  initialSubscribed: boolean;
  loggedIn: boolean;
};

export function TaskReminderButton({
  requestId,
  initialSubscribed,
  loggedIn
}: TaskReminderButtonProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/requests/${requestId}`)}`}
        className="btn-secondary text-sm"
      >
        Log in to set a reminder
      </Link>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = subscribed
        ? await unsubscribeTaskReminderAction(requestId)
        : await subscribeTaskReminderAction(requestId);

      if (result?.needsAuth) {
        window.location.href = `/login?next=${encodeURIComponent(`/requests/${requestId}`)}`;
        return;
      }

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSubscribed(!subscribed);
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Saving…"
          : subscribed
            ? "Reminder on ✓"
            : "Remind me 15 min before"}
      </button>
      <p className="text-xs text-peek-muted">
        We&apos;ll nudge you a quarter hour before this task opens.
      </p>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
