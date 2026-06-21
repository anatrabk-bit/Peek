import {
  isPeekAvatarIcon,
  isUnsetAvatarIcon,
  PENDING_PEEK_AVATAR_ICON
} from "@/lib/avatar-icons";
import {
  hasChosenNickname,
  normalizeNickname,
  shouldResetNickname,
  validateNickname
} from "@/lib/nickname-suggestions";
import { starsEarnedForJob, STARS_VOUCHER_THRESHOLD } from "@/lib/stars";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PeekProfile = {
  user_id: string;
  nickname: string | null;
  avatar_icon: string;
  peek_stars: number;
  vouchers_earned: number;
  first_peek_bonus_claimed: boolean;
};

export type PublicPeekDisplay = {
  userId: string;
  nickname: string;
  avatarIcon: string;
  jobsCompleted: number;
  peekStars: number;
  vouchersEarned: number;
};

export function hasChosenPeekIdentity(profile: PeekProfile): boolean {
  return (
    hasChosenNickname(profile.nickname) &&
    !isUnsetAvatarIcon(profile.avatar_icon)
  );
}

function normalizeStoredNickname(stored: string | null): string | null {
  const trimmed = stored?.trim();
  if (!trimmed || shouldResetNickname(trimmed)) {
    return null;
  }
  return trimmed;
}

async function fixStoredNicknameIfNeeded(
  userId: string,
  stored: string | null
): Promise<void> {
  const trimmed = stored?.trim();
  if (!trimmed || !shouldResetNickname(trimmed)) {
    return;
  }

  const supabase = createClient();
  await supabase
    .from("peek_profiles")
    .update({
      nickname: null,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);
}

function mapProfile(row: {
  user_id: string;
  nickname: string | null;
  avatar_icon: string;
  peek_stars: number;
  vouchers_earned: number;
  first_peek_bonus_claimed: boolean;
}): PeekProfile {
  return {
    user_id: row.user_id,
    nickname: normalizeStoredNickname(row.nickname),
    avatar_icon: row.avatar_icon,
    peek_stars: row.peek_stars,
    vouchers_earned: row.vouchers_earned,
    first_peek_bonus_claimed: row.first_peek_bonus_claimed
  };
}

function emptyProfile(userId: string): PeekProfile {
  return {
    user_id: userId,
    nickname: null,
    avatar_icon: PENDING_PEEK_AVATAR_ICON,
    peek_stars: 0,
    vouchers_earned: 0,
    first_peek_bonus_claimed: false
  };
}

export async function getPeekJobsCompleted(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("runner_id", userId)
    .eq("status", "completed");

  return count ?? 0;
}

export async function getPeekProfile(
  userId: string
): Promise<PeekProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("peek_profiles")
    .select(
      "user_id, nickname, avatar_icon, peek_stars, vouchers_earned, first_peek_bonus_claimed"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error?.message?.includes("peek_profiles")) {
    return null;
  }

  if (!data) {
    return emptyProfile(userId);
  }

  const profile = mapProfile(data);
  if (data.nickname && shouldResetNickname(data.nickname)) {
    await fixStoredNicknameIfNeeded(userId, data.nickname);
  }

  return profile;
}

export async function getOrCreatePeekProfile(
  userId: string
): Promise<PeekProfile> {
  const existing = await getPeekProfile(userId);
  if (!existing) {
    return emptyProfile(userId);
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("peek_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    await supabase.from("peek_profiles").insert({
      user_id: userId,
      nickname: null,
      avatar_icon: PENDING_PEEK_AVATAR_ICON
    });
  }

  return existing;
}

export async function getPublicPeekDisplay(
  userId: string
): Promise<PublicPeekDisplay | null> {
  const [profile, jobsCompleted] = await Promise.all([
    getPeekProfile(userId),
    getPeekJobsCompleted(userId)
  ]);

  if (!profile || !hasChosenPeekIdentity(profile)) {
    return null;
  }

  return {
    userId,
    nickname: profile.nickname!,
    avatarIcon: profile.avatar_icon,
    jobsCompleted,
    peekStars: profile.peek_stars,
    vouchersEarned: profile.vouchers_earned
  };
}

export async function updatePeekIdentity(input: {
  nickname: string;
  avatarIcon: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Log in to update your profile." };
  }

  const nickname = normalizeNickname(input.nickname);
  const nicknameError = validateNickname(nickname);
  if (nicknameError) {
    return { error: nicknameError };
  }

  if (!input.avatarIcon.trim()) {
    return { error: "Pick a profile icon." };
  }

  if (!isPeekAvatarIcon(input.avatarIcon)) {
    return { error: "Pick one of the profile icons shown." };
  }

  const { error } = await supabase.from("peek_profiles").upsert({
    user_id: user.id,
    nickname,
    avatar_icon: input.avatarIcon,
    updated_at: new Date().toISOString()
  });

  if (error) {
    if (error.message.includes("peek_profiles")) {
      return {
        error: "Run supabase/migrations/020_stars_anonymity.sql in Supabase."
      };
    }
    return { error: error.message };
  }

  return { ok: true };
}

export async function awardPeekStarsForCompletion(
  userId: string
): Promise<{ starsEarned: number; newVoucher: boolean } | { error: string }> {
  try {
    const admin = createAdminClient();
    const { data: row, error: fetchError } = await admin
      .from("peek_profiles")
      .select(
        "user_id, peek_stars, vouchers_earned, first_peek_bonus_claimed"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && !fetchError.message.includes("peek_profiles")) {
      return { error: fetchError.message };
    }

    const isFirst = !row?.first_peek_bonus_claimed;
    const starsEarned = starsEarnedForJob(isFirst);
    const previousStars = row?.peek_stars ?? 0;
    const newStars = previousStars + starsEarned;
    const previousVouchers = row?.vouchers_earned ?? 0;
    const newVouchers = Math.floor(newStars / STARS_VOUCHER_THRESHOLD);
    const newVoucher = newVouchers > previousVouchers;

    const { error: upsertError } = await admin.from("peek_profiles").upsert({
      user_id: userId,
      peek_stars: newStars,
      vouchers_earned: newVouchers,
      first_peek_bonus_claimed: true,
      updated_at: new Date().toISOString()
    });

    if (upsertError) {
      return { error: upsertError.message };
    }

    return { starsEarned, newVoucher };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Could not award stars."
    };
  }
}
