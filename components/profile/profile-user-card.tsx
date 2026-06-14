import { getDisplayName, getUserSummary } from "@/lib/auth-user";
import { UserInitialsAvatar } from "@/components/user-initials-avatar";
import type { User } from "@supabase/supabase-js";

type ProfileUserCardProps = {
  user: User;
};

export function ProfileUserCard({ user }: ProfileUserCardProps) {
  const summary = getUserSummary(user);
  if (!summary) return null;

  const displayName = getDisplayName(summary) ?? "Your account";

  return (
    <article className="card-static flex items-center gap-4">
      <UserInitialsAvatar initials={summary.initials} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-peek-text" dir="ltr">
          {displayName}
        </p>
        {summary.email && (
          <p className="truncate text-sm text-peek-muted" dir="ltr">
            {summary.email}
          </p>
        )}
      </div>
    </article>
  );
}
