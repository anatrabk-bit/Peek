import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentProvider, PaymentStatus } from "@/types/payment";
import type { RequestStatus } from "@/types/request";

export type AdminRequestRow = {
  id: string;
  title: string;
  location: string;
  status: RequestStatus;
  budget: number;
  created_at: string;
  payment_status: PaymentStatus | null;
  payment_provider: PaymentProvider | null;
};

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string;
};

export async function getAdminRequests(): Promise<AdminRequestRow[]> {
  const admin = await requireAdmin();
  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  let { data, error } = await supabase
    .from("requests")
    .select(
      "id, title, location, status, budget, created_at, payments (status, payment_provider)"
    )
    .order("created_at", { ascending: false });

  if (error?.message?.includes("payments")) {
    const fallback = await supabase
      .from("requests")
      .select("id, title, location, status, budget, created_at")
      .order("created_at", { ascending: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) {
    console.error("[Peek Admin] getAdminRequests:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const payment = Array.isArray(row.payments)
      ? row.payments[0]
      : row.payments;

    return {
      id: row.id,
      title: row.title,
      location: row.location,
      status: row.status,
      budget: Number(row.budget),
      created_at: row.created_at,
      payment_status: payment?.status ?? null,
      payment_provider: payment?.payment_provider ?? null
    };
  });
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const admin = await requireAdmin();
  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    console.error("[Peek Admin] getAdminUsers:", error.message);
    return [];
  }

  return (data.users ?? [])
    .map((user) => ({
      id: user.id,
      email: user.email ?? "—",
      created_at: user.created_at
    }))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
