"use client";

import { createContext, useContext } from "react";
import type { UserNotification } from "@/types/notification";

export type NotificationContextValue = {
  unreadCount: number;
  notifications: UserNotification[];
  markReadLocal: (id: string) => void;
  markAllReadLocal: () => void;
  prependNotification: (notification: UserNotification) => void;
};

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  return useContext(NotificationContext);
}
