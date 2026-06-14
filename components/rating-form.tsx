"use client";

import { useState, useTransition } from "react";
import { submitRating } from "@/app/requests/[id]/actions";
import { StarPicker, StarRating } from "@/components/star-rating";
import type { RequestRating } from "@/types/rating";

type RatingSectionProps = {
  requestId: string;
  existingRating?: RequestRating | null;
  title: string;
  description: string;
  thanksMessage: string;
  emptyScoreError: string;
};

export function RatingSection({
  requestId,
  existingRating = null,
  title,
  description,
  thanksMessage,
  emptyScoreError
}: RatingSectionProps) {
  const [rating, setRating] = useState<RequestRating | null>(existingRating);
  const [score, setScore] = useState(existingRating?.score ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (rating) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <p className="font-semibold">Your rating</p>
        <div className="mt-2 flex items-center gap-2">
          <StarRating score={rating.score} size="lg" />
          <span className="text-sm font-medium">{rating.score}/5</span>
        </div>
        {rating.comment && (
          <p className="mt-3 text-sm leading-relaxed">{rating.comment}</p>
        )}
        <p className="mt-3 text-xs text-amber-800">{thanksMessage}</p>
      </div>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    if (score < 1) {
      setError(emptyScoreError);
      return;
    }

    formData.set("score", String(score));

    startTransition(async () => {
      const result = await submitRating(requestId, formData);
      if (result?.ok && result.rating) {
        setRating(result.rating);
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-6 card-static space-y-4">
      <div>
        <h3 className="font-semibold text-peek-text">{title}</h3>
        <p className="mt-1 text-sm text-peek-muted">{description}</p>
      </div>

      <StarPicker value={score} onChange={setScore} disabled={isPending} />

      <div className="space-y-2">
        <label
          htmlFor={`rating-comment-${requestId}`}
          className="text-sm font-semibold text-peek-text"
        >
          Comment (optional)
        </label>
        <textarea
          id={`rating-comment-${requestId}`}
          name="comment"
          rows={3}
          placeholder="Share your experience…"
          className="input-field resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || score < 1}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit rating"}
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
