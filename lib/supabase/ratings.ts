import { createClient } from "@/lib/supabase/server";
import type {
  RequestRating,
  RequestRatings,
  UserRatingSummary,
  PublicUserReview
} from "@/types/rating";

function summarizeScores(scores: number[]): UserRatingSummary {
  if (!scores.length) {
    return { averageScore: null, ratingCount: 0 };
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return {
    averageScore: Math.round((total / scores.length) * 10) / 10,
    ratingCount: scores.length
  };
}

export async function getRatingsForRequest(
  requestId: string
): Promise<RequestRatings> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("id, request_id, rater_id, rated_id, score, comment, created_at")
    .eq("request_id", requestId);

  if (error || !data?.length) {
    return { fromRequester: null, fromPeek: null };
  }

  const { data: request } = await supabase
    .from("requests")
    .select("user_id, runner_id")
    .eq("id", requestId)
    .single();

  const ratings = data as RequestRating[];
  const fromRequester =
    ratings.find((rating) => rating.rater_id === request?.user_id) ?? null;
  const fromPeek =
    ratings.find((rating) => rating.rater_id === request?.runner_id) ?? null;

  return { fromRequester, fromPeek };
}

export async function getPeekRatingSummary(
  peekId: string
): Promise<UserRatingSummary> {
  const supabase = createClient();

  const { data: completedJobs } = await supabase
    .from("requests")
    .select("id")
    .eq("runner_id", peekId)
    .eq("status", "completed");

  const requestIds = (completedJobs ?? []).map((job) => job.id);
  if (!requestIds.length) {
    return { averageScore: null, ratingCount: 0 };
  }

  const { data: ratings } = await supabase
    .from("ratings")
    .select("score")
    .in("request_id", requestIds)
    .eq("rated_id", peekId);

  return summarizeScores((ratings ?? []).map((row) => Number(row.score)));
}

export async function getRequesterRatingSummary(
  requesterId: string
): Promise<UserRatingSummary> {
  const supabase = createClient();

  const { data: postedRequests } = await supabase
    .from("requests")
    .select("id")
    .eq("user_id", requesterId)
    .eq("status", "completed");

  const requestIds = (postedRequests ?? []).map((request) => request.id);
  if (!requestIds.length) {
    return { averageScore: null, ratingCount: 0 };
  }

  const { data: ratings } = await supabase
    .from("ratings")
    .select("score")
    .in("request_id", requestIds)
    .eq("rated_id", requesterId);

  return summarizeScores((ratings ?? []).map((row) => Number(row.score)));
}

export async function getRequesterRatingSummaries(
  requesterIds: string[]
): Promise<Record<string, UserRatingSummary>> {
  const uniqueIds = [...new Set(requesterIds.filter(Boolean))];
  const result: Record<string, UserRatingSummary> = {};

  for (const id of uniqueIds) {
    result[id] = { averageScore: null, ratingCount: 0 };
  }

  if (!uniqueIds.length) {
    return result;
  }

  const supabase = createClient();

  const { data: ratings } = await supabase
    .from("ratings")
    .select("rated_id, score, request_id")
    .in("rated_id", uniqueIds);

  if (!ratings?.length) {
    return result;
  }

  const requestIds = [...new Set(ratings.map((rating) => rating.request_id))];
  const { data: requests } = await supabase
    .from("requests")
    .select("id, user_id")
    .in("id", requestIds);

  const ownerByRequest = new Map(
    (requests ?? []).map((request) => [request.id, request.user_id])
  );

  const scoresByRequester: Record<string, number[]> = {};

  for (const rating of ratings) {
    if (ownerByRequest.get(rating.request_id) !== rating.rated_id) {
      continue;
    }

    (scoresByRequester[rating.rated_id] ??= []).push(Number(rating.score));
  }

  for (const [id, scores] of Object.entries(scoresByRequester)) {
    result[id] = summarizeScores(scores);
  }

  return result;
}

export type UserReviewRole = "peek" | "client";

export async function getPublicUserReviews(
  userId: string,
  role: UserReviewRole
): Promise<PublicUserReview[]> {
  const supabase = createClient();

  const { data: roleRequests } =
    role === "peek"
      ? await supabase
          .from("requests")
          .select("id")
          .eq("runner_id", userId)
          .eq("status", "completed")
      : await supabase
          .from("requests")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "completed");

  const requestIds = (roleRequests ?? []).map((row) => row.id as string);
  if (!requestIds.length) {
    return [];
  }

  const { data: ratings, error } = await supabase
    .from("ratings")
    .select("id, score, comment, created_at, request_id")
    .eq("rated_id", userId)
    .in("request_id", requestIds)
    .order("created_at", { ascending: false });

  if (error || !ratings?.length) {
    return [];
  }

  const reviewRequestIds = [
    ...new Set(ratings.map((row) => row.request_id as string))
  ];
  const { data: requests } = await supabase
    .from("requests")
    .select("id, title")
    .in("id", reviewRequestIds);

  const titleByRequest = new Map(
    (requests ?? []).map((request) => [request.id, request.title as string])
  );

  return ratings.map((row) => ({
    id: row.id as string,
    score: Number(row.score),
    comment: (row.comment as string | null) ?? null,
    created_at: row.created_at as string,
    requestTitle: titleByRequest.get(row.request_id as string) ?? "Completed job"
  }));
}
