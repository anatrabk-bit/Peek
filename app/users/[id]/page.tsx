import Link from "next/link";
import { notFound } from "next/navigation";
import { UserAvatarIcon } from "@/components/user-avatar-icon";
import {
  getPublicUserProfile,
  type PublicUserRole
} from "@/lib/supabase/public-user";

type PublicUserPageProps = {
  params: { id: string };
  searchParams: { as?: string };
};

function parseRole(value: string | undefined): PublicUserRole {
  return value === "client" ? "client" : "peek";
}

export default async function PublicUserPage({
  params,
  searchParams
}: PublicUserPageProps) {
  const role = parseRole(searchParams.as);
  const profile = await getPublicUserProfile(params.id, role);

  if (!profile) {
    notFound();
  }

  const isPeek = role === "peek";

  return (
    <section className="page-container space-y-8">
      <div>
        <Link
          href={isPeek ? "/requests" : "/my-requests"}
          className="text-sm font-semibold text-peek-primary hover:underline"
        >
          ← Back
        </Link>
        <h1 className="heading-section mt-4 text-3xl sm:text-4xl" dir="ltr">
          {profile.display.nickname}
        </h1>
        <p className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-peek-muted">
          {isPeek ? "Peek" : "Requester"}
        </p>
        <p className="mt-3 text-body">
          Anonymous profile — no real name is shown on Peek.
        </p>
      </div>

      <article className="card-static flex items-center gap-4">
        <UserAvatarIcon icon={profile.display.avatarIcon} size="lg" />
        <div>
          <p className="text-lg font-semibold text-peek-text" dir="ltr">
            {profile.display.nickname}
          </p>
          <p className="mt-1 text-sm text-peek-muted">
            {isPeek
              ? `${profile.jobsCompleted} task${
                  profile.jobsCompleted === 1 ? "" : "s"
                } completed`
              : `${profile.requestsPosted} request${
                  profile.requestsPosted === 1 ? "" : "s"
                } posted`}
          </p>
          {isPeek && profile.display.peekStars > 0 && (
            <p className="mt-1 text-sm font-semibold text-amber-600">
              {profile.display.peekStars} ⭐ earned
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
