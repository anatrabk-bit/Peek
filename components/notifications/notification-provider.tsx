"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PeekAppliedModal } from "@/components/peek-applied-modal";
import { PeekDecisionModal } from "@/components/peek-decision-modal";
import {
  NotificationContext,
  type NotificationContextValue
} from "@/components/notifications/notification-context";
import type { NotificationEvent, UserNotification } from "@/types/notification";

type NotificationProviderProps = {
  userId: string;
  initialUnreadCount: number;
  initialNotifications: UserNotification[];
  children: React.ReactNode;
};

const POPUP_EVENTS: NotificationEvent[] = [
  "peek_applied",
  "peek_approved",
  "peek_declined"
];

const SHOWN_KEY = "peek-popup-notifications-shown";

function readShownIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markShownId(id: string) {
  const shown = readShownIds();
  shown.add(id);
  sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]));
}

function shouldPopup(notification: UserNotification, shown: Set<string>) {
  return (
    POPUP_EVENTS.includes(notification.event) &&
    !notification.read_at &&
    !shown.has(notification.id)
  );
}

export function NotificationProvider({
  userId,
  initialUnreadCount,
  initialNotifications,
  children
}: NotificationProviderProps) {
  const [notifications, setNotifications] =
    useState<UserNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [peekAppliedNotification, setPeekAppliedNotification] =
    useState<UserNotification | null>(null);
  const [peekDecisionNotification, setPeekDecisionNotification] =
    useState<UserNotification | null>(null);
  const shownRef = useRef<Set<string>>(readShownIds());
  const knownIdsRef = useRef<Set<string>>(
    new Set(initialNotifications.map((item) => item.id))
  );

  const showPopupFor = useCallback((notification: UserNotification) => {
    if (!shouldPopup(notification, shownRef.current)) {
      return;
    }

    shownRef.current.add(notification.id);
    markShownId(notification.id);

    if (notification.event === "peek_applied") {
      setPeekAppliedNotification(notification);
      return;
    }

    if (
      notification.event === "peek_approved" ||
      notification.event === "peek_declined"
    ) {
      setPeekDecisionNotification(notification);
    }
  }, []);

  const ingestNotification = useCallback(
    (notification: UserNotification, forcePopup = false) => {
      const isNew = !knownIdsRef.current.has(notification.id);
      if (isNew) {
        knownIdsRef.current.add(notification.id);
      }

      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }
        return [notification, ...current].slice(0, 8);
      });

      if (isNew && !notification.read_at) {
        setUnreadCount((count) => count + 1);
      }

      if (isNew || forcePopup) {
        showPopupFor(notification);
      }
    },
    [showPopupFor]
  );

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
    knownIdsRef.current = new Set(initialNotifications.map((item) => item.id));

    for (const notification of initialNotifications) {
      showPopupFor(notification);
    }
  }, [initialNotifications, initialUnreadCount, showPopupFor]);

  const prependNotification = useCallback(
    (notification: UserNotification) => {
      ingestNotification(notification, true);
    },
    [ingestNotification]
  );

  const markReadLocal = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId && !notification.read_at
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllReadLocal = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.read_at
          ? notification
          : { ...notification, read_at: new Date().toISOString() }
      )
    );
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          ingestNotification(payload.new as UserNotification, true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, ingestNotification]);

  useEffect(() => {
    let cancelled = false;

    async function pollNotifications() {
      if (document.visibilityState === "hidden") return;

      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store"
        });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as {
          unreadCount: number;
          notifications: UserNotification[];
        };

        if (cancelled) return;

        setUnreadCount(data.unreadCount);

        for (const notification of [...data.notifications].reverse()) {
          ingestNotification(notification, false);
        }

        for (const notification of data.notifications) {
          if (shouldPopup(notification, shownRef.current)) {
            showPopupFor(notification);
            break;
          }
        }
      } catch {
        // polling is a backup — ignore transient errors
      }
    }

    void pollNotifications();
    const interval = window.setInterval(pollNotifications, 10000);

    function onFocus() {
      void pollNotifications();
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [ingestNotification, showPopupFor]);

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      notifications,
      markReadLocal,
      markAllReadLocal,
      prependNotification
    }),
    [
      unreadCount,
      notifications,
      markReadLocal,
      markAllReadLocal,
      prependNotification
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <PeekAppliedModal
        notification={peekAppliedNotification}
        onClose={() => setPeekAppliedNotification(null)}
      />
      <PeekDecisionModal
        notification={peekDecisionNotification}
        onClose={() => setPeekDecisionNotification(null)}
      />
    </NotificationContext.Provider>
  );
}
