import { StarRating } from "@/components/star-rating";
import type { PublicUserReview } from "@/types/rating";

type UserReviewsListProps = {
  reviews: PublicUserReview[];
  emptyMessage: string;
};

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function UserReviewsList({ reviews, emptyMessage }: UserReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <article className="card-static border-2 border-dashed border-zinc-200 text-center">
        <p className="text-body">{emptyMessage}</p>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="card-static space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StarRating score={review.score} size="md" />
            <p className="text-xs text-peek-muted">
              {formatReviewDate(review.created_at)}
            </p>
          </div>
          {review.comment ? (
            <p className="text-body leading-relaxed text-peek-text">
              &ldquo;{review.comment}&rdquo;
            </p>
          ) : (
            <p className="text-sm italic text-peek-muted">No written comment.</p>
          )}
          <p className="text-xs text-peek-muted">
            Job: {review.requestTitle}
          </p>
        </article>
      ))}
    </div>
  );
}
