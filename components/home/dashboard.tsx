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
    cardClass:
      "border-orange-100 bg-gradient-to-br from-orange-50/90 to-amber-50/50 hover:from-orange-50 hover:to-amber-50",
    iconBg: "bg-white/90 text-orange-700"
  },
  {
    href: "/requests",
    emoji: "🔍",
    title: "Find work",
    description: "Grab a task nearby, earn stars ⭐",
    cardClass:
      "border-sky-200 bg-gradient-to-br from-sky-50/90 to-cyan-50/40 hover:from-sky-50 hover:to-cyan-50",
    iconBg: "bg-white/90 text-sky-800"
  },
  {
    href: "/my-requests",
    emoji: "📋",
    title: "My requests",
    description: "Track your posts and answers.",
    cardClass:
      "border-violet-100 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/30 hover:from-violet-50 hover:to-fuchsia-50/40",
    iconBg: "bg-white/90 text-violet-700"
  },
  {
    href: "/profile",
    emoji: "⭐",
    title: "Your profile",
    description: "Nickname, icon & star progress.",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 hover:from-amber-50 hover:to-yellow-50",
    iconBg: "bg-white/90 text-amber-800"
  }
];

export function HomeDashboard({ user, summary }: HomeDashboardProps) {
  const peekName = getPeekDisplayName(user);
  const avatarIcon = user.peekAvatarIcon ?? "✨";

  return (
    <div className="page-container space-y-10">
      <section className="peek-fade-in overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-100 via-amber-50/80 to-pink-50/60 p-8 shadow-sm sm:p-10">
        <div className="flex items-start gap-4">
          <UserAvatarIcon icon={avatarIcon} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sky-800/80">
              Good to see you again
            </p>
            <h1
              className="mt-1 text-3xl font-bold text-peek-text sm:text-4xl"
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
            className={`group relative rounded-2xl border p-5 shadow-sm transition duration-200 hover:shadow-card ${action.cardClass} peek-fade-in peek-delay-${index + 1}`}
          >
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-sm ${action.iconBg}`}
            >
              {action.emoji}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-peek-text group-hover:text-peek-primary">
              {action.title}
            </h2>
            <p className="mt-1 text-sm text-peek-muted">{action.description}</p>
            {action.href === "/requests" && summary.openJobsNearby > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-sky-800 shadow-sm">
                {summary.openJobsNearby} open
              </span>
            )}
            {action.href === "/my-requests" && summary.myActiveRequests > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-amber-900 shadow-sm">
                {summary.myActiveRequests} active
              </span>
            )}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-6 shadow-sm">
          <p className="text-sm text-peek-muted">Open jobs nearby</p>
          <p className="mt-2 text-3xl font-bold text-peek-primary">
            {summary.openJobsNearby}
          </p>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-6 shadow-sm">
          <p className="text-sm text-peek-muted">Your active requests</p>
          <p className="mt-2 text-3xl font-bold text-peek-text">
            {summary.myActiveRequests}
          </p>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-6 shadow-sm">
          <p className="text-sm text-peek-muted">Good deeds done</p>
          <p className="mt-2 text-3xl font-bold text-peek-text">
            {summary.jobsCompletedAsPeek} ⭐
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="heading-section text-lg">Your recent requests</h2>
          <Link
            href="/my-requests"
            className="text-sm font-semibold text-peek-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {summary.recentRequests.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-sky-200 bg-gradient-to-br from-sky-50/60 to-amber-50/30 p-8 text-center">
            <p className="text-2xl" aria-hidden>
              🌻
            </p>
            <p className="mt-2 font-semibold text-peek-text">No requests yet</p>
            <p className="mt-1 text-sm text-peek-muted">
              Post your first one — it&apos;s free and only takes a minute.
            </p>
            <Link href="/post-request" className="btn-primary mt-5 inline-flex">
              Post a request
            </Link>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-zinc-100">
            {summary.recentRequests.map((request) => (
              <li key={request.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/requests/${request.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_STYLES[request.status]}`}
                    >
                      {REQUEST_STATUS_LABELS[request.status]}
                    </span>
                    <p className="mt-2 font-medium text-peek-text group-hover:text-peek-primary">
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
