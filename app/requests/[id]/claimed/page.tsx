import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestById } from "@/lib/supabase/requests";

type ClaimedPageProps = {
  params: {
    id: string;
  };
};

export default async function ClaimedConfirmationPage({
  params
}: ClaimedPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/requests/${params.id}/claimed`)}`
    );
  }

  const request = await getRequestById(params.id);

  if (!request) {
    notFound();
  }

  if (request.runner_id !== user.id || request.status !== "claimed") {
    redirect(`/requests/${params.id}`);
  }

  const mapsHref =
    request.latitude != null && request.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.location)}`;

  return (
    <section className="page-container">
      <article className="card-static mx-auto max-w-3xl space-y-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-lg font-semibold">You&apos;ve claimed this job!</p>
          <p className="mt-2 text-sm leading-relaxed">
            Head to the address below, complete the task, then come back to
            submit your answer.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-peek-muted">
            Task
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-peek-text">
            {request.title}
          </h1>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-peek-muted">
            Address
          </p>
          <p className="text-lg font-medium text-peek-text">{request.location}</p>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-peek-primary hover:underline"
          >
            Open in Google Maps →
          </a>
        </div>

        <div className="grid gap-4 rounded-2xl bg-peek-card p-5 sm:grid-cols-2">
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

        <div className="space-y-2">
          <h2 className="heading-section text-lg">What they need</h2>
          <p className="text-body text-peek-text">{request.details}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/requests/${request.id}`}
            className="btn-primary text-center"
          >
            Submit your answer
          </Link>
          <Link href="/requests" className="btn-secondary text-center">
            Browse more jobs
          </Link>
        </div>
      </article>
    </section>
  );
}
