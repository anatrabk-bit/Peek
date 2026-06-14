"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approvePeekForRequest,
  declinePeekForRequest
} from "@/app/requests/[id]/actions";
import { UserProfilePreview } from "@/components/user-profile-preview";
import type { AuthUserSummary } from "@/lib/auth-user";
import type { UserRatingSummary } from "@/types/rating";

type PeekApprovalPanelProps = {
  requestId: string;
  peek: AuthUserSummary;
  peekRating: UserRatingSummary | null;
  runnerId: string;
  jobsCompleted?: number;
};

export function PeekApprovalPanel({
  requestId,
  peek,
  peekRating,
  runnerId,
  jobsCompleted = 0
}: PeekApprovalPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approvePeekForRequest(requestId);
      if (!result.ok) {
        setError(result.error ?? "Could not approve this Peek.");
        return;
      }
      router.refresh();
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const result = await declinePeekForRequest(requestId);
      if (!result.ok) {
        setError(result.error ?? "Could not decline this Peek.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-violet-950">
      <div>
        <p className="font-semibold">A Peek wants this job</p>
        <p className="mt-2 text-sm leading-relaxed">
          Review their profile before they start — like choosing your driver on
          Uber. Approve to let them begin, or decline to reopen the job for
          others.
        </p>
      </div>

      <UserProfilePreview
        display={peek}
        userId={runnerId}
        role="peek"
        summary={peekRating}
        metaLabel={
          jobsCompleted > 0
            ? `${jobsCompleted} job${jobsCompleted === 1 ? "" : "s"} completed`
            : null
        }
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Approving…" : "Approve Peek"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Declining…" : "Decline"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
