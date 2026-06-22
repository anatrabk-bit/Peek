import { notFound } from "next/navigation";
import { RequestActions } from "@/components/request-actions";
import { TaskScheduleBadge } from "@/components/task-schedule-badge";
import { UserProfilePreview } from "@/components/user-profile-preview";
import { releaseExpiredClaimIfNeeded } from "@/lib/supabase/claim-lifecycle";
import { notifyClaimWindowOpenIfNeeded } from "@/lib/supabase/claim-notify";
import { getPublicPeekDisplay } from "@/lib/supabase/peek-profile";
import { splitPlaceLocation } from "@/lib/format-place";
import {
  getRequestById,
  getResponseForRequest
} from "@/lib/supabase/requests";
import { REQUEST_STATUS_LABELS } from "@/lib/request-status-labels";
import { createClient } from "@/lib/supabase/server";

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

  await releaseExpiredClaimIfNeeded(params.id);
  await notifyClaimWindowOpenIfNeeded(params.id);

  const [request, existingResponse] = await Promise.all([
    getRequestById(params.id),
    getResponseForRequest(params.id)
  ]);

  if (!request) {
    notFound();
  }

  const isOwner = user?.id === request.user_id;
  const locationParts = splitPlaceLocation(request.location);

  const assignedPeek =
    request.runner_id &&
    (request.status === "claimed" ||
      request.status === "pending_approval" ||
      request.status === "completed")
      ? await getPublicPeekDisplay(request.runner_id)
      : null;

  return (
    <section className="page-container">
      <article className="card-static mx-auto max-w-3xl">
        <span className="badge-open capitalize">
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
        <div className="mt-3">
          <TaskScheduleBadge schedule={request} size="md" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-peek-text">
          {request.title}
        </h1>
        <div className="mt-3">
          <p className="text-base font-semibold text-peek-text">
            {locationParts.placeName}
          </p>
          {locationParts.address && (
            <p className="text-sm text-peek-muted">{locationParts.address}</p>
          )}
        </div>
        {request.details && (
          <p className="mt-4 text-sm leading-relaxed text-peek-muted">
            {request.details}
          </p>
        )}

        <RequestActions
          request={request}
          userId={user?.id ?? null}
          existingResponse={existingResponse}
          assignedPeek={assignedPeek}
        />

        {isOwner && assignedPeek && request.status !== "completed" && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-peek-muted">
              Your Peek (anonymous)
            </p>
            <UserProfilePreview display={assignedPeek} showProfileLink={false} />
          </div>
        )}
      </article>
    </section>
  );
}
