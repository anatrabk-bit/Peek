import { getPublicPeekDisplay } from "@/lib/supabase/peek-profile";
import type { PublicPeekDisplay } from "@/lib/supabase/peek-profile";

export type PublicUserRole = "client" | "peek";

export type PublicUserProfile = {
  userId: string;
  display: PublicPeekDisplay;
  role: PublicUserRole;
  jobsCompleted: number;
  requestsPosted: number;
};

export async function getPublicUserProfile(
  userId: string,
  role: PublicUserRole
): Promise<PublicUserProfile | null> {
  const display = await getPublicPeekDisplay(userId);

  if (!display) {
    return null;
  }

  const requestsPosted =
    role === "client"
      ? await (async () => {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = createClient();
          const { count } = await supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          return count ?? 0;
        })()
      : 0;

  return {
    userId,
    display,
    role,
    jobsCompleted: role === "peek" ? display.jobsCompleted : 0,
    requestsPosted
  };
}

export async function getPublicPeekDisplays(
  userIds: string[]
): Promise<Record<string, PublicPeekDisplay>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const result: Record<string, PublicPeekDisplay> = {};

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const display = await getPublicPeekDisplay(userId);
      if (display) {
        result[userId] = display;
      }
    })
  );

  return result;
}
