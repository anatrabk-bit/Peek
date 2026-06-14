import { notFound } from "next/navigation";
import { RequestActions } from "@/components/request-actions";
import { UserProfilePreview } from "@/components/user-profile-preview";
import { createClient } from "@/lib/supabase/server";
import {
  getPeekRatingSummary,
  getRatingsForRequest,
  getRequesterRatingSummary
} from "@/lib/supabase/ratings";
import { getPublicUserDisplay } from "@/lib/supabase/public-user";
import {
  getRequestById,
  getResponseForRequest
} from "@/lib/supabase/requests";
import { REQUEST_STATUS_LABELS } from "@/lib/request-status-labels";

type RequestDetailsPageProps = {
  params: {
    id: string;
  };
};

export default async function RequestDetailsPage({
  params
}: RequestDetailsPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [request, existingResponse, requestRatings] = await Promise.all([
    getRequestById(params.id),
    getResponseForRequest(params.id),
    getRatingsForRequest(params.id)
  ]);

  if (!request) {
    notFound();
  }

  const isOwner = user?.id === request.user_id;
  const isPeekViewer = !!user && !isOwner;

  const requesterRating =
    isPeekViewer && request.user_id
      ? await getRequesterRatingSummary(request.user_id)
      : null;

  const requesterDisplay =
    isPeekViewer && request.user_id
      ? await getPublicUserDisplay(request.user_id)
      : null;

  const peekRating =
    isOwner &&
    request.runner_id &&
    (request.status === "pending_approval" ||
      request.status === "completed")
      ? await getPeekRatingSummary(request.runner_id)
      : null;

  const assignedPeekDisplay =
    isOwner &&
    request.runner_id &&
    (request.status === "pending_approval" ||
      request.status === "completed")
      ? await getPublicUserDisplay(request.runner_id)
      : null;

  const pendingPeek =
    isOwner &&
    request.status === "pending_approval" &&
    request.runner_id
      ? assignedPeekDisplay
      : null;

  let peekJobsCompleted = 0;
  if (
    request.runner_id &&
    isOwner &&
    (request.status === "pending_approval" ||
      request.status === "completed")
  ) {
    const { count } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("runner_id", request.runner_id)
      .eq("status", "completed");
    peekJobsCompleted = count ?? 0;
  }

  return (
    <section className="page-container">
      <article className="card-static mx-auto max-w-3xl">
        <span className="badge-open capitalize">
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-peek-text">
          {request.title}
        </h1>
        <p className="mt-2 text-body">{request.location}</p>
        {requesterDisplay && request.user_id && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-peek-muted">
              Posted by
            </p>
            <UserProfilePreview
              display={requesterDisplay}
              userId={request.user_id}
              role="client"
              summary={requesterRating}
              size="sm"
            />
          </div>
        )}

        <div className="mt-6 grid gap-4 rounded-2xl bg-peek-card p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-peek-muted">
              Pay
            </p>
            <p className="mt-1 text-2xl font-bold text-peek-accent">
              £{request.budget}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-peek-muted">
              Status
            </p>
            <p className="mt-1 text-2xl font-semibold text-peek-text">
              {REQUEST_STATUS_LABELS[request.status]}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <h2 className="heading-section text-lg">What they need</h2>
          <p className="text-body text-peek-text">{request.details}</p>
        </div>

        <RequestActions
          request={request}
          userId={user?.id ?? null}
          existingResponse={existingResponse}
          requestRatings={requestRatings}
          peekRating={peekRating}
          pendingPeek={pendingPeek}
          peekDisplay={assignedPeekDisplay}
          peekJobsCompleted={peekJobsCompleted}
        />
      </article>
    </section>
  );
}
