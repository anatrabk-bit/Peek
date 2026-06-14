import { getUserSummary, type AuthUserSummary } from "@/lib/auth-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPeekRatingSummary,
  getRequesterRatingSummary
} from "@/lib/supabase/ratings";
import { createClient } from "@/lib/supabase/server";
import type { UserRatingSummary } from "@/types/rating";

export type PublicUserRole = "client" | "peek";

export type PublicUserProfile = {
  userId: string;
  display: AuthUserSummary;
  role: PublicUserRole;
  rating: UserRatingSummary;
  jobsCompleted: number;
  requestsPosted: number;
};

export async function getPublicUserDisplay(
  userId: string
): Promise<AuthUserSummary | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      return null;
    }
    return getUserSummary(data.user);
  } catch {
    return null;
  }
}

export async function getPublicUserProfile(
  userId: string,
  role: PublicUserRole
): Promise<PublicUserProfile | null> {
  const supabase = createClient();
  const display = await getPublicUserDisplay(userId);

  if (!display) {
    return null;
  }

  const [rating, jobsResult, requestsResult] = await Promise.all([
    role === "client"
      ? getRequesterRatingSummary(userId)
      : getPeekRatingSummary(userId),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("runner_id", userId)
      .eq("status", "completed"),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
  ]);

  return {
    userId,
    display,
    role,
    rating,
    jobsCompleted: jobsResult.count ?? 0,
    requestsPosted: requestsResult.count ?? 0
  };
}

export async function getPublicUserDisplays(
  userIds: string[]
): Promise<Record<string, AuthUserSummary>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const result: Record<string, AuthUserSummary> = {};

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const display = await getPublicUserDisplay(userId);
      if (display) {
        result[userId] = display;
      }
    })
  );

  return result;
}
