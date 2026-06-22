export const CLAIM_DURATION_MS = 15 * 60 * 1000;
export const CHECK_IN_PROMPT_MS = 10 * 60 * 1000;

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

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
