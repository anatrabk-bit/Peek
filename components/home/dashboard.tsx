import Link from "next/link";
import { getPeekDisplayName } from "@/lib/auth-user";
import type { AuthUserSummary } from "@/lib/auth-user";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES
} from "@/lib/request-status-labels";
import type { DashboardSummary } from "@/lib/supabase/dashboard";
import { UserAvatarIcon } from "@/components/user-avatar-icon";

type HomeDashboardProps = {
  user: AuthUserSummary;
  summary: DashboardSummary;
};

const actions = [
  {
    href: "/post-request",
    emoji: "📝",
    badgeClass: "peek-icon-badge-orange",
    title: "Post a request",
    description: "Need someone to check something for you?"
  },
  {
    href: "/requests",
    emoji: "🔍",
    badgeClass: "peek-icon-badge-emerald",
    title: "Help nearby",
    description: "Open tasks you can pick up and earn stars."
  },
  {
    href: "/my-requests",
    emoji: "📋",
    badgeClass: "peek-icon-badge-sky",
    title: "My requests",
    description: "See what you posted and answers."
  },
  {
    href: "/profile",
    emoji: "⭐",
    badgeClass: "peek-icon-badge-amber",
    title: "Your profile",
    description: "Nickname, icon, and star progress."
  }
];

export function HomeDashboard({ user, summary }: HomeDashboardProps) {
  const peekName = getPeekDisplayName(user);
  const avatarIcon = user.peekAvatarIcon ?? "✨";

  return (
    <div className="page-container space-y-8">
      <section className="peek-welcome-banner peek-fade-in">
        <div className="flex items-start gap-4">
          <UserAvatarIcon icon={avatarIcon} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-peek-muted">Your home on Peek</p>
            <h1
              className="mt-1 text-2xl font-bold text-peek-text sm:text-3xl"
              dir="ltr"
            >
              Hey, {peekName}
            </h1>
            <p className="mt-2 text-body">
              Post when you need someone to check a place for you.
              <br />
              Or pick up a nearby task and earn stars.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={`group relative card card-fun peek-fade-in peek-delay-${index + 1}`}
          >
            <div className={`peek-icon-badge ${action.badgeClass}`}>
              {action.emoji}
            </div>
            <h2 className="mt-4 font-semibold text-peek-text group-hover:text-peek-primary">
              {action.title}
            </h2>
            <p className="mt-1 text-sm text-peek-muted">{action.description}</p>
            {action.href === "/requests" && summary.openJobsNearby > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                {summary.openJobsNearby} open
              </span>
            )}
            {action.href === "/my-requests" && summary.myActiveRequests > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                {summary.myActiveRequests} active
              </span>
            )}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="peek-stat">
          <p className="text-sm text-peek-muted">Open jobs nearby</p>
          <p className="mt-1 text-3xl font-bold text-peek-primary">
            {summary.openJobsNearby}
          </p>
        </article>
        <article className="peek-stat">
          <p className="text-sm text-peek-muted">Your active requests</p>
          <p className="mt-1 text-3xl font-bold text-peek-text">
            {summary.myActiveRequests}
          </p>
        </article>
        <article className="peek-stat">
          <p className="text-sm text-peek-muted">Tasks you completed</p>
          <p className="mt-1 text-3xl font-bold text-peek-text">
            {summary.jobsCompletedAsPeek}
          </p>
        </article>
      </section>

      <section className="card-static">
        <div className="flex items-center justify-between gap-4">
          <h2 className="heading-section text-lg">Recent requests</h2>
          <Link
            href="/my-requests"
            className="text-sm font-semibold text-peek-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {summary.recentRequests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-peek-border bg-stone-50 p-8 text-center">
            <p className="font-semibold text-peek-text">No requests yet</p>
            <p className="mt-1 text-sm text-peek-muted">
              Post your first one. It only takes a minute.
            </p>
            <Link href="/post-request" className="btn-primary mt-4 inline-flex">
              Post a request
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-peek-border">
            {summary.recentRequests.map((request) => (
              <li key={request.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/requests/${request.id}`}
                  className="group block"
                >
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_STYLES[request.status]}`}
                  >
                    {REQUEST_STATUS_LABELS[request.status]}
                  </span>
                  <p className="mt-2 font-medium text-peek-text group-hover:text-peek-primary">
                    {request.title}
                  </p>
                  <p className="text-sm text-peek-muted">{request.location}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
