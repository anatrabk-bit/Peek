import { isClaimWindowOpen } from "@/lib/claim-session";
import { sendUserNotification } from "@/lib/notifications/send";
import { formatTaskSchedule } from "@/lib/task-schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TaskScheduleFields } from "@/types/task-schedule";

function scheduleFields(row: {
  task_type?: string | null;
  schedule_mode?: string | null;
  scheduled_at?: string | null;
}): TaskScheduleFields {
  return {
    task_type: (row.task_type ?? "untimed") as TaskScheduleFields["task_type"],
    schedule_mode: row.schedule_mode as TaskScheduleFields["schedule_mode"],
    scheduled_at: row.scheduled_at ?? null
  };
}

export async function notifyClaimWindowOpenIfNeeded(
  requestId: string
): Promise<void> {
  const supabase = createClient();

  const { data: row } = await supabase
    .from("requests")
    .select(
      "id, title, status, runner_id, claimed_at, task_type, schedule_mode, scheduled_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (
    !row ||
    row.status !== "claimed" ||
    !row.runner_id ||
    !row.claimed_at
  ) {
    return;
  }

  const fields = scheduleFields(row);
  if (!isClaimWindowOpen(fields, row.claimed_at)) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("user_notifications")
      .select("id")
      .eq("user_id", row.runner_id)
      .eq("request_id", requestId)
      .eq("event", "claim_window_open")
      .maybeSingle();

    if (existing) {
      return;
    }

    await sendUserNotification({
      userId: row.runner_id,
      event: "claim_window_open",
      requestId,
      requestTitle: row.title ?? "Your task"
    });
  } catch (error) {
    console.error("[Peek] notifyClaimWindowOpenIfNeeded failed:", error);
  }
}

export async function notifyClaimReserved(
  requestId: string,
  runnerId: string
): Promise<void> {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("requests")
    .select("title, task_type, schedule_mode, scheduled_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!row) return;

  const fields = scheduleFields(row);
  const when = formatTaskSchedule(fields);

  await sendUserNotification({
    userId: runnerId,
    event: "claim_reserved",
    requestId,
    requestTitle: row.title ?? "Your task",
    scheduleLabel: when
  });
}

export async function notifyRequesterAboutClaim(
  requestId: string,
  requesterId: string,
  requestTitle: string,
  fields: TaskScheduleFields
): Promise<void> {
  const isFuture =
    fields.task_type === "scheduled" &&
    fields.schedule_mode !== "live" &&
    !!fields.scheduled_at &&
    new Date(fields.scheduled_at).getTime() > Date.now();

  await sendUserNotification({
    userId: requesterId,
    event: isFuture ? "peek_booked" : "peek_applied",
    requestId,
    requestTitle,
    scheduleLabel: isFuture ? formatTaskSchedule(fields) : undefined,
    skipInApp: !isFuture
  });
}
