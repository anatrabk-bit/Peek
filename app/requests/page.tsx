import { BrowseRequestsView } from "@/components/maps/browse-requests-view";
import { getRequesterRatingSummaries } from "@/lib/supabase/ratings";
import { getPublicUserDisplays } from "@/lib/supabase/public-user";
import { getOpenRequests } from "@/lib/supabase/requests";
import type { AuthUserSummary } from "@/lib/auth-user";

export default async function BrowseRequestsPage() {
  const { requests, error: fetchError } = await getOpenRequests();
  const requesterIds = requests
    .map((request) => request.user_id)
    .filter((id): id is string => !!id);
  const [requesterRatings, requesterDisplays] = await Promise.all([
    getRequesterRatingSummaries(requesterIds),
    getPublicUserDisplays(requesterIds)
  ]);

  return (
    <section className="page-container space-y-8">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">
          Jobs waiting nearby
        </h1>
        <p className="mt-3 text-body">
          Browse every open request on the map and claim any job you can handle
          as a Peek.
        </p>
      </div>

      <BrowseRequestsView
        requests={requests}
        fetchError={fetchError}
        requesterRatings={requesterRatings}
        requesterDisplays={requesterDisplays}
      />
    </section>
  );
}
