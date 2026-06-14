"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { claimRequest } from "@/app/requests/[id]/actions";
import { AnswerRatingFlow } from "@/components/answer-rating-flow";
import { PeekApprovalPanel } from "@/components/peek-approval-panel";
import { RatingSection } from "@/components/rating-form";
import { SubmitResponseForm } from "@/components/submit-response-form";
import { createClient } from "@/lib/supabase/client";
import { peekCanSubmitResponse } from "@/lib/request-status-labels";
import type { AuthUserSummary } from "@/lib/auth-user";
import type { MarketplaceRequest, RequestResponse } from "@/types/request";
import type { RequestRatings, UserRatingSummary } from "@/types/rating";

const LOGIN_REQUIRED_MESSAGE = "You need to log in to claim this job.";

type RequestActionsProps = {
  request: MarketplaceRequest;
  userId: string | null;
  existingResponse: RequestResponse | null;
  requestRatings: RequestRatings;
  peekRating?: UserRatingSummary | null;
  pendingPeek?: AuthUserSummary | null;
  peekDisplay?: AuthUserSummary | null;
  peekJobsCompleted?: number;
};

function ResponseCard({
  title,
  response
}: {
  title: string;
  response: RequestResponse;
}) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <p className="font-semibold">{title}</p>
        <p className="mt-2 text-sm leading-relaxed">{response.answer}</p>
        {response.photo_url && (
          <a
            href={response.photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-peek-primary hover:underline"
          >
            View photo
          </a>
        )}
      </div>
    </div>
  );
}

export function RequestActions({
  request,
  userId,
  existingResponse,
  requestRatings,
  peekRating = null,
  pendingPeek = null,
  peekDisplay = null,
  peekJobsCompleted = 0
}: RequestActionsProps) {
  const isOwner = !!(userId && request.user_id === userId);
  const isAssignedRunner = !!(userId && request.runner_id === userId);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const completed =
    request.status === "completed" || !!existingResponse;
  const isOpen =
    request.status === "open" && !isAssignedRunner && !completed;
  const canClaim = isOpen && !request.runner_id && !isOwner;
  const canSubmit = peekCanSubmitResponse(request.status);

  async function handleClaim() {
    setError(null);
    setShowLoginPrompt(false);

    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setError(LOGIN_REQUIRED_MESSAGE);
      setShowLoginPrompt(true);
      return;
    }

    startTransition(async () => {
      const result = await claimRequest(request.id);
      if (result?.needsAuth) {
        setError(LOGIN_REQUIRED_MESSAGE);
        setShowLoginPrompt(true);
        return;
      }
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  if (isAssignedRunner && request.status === "pending_approval" && !completed) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-900">
          <p className="font-semibold">Waiting for the client&apos;s approval</p>
          <p className="mt-2 text-sm leading-relaxed">
            They&apos;re reviewing your profile now. Once they approve you,
            you&apos;ll be able to start the job and submit your answer.
          </p>
        </div>
        <Link
          href={`/requests/${request.id}/claimed`}
          className="inline-block text-sm font-semibold text-peek-primary hover:underline"
        >
          View claim status →
        </Link>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (isAssignedRunner && canSubmit && !completed) {
    return (
      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">You&apos;re approved — go for it</p>
          <p className="mt-2 text-sm leading-relaxed">
            The client approved you. Complete the check, then submit your answer
            below.
          </p>
        </div>
        <SubmitResponseForm
          requestId={request.id}
          redirectOnSuccess={`/requests/${request.id}`}
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (isOwner) {
    if (completed && existingResponse) {
      return (
        <AnswerRatingFlow
          requestId={request.id}
          requestTitle={request.title}
          response={existingResponse}
          existingRating={requestRatings.fromRequester}
          peekRating={peekRating}
          peekDisplay={peekDisplay}
          runnerId={request.runner_id}
          peekJobsCompleted={peekJobsCompleted}
        />
      );
    }

    if (
      request.status === "pending_approval" &&
      request.runner_id &&
      pendingPeek
    ) {
      return (
        <PeekApprovalPanel
          requestId={request.id}
          peek={pendingPeek}
          peekRating={peekRating}
          runnerId={request.runner_id}
          jobsCompleted={peekJobsCompleted}
        />
      );
    }

    if (request.status === "claimed") {
      return (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Your Peek is on the job</p>
          <p className="mt-2 text-sm leading-relaxed">
            You approved them — they&apos;re checking things for you now.
            You&apos;ll see the answer here when they&apos;re done.
          </p>
        </div>
      );
    }

    if (request.status === "open") {
      return (
        <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
          <p className="font-semibold">Waiting for a Peek</p>
          <p className="mt-2 text-sm leading-relaxed">
            Your request is live. When a Peek applies, you&apos;ll review their
            profile here before they start.
          </p>
          <Link
            href="/my-requests"
            className="mt-3 inline-block text-sm font-semibold text-peek-primary hover:underline"
          >
            ← Back to my requests
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <p className="font-semibold">This request is complete.</p>
      </div>
    );
  }

  if (isAssignedRunner && completed && existingResponse) {
    return (
      <>
        <ResponseCard title="Response submitted" response={existingResponse} />
        {submitMessage && (
          <p className="mt-4 text-sm text-emerald-700">{submitMessage}</p>
        )}
        {request.user_id && (
          <RatingSection
            requestId={request.id}
            existingRating={requestRatings.fromPeek}
            title="Rate this client"
            description="Help other Peeks know what to expect before they take a job."
            thanksMessage="Thanks — other Peeks will see this client's average rating on open jobs."
            emptyScoreError="Tap a star to rate this client."
          />
        )}
      </>
    );
  }

  if (completed && existingResponse) {
    return (
      <ResponseCard title="Response submitted" response={existingResponse} />
    );
  }

  if (completed) {
    return (
      <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <p className="font-semibold">This request is complete.</p>
        {submitMessage && (
          <p className="mt-2 text-sm leading-relaxed">{submitMessage}</p>
        )}
      </div>
    );
  }

  if (
    (request.status === "pending_approval" || request.status === "claimed") &&
    request.runner_id &&
    request.runner_id !== userId
  ) {
    return (
      <p className="mt-6 text-sm text-peek-muted">
        Another Peek has already applied for this one.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {canClaim && !showLoginPrompt && (
        <>
          <p className="text-sm text-peek-muted">
            The client will review your profile before you start — like Uber
            driver approval.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Applying…" : "Apply for this job"}
          </button>
        </>
      )}

      {canClaim && showLoginPrompt && (
        <div className="card-static space-y-4">
          <p className="text-sm font-semibold text-peek-text" role="alert">
            {error}
          </p>
          <Link href="/login" className="btn-primary inline-flex">
            Log in →
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowLoginPrompt(false);
              setError(null);
            }}
            className="block text-sm font-semibold text-peek-primary hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {error && !showLoginPrompt && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
