"use server";

import { revalidatePath } from "next/cache";
import { updatePeekIdentity } from "@/lib/supabase/peek-profile";

export async function updatePeekIdentityAction(input: {
  nickname: string;
  avatarIcon: string;
}) {
  const result = await updatePeekIdentity(input);

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/requests");

  return { ok: true as const };
}
