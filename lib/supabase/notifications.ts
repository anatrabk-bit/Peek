import { createClient } from "@/lib/supabase/server";
import type { UserNotification } from "@/types/notification";

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    if (error.message.includes("user_notifications")) return 0;
    console.error("[Peek] getUnreadNotificationCount:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getRecentNotifications(
  userId: string,
  limit = 8
): Promise<UserNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      "id, user_id, request_id, event, title, body, url, read_at, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("user_notifications")) return [];
    console.error("[Peek] getRecentNotifications:", error.message);
    return [];
  }

  return (data ?? []) as UserNotification[];
}
