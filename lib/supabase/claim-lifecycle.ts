import { isClaimExpiredForTask } from "@/lib/claim-session";
import type { TaskScheduleFields } from "@/types/task-schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function releaseExpiredClaimIfNeeded(
  requestId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("requests")
    .select(
      "id, status, claimed_at, runner_id, task_type, schedule_mode, scheduled_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  const fields = row ? scheduleFields(row) : null;

  if (
    !row ||
    row.status !== "claimed" ||
    !row.claimed_at ||
    !fields ||
    !isClaimExpiredForTask(fields, row.claimed_at)
  ) {
    return false;
  }

  const { data: response } = await supabase
    .from("responses")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();

  if (response) {
    return false;
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("requests")
      .update({
        status: "open",
        runner_id: null,
        claimed_at: null
      })
      .eq("id", requestId)
      .eq("status", "claimed");
  } catch {
    await supabase
      .from("requests")
      .update({
        status: "open",
        runner_id: null,
        claimed_at: null
      })
      .eq("id", requestId)
      .eq("status", "claimed");
  }

  return true;
}
