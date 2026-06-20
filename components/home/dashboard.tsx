import Link from "next/link";
import { getFirstName } from "@/lib/auth-user";
import type { AuthUserSummary } from "@/lib/auth-user";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES
} from "@/lib/request-status-labels";
import type { DashboardSummary } from "@/lib/supabase/dashboard";

type HomeDashboardProps = {
  user: AuthUserSummary;
  summary: DashboardSummary;
};

const actions = [
  {
    href: "/post-request",
    emoji: "📝",
    title: "Post a request",
    description: "Need eyes somewhere? Ask a Peek.",
    cardClass: "border-orange-100 bg-orange-50/60 hover:bg-orange-50",
    iconBg: "bg-white/80 text-orange-700"
  },
  {
    href: "/requests",
    emoji: "🔍",
    title: "Find work",
    description: "Grab a task nearby, earn stars.",
    cardClass: "border-sky-200 bg-sky-50/70 hover:bg-sky-50",
    iconBg: "bg-white/80 text-sky-800"
  },
  {
    href: "/my-requests",
    emoji: "📋",
    title: "My requests",
    description: "Track your posts and answers.",
    cardClass: "border-violet-100 bg-violet-50/50 hover:bg-violet-50/70",
    iconBg: "bg-white/80 text-violet-700"
  },
  {
    href: "/profile",
    emoji: "⭐",
    title: "Your profile",
    description: "Stars, nickname, settings.",
    cardClass: "border-stone-200 bg-stone-50 hover:bg-stone-100/80",
    iconBg: "bg-white/80 text-stone-700"
  }
];

export function HomeDashboard({ user, summary }: HomeDashboardProps) {
  const firstName = getFirstName(user);

  return (
    <div className="page-container space-y-10">
      <section className="peek-fade-in overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100/90 via-sky-50 to-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-sky-800/80">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold text-peek-text sm:text-4xl" dir="ltr">
          {firstName ? `Hey, ${firstName}!` : "Welcome back!"}
        </h1>
        <p className="mt-3 max-w-lg text-body">
          What would you like to do today — post something you need checked, or
          help someone nearby as a Peek?
        </p>
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
        <article className="rounded-2xl border border-sky-100 bg-sky-50/50 p-6 shadow-sm">
          <p className="text-sm text-peek-muted">Open jobs nearby</p>
          <p className="mt-2 text-3xl font-bold text-peek-primary">
            {summary.openJobsNearby}
          </p>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-violet-50/40 p-6 shadow-sm">
          <p className="text-sm text-peek-muted">Your active requests</p>
          <p className="mt-2 text-3xl font-bold text-peek-text">
            {summary.myActiveRequests}
          </p>
        </article>
        <article className="rounded-2xl border border-orange-100 bg-orange-50/40 p-6 shadow-sm">
          <p className="text-sm text-peek-muted">Jobs you completed</p>
          <p className="mt-2 text-3xl font-bold text-peek-text">
            {summary.jobsCompletedAsPeek}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
          <div className="mt-6 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-8 text-center">
            <p className="font-semibold text-peek-text">No requests yet</p>
            <p className="mt-1 text-sm text-peek-muted">
              Post your first one — it only takes a minute.
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
                  <p className="text-sm font-semibold text-peek-primary">
                    {REQUEST_STATUS_LABELS[request.status]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
