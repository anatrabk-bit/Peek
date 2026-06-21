export type TaskType = "scheduled" | "untimed";

export type ScheduleMode = "live" | "today" | "tomorrow" | "custom";

export type TaskScheduleFields = {
  task_type: TaskType;
  schedule_mode: ScheduleMode | null;
  scheduled_at: string | null;
};
