import Link from "next/link";
import { getDisplayName, type AuthUserSummary } from "@/lib/auth-user";
import { StarRating } from "@/components/star-rating";
import { UserInitialsAvatar } from "@/components/user-initials-avatar";
import type { UserRatingSummary } from "@/types/rating";

type UserProfilePreviewProps = {
  display: AuthUserSummary;
  userId: string;
  role: "peek" | "client";
  summary?: UserRatingSummary | null;
  metaLabel?: string | null;
  size?: "sm" | "md";
  showProfileLink?: boolean;
};

export function UserProfilePreview({
  display,
  userId,
  role,
  summary = null,
  metaLabel = null,
  size = "md",
  showProfileLink = true
}: UserProfilePreviewProps) {
  const displayName = getDisplayName(display) ?? (role === "peek" ? "Peek" : "Client");
  const avatarSize = size === "sm" ? "sm" : "md";
  const hasRating =
    summary && summary.ratingCount > 0 && summary.averageScore != null;
  const profileHref = `/users/${userId}?as=${role}`;

  const content = (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 ${
        showProfileLink ? "transition hover:border-sky-200 hover:bg-sky-50/40" : ""
      }`}
    >
      <UserInitialsAvatar initials={display.initials} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold text-peek-text ${
            size === "sm" ? "text-sm" : "text-base"
          }`}
          dir="ltr"
        >
          {displayName}
        </p>
        {hasRating ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`font-semibold text-peek-text ${
                size === "sm" ? "text-sm" : "text-base"
              }`}
            >
              {summary!.averageScore!.toFixed(1)}
            </span>
            <StarRating score={Math.round(summary!.averageScore!)} size="sm" />
            <span className="text-xs text-peek-muted">
              ({summary!.ratingCount} review
              {summary!.ratingCount === 1 ? "" : "s"})
            </span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-peek-muted">
            {role === "peek" ? "New Peek — no reviews yet" : "New client — no reviews yet"}
          </p>
        )}
        {metaLabel && (
          <p className="mt-1 text-xs text-peek-muted">{metaLabel}</p>
        )}
        {showProfileLink && (
          <p className="mt-1 text-xs font-semibold text-peek-primary">
            View profile →
          </p>
        )}
      </div>
    </div>
  );

  if (!showProfileLink) {
    return content;
  }

  return (
    <Link href={profileHref} className="block">
      {content}
    </Link>
  );
}
