import { buildNotificationContent } from "@/lib/notifications/events";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { NotificationEvent } from "@/types/notification";

type SendNotificationInput = {
  userId: string;
  event: NotificationEvent;
  requestId: string;
  requestTitle: string;
  scheduleLabel?: string;
  siteUrl?: string;
  /** Set when a DB trigger already inserted the in-app row (e.g. peek_applied). */
  skipInApp?: boolean;
};

export async function sendUserNotification(input: SendNotificationInput) {
  const content = buildNotificationContent(
    input.event,
    input.requestTitle,
    input.requestId,
    { scheduleLabel: input.scheduleLabel }
  );

  if (!input.skipInApp) {
    try {
      const admin = createAdminClient();
      const { error } = await admin.from("user_notifications").insert({
        user_id: input.userId,
        request_id: input.requestId,
        event: input.event,
        title: content.title,
        body: content.body,
        url: content.url
      });

      if (error && error.code !== "23505") {
        console.error("[Peek] in-app notification failed:", error.message);
      }
    } catch (error) {
      console.error("[Peek] in-app notification failed:", error);
    }
  }

  try {
    const supabase = createClient();
    await supabase.functions.invoke("notify-user", {
      body: {
        user_id: input.userId,
        event: input.event,
        request_id: input.requestId,
        request_title: input.requestTitle,
        site_url: input.siteUrl ?? getSiteUrl(),
        title: content.title,
        body: content.body,
        url: content.url
      }
    });
  } catch (error) {
    console.error("[Peek] notify-user edge function failed:", error);
  }
}

export async function notifyRequestWentLive(requestId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("requests")
      .select("user_id, title")
      .eq("id", requestId)
      .single();

    if (!data?.user_id) return;

    await sendUserNotification({
      userId: data.user_id,
      event: "request_live",
      requestId,
      requestTitle: data.title ?? "Your request"
    });
  } catch (error) {
    console.error("[Peek] notifyRequestWentLive failed:", error);
  }
}
