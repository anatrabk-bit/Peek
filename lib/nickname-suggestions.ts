export const PEEK_NICKNAME_SUGGESTIONS = [
  "Day Maker",
  "Smile Spreader",
  "Cosmic Helper",
  "Coffee Hero",
  "Harry Potter Queen",
  "Kindness Captain",
  "Magic Moment Maker",
  "Bubble Tea Boss",
  "Chaos Coordinator",
  "Golden Retriever Energy",
  "Main Character Energy",
  "Plot Twist Pro",
  "Joy Bringer",
  "Mood Lifter",
  "Star Chaser",
  "Spark Spreader",
  "Task Wizard",
  "Adventure Ally",
  "Neighborhood Hero",
  "Street Champion",
  "Good Vibes Captain",
  "Hope Dealer",
  "Vibe Curator",
  "Wonder Walker"
] as const;

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 32;

const OLD_AUTO_NICKNAME = /^Peek-[A-F0-9]{4}$/i;

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % 2147483647;
  }
  return hash;
}

export function suggestDefaultNickname(userId: string): string {
  const index = hashUserId(userId) % PEEK_NICKNAME_SUGGESTIONS.length;
  return PEEK_NICKNAME_SUGGESTIONS[index];
}

export function getNicknameSuggestionsForUser(
  userId: string,
  count = 5
): string[] {
  const start = hashUserId(userId) % PEEK_NICKNAME_SUGGESTIONS.length;
  const picks: string[] = [];

  for (let offset = 0; picks.length < count; offset += 1) {
    const suggestion =
      PEEK_NICKNAME_SUGGESTIONS[
        (start + offset) % PEEK_NICKNAME_SUGGESTIONS.length
      ];
    if (!picks.includes(suggestion)) {
      picks.push(suggestion);
    }
  }

  return picks;
}

export function isLegacyAutoNickname(nickname: string): boolean {
  return OLD_AUTO_NICKNAME.test(nickname.trim());
}

/** Stored nicknames we should replace with a fun suggestion (hyphens, old auto names, etc.). */
export function shouldResetNickname(nickname: string): boolean {
  const trimmed = nickname.trim();
  if (!trimmed) return false;
  if (isLegacyAutoNickname(trimmed)) return true;
  if (trimmed.includes("-")) return true;

  const normalized = normalizeNickname(trimmed).toLowerCase();
  const deprecated = new Set([
    "the first peek",
    "warm heart",
    "little legend",
    "sunshine helper",
    "neighborhood angel",
    "soft launch star",
    "plot armor pal",
    "good vibes only",
    "street explorer"
  ]);

  return deprecated.has(normalized);
}

export function hasChosenNickname(nickname: string | null | undefined): boolean {
  const trimmed = nickname?.trim();
  return Boolean(trimmed && !shouldResetNickname(trimmed));
}

export function normalizeNickname(raw: string): string {
  return raw.trim().replace(/-/g, " ").replace(/\s+/g, " ");
}

export function validateNickname(raw: string): string | null {
  if (raw.trim().includes("-")) {
    return "Use spaces between words, not hyphens (e.g. Day Maker, not Day-Maker).";
  }

  const nickname = normalizeNickname(raw);

  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters.`;
  }

  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9 ']*[a-zA-Z0-9]$/.test(nickname)) {
    return "Use letters, numbers, and spaces. Start and end with a letter or number.";
  }

  return null;
}
