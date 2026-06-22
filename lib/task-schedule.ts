import type { ScheduleMode, TaskScheduleFields, TaskType } from "@/types/task-schedule";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  scheduled: "Scheduled",
  untimed: "Anytime"
};

export const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
  live: "Now / Live",
  today: "Today",
  tomorrow: "Tomorrow",
  custom: "Pick date & time"
};

export function defaultTimeValue(now = new Date()): string {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return `${String(next.getHours()).padStart(2, "0")}:00`;
}

export function defaultCustomDatetimeLocal(now = new Date()): string {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return toDatetimeLocalValue(next);
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function resolveScheduledAt(input: {
  scheduleMode: ScheduleMode;
  scheduleTime?: string;
  customScheduledAt?: string;
  now?: Date;
}): Date | null {
  const now = input.now ?? new Date();

  switch (input.scheduleMode) {
    case "live":
      return now;
    case "today":
    case "tomorrow": {
      const time = input.scheduleTime?.trim() || defaultTimeValue(now);
      const [hours, minutes] = time.split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
      }

      const date = new Date(now);
      if (input.scheduleMode === "tomorrow") {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    case "custom": {
      const raw = input.customScheduledAt?.trim();
      if (!raw) {
        return null;
      }
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    default:
      return null;
  }
}

export function validateTaskSchedule(input: {
  taskType: TaskType;
  scheduleMode?: ScheduleMode | null;
  scheduleTime?: string;
  customScheduledAt?: string;
  now?: Date;
}): { ok: true; scheduledAt: Date | null } | { error: string } {
  const now = input.now ?? new Date();

  if (input.taskType === "untimed") {
    return { ok: true, scheduledAt: null };
  }

  const scheduleMode = input.scheduleMode;
  if (!scheduleMode) {
    return { error: "Pick when this should be checked." };
  }

  const scheduledAt = resolveScheduledAt({
    scheduleMode,
    scheduleTime: input.scheduleTime,
    customScheduledAt: input.customScheduledAt,
    now
  });

  if (!scheduledAt) {
    return { error: "Pick a valid date and time." };
  }

  if (scheduleMode !== "live" && scheduledAt.getTime() <= now.getTime()) {
    return { error: "Pick a time in the future." };
  }

  return { ok: true, scheduledAt };
}

export function formatTaskSchedule(
  fields: TaskScheduleFields,
  locale = "en-GB"
): string {
  if (fields.task_type === "untimed") {
    return TASK_TYPE_LABELS.untimed;
  }

  if (fields.schedule_mode === "live") {
    return SCHEDULE_MODE_LABELS.live;
  }

  if (!fields.scheduled_at) {
    return TASK_TYPE_LABELS.scheduled;
  }

  const when = new Date(fields.scheduled_at);
  if (Number.isNaN(when.getTime())) {
    return TASK_TYPE_LABELS.scheduled;
  }

  const time = when.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit"
  });

  if (fields.schedule_mode === "today") {
    return `Today at ${time}`;
  }

  if (fields.schedule_mode === "tomorrow") {
    return `Tomorrow at ${time}`;
  }

  const date = when.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  return `${date} at ${time}`;
}

export function isScheduledTask(fields: TaskScheduleFields): boolean {
  return fields.task_type === "scheduled";
}

const CLAIM_EARLY_MS = 5 * 60 * 1000;

/** Scheduled tasks can be claimed from 5 minutes before scheduled_at (live = immediately). */
export function canClaimScheduledTask(
  fields: TaskScheduleFields,
  now = new Date()
): boolean {
  if (fields.task_type === "untimed") {
    return true;
  }

  if (fields.schedule_mode === "live") {
    return true;
  }

  if (!fields.scheduled_at) {
    return true;
  }

  const scheduled = new Date(fields.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) {
    return true;
  }

  return now.getTime() >= scheduled.getTime() - CLAIM_EARLY_MS;
}

export function claimOpensAtMessage(fields: TaskScheduleFields): string | null {
  if (canClaimScheduledTask(fields)) {
    return null;
  }

  return `Opens ${formatTaskSchedule(fields).toLowerCase()}`;
}

const REMINDER_BEFORE_MS = 15 * 60 * 1000;

export function isFutureScheduledTask(
  fields: TaskScheduleFields,
  now = new Date()
): boolean {
  if (fields.task_type !== "scheduled" || fields.schedule_mode === "live") {
    return false;
  }

  if (!fields.scheduled_at) {
    return false;
  }

  const scheduled = new Date(fields.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) {
    return false;
  }

  return scheduled.getTime() > now.getTime();
}

export function getTaskReminderAt(
  fields: TaskScheduleFields,
  now = new Date()
): Date | null {
  if (!isFutureScheduledTask(fields, now)) {
    return null;
  }

  const scheduled = new Date(fields.scheduled_at!);
  const remindAt = new Date(scheduled.getTime() - REMINDER_BEFORE_MS);

  return remindAt.getTime() < now.getTime() ? now : remindAt;
}
