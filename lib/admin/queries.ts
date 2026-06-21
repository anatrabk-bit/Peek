import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus } from "@/types/request";

export type AdminRequestRow = {
  id: string;
  title: string;
  location: string;
  status: RequestStatus;
  budget: number;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  phone: string | null;
  nickname: string | null;
  created_at: string;
};

export async function getAdminRequests(): Promise<AdminRequestRow[]> {
  const admin = await requireAdmin();
  if (!admin) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select("id, title, location, status, budget, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Peek Admin] getAdminRequests:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location,
    status: row.status,
    budget: Number(row.budget),
    created_at: row.created_at
  }));
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const adminUser = await requireAdmin();
  if (!adminUser) {
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

  const authUsers = data.users ?? [];
  const userIds = authUsers.map((user) => user.id);

  const profilesByUserId = new Map<
    string,
    { nickname: string | null; phone: string | null }
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("peek_profiles")
      .select("user_id, nickname")
      .in("user_id", userIds);

    for (const profile of profiles ?? []) {
      profilesByUserId.set(profile.user_id, {
        nickname: profile.nickname,
        phone: null
      });
    }
  }

  return authUsers
    .map((user) => {
      const meta = user.user_metadata ?? {};
      const phone =
        typeof meta.phone === "string" && meta.phone.trim()
          ? meta.phone.trim()
          : null;

      return {
        id: user.id,
        email: user.email ?? "—",
        phone,
        nickname: profilesByUserId.get(user.id)?.nickname ?? null,
        created_at: user.created_at
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
