import Link from "next/link";
import { redirect } from "next/navigation";
import { TaskScheduleBadge } from "@/components/task-schedule-badge";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES
} from "@/lib/request-status-labels";
import { splitPlaceLocation } from "@/lib/format-place";
import { createClient } from "@/lib/supabase/server";
import { getMyRequests } from "@/lib/supabase/requests";

type MyRequestsPageProps = {
  searchParams: {
    posted?: string;
  };
};

export default async function MyRequestsPage({
  searchParams
}: MyRequestsPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my-requests");
  }

  const { requests, error } = await getMyRequests(user.id);

  return (
    <section className="page-container space-y-8">
      {searchParams.posted === "1" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Your request is live.
          <br />
          A nearby Peek can grab it anytime.
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-section text-3xl sm:text-4xl">My requests</h1>
          <p className="mt-3 text-body">
            Track what you asked for and read answers here.
          </p>
        </div>
        <Link href="/post-request" className="btn-primary shrink-0">
          Post a new request
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {requests.length === 0 ? (
        <div className="card-static text-center">
          <p className="text-body">You haven&apos;t posted any requests yet.</p>
          <Link href="/post-request" className="btn-primary mt-6 inline-flex">
            Post your first request
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id}>
              {(() => {
                const locationParts = splitPlaceLocation(request.location);
                return (
              <Link
                href={`/requests/${request.id}`}
                className="card block transition hover:shadow-card-hover"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2">
                      <TaskScheduleBadge schedule={request} />
                    </div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        REQUEST_STATUS_STYLES[request.status]
                      }`}
                    >
                      {REQUEST_STATUS_LABELS[request.status]}
                    </span>
                    <h2 className="mt-3 text-lg font-semibold text-peek-text">
                      {request.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-peek-text">
                      {locationParts.placeName}
                    </p>
                    {locationParts.address && (
                      <p className="text-sm text-peek-muted">
                        {locationParts.address}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
                );
              })()}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
