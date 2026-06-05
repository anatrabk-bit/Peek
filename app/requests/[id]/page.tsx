import { notFound } from "next/navigation";
import { RequestActions } from "@/components/request-actions";
import { createClient } from "@/lib/supabase/server";
import {
  getRequestById,
  getResponseForRequest
} from "@/lib/supabase/requests";

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

  const [request, existingResponse] = await Promise.all([
    getRequestById(params.id),
    getResponseForRequest(params.id)
  ]);

  if (!request) {
    notFound();
  }

  return (
    <section className="page-container">
      <article className="card-static mx-auto max-w-3xl">
        <span className="badge-open">{request.status}</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-peek-text">
          {request.title}
        </h1>
        <p className="mt-2 text-body">{request.location}</p>

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
            <p className="mt-1 text-2xl font-semibold capitalize text-peek-text">
              {request.status}
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
        />
      </article>
    </section>
  );
}
