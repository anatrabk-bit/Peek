import dynamic from "next/dynamic";
import { getOpenRequests } from "@/app/requests/actions";

const BrowseRequestsView = dynamic(
  () =>
    import("@/components/maps/browse-requests-view").then(
      (mod) => mod.BrowseRequestsView
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-peek-card text-sm text-peek-muted">
        Loading map…
      </div>
    )
  }
);

export default async function BrowseRequestsPage() {
  const requests = await getOpenRequests();

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

      <BrowseRequestsView requests={requests} />
    </section>
  );
}
