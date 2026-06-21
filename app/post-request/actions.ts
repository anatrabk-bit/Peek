"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyRequestWentLive } from "@/lib/notifications/send";
import { validateTaskSchedule } from "@/lib/task-schedule";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleMode, TaskType } from "@/types/task-schedule";

function parseTaskType(value: FormDataEntryValue | null): TaskType | null {
  if (value === "scheduled" || value === "untimed") {
    return value;
  }
  return null;
}

function parseScheduleMode(
  value: FormDataEntryValue | null
): ScheduleMode | null {
  if (
    value === "live" ||
    value === "today" ||
    value === "tomorrow" ||
    value === "custom"
  ) {
    return value;
  }
  return null;
}

export async function createRequest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/post-request");
  }

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const taskType = parseTaskType(formData.get("taskType"));

  if (!title || !location) {
    return { error: "Please fill in the task and location." };
  }

  if (!taskType) {
    return { error: "Choose when this should be checked: scheduled or anytime." };
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return {
      error: "Select a location from the address suggestions."
    };
  }

  const scheduleResult = validateTaskSchedule({
    taskType,
    scheduleMode: parseScheduleMode(formData.get("scheduleMode")),
    scheduleTime: String(formData.get("scheduleTime") ?? ""),
    customScheduledAt: String(formData.get("customScheduledAt") ?? "")
  });

  if ("error" in scheduleResult) {
    return { error: scheduleResult.error };
  }

  const scheduleMode =
    taskType === "scheduled"
      ? parseScheduleMode(formData.get("scheduleMode"))
      : null;

  try {
    const { data, error } = await supabase
      .from("requests")
      .insert({
        title,
        location,
        latitude,
        longitude,
        budget: 0,
        details: "Posted via Peek",
        status: "open",
        user_id: user.id,
        task_type: taskType,
        schedule_mode: scheduleMode,
        scheduled_at: scheduleResult.scheduledAt?.toISOString() ?? null
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.message?.includes("task_type")) {
        return {
          error:
            "Run supabase/migrations/021_task_schedule.sql in Supabase, then try again."
        };
      }
      return { error: error?.message ?? "Could not save request." };
    }

    await supabase.functions.invoke("notify-nearby-runners", {
      body: {
        request_id: data.id,
        title,
        budget: 0,
        latitude,
        longitude
      }
    });
    await notifyRequestWentLive(data.id);

    return {
      ok: true as const,
      requestId: data.id as string
    };
  } catch {
    return {
      error:
        "Could not save the request. Check your Supabase connection and schema."
    };
  }
}
