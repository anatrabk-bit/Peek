"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkInOnClaim,
  triggerClaimWindowNotification
} from "@/app/requests/[id]/actions";
import {
  formatCountdown,
  isClaimWindowOpen,
  msUntilClaimExpiresForTask,
  msUntilClaimWindowOpens,
  msUntilCheckInPromptForTask,
  shouldPromptCheckInForTask
} from "@/lib/claim-session";
import { formatTaskSchedule } from "@/lib/task-schedule";
import type { TaskScheduleFields } from "@/types/task-schedule";

type ClaimTimerPanelProps = {
  requestId: string;
  claimedAt: string;
  checkInAt: string | null;
  schedule: TaskScheduleFields;
};

export function ClaimTimerPanel({
  requestId,
  claimedAt,
  checkInAt: initialCheckInAt,
  schedule
}: ClaimTimerPanelProps) {
  const [checkInAt, setCheckInAt] = useState(initialCheckInAt);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const notifiedRef = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const windowOpen = isClaimWindowOpen(schedule, claimedAt, now);
  const scheduleLabel = formatTaskSchedule(schedule);

  useEffect(() => {
    if (!windowOpen || notifiedRef.current) {
      return;
    }

    notifiedRef.current = true;
    void triggerClaimWindowNotification(requestId);
  }, [windowOpen, requestId]);

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

  if (!windowOpen) {
    const untilStart = formatCountdown(
      msUntilClaimWindowOpens(schedule, claimedAt, now)
    );

    return (
      <div className="space-y-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950">
        <p className="font-semibold">You&apos;re booked for this one</p>
        <p className="text-sm leading-relaxed">
          No rush yet. This task starts {scheduleLabel.toLowerCase()}.
        </p>
        <p className="text-sm text-sky-800">
          We&apos;ll remind you when it&apos;s time to go. Starts in {untilStart}.
        </p>
      </div>
    );
  }

  const showCheckIn = shouldPromptCheckInForTask(
    schedule,
    claimedAt,
    checkInAt,
    now
  );
  const timeLeft = formatCountdown(
    msUntilClaimExpiresForTask(schedule, claimedAt, now)
  );
  const untilCheckIn = formatCountdown(
    msUntilCheckInPromptForTask(schedule, claimedAt, now)
  );

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">You&apos;re on this task</p>
        <p className="text-sm text-amber-800">About {timeLeft} left to submit</p>
      </div>

      {checkInAt ? (
        <p className="text-sm leading-relaxed">
          Nice one. Submit your answer below whenever you&apos;re done.
        </p>
      ) : showCheckIn ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            Quick check-in - still working on this one?
          </p>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Yes, I'm on it"}
          </button>
        </div>
      ) : (
        <p className="text-sm leading-relaxed">
          Take your time. A gentle check-in opens in {untilCheckIn}, if you need
          it.
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
