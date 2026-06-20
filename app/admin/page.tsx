import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { isAdminEmail } from "@/lib/admin";
import { getAdminRequests, getAdminUsers } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminEmail(user.email)) {
    return (
      <section className="page-container">
        <div className="mx-auto max-w-lg card-static text-center">
          <h1 className="heading-section text-2xl">Access denied</h1>
          <p className="mt-3 text-body">
            This page is only available to the platform admin.
          </p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  let requests: Awaited<ReturnType<typeof getAdminRequests>> = [];
  let users: Awaited<ReturnType<typeof getAdminUsers>> = [];
  let loadError: string | null = null;

  try {
    [requests, users] = await Promise.all([
      getAdminRequests(),
      getAdminUsers()
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load admin data. Check SUPABASE_SERVICE_ROLE_KEY in .env.local.";
  }

  return (
    <section className="page-container space-y-8">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">Admin</h1>
        <p className="mt-3 text-body">
          View new signups and manage requests. Signed in as {user.email}.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : (
        <AdminPanel requests={requests} users={users} />
      )}
    </section>
  );
}
