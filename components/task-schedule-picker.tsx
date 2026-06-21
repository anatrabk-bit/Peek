"use client";

import { useMemo, useState } from "react";
import {
  defaultCustomDatetimeLocal,
  defaultTimeValue,
  SCHEDULE_MODE_LABELS,
  TASK_TYPE_LABELS
} from "@/lib/task-schedule";
import type { ScheduleMode, TaskType } from "@/types/task-schedule";

type TaskSchedulePickerProps = {
  disabled?: boolean;
};

const SCHEDULE_MODES: ScheduleMode[] = [
  "live",
  "today",
  "tomorrow",
  "custom"
];

export function TaskSchedulePicker({ disabled = false }: TaskSchedulePickerProps) {
  const now = useMemo(() => new Date(), []);
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("live");
  const [scheduleTime, setScheduleTime] = useState(defaultTimeValue(now));
  const [customScheduledAt, setCustomScheduledAt] = useState(
    defaultCustomDatetimeLocal(now)
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-peek-text">
          When should this be checked?
        </p>
        <p className="text-xs text-peek-muted">
          Start with whether you need a specific time — then add details below.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
              taskType === "scheduled"
                ? "border-peek-primary bg-sky-50"
                : "border-zinc-200 bg-white hover:border-sky-200"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="taskType"
              value="scheduled"
              checked={taskType === "scheduled"}
              onChange={() => setTaskType("scheduled")}
              disabled={disabled}
              className="sr-only"
              required
            />
            <p className="font-semibold text-peek-text">
              {TASK_TYPE_LABELS.scheduled}
            </p>
            <p className="mt-1 text-sm text-peek-muted">
              I need a check at a specific time — now, later today, or another
              date.
            </p>
          </label>

          <label
            className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
              taskType === "untimed"
                ? "border-peek-primary bg-sky-50"
                : "border-zinc-200 bg-white hover:border-sky-200"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="taskType"
              value="untimed"
              checked={taskType === "untimed"}
              onChange={() => setTaskType("untimed")}
              disabled={disabled}
              className="sr-only"
              required
            />
            <p className="font-semibold text-peek-text">
              {TASK_TYPE_LABELS.untimed}
            </p>
            <p className="mt-1 text-sm text-peek-muted">
              No rush — a nearby Peek can check when it suits them.
            </p>
          </label>
        </div>
      </div>

      {taskType === "untimed" && (
        <div className="peek-callout text-sm leading-relaxed">
          <span className="font-semibold text-peek-text">Anytime</span> — no
          deadline. Good for things like &quot;Is there a kids&apos; discount?&quot;
          or &quot;Are dogs allowed?&quot;
        </div>
      )}

      {taskType === "scheduled" && (
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-peek-card p-4">
          <p className="text-sm font-semibold text-peek-text">Pick a time</p>

          <div className="space-y-2">
            {SCHEDULE_MODES.map((mode) => (
              <label
                key={mode}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                  scheduleMode === mode
                    ? "border-peek-primary bg-white"
                    : "border-transparent hover:bg-white/80"
                }`}
              >
                <input
                  type="radio"
                  name="scheduleMode"
                  value={mode}
                  checked={scheduleMode === mode}
                  onChange={() => setScheduleMode(mode)}
                  disabled={disabled}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-peek-text">
                    {SCHEDULE_MODE_LABELS[mode]}
                  </span>
                  {mode === "live" && (
                    <span className="mt-0.5 block text-xs text-peek-muted">
                      e.g. &quot;Is there a queue right now?&quot;
                    </span>
                  )}
                  {mode === "today" && (
                    <span className="mt-2 block">
                      <input
                        type="time"
                        name="scheduleTime"
                        value={scheduleTime}
                        onChange={(event) => setScheduleTime(event.target.value)}
                        disabled={disabled || scheduleMode !== "today"}
                        className="input-field max-w-[10rem]"
                        required={scheduleMode === "today"}
                      />
                    </span>
                  )}
                  {mode === "tomorrow" && (
                    <span className="mt-2 block">
                      <input
                        type="time"
                        name="scheduleTime"
                        value={scheduleTime}
                        onChange={(event) => setScheduleTime(event.target.value)}
                        disabled={disabled || scheduleMode !== "tomorrow"}
                        className="input-field max-w-[10rem]"
                        required={scheduleMode === "tomorrow"}
                      />
                    </span>
                  )}
                  {mode === "custom" && (
                    <span className="mt-2 block">
                      <input
                        type="datetime-local"
                        name="customScheduledAt"
                        value={customScheduledAt}
                        onChange={(event) =>
                          setCustomScheduledAt(event.target.value)
                        }
                        disabled={disabled || scheduleMode !== "custom"}
                        min={defaultCustomDatetimeLocal(now)}
                        className="input-field max-w-full sm:max-w-xs"
                        required={scheduleMode === "custom"}
                      />
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          {scheduleMode !== "today" && scheduleMode !== "tomorrow" && (
            <input type="hidden" name="scheduleTime" value={scheduleTime} />
          )}
          {scheduleMode !== "custom" && (
            <input
              type="hidden"
              name="customScheduledAt"
              value={customScheduledAt}
            />
          )}
        </div>
      )}
    </div>
  );
}
