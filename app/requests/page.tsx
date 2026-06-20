import { BrowseRequestsView } from "@/components/maps/browse-requests-view";
import { getOpenRequests } from "@/lib/supabase/requests";

export default async function BrowseRequestsPage() {
  const { requests, error: fetchError } = await getOpenRequests();

  return (
    <section className="page-container space-y-8">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">
          Open tasks nearby
        </h1>
        <p className="mt-3 text-body">
          Already there? Grab a quick check, earn stars, and help someone out —
          all anonymously.
        </p>
      </div>

      <BrowseRequestsView requests={requests} fetchError={fetchError} />
    </section>
  );
}
