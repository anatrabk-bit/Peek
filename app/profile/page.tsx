import Link from "next/link";
import { redirect } from "next/navigation";
import { getRunnerProfile } from "@/app/profile/actions";
import { ProfileUserCard } from "@/components/profile/profile-user-card";
import { RatingStat } from "@/components/profile/rating-stat";
import { PeekPayoutPanel } from "@/components/profile/peek-payout-panel";
import { RunnerSettingsPanel } from "@/components/profile/runner-settings-panel";
import { UserReviewsList } from "@/components/user-reviews-list";
import { getProfileStats } from "@/lib/supabase/profile-stats";
import { getPublicUserReviews } from "@/lib/supabase/ratings";
import type { RunnerProfile } from "@/types/runner";

export default async function UserProfilePage() {
  const { user, profile } = await getRunnerProfile();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const [stats, peekReviews, clientReviews] = await Promise.all([
    getProfileStats(user.id),
    getPublicUserReviews(user.id, "peek"),
    getPublicUserReviews(user.id, "client")
  ]);

  return (
    <section className="page-container space-y-10">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">Your profile</h1>
        <p className="mt-3 text-body">
          Two sides of Peek — when you help others, and when you post requests.
        </p>
      </div>

      <ProfileUserCard user={user} />

      <div className="space-y-6">
        <div>
          <h2 className="heading-section text-2xl">As a Peek</h2>
          <p className="mt-2 text-body">
            Jobs you take on, what you earn, and how clients rate your work.
          </p>
        </div>

        <RunnerSettingsPanel isLoggedIn />

        <PeekPayoutPanel profile={profile as RunnerProfile | null} />

        <div className="grid gap-5 sm:grid-cols-3">
          <article className="card text-center sm:text-left">
            <p className="text-sm font-medium text-peek-muted">Jobs completed</p>
            <p className="mt-2 text-3xl font-bold text-peek-text">
              {stats.jobsCompleted}
            </p>
          </article>
          <RatingStat
            label="Peek rating"
            summary={{
              averageScore: stats.peekRating,
              ratingCount: stats.peekRatingCount
            }}
            emptyLabel="No Peek ratings yet"
          />
          <article className="card text-center sm:text-left">
            <p className="text-sm font-medium text-peek-muted">Earned so far</p>
            <p className="mt-2 text-3xl font-bold text-peek-accent">
              £{stats.earned}
            </p>
          </article>
        </div>

        <article className="card-static">
          <h3 className="heading-section text-lg">Jobs you&apos;ve completed</h3>
          {stats.completedJobs.length === 0 ? (
            <p className="mt-4 text-body">
              No completed jobs yet. Browse{" "}
              <Link
                href="/requests"
                className="font-semibold text-peek-primary hover:underline"
              >
                Find work
              </Link>{" "}
              and take on a request nearby.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-zinc-100">
              {stats.completedJobs.map((job) => (
                <li key={job.id} className="py-4 first:pt-0 last:pb-0">
                  <Link href={`/requests/${job.id}`} className="group block">
                    <p className="font-medium text-peek-text group-hover:text-peek-primary">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-peek-muted">
                      {job.location} · £{job.budget}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="heading-section text-lg">Reviews from clients</h3>
            <Link
              href={`/users/${user.id}?as=peek`}
              className="text-sm font-semibold text-peek-primary hover:underline"
            >
              Public profile →
            </Link>
          </div>
          <UserReviewsList
            reviews={peekReviews}
            emptyMessage="No reviews yet — complete jobs and clients can rate your work."
          />
        </div>
      </div>

      <div className="space-y-6 border-t border-zinc-200 pt-10">
        <div>
          <h2 className="heading-section text-2xl">As a client</h2>
          <p className="mt-2 text-body">
            Requests you post and how Peeks rate working with you.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <article className="card text-center sm:text-left">
            <p className="text-sm font-medium text-peek-muted">Requests posted</p>
            <p className="mt-2 text-3xl font-bold text-peek-text">
              {stats.requestsPosted}
            </p>
            {stats.requestsPosted > 0 && (
              <Link
                href="/my-requests"
                className="mt-2 inline-block text-sm font-semibold text-peek-primary hover:underline"
              >
                View my requests →
              </Link>
            )}
          </article>
          <RatingStat
            label="Client rating"
            summary={{
              averageScore: stats.clientRating,
              ratingCount: stats.clientRatingCount
            }}
            emptyLabel="No client ratings yet"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="heading-section text-lg">Reviews from Peeks</h3>
            <Link
              href={`/users/${user.id}?as=client`}
              className="text-sm font-semibold text-peek-primary hover:underline"
            >
              Public profile →
            </Link>
          </div>
          <UserReviewsList
            reviews={clientReviews}
            emptyMessage="No reviews yet — post requests and Peeks can rate you as a client."
          />
        </div>
      </div>
    </section>
  );
}
