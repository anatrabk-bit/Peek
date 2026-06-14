"use client";

import { useEffect, useState, useTransition } from "react";
import { submitRating } from "@/app/requests/[id]/actions";
import { StarPicker, StarRating } from "@/components/star-rating";
import { UserProfilePreview } from "@/components/user-profile-preview";
import type { AuthUserSummary } from "@/lib/auth-user";
import type { RequestResponse } from "@/types/request";
import type { RequestRating, UserRatingSummary } from "@/types/rating";

type AnswerRatingFlowProps = {
  requestId: string;
  requestTitle: string;
  response: RequestResponse;
  existingRating: RequestRating | null;
  peekRating?: UserRatingSummary | null;
  peekDisplay?: AuthUserSummary | null;
  runnerId?: string | null;
  peekJobsCompleted?: number;
};

type FlowStep = "answer" | "rate";

function storageKey(requestId: string) {
  return `peek-answer-flow-${requestId}`;
}

export function AnswerRatingFlow({
  requestId,
  requestTitle,
  response,
  existingRating,
  peekRating = null,
  peekDisplay = null,
  runnerId = null,
  peekJobsCompleted = 0
}: AnswerRatingFlowProps) {
  const [rating, setRating] = useState<RequestRating | null>(existingRating);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<FlowStep>("answer");
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const needsRating = !rating;

  useEffect(() => {
    if (!needsRating) return;

    const dismissed = sessionStorage.getItem(storageKey(requestId));
    if (dismissed === "later") {
      setShowInlinePrompt(true);
      return;
    }

    setModalOpen(true);
  }, [requestId, needsRating]);

  useEffect(() => {
    if (!modalOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);

  function closeModalLater() {
    sessionStorage.setItem(storageKey(requestId), "later");
    setModalOpen(false);
    setShowInlinePrompt(true);
  }

  function handleSubmitRating(formData: FormData) {
    setError(null);

    if (score < 1) {
      setError("Tap a star to rate your Peek.");
      return;
    }

    formData.set("score", String(score));

    startTransition(async () => {
      const result = await submitRating(requestId, formData);
      if (result?.ok && result.rating) {
        setRating(result.rating);
        sessionStorage.removeItem(storageKey(requestId));
        setModalOpen(false);
        setShowInlinePrompt(false);
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {modalOpen && needsRating && (
        <div
          className="fixed inset-x-0 bottom-0 top-[4.25rem] z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="answer-flow-title"
          onClick={closeModalLater}
        >
          <div
            className="peek-slide-up w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {step === "answer" ? (
              <div className="p-6 sm:p-8">
                <div className="text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                    ✨
                  </span>
                  <h2
                    id="answer-flow-title"
                    className="mt-4 text-2xl font-bold text-peek-text"
                  >
                    Your answer is ready!
                  </h2>
                  <p className="mt-2 text-sm text-peek-muted">
                    A Peek finished &ldquo;{requestTitle}&rdquo;
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
                    What they found
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-peek-text">
                    {response.answer}
                  </p>
                  {response.photo_url && (
                    <a
                      href={response.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block overflow-hidden rounded-xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={response.photo_url}
                        alt="Photo from your Peek"
                        className="max-h-56 w-full object-cover"
                      />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep("rate")}
                  className="btn-primary mt-6 w-full"
                >
                  Continue — rate your Peek →
                </button>
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <div className="text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
                    ⭐
                  </span>
                  <h2 className="mt-4 text-2xl font-bold text-peek-text">
                    How was your Peek?
                  </h2>
                  <p className="mt-2 text-sm text-peek-muted">
                    Takes 5 seconds — it really helps good Peeks get more work.
                  </p>
                  {peekDisplay && runnerId && (
                    <div className="mt-4 text-left">
                      <UserProfilePreview
                        display={peekDisplay}
                        userId={runnerId}
                        role="peek"
                        summary={peekRating}
                        metaLabel={
                          peekJobsCompleted > 0
                            ? `${peekJobsCompleted} job${peekJobsCompleted === 1 ? "" : "s"} completed`
                            : null
                        }
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                <form action={handleSubmitRating} className="mt-8 space-y-5">
                  <div className="flex justify-center">
                    <StarPicker
                      value={score}
                      onChange={setScore}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="modal-rating-comment"
                      className="text-sm font-semibold text-peek-text"
                    >
                      Anything to add? (optional)
                    </label>
                    <textarea
                      id="modal-rating-comment"
                      name="comment"
                      rows={3}
                      placeholder="Quick, friendly, found exactly what I needed…"
                      className="input-field resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || score < 1}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Submitting…" : "Submit rating"}
                  </button>

                  {error && (
                    <p className="text-center text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={closeModalLater}
                    className="w-full text-center text-sm font-medium text-peek-muted hover:text-peek-text"
                  >
                    Maybe later
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {showInlinePrompt && needsRating && !modalOpen && (
        <div className="peek-rating-prompt mt-8 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl" aria-hidden>
              ⭐
            </span>
            <div className="flex-1">
              <p className="text-lg font-bold text-peek-text">
                Don&apos;t forget to rate your Peek!
              </p>
              <p className="mt-1 text-sm text-peek-muted">
                Your rating helps great Peeks stand out — just like on Uber.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("rate");
                  setModalOpen(true);
                }}
                className="btn-primary mt-4"
              >
                Rate now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {peekDisplay && runnerId && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-peek-muted">
              Your Peek
            </p>
            <UserProfilePreview
              display={peekDisplay}
              userId={runnerId}
              role="peek"
              summary={peekRating}
              metaLabel={
                peekJobsCompleted > 0
                  ? `${peekJobsCompleted} job${peekJobsCompleted === 1 ? "" : "s"} completed`
                  : null
              }
              size="sm"
            />
          </div>
        )}

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900">
          <p className="font-semibold">Your answer from a Peek</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {response.answer}
          </p>
          {response.photo_url && (
            <a
              href={response.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={response.photo_url}
                alt="Photo from your Peek"
                className="max-h-48 rounded-xl object-cover"
              />
            </a>
          )}
        </div>

        {rating ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="font-semibold">Thanks for rating your Peek!</p>
            <div className="mt-3 flex items-center gap-2">
              <StarRating score={rating.score} size="lg" />
              <span className="font-medium">{rating.score}/5</span>
            </div>
            {rating.comment && (
              <p className="mt-3 text-sm leading-relaxed">{rating.comment}</p>
            )}
          </div>
        ) : (
          !showInlinePrompt &&
          !modalOpen && (
            <button
              type="button"
              onClick={() => {
                setStep("rate");
                setModalOpen(true);
              }}
              className="btn-secondary w-full"
            >
              Rate your Peek
            </button>
          )
        )}
      </div>
    </>
  );
}
