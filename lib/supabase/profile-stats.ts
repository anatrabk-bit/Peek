import { createClient } from "@/lib/supabase/server";

export type CompletedPeekJob = {
  id: string;
  title: string;
  location: string;
  created_at: string;
};

export type ProfileStats = {
  jobsCompleted: number;
  requestsPosted: number;
  completedJobs: CompletedPeekJob[];
};

export async function getProfileStats(
  userId: string
): Promise<ProfileStats> {
  const supabase = createClient();

  const [completedResult, postedResult] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, location, created_at")
      .eq("runner_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
  ]);

  const completedJobs = (completedResult.data ?? []) as CompletedPeekJob[];

  return {
    jobsCompleted: completedJobs.length,
    requestsPosted: postedResult.count ?? 0,
    completedJobs
  };
}
