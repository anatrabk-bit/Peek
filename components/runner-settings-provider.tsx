"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_RADIUS_KM,
  MAX_RADIUS_KM,
  MIN_RADIUS_KM
} from "@/lib/google-maps";
import type { Coordinates } from "@/lib/geo";
import type { RunnerProfile } from "@/types/runner";
import {
  removePushSubscriptions,
  savePushSubscription,
  updateRunnerProfile
} from "@/app/profile/actions";

type RunnerSettingsContextValue = {
  userId: string | null;
  radiusKm: number;
  notificationsEnabled: boolean;
  setRadiusKm: (value: number) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  /** Saves coords to profile for proximity push notifications only */
  updateNotificationLocation: () => Promise<{ error?: string }>;
  enablePushNotifications: () => Promise<{ error?: string }>;
};

const RunnerSettingsContext = createContext<RunnerSettingsContextValue | null>(
  null
);

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function RunnerSettingsProvider({
  children,
  initialProfile
}: {
  children: React.ReactNode;
  initialProfile: RunnerProfile | null;
}) {
  const [userId, setUserId] = useState<string | null>(
    initialProfile?.user_id ?? null
  );
  const [radiusKm, setRadiusKmState] = useState(
    initialProfile?.radius_km ?? DEFAULT_RADIUS_KM
  );
  const [notificationsEnabled, setNotificationsEnabledState] = useState(
    initialProfile?.notifications_enabled ?? true
  );

  const syncProfile = useCallback(
    async (patch: {
      latitude?: number;
      longitude?: number;
      radius_km?: number;
      notifications_enabled?: boolean;
    }) => {
      if (!userId) return;
      await updateRunnerProfile(patch);
    },
    [userId]
  );

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateNotificationLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      return { error: "Geolocation is not supported in this browser." };
    }

    return new Promise<{ error?: string }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          syncProfile({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          resolve({});
        },
        () => resolve({ error: "Location permission was denied." }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
      );
    });
  }, [syncProfile]);

  const setRadiusKm = useCallback(
    (value: number) => {
      const clamped = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, value));
      setRadiusKmState(clamped);
      syncProfile({ radius_km: clamped });
    },
    [syncProfile]
  );

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      setNotificationsEnabledState(enabled);
      await syncProfile({ notifications_enabled: enabled });

      if (!enabled) {
        await removePushSubscriptions();
      }
    },
    [syncProfile]
  );

  const enablePushNotifications = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidKey) {
      return { error: "Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local" };
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { error: "Push notifications are not supported in this browser." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { error: "Notification permission was denied." };
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { error: "Could not read push subscription." };
    }

    const result = await savePushSubscription({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    });

    if (result.error) {
      return { error: result.error };
    }

    setNotificationsEnabledState(true);
    return {};
  }, []);

  const value = useMemo(
    () => ({
      userId,
      radiusKm,
      notificationsEnabled,
      setRadiusKm,
      setNotificationsEnabled,
      updateNotificationLocation,
      enablePushNotifications
    }),
    [
      userId,
      radiusKm,
      notificationsEnabled,
      setRadiusKm,
      setNotificationsEnabled,
      updateNotificationLocation,
      enablePushNotifications
    ]
  );

  return (
    <RunnerSettingsContext.Provider value={value}>
      {children}
    </RunnerSettingsContext.Provider>
  );
}

export function useRunnerSettings() {
  const context = useContext(RunnerSettingsContext);

  if (!context) {
    throw new Error("useRunnerSettings must be used within RunnerSettingsProvider");
  }

  return context;
}
