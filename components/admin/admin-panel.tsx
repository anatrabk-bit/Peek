"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRequest, updateRequestStatus } from "@/app/admin/actions";
import type { AdminRequestRow, AdminUserRow } from "@/lib/admin/queries";
import type { RequestStatus } from "@/types/request";

type AdminPanelProps = {
  requests: AdminRequestRow[];
  users: AdminUserRow[];
};

const STATUSES: RequestStatus[] = [
  "open",
  "pending_approval",
  "claimed",
  "completed"
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function AdminPanel({ requests, users }: AdminPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleStatusChange(requestId: string, status: RequestStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateRequestStatus(requestId, status);
      if (result.ok) {
        refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleDelete(requestId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteRequest(requestId);
      if (result.ok) {
        refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="heading-section text-xl">New signups</h2>
          <p className="mt-1 text-sm text-peek-muted">
            {users.length} user{users.length === 1 ? "" : "s"} — newest first.
            Phone comes from signup; nickname after they save their profile.
          </p>
        </div>

        <div className="card-static overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-peek-muted">
                <th className="px-3 py-3">Joined</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Peek nickname</th>
                <th className="px-3 py-3">User ID</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-peek-muted"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="px-3 py-4 whitespace-nowrap text-peek-muted">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-3 py-4 font-medium text-peek-text">
                    {user.email}
                  </td>
                  <td className="px-3 py-4 text-peek-text" dir="ltr">
                    {user.phone ?? "—"}
                  </td>
                  <td className="px-3 py-4 text-peek-text" dir="ltr">
                    {user.nickname?.trim() || "—"}
                  </td>
                  <td className="px-3 py-4 font-mono text-xs text-peek-muted">
                    {user.id.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="heading-section text-xl">Requests</h2>
          <p className="mt-1 text-sm text-peek-muted">
            {requests.length} total — change status or delete as needed.
          </p>
        </div>

        <div className="card-static overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-peek-muted">
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Posted</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-peek-muted"
                  >
                    No requests yet.
                  </td>
                </tr>
              )}
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="px-3 py-4 font-medium text-peek-text">
                    {request.title}
                  </td>
                  <td className="px-3 py-4 text-peek-muted">
                    {request.location}
                  </td>
                  <td className="px-3 py-4 capitalize">{request.status}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-peek-muted">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={isPending || request.status === status}
                          onClick={() =>
                            handleStatusChange(request.id, status)
                          }
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition disabled:cursor-not-allowed ${
                            request.status === status
                              ? "bg-sky-100 text-sky-800"
                              : "border border-zinc-200 text-peek-muted hover:border-peek-primary hover:text-peek-primary"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleDelete(request.id, request.title)
                        }
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
