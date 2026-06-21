"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus } from "@/types/request";

async function assertAdmin() {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "Unauthorized" };
  }
  return { ok: true as const, admin };
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus
) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return auth;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", requestId);

  if (error) {
    console.error("[Peek Admin] updateRequestStatus:", error.message);
    return { ok: false as const, error: "Could not update status." };
  }

  revalidatePath("/admin");
  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);

  return { ok: true as const };
}

export async function deleteRequest(requestId: string) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return auth;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("requests").delete().eq("id", requestId);

  if (error) {
    console.error("[Peek Admin] deleteRequest:", error.message);
    return { ok: false as const, error: "Could not delete request." };
  }

  revalidatePath("/admin");
  revalidatePath("/requests");

  return { ok: true as const };
}
