import {
  isPeekAvatarIcon,
  resolveAvatarIcon,
  suggestDefaultAvatarIcon
} from "@/lib/avatar-icons";
import {
  normalizeNickname,
  shouldResetNickname,
  suggestDefaultNickname,
  validateNickname
} from "@/lib/nickname-suggestions";
import { starsEarnedForJob, STARS_VOUCHER_THRESHOLD } from "@/lib/stars";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PeekProfile = {
  user_id: string;
  nickname: string;
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

function defaultNickname(userId: string): string {
  return suggestDefaultNickname(userId);
}

function resolveNickname(userId: string, stored: string | null): string {
  const trimmed = stored?.trim();
  if (!trimmed || shouldResetNickname(trimmed)) {
    return defaultNickname(userId);
  }
  return trimmed;
}

async function fixStoredNicknameIfNeeded(
  userId: string,
  stored: string | null,
  resolved: string
): Promise<void> {
  const trimmed = stored?.trim();
  if (!trimmed || !shouldResetNickname(trimmed) || trimmed === resolved) {
    return;
  }

  const supabase = createClient();
  await supabase
    .from("peek_profiles")
    .update({
      nickname: resolved,
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
    nickname: resolveNickname(row.user_id, row.nickname),
    avatar_icon: resolveAvatarIcon(row.user_id, row.avatar_icon),
    peek_stars: row.peek_stars,
    vouchers_earned: row.vouchers_earned,
    first_peek_bonus_claimed: row.first_peek_bonus_claimed
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
    return {
      user_id: userId,
      nickname: defaultNickname(userId),
      avatar_icon: suggestDefaultAvatarIcon(userId),
      peek_stars: 0,
      vouchers_earned: 0,
      first_peek_bonus_claimed: false
    };
  }

  const profile = mapProfile(data);
  if (data.nickname && shouldResetNickname(data.nickname)) {
    await fixStoredNicknameIfNeeded(userId, data.nickname, profile.nickname);
  }

  return profile;
}

export async function getOrCreatePeekProfile(
  userId: string
): Promise<PeekProfile> {
  const existing = await getPeekProfile(userId);
  if (!existing) {
    return {
      user_id: userId,
      nickname: defaultNickname(userId),
      avatar_icon: suggestDefaultAvatarIcon(userId),
      peek_stars: 0,
      vouchers_earned: 0,
      first_peek_bonus_claimed: false
    };
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
      nickname: defaultNickname(userId),
      avatar_icon: suggestDefaultAvatarIcon(userId)
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

  if (!profile) {
    return null;
  }

  return {
    userId,
    nickname: profile.nickname,
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

  const avatarIcon = isPeekAvatarIcon(input.avatarIcon)
    ? input.avatarIcon
    : suggestDefaultAvatarIcon(user.id);

  const { error } = await supabase.from("peek_profiles").upsert({
    user_id: user.id,
    nickname,
    avatar_icon: avatarIcon,
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
