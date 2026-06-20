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
    title: "Post a request",
    description: "Need eyes somewhere? Ask kindly.",
    cardClass: "card-pink"
  },
  {
    href: "/requests",
    emoji: "🔍",
    title: "Find work",
    description: "Grab a task nearby, earn stars ⭐",
    cardClass: "card-mint"
  },
  {
    href: "/my-requests",
    emoji: "📋",
    title: "My requests",
    description: "Track your posts and answers.",
    cardClass: "card-lavender"
  },
  {
    href: "/profile",
    emoji: "⭐",
    title: "Your profile",
    description: "Nickname, icon & star progress.",
    cardClass: "card-sunny"
  }
];

export function HomeDashboard({ user, summary }: HomeDashboardProps) {
  const peekName = getPeekDisplayName(user);
  const avatarIcon = user.peekAvatarIcon ?? "✨";

  return (
    <div className="page-container space-y-10">
      <section className="peek-welcome-banner peek-fade-in">
        <div className="flex items-start gap-4">
          <UserAvatarIcon icon={avatarIcon} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-peek-primary">
              Good to see you again 💛
            </p>
            <h1
              className="mt-1 text-3xl font-extrabold text-peek-text sm:text-4xl"
              dir="ltr"
            >
              Hey, {peekName}! ✨
            </h1>
            <p className="mt-3 max-w-lg text-body">
              Ready to do a little good today? Post something you need checked,
              or help someone nearby as a Peek.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={`group relative card card-fun ${action.cardClass} peek-fade-in peek-delay-${index + 1}`}
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
              {action.emoji}
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-peek-text group-hover:text-peek-primary">
              {action.title}
            </h2>
            <p className="mt-1 text-sm font-medium text-peek-muted">
              {action.description}
            </p>
            {action.href === "/requests" && summary.openJobsNearby > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                {summary.openJobsNearby} open
              </span>
            )}
            {action.href === "/my-requests" && summary.myActiveRequests > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-peek-primary shadow-sm">
                {summary.myActiveRequests} active
              </span>
            )}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-static card-mint text-center sm:text-left">
          <p className="text-sm font-bold text-peek-muted">Open jobs nearby</p>
          <p className="mt-2 text-4xl font-extrabold text-emerald-600">
            {summary.openJobsNearby}
          </p>
        </article>
        <article className="card-static card-lavender text-center sm:text-left">
          <p className="text-sm font-bold text-peek-muted">Your active requests</p>
          <p className="mt-2 text-4xl font-extrabold text-violet-600">
            {summary.myActiveRequests}
          </p>
        </article>
        <article className="card-static card-sunny text-center sm:text-left">
          <p className="text-sm font-bold text-peek-muted">Good deeds done</p>
          <p className="mt-2 text-4xl font-extrabold text-amber-600">
            {summary.jobsCompletedAsPeek} ⭐
          </p>
        </article>
      </section>

      <section className="card-static">
        <div className="flex items-center justify-between gap-4">
          <h2 className="heading-section text-lg">Your recent requests</h2>
          <Link
            href="/my-requests"
            className="text-sm font-bold text-peek-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {summary.recentRequests.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border-2 border-dashed border-peek-primary/30 bg-peek-peach/40 p-8 text-center">
            <p className="text-4xl" aria-hidden>
              🌻
            </p>
            <p className="mt-2 font-extrabold text-peek-text">No requests yet</p>
            <p className="mt-1 text-sm text-peek-muted">
              Post your first one — it&apos;s free and only takes a minute.
            </p>
            <Link href="/post-request" className="btn-primary btn-fun mt-5 inline-flex">
              Post a request
            </Link>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-peek-peach/60">
            {summary.recentRequests.map((request) => (
              <li key={request.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/requests/${request.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${REQUEST_STATUS_STYLES[request.status]}`}
                    >
                      {REQUEST_STATUS_LABELS[request.status]}
                    </span>
                    <p className="mt-2 font-bold text-peek-text group-hover:text-peek-primary">
                      {request.title}
                    </p>
                    <p className="text-sm text-peek-muted">{request.location}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
