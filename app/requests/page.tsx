import { BrowseRequestsView } from "@/components/maps/browse-requests-view";
import { processDueTaskReminders } from "@/lib/supabase/task-reminders";
import { getOpenRequests } from "@/lib/supabase/requests";

export default async function BrowseRequestsPage() {
  await processDueTaskReminders();

  const { requests, error: fetchError } = await getOpenRequests();

  return (
    <section className="page-container space-y-8">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">
          Open tasks nearby
        </h1>
        <div className="mt-3 space-y-1 text-body">
          <p>Already there?</p>
          <p>Grab a quick check, earn stars, and help someone out.</p>
          <p>All anonymously.</p>
        </div>
      </div>

      <BrowseRequestsView requests={requests} fetchError={fetchError} />
    </section>
  );
}
