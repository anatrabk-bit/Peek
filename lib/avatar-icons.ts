export const PEEK_AVATAR_ICONS = [
  "🙂",
  "😊",
  "🦊",
  "🐻",
  "🐼",
  "🦁",
  "🐸",
  "🦄",
  "🐙",
  "🌟",
  "🔵",
  "🟣",
  "🟢",
  "🟡",
  "🔴"
] as const;

export type PeekAvatarIcon = (typeof PEEK_AVATAR_ICONS)[number];

export const DEFAULT_PEEK_AVATAR_ICON: PeekAvatarIcon = "🙂";

export function isPeekAvatarIcon(value: string): value is PeekAvatarIcon {
  return (PEEK_AVATAR_ICONS as readonly string[]).includes(value);
}
