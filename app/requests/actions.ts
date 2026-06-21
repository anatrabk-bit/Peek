import { createClient } from "@supabase/supabase-js";
import type { MarketplaceRequest } from "@/types/request";
import type { ScheduleMode, TaskType } from "@/types/task-schedule";

export async function getOpenRequests(): Promise<MarketplaceRequest[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("status", "open");

  if (error) {
    console.error("[Peek] getOpenRequests:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const taskType = (row.task_type as TaskType | null) ?? "untimed";

    return {
      id: row.id,
      title: row.title,
      location: row.location,
      budget: Number(row.budget),
      details:
        row.details ?? "No extra details - reach out if you need more context.",
      status: row.status,
      runner_id: row.runner_id ?? null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      task_type: taskType,
      schedule_mode:
        taskType === "scheduled"
          ? ((row.schedule_mode as ScheduleMode | null) ?? "live")
          : null,
      scheduled_at:
        taskType === "scheduled" ? (row.scheduled_at ?? null) : null
    };
  });
}
