"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { claimRequest } from "@/app/requests/[id]/actions";
import { SubmitResponseForm } from "@/components/submit-response-form";
import { UserProfilePreview } from "@/components/user-profile-preview";
import { createClient } from "@/lib/supabase/client";
import type { PublicPeekDisplay } from "@/lib/supabase/peek-profile";
import type { MarketplaceRequest, RequestResponse } from "@/types/request";

const LOGIN_REQUIRED_MESSAGE = "You need to log in first.";
const TAKEN_MESSAGE = "Someone else already grabbed this one.";

type RequestActionsProps = {
  request: MarketplaceRequest;
  userId: string | null;
  existingResponse: RequestResponse | null;
  assignedPeek?: PublicPeekDisplay | null;
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
  assignedPeek = null
}: RequestActionsProps) {
  const isOwner = !!(userId && request.user_id === userId);
  const isAssignedRunner = !!(userId && request.runner_id === userId);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const completed =
    request.status === "completed" || !!existingResponse;
  const isOpen = request.status === "open" && !completed;
  const canClaim = isOpen && !request.runner_id && !isOwner;
  const canSubmit = request.status === "claimed" && isAssignedRunner;

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

  if (isAssignedRunner && canSubmit && !completed) {
    return (
      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">You&apos;re on it!</p>
          <p className="mt-2 text-sm leading-relaxed">
            Complete the check while you&apos;re there, then submit your answer
            below. You&apos;ll earn stars when the client gets their answer.
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
        <>
          {assignedPeek && (
            <div className="mt-6">
              <UserProfilePreview display={assignedPeek} />
            </div>
          )}
          <ResponseCard title="Your answer" response={existingResponse} />
        </>
      );
    }

    if (request.status === "claimed" && assignedPeek) {
      return (
        <div className="mt-6 space-y-4">
          <UserProfilePreview display={assignedPeek} showProfileLink={false} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">A Peek is on it</p>
            <p className="mt-2 text-sm leading-relaxed">
              They grabbed your task and are checking now. Your answer will
              appear here when they&apos;re done.
            </p>
          </div>
        </div>
      );
    }

    if (request.status === "open") {
      return (
        <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
          <p className="font-semibold">Waiting for a Peek</p>
          <p className="mt-2 text-sm leading-relaxed">
            Your request is live. The first nearby Peek to tap &quot;I&apos;m on
            it&quot; will handle it.
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
    return <ResponseCard title="Response submitted" response={existingResponse} />;
  }

  if (completed && existingResponse) {
    return <ResponseCard title="Response submitted" response={existingResponse} />;
  }

  if (
    (request.status === "claimed" || request.status === "pending_approval") &&
    request.runner_id &&
    request.runner_id !== userId
  ) {
    return (
      <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-peek-muted">
        {TAKEN_MESSAGE}
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {canClaim && !showLoginPrompt && (
        <>
          <p className="text-sm text-peek-muted">
            Already nearby? Grab this task — first Peek wins. You&apos;ll stay
            anonymous; only your nickname and icon show.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Grabbing…" : "I'm on it"}
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
