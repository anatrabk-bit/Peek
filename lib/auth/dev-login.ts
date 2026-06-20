import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type DevLoginProfile = {
  name?: string;
  phone?: string;
};

export async function verifyDevLoginEmail(
  supabase: SupabaseClient,
  email: string,
  profile?: DevLoginProfile | string
) {
  const name = typeof profile === "string" ? profile : profile?.name;
  const phone = typeof profile === "string" ? undefined : profile?.phone;

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email
  });

  if (linkError) {
    return { error: linkError.message };
  }

  const token_hash = linkData.properties?.hashed_token;
  if (!token_hash) {
    return { error: "Could not create login token." };
  }

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash,
    type: "email"
  });

  if (verifyError) {
    return { error: verifyError.message };
  }

  if (verifyData.user && (name || phone)) {
    await admin.auth.admin.updateUserById(verifyData.user.id, {
      user_metadata: {
        ...verifyData.user.user_metadata,
        ...(name
          ? {
              full_name: name,
              name
            }
          : {}),
        ...(phone ? { phone } : {})
      }
    });
  }

  return { success: true as const };
}
