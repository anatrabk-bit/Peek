"use client";

import { useEffect, useState, useTransition } from "react";
import { checkInOnClaim } from "@/app/requests/[id]/actions";
import {
  formatCountdown,
  msUntilCheckInPrompt,
  msUntilClaimExpires,
  shouldPromptCheckIn
} from "@/lib/claim-session";

type ClaimTimerPanelProps = {
  requestId: string;
  claimedAt: string;
  checkInAt: string | null;
};

export function ClaimTimerPanel({
  requestId,
  claimedAt,
  checkInAt: initialCheckInAt
}: ClaimTimerPanelProps) {
  const [checkInAt, setCheckInAt] = useState(initialCheckInAt);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const showCheckIn = shouldPromptCheckIn(claimedAt, checkInAt, now);
  const timeLeft = formatCountdown(msUntilClaimExpires(claimedAt, now));
  const untilCheckIn = formatCountdown(msUntilCheckInPrompt(claimedAt, now));

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const result = await checkInOnClaim(requestId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCheckInAt(new Date().toISOString());
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">15-minute window</p>
        <p className="font-mono text-sm">{timeLeft} left</p>
      </div>

      {checkInAt ? (
        <p className="text-sm leading-relaxed">
          You checked in. Finish the task and submit your answer below.
        </p>
      ) : showCheckIn ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            Still on it? Tap below so the requester knows you&apos;re working on
            it.
          </p>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Yes, still on it"}
          </button>
        </div>
      ) : (
        <p className="text-sm leading-relaxed">
          Check-in opens in {untilCheckIn}. You have until the timer runs out to
          submit.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
