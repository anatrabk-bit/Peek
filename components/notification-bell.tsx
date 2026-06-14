"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead
} from "@/app/notifications/actions";
import { useNotifications } from "@/components/notifications/notification-context";
import type { UserNotification } from "@/types/notification";

type NotificationBellProps = {
  initialUnreadCount: number;
  initialNotifications: UserNotification[];
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function NotificationBell({
  initialUnreadCount,
  initialNotifications
}: NotificationBellProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [isPending, startTransition] = useTransition();
  const notificationState = useNotifications();

  const unreadCount = notificationState?.unreadCount ?? initialUnreadCount;
  const notifications =
    notificationState?.notifications ?? initialNotifications;

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  function handleOpenNotification(notification: UserNotification) {
    startTransition(async () => {
      if (!notification.read_at) {
        await markNotificationRead(notification.id);
        notificationState?.markReadLocal(notification.id);
      }
      closeMenu();
      router.push(notification.url ?? "/");
      router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      notificationState?.markAllReadLocal();
      router.refresh();
    });
  }

  return (
    <details ref={menuRef} className="relative shrink-0">
      <summary
        className="relative flex cursor-pointer list-none items-center justify-center rounded-full p-2 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peek-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
      >
        <svg
          className="h-5 w-5 text-peek-text"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </summary>

      <div
        className="absolute right-0 z-[70] mt-2 w-80 origin-top-right rounded-2xl border border-zinc-200 bg-white shadow-xl sm:w-96"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <p className="font-semibold text-peek-text">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="text-xs font-semibold text-peek-primary hover:underline disabled:opacity-60"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-peek-muted">
            No notifications yet.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleOpenNotification(notification)}
                  disabled={isPending}
                  className={`w-full px-4 py-3 text-left transition hover:bg-zinc-50 disabled:opacity-60 ${
                    notification.read_at ? "opacity-70" : "bg-sky-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-peek-text">
                      {notification.title}
                    </p>
                    {!notification.read_at && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-peek-muted">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-peek-muted">
                    {formatWhen(notification.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-zinc-100 px-4 py-3">
          <Link
            href="/my-requests"
            onClick={closeMenu}
            className="text-sm font-semibold text-peek-primary hover:underline"
          >
            View my requests →
          </Link>
        </div>
      </div>
    </details>
  );
}
