import { StarRating } from "@/components/star-rating";
import type { UserRatingSummary } from "@/types/rating";

type RatingStatProps = {
  label: string;
  summary: UserRatingSummary;
  emptyLabel?: string;
};

export function RatingStat({
  label,
  summary,
  emptyLabel = "No ratings yet"
}: RatingStatProps) {
  return (
    <article className="card text-center sm:text-left">
      <p className="text-sm font-medium text-peek-muted">{label}</p>
      {summary.ratingCount > 0 && summary.averageScore != null ? (
        <>
          <div className="mt-2 flex flex-col items-center gap-1 sm:items-start">
            <p className="text-3xl font-bold text-peek-text">
              {summary.averageScore}
            </p>
            <StarRating score={Math.round(summary.averageScore)} size="sm" />
          </div>
          <p className="mt-1 text-sm text-peek-muted">
            from {summary.ratingCount} rating
            {summary.ratingCount === 1 ? "" : "s"}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-3xl font-bold text-peek-text">-</p>
          <p className="mt-1 text-sm text-peek-muted">{emptyLabel}</p>
        </>
      )}
    </article>
  );
}
