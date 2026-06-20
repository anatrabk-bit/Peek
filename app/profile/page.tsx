import Link from "next/link";
import { redirect } from "next/navigation";
import { SetPeekIdentityForm } from "@/components/profile/set-peek-identity-form";
import { StarsProgressPanel } from "@/components/profile/stars-progress-panel";
import { RunnerSettingsPanel } from "@/components/profile/runner-settings-panel";
import { UserAvatarIcon } from "@/components/user-avatar-icon";
import { getProfileStats } from "@/lib/supabase/profile-stats";
import { getNicknameSuggestionsForUser } from "@/lib/nickname-suggestions";
import {
  getOrCreatePeekProfile,
  getPeekProfile
} from "@/lib/supabase/peek-profile";
import { createClient } from "@/lib/supabase/server";

export default async function UserProfilePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const [stats, peekProfile] = await Promise.all([
    getProfileStats(user.id),
    getOrCreatePeekProfile(user.id)
  ]);

  const profile = (await getPeekProfile(user.id)) ?? peekProfile;
  const nicknameSuggestions = getNicknameSuggestionsForUser(user.id);

  return (
    <section className="page-container space-y-10">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">Your profile</h1>
        <p className="mt-3 text-body">
          You stay anonymous on Peek — others only see your nickname and icon.
        </p>
      </div>

      <article className="card-static flex items-center gap-4">
        <UserAvatarIcon icon={profile.avatar_icon} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-peek-text" dir="ltr">
            {profile.nickname}
          </p>
          <p className="truncate text-sm text-peek-muted">
            Only you see your login email
          </p>
        </div>
      </article>

      <SetPeekIdentityForm
        profile={profile}
        nicknameSuggestions={nicknameSuggestions}
      />
      <StarsProgressPanel profile={profile} />

      <div className="space-y-6">
        <div>
          <h2 className="heading-section text-2xl">As a Peek</h2>
          <p className="mt-2 text-body">
            Help nearby, earn stars, unlock vouchers.
          </p>
        </div>

        <RunnerSettingsPanel isLoggedIn />

        <div className="grid gap-5 sm:grid-cols-2">
          <article className="card text-center sm:text-left">
            <p className="text-sm font-medium text-peek-muted">Tasks completed</p>
            <p className="mt-2 text-3xl font-bold text-peek-text">
              {stats.jobsCompleted}
            </p>
          </article>
          <article className="card text-center sm:text-left">
            <p className="text-sm font-medium text-peek-muted">Stars earned</p>
            <p className="mt-2 text-3xl font-bold text-amber-500">
              {profile.peek_stars} ⭐
            </p>
          </article>
        </div>

        <article className="card-static">
          <h3 className="heading-section text-lg">Tasks you&apos;ve completed</h3>
          {stats.completedJobs.length === 0 ? (
            <p className="mt-4 text-body">
              No tasks yet. Browse{" "}
              <Link
                href="/requests"
                className="font-semibold text-peek-primary hover:underline"
              >
                open tasks
              </Link>{" "}
              and tap &quot;I&apos;m on it&quot; when you&apos;re nearby.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-zinc-100">
              {stats.completedJobs.map((job) => (
                <li key={job.id} className="py-4 first:pt-0 last:pb-0">
                  <Link href={`/requests/${job.id}`} className="group block">
                    <p className="font-medium text-peek-text group-hover:text-peek-primary">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-peek-muted">{job.location}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="space-y-6 border-t border-zinc-200 pt-10">
        <div>
          <h2 className="heading-section text-2xl">As a requester</h2>
          <p className="mt-2 text-body">Requests you posted for others to check.</p>
        </div>

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
      </div>
    </section>
  );
}
