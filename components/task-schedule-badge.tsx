import { formatTaskSchedule, isScheduledTask } from "@/lib/task-schedule";
import type { TaskScheduleFields } from "@/types/task-schedule";

type TaskScheduleBadgeProps = {
  schedule: TaskScheduleFields;
  size?: "sm" | "md";
};

export function TaskScheduleBadge({
  schedule,
  size = "sm"
}: TaskScheduleBadgeProps) {
  const label = formatTaskSchedule(schedule);
  const scheduled = isScheduledTask(schedule);

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      } ${
        scheduled
          ? "bg-violet-100 text-violet-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {label}
    </span>
  );
}
