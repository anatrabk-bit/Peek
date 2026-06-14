import { NextResponse } from "next/server";
import {
  getRecentNotifications,
  getUnreadNotificationCount
} from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(user.id),
    getRecentNotifications(user.id)
  ]);

  return NextResponse.json({ unreadCount, notifications });
}
