import type { User } from "@supabase/supabase-js";
import { isUnsetAvatarIcon } from "@/lib/avatar-icons";
import { hasChosenNickname } from "@/lib/nickname-suggestions";

export type AuthUserSummary = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
  peekNickname: string | null;
  peekAvatarIcon: string | null;
};

type PeekIdentity = {
  nickname: string | null;
  avatar_icon: string;
};

function readMetaString(
  meta: Record<string, unknown>,
  key: string
): string | null {
  const value = meta[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/** שם מפרופיל Google / Supabase — לא מכתובת המייל */
function nameFromMetadata(meta: Record<string, unknown>): string | null {
  const fullName = readMetaString(meta, "full_name");
  if (fullName) return fullName;

  const name = readMetaString(meta, "name");
  if (name) return name;

  const givenName = readMetaString(meta, "given_name");
  const familyName = readMetaString(meta, "family_name");

  if (givenName && familyName) {
    return `${givenName} ${familyName}`;
  }

  if (givenName) return givenName;
  if (familyName) return familyName;

  return null;
}

export function getUserSummary(
  user: User | null | undefined,
  peek?: PeekIdentity | null
): AuthUserSummary | null {
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const name = nameFromMetadata(meta);
  const email = user.email ?? null;
  const peekNickname = hasChosenNickname(peek?.nickname)
    ? peek!.nickname!.trim()
    : null;
  const rawAvatar = peek?.avatar_icon?.trim();
  const peekAvatarIcon =
    rawAvatar && !isUnsetAvatarIcon(rawAvatar) ? rawAvatar : null;
  const fallbackLabel =
    peekNickname || name || nameFromEmail(email) || email || "?";

  return {
    name,
    email,
    avatarUrl: null,
    initials: fallbackLabel.charAt(0).toUpperCase(),
    peekNickname,
    peekAvatarIcon
  };
}

/** גיבוי כשאין פרופיל Google — anat@… → Anat */
export function nameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const local = email.split("@")[0]?.trim();
  if (!local) return null;

  const firstPart = local.split(/[._-]/)[0]?.trim();
  if (!firstPart) return null;

  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
}

/** How Peek addresses you — always your anonymous nickname, never real name. */
export function getPeekDisplayName(user: AuthUserSummary | null): string {
  if (!user) return "Your Peek";
  return user.peekNickname?.trim() || "Your Peek";
}

/** @deprecated Use getPeekDisplayName — real names are not shown in the app UI. */
export function getFirstName(user: AuthUserSummary | null): string | null {
  return getPeekDisplayName(user);
}

/** @deprecated Use getPeekDisplayName — real names are not shown in the app UI. */
export function getDisplayName(user: AuthUserSummary | null): string | null {
  if (!user) return null;
  return getPeekDisplayName(user);
}
