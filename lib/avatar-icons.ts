export type PeekAvatarOption = {
  emoji: string;
  ring: string;
};

export const PEEK_AVATAR_OPTIONS = [
  { emoji: "🦊", ring: "bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50" },
  { emoji: "🐼", ring: "bg-gradient-to-br from-slate-200 via-zinc-100 to-white" },
  { emoji: "🦁", ring: "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-50" },
  { emoji: "🐸", ring: "bg-gradient-to-br from-lime-200 via-green-100 to-emerald-50" },
  { emoji: "🦄", ring: "bg-gradient-to-br from-fuchsia-200 via-pink-100 to-violet-50" },
  { emoji: "🐙", ring: "bg-gradient-to-br from-violet-200 via-purple-100 to-indigo-50" },
  { emoji: "🦉", ring: "bg-gradient-to-br from-amber-100 via-orange-50 to-stone-100" },
  { emoji: "🐨", ring: "bg-gradient-to-br from-slate-300 via-gray-200 to-slate-100" },
  { emoji: "🐧", ring: "bg-gradient-to-br from-sky-200 via-blue-100 to-slate-100" },
  { emoji: "🦋", ring: "bg-gradient-to-br from-sky-200 via-indigo-100 to-violet-100" },
  { emoji: "☕", ring: "bg-gradient-to-br from-amber-300 via-orange-200 to-amber-100" },
  { emoji: "🧙‍♀️", ring: "bg-gradient-to-br from-violet-300 via-purple-200 to-fuchsia-100" },
  { emoji: "🚀", ring: "bg-gradient-to-br from-indigo-200 via-blue-100 to-cyan-100" },
  { emoji: "✨", ring: "bg-gradient-to-br from-yellow-200 via-amber-100 to-orange-100" },
  { emoji: "🎧", ring: "bg-gradient-to-br from-zinc-300 via-slate-200 to-zinc-100" },
  { emoji: "🌈", ring: "bg-gradient-to-br from-pink-200 via-sky-100 to-violet-100" },
  { emoji: "🔮", ring: "bg-gradient-to-br from-purple-300 via-violet-200 to-indigo-100" },
  { emoji: "🍕", ring: "bg-gradient-to-br from-red-200 via-orange-100 to-amber-100" },
  { emoji: "🎸", ring: "bg-gradient-to-br from-rose-200 via-red-100 to-orange-100" },
  { emoji: "⚡", ring: "bg-gradient-to-br from-yellow-300 via-amber-200 to-yellow-100" },
  { emoji: "😎", ring: "bg-gradient-to-br from-cyan-200 via-sky-100 to-blue-100" },
  { emoji: "🥳", ring: "bg-gradient-to-br from-pink-200 via-rose-100 to-orange-100" },
  { emoji: "👾", ring: "bg-gradient-to-br from-emerald-200 via-lime-100 to-green-100" },
  { emoji: "🧋", ring: "bg-gradient-to-br from-pink-200 via-fuchsia-100 to-violet-100" },
  { emoji: "🌻", ring: "bg-gradient-to-br from-yellow-300 via-lime-200 to-green-100" },
  { emoji: "🎯", ring: "bg-gradient-to-br from-red-200 via-rose-100 to-pink-100" },
  { emoji: "🛸", ring: "bg-gradient-to-br from-teal-200 via-cyan-100 to-sky-100" },
  { emoji: "🤠", ring: "bg-gradient-to-br from-amber-200 via-yellow-100 to-lime-100" }
] as const satisfies readonly PeekAvatarOption[];

export const PEEK_AVATAR_ICONS = PEEK_AVATAR_OPTIONS.map(
  (option) => option.emoji
) as readonly string[];

export type PeekAvatarIcon = (typeof PEEK_AVATAR_OPTIONS)[number]["emoji"];

export const DEFAULT_PEEK_AVATAR_ICON: PeekAvatarIcon = "🦊";

const LEGACY_AVATAR_ICONS = new Set([
  "🔵",
  "🟣",
  "🟢",
  "🟡",
  "🔴",
  "🙂",
  "😊"
]);

const avatarOptionByEmoji = new Map<string, PeekAvatarOption>(
  PEEK_AVATAR_OPTIONS.map((option) => [option.emoji, option])
);

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * (i + 7)) % 2147483647;
  }
  return hash;
}

export function suggestDefaultAvatarIcon(userId: string): PeekAvatarIcon {
  const index = hashUserId(userId) % PEEK_AVATAR_OPTIONS.length;
  return PEEK_AVATAR_OPTIONS[index].emoji;
}

export function isPeekAvatarIcon(value: string): value is PeekAvatarIcon {
  return (PEEK_AVATAR_ICONS as readonly string[]).includes(value);
}

export function isLegacyAvatarIcon(value: string): boolean {
  return LEGACY_AVATAR_ICONS.has(value);
}

export function getAvatarRingClass(emoji: string): string {
  return avatarOptionByEmoji.get(emoji)?.ring ?? PEEK_AVATAR_OPTIONS[0].ring;
}

export function resolveAvatarIcon(
  userId: string,
  stored: string | null | undefined
): PeekAvatarIcon {
  const trimmed = stored?.trim();
  if (trimmed && isPeekAvatarIcon(trimmed) && !isLegacyAvatarIcon(trimmed)) {
    return trimmed;
  }
  return suggestDefaultAvatarIcon(userId);
}
