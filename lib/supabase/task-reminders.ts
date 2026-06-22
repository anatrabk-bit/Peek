import { sendUserNotification } from "@/lib/notifications/send";
import {
  formatTaskSchedule,
  getTaskReminderAt,
  isFutureScheduledTask
} from "@/lib/task-schedule";
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

export async function hasTaskReminder(
  requestId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("request_reminders")
    .select("id")
    .eq("request_id", requestId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function subscribeTaskReminder(
  requestId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("status, task_type, schedule_mode, scheduled_at")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, error: "Request not found." };
  }

  if (request.status !== "open") {
    return { ok: false, error: "This task is no longer open." };
  }

  const fields = scheduleFields(request);
  if (!isFutureScheduledTask(fields)) {
    return {
      ok: false,
      error: "Reminders are only for scheduled tasks that start later."
    };
  }

  const remindAt = getTaskReminderAt(fields);
  if (!remindAt) {
    return { ok: false, error: "Could not set a reminder for this task." };
  }

  const { error } = await supabase.from("request_reminders").upsert(
    {
      user_id: userId,
      request_id: requestId,
      remind_at: remindAt.toISOString(),
      notified_at: null
    },
    { onConflict: "user_id,request_id" }
  );

  if (error) {
    if (error.message.includes("request_reminders")) {
      return {
        ok: false,
        error:
          "Run supabase/migrations/025_task_reminders.sql in Supabase, then try again."
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function unsubscribeTaskReminder(
  requestId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("request_reminders")
    .delete()
    .eq("request_id", requestId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function processDueTaskReminders(): Promise<void> {
  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: due, error } = await admin
      .from("request_reminders")
      .select("id, user_id, request_id")
      .is("notified_at", null)
      .lte("remind_at", nowIso)
      .limit(50);

    if (error || !due?.length) {
      return;
    }

    for (const reminder of due) {
      const { data: request } = await admin
        .from("requests")
        .select("title, status, task_type, schedule_mode, scheduled_at")
        .eq("id", reminder.request_id)
        .maybeSingle();

      if (!request || request.status !== "open") {
        await admin
          .from("request_reminders")
          .update({ notified_at: nowIso })
          .eq("id", reminder.id);
        continue;
      }

      const fields = scheduleFields(request);
      const when = formatTaskSchedule(fields);

      await sendUserNotification({
        userId: reminder.user_id,
        event: "task_reminder",
        requestId: reminder.request_id,
        requestTitle: request.title ?? "Open task",
        scheduleLabel: when
      });

      await admin
        .from("request_reminders")
        .update({ notified_at: nowIso })
        .eq("id", reminder.id);
    }
  } catch (error) {
    console.error("[Peek] processDueTaskReminders failed:", error);
  }
}
