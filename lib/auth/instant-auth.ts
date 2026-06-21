import type { SupabaseClient } from "@supabase/supabase-js";
import { PENDING_PEEK_AVATAR_ICON } from "@/lib/avatar-icons";
import {
  isDuplicateSignupError,
  normalizeSignupEmail,
  normalizeSignupPhone
} from "@/lib/auth/validate-signup";
import { createAdminClient } from "@/lib/supabase/admin";

export type InstantAuthResult =
  | { ok: true; userId: string; isNew: boolean; email: string; phone: string }
  | { error: string };

export async function instantSignInOrUp(
  sessionClient: SupabaseClient,
  input: { email: string; phone: string }
): Promise<InstantAuthResult> {
  const admin = createAdminClient();
  const email = normalizeSignupEmail(input.email);
  const phone = normalizeSignupPhone(input.phone);

  const { data: existingUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const alreadyRegistered = (existingUsers.users ?? []).some(
    (user) => user.email?.toLowerCase() === email
  );

  let isNew = false;

  if (!alreadyRegistered) {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { phone }
      });

    if (createError) {
      if (!isDuplicateSignupError(createError.message)) {
        return { error: createError.message };
      }
    } else if (created.user) {
      isNew = true;
    }
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email
    });

  const tokenHash = linkData?.properties?.hashed_token;
  const userId = linkData?.user?.id;

  if (linkError || !tokenHash || !userId) {
    return {
      error: linkError?.message ?? "Could not sign you in. Try again."
    };
  }

  if (!isNew) {
    const { data: existingUser } = await admin.auth.admin.getUserById(userId);
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(existingUser.user?.user_metadata ?? {}),
        phone
      }
    });
  }

  const { error: verifyError } = await sessionClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email"
  });

  if (verifyError) {
    return { error: verifyError.message };
  }

  const { data: existingProfile } = await admin
    .from("peek_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingProfile) {
    await admin.from("peek_profiles").insert({
      user_id: userId,
      nickname: null,
      avatar_icon: PENDING_PEEK_AVATAR_ICON
    });
  }

  return { ok: true, userId, isNew, email, phone };
}
