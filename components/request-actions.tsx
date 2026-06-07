"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { claimRequest, submitResponse } from "@/app/requests/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import type { MarketplaceRequest, RequestResponse } from "@/types/request";

const LOGIN_REQUIRED_MESSAGE = "You need to log in to claim this job.";

type RequestActionsProps = {
  request: MarketplaceRequest;
  userId: string | null;
  existingResponse: RequestResponse | null;
};

export function RequestActions({
  request,
  userId,
  existingResponse
}: RequestActionsProps) {
  const [claimed, setClaimed] = useState(
    request.status === "claimed" && request.runner_id === userId
  );
  const [completed, setCompleted] = useState(
    request.status === "completed" || !!existingResponse
  );
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isAssignedRunner =
    userId && (request.runner_id === userId || claimed);
  const isOpen = request.status === "open" && !claimed && !completed;
  const canClaim = isOpen && !request.runner_id;

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
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitMessage(null);
    startTransition(async () => {
      const result = await submitResponse(request.id, formData);
      if (result?.ok) {
        setCompleted(true);
        setSubmitMessage("Response submitted. Nice work!");
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  if (completed && existingResponse) {
    return (
      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
          <p className="font-semibold">Response submitted</p>
          <p className="mt-2 text-sm leading-relaxed">{existingResponse.answer}</p>
          {existingResponse.photo_url && (
            <a
              href={existingResponse.photo_url}
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

  if (request.status === "claimed" && request.runner_id && request.runner_id !== userId) {
    return (
      <p className="mt-6 text-sm text-peek-muted">
        Another Peek has already taken this one.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {canClaim && !showLoginPrompt && (
        <>
          <p className="text-sm text-peek-muted">
            You&apos;ll confirm when it&apos;s done - they pay only then.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Claiming…" : "I'll take this on"}
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

      {(claimed || isAssignedRunner) && (
        <>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <p className="font-semibold">
              You&apos;ve claimed this request! Go check it out and come back to
              submit your answer.
            </p>
          </div>

          <form action={handleSubmit} className="card-static space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="answer"
                className="text-sm font-semibold text-peek-text"
              >
                Your answer
              </label>
              <textarea
                id="answer"
                name="answer"
                required
                rows={5}
                placeholder="What did you find? Include anything they asked for."
                className="input-field resize-y"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="photo"
                className="text-sm font-semibold text-peek-text"
              >
                Photo (optional)
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-peek-muted file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-peek-primary hover:file:bg-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Submitting…" : "Submit response"}
            </button>
          </form>
        </>
      )}

      {error && !showLoginPrompt && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
