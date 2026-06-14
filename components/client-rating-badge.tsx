import Link from "next/link";
import { StarRating } from "@/components/star-rating";
import type { UserRatingSummary } from "@/types/rating";

type ClientRatingBadgeProps = {
  summary: UserRatingSummary;
  userId?: string;
  compact?: boolean;
};

export function ClientRatingBadge({
  summary,
  userId,
  compact = false
}: ClientRatingBadgeProps) {
  if (!summary.ratingCount || summary.averageScore == null) {
    return null;
  }

  const isLow = summary.averageScore < 3;

  const badge = (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        isLow
          ? "bg-red-50 text-red-800"
          : "bg-amber-50 text-amber-900"
      } ${userId ? "transition hover:opacity-80" : ""}`}
    >
      <span>Client {summary.averageScore}/5</span>
      <StarRating score={Math.round(summary.averageScore)} size="sm" />
      {!compact && (
        <span className="opacity-80">
          ({summary.ratingCount} rating{summary.ratingCount === 1 ? "" : "s"})
        </span>
      )}
    </div>
  );

  if (!userId) {
    return badge;
  }

  return (
    <Link href={`/users/${userId}?as=client`} className="inline-block">
      {badge}
    </Link>
  );
}
