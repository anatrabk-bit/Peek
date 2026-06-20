import { createClient } from "@/lib/supabase/server";
import { isRequestActive } from "@/lib/request-status-labels";
import type { MarketplaceRequest } from "@/types/request";
export type DashboardSummary = {
  openJobsNearby: number;
  myActiveRequests: number;
  myCompletedRequests: number;
  jobsCompletedAsPeek: number;
  recentRequests: MarketplaceRequest[];
};

export async function getDashboardSummary(
  userId: string
): Promise<DashboardSummary> {
  const supabase = createClient();

  const [openJobsResult, myRequestsResult, peekJobsResult] = await Promise.all([
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("requests")
      .select(
        "id, title, location, budget, details, status, user_id, runner_id, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("runner_id", userId)
      .eq("status", "completed")
  ]);

  const myRequests = (myRequestsResult.data ?? []) as MarketplaceRequest[];

  const myActiveRequests = myRequests.filter((request) =>
    isRequestActive(request.status)
  ).length;
  const myCompletedRequests = myRequests.filter(
    (request) => request.status === "completed"
  ).length;

  return {
    openJobsNearby: openJobsResult.count ?? 0,
    myActiveRequests,
    myCompletedRequests,
    jobsCompletedAsPeek: peekJobsResult.count ?? 0,
    recentRequests: myRequests.slice(0, 3)
  };
}
