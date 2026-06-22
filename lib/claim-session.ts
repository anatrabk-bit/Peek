import type { TaskScheduleFields } from "@/types/task-schedule";

export const CLAIM_DURATION_MS = 15 * 60 * 1000;
export const CHECK_IN_PROMPT_MS = 10 * 60 * 1000;

/** When the 15-minute work window starts (scheduled tasks wait until scheduled_at). */
export function getClaimWindowStart(
  fields: TaskScheduleFields,
  claimedAt: string
): Date {
  const claimed = new Date(claimedAt);
  if (Number.isNaN(claimed.getTime())) {
    return new Date();
  }

  if (fields.task_type === "untimed" || fields.schedule_mode === "live") {
    return claimed;
  }

  if (!fields.scheduled_at) {
    return claimed;
  }

  const scheduled = new Date(fields.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) {
    return claimed;
  }

  return scheduled > claimed ? scheduled : claimed;
}

export function isClaimWindowOpen(
  fields: TaskScheduleFields,
  claimedAt: string,
  now = Date.now()
): boolean {
  return now >= getClaimWindowStart(fields, claimedAt).getTime();
}

export function claimExpiresAtForTask(
  fields: TaskScheduleFields,
  claimedAt: string
): Date {
  return new Date(
    getClaimWindowStart(fields, claimedAt).getTime() + CLAIM_DURATION_MS
  );
}

export function isClaimExpiredForTask(
  fields: TaskScheduleFields,
  claimedAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (!claimedAt) return false;
  if (!isClaimWindowOpen(fields, claimedAt, now)) return false;
  return now >= claimExpiresAtForTask(fields, claimedAt).getTime();
}

export function shouldPromptCheckInForTask(
  fields: TaskScheduleFields,
  claimedAt: string,
  checkInAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (checkInAt) return false;
  if (!isClaimWindowOpen(fields, claimedAt, now)) return false;

  const elapsed = now - getClaimWindowStart(fields, claimedAt).getTime();
  return elapsed >= CHECK_IN_PROMPT_MS && elapsed < CLAIM_DURATION_MS;
}

export function msUntilClaimWindowOpens(
  fields: TaskScheduleFields,
  claimedAt: string,
  now = Date.now()
): number {
  return Math.max(0, getClaimWindowStart(fields, claimedAt).getTime() - now);
}

export function msUntilCheckInPromptForTask(
  fields: TaskScheduleFields,
  claimedAt: string,
  now = Date.now()
): number {
  const start = getClaimWindowStart(fields, claimedAt).getTime();
  return Math.max(0, start + CHECK_IN_PROMPT_MS - now);
}

export function msUntilClaimExpiresForTask(
  fields: TaskScheduleFields,
  claimedAt: string,
  now = Date.now()
): number {
  return Math.max(0, claimExpiresAtForTask(fields, claimedAt).getTime() - now);
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Legacy helpers (use task-aware versions in new code)
export function claimExpiresAt(claimedAt: string): Date {
  return new Date(new Date(claimedAt).getTime() + CLAIM_DURATION_MS);
}

export function isClaimExpired(
  claimedAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (!claimedAt) return false;
  return now >= claimExpiresAt(claimedAt).getTime();
}

export function shouldPromptCheckIn(
  claimedAt: string,
  checkInAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (checkInAt) return false;
  const elapsed = now - new Date(claimedAt).getTime();
  return elapsed >= CHECK_IN_PROMPT_MS && elapsed < CLAIM_DURATION_MS;
}

export function msUntilCheckInPrompt(claimedAt: string, now = Date.now()): number {
  return Math.max(0, new Date(claimedAt).getTime() + CHECK_IN_PROMPT_MS - now);
}

export function msUntilClaimExpires(claimedAt: string, now = Date.now()): number {
  return Math.max(0, claimExpiresAt(claimedAt).getTime() - now);
}
