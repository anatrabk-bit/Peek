import { createClient } from "@/lib/supabase/server";

import {

  getPeekRatingSummary,

  getRequesterRatingSummary

} from "@/lib/supabase/ratings";



export type CompletedPeekJob = {

  id: string;

  title: string;

  location: string;

  budget: number;

  created_at: string;

};



export type ProfileStats = {

  jobsCompleted: number;

  earned: number;

  requestsPosted: number;

  peekRating: number | null;

  peekRatingCount: number;

  clientRating: number | null;

  clientRatingCount: number;

  completedJobs: CompletedPeekJob[];

};



export async function getProfileStats(

  userId: string

): Promise<ProfileStats> {

  const supabase = createClient();



  const paidCompleted = await supabase

    .from("requests")

    .select("id, title, location, budget, created_at, payments!inner(status)")

    .eq("runner_id", userId)

    .eq("status", "completed")

    .in("payments.status", ["completed"])

    .order("created_at", { ascending: false });



  const completedResult = paidCompleted.error?.message?.includes("payments")

    ? await supabase

        .from("requests")

        .select("id, title, location, budget, created_at")

        .eq("runner_id", userId)

        .eq("status", "completed")

        .order("created_at", { ascending: false })

    : paidCompleted;



  const [postedResult, peekRatingSummary, clientRatingSummary] = await Promise.all([

    supabase

      .from("requests")

      .select("id", { count: "exact", head: true })

      .eq("user_id", userId),

    getPeekRatingSummary(userId),

    getRequesterRatingSummary(userId)

  ]);



  const completedJobs = (completedResult.data ?? []) as CompletedPeekJob[];

  const earned = completedJobs.reduce((sum, job) => sum + Number(job.budget), 0);



  return {

    jobsCompleted: completedJobs.length,

    earned,

    requestsPosted: postedResult.count ?? 0,

    peekRating: peekRatingSummary.averageScore,

    peekRatingCount: peekRatingSummary.ratingCount,

    clientRating: clientRatingSummary.averageScore,

    clientRatingCount: clientRatingSummary.ratingCount,

    completedJobs

  };

}


