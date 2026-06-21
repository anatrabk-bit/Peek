import Link from "next/link";
import { UserAvatarIcon } from "@/components/user-avatar-icon";
import type { PublicPeekDisplay } from "@/lib/supabase/peek-profile";

type UserProfilePreviewProps = {
  display: PublicPeekDisplay;
  size?: "sm" | "md";
  showProfileLink?: boolean;
};

export function UserProfilePreview({
  display,
  size = "md",
  showProfileLink = true
}: UserProfilePreviewProps) {
  const avatarSize = size === "sm" ? "sm" : "md";
  const profileHref = `/users/${display.userId}?as=peek`;

  const content = (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 ${
        showProfileLink ? "transition hover:border-sky-200 hover:bg-sky-50/40" : ""
      }`}
    >
      <UserAvatarIcon icon={display.avatarIcon} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold text-peek-text ${
            size === "sm" ? "text-sm" : "text-base"
          }`}
          dir="ltr"
        >
          {display.nickname}
        </p>
        <p className="mt-1 text-xs text-peek-muted">
          {display.jobsCompleted === 0
            ? "New Peek. No tasks yet"
            : `${display.jobsCompleted} task${
                display.jobsCompleted === 1 ? "" : "s"
              } completed`}
        </p>
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
