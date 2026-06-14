import type { User } from "@supabase/supabase-js";

export type AuthUserSummary = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
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
  user: User | null | undefined
): AuthUserSummary | null {
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const name = nameFromMetadata(meta);
  const email = user.email ?? null;
  const label =
    name || nameFromEmail(email) || email || "?";

  return {
    name,
    email,
    avatarUrl: null,
    initials: label.charAt(0).toUpperCase()
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

/** שם פרטי לברכה — קודם Google, רק אז גיבוי מהמייל */
export function getFirstName(user: AuthUserSummary | null): string | null {
  if (!user) return null;

  if (user.name) {
    const first = user.name.split(/\s+/)[0]?.trim();
    if (first) return first;
  }

  return nameFromEmail(user.email);
}

/** שם מלא לתצוגה — קודם Google, רק אז גיבוי מהמייל */
export function getDisplayName(user: AuthUserSummary | null): string | null {
  if (!user) return null;
  return user.name?.trim() || nameFromEmail(user.email);
}
