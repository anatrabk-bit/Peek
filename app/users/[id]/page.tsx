import Link from "next/link";
import { notFound } from "next/navigation";
import { RatingStat } from "@/components/profile/rating-stat";
import { UserProfilePreview } from "@/components/user-profile-preview";
import { UserReviewsList } from "@/components/user-reviews-list";
import { getDisplayName } from "@/lib/auth-user";
import { getPublicUserReviews } from "@/lib/supabase/ratings";
import {
  getPublicUserProfile,
  type PublicUserRole
} from "@/lib/supabase/public-user";

type PublicUserPageProps = {
  params: { id: string };
  searchParams: { as?: string };
};

function parseRole(value: string | undefined): PublicUserRole {
  return value === "peek" ? "peek" : "client";
}

export default async function PublicUserPage({
  params,
  searchParams
}: PublicUserPageProps) {
  const role = parseRole(searchParams.as);
  const [profile, reviews] = await Promise.all([
    getPublicUserProfile(params.id, role),
    getPublicUserReviews(params.id, role)
  ]);

  if (!profile) {
    notFound();
  }

  const displayName = getDisplayName(profile.display) ?? "Peek user";
  const isClient = role === "client";
  const metaLabel = isClient
    ? `${profile.requestsPosted} request${profile.requestsPosted === 1 ? "" : "s"} posted`
    : `${profile.jobsCompleted} job${profile.jobsCompleted === 1 ? "" : "s"} completed`;

  return (
    <section className="page-container space-y-8">
      <div>
        <Link
          href={isClient ? "/requests" : "/profile"}
          className="text-sm font-semibold text-peek-primary hover:underline"
        >
          ← {isClient ? "Back to jobs" : "Back"}
        </Link>
        <h1 className="heading-section mt-4 text-3xl sm:text-4xl" dir="ltr">
          {displayName}
        </h1>
        <p className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-peek-muted">
          {isClient ? "Client profile" : "Peek profile"}
        </p>
        <p className="mt-3 text-body">
          {isClient
            ? "Reviews from Peeks who completed jobs for this client."
            : "Reviews from clients who received answers from this Peek."}
        </p>
      </div>

      <UserProfilePreview
        display={profile.display}
        userId={profile.userId}
        role={role}
        summary={profile.rating}
        metaLabel={metaLabel}
        showProfileLink={false}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <RatingStat
          label={isClient ? "Client rating" : "Peek rating"}
          summary={profile.rating}
        />
        <article className="card text-center sm:text-left">
          <p className="text-sm font-medium text-peek-muted">
            {isClient ? "Requests posted" : "Jobs completed"}
          </p>
          <p className="mt-2 text-3xl font-bold text-peek-text">
            {isClient ? profile.requestsPosted : profile.jobsCompleted}
          </p>
          <p className="mt-1 text-sm text-peek-muted">
            {isClient ? "on Peek" : "as a Peek"}
          </p>
        </article>
      </div>

      <div className="space-y-4">
        <h2 className="heading-section text-xl">Reviews</h2>
        <UserReviewsList
          reviews={reviews}
          emptyMessage={
            isClient
              ? "No reviews yet — this client hasn't been rated by a Peek."
              : "No reviews yet — this Peek hasn't been rated by a client."
          }
        />
      </div>
    </section>
  );
}
