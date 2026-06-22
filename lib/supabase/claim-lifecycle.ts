import { isClaimExpired } from "@/lib/claim-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function releaseExpiredClaimIfNeeded(
  requestId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("requests")
    .select("id, status, claimed_at, runner_id")
    .eq("id", requestId)
    .maybeSingle();

  if (
    !row ||
    row.status !== "claimed" ||
    !row.claimed_at ||
    !isClaimExpired(row.claimed_at)
  ) {
    return false;
  }

  const { data: response } = await supabase
    .from("responses")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();

  if (response) {
    return false;
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("requests")
      .update({
        status: "open",
        runner_id: null,
        claimed_at: null
      })
      .eq("id", requestId)
      .eq("status", "claimed");
  } catch {
    await supabase
      .from("requests")
      .update({
        status: "open",
        runner_id: null,
        claimed_at: null
      })
      .eq("id", requestId)
      .eq("status", "claimed");
  }

  return true;
}
