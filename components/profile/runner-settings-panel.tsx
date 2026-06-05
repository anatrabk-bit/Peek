"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRunnerSettings } from "@/components/runner-settings-provider";
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from "@/lib/google-maps";

type RunnerSettingsPanelProps = {
  isLoggedIn: boolean;
};

export function RunnerSettingsPanel({ isLoggedIn }: RunnerSettingsPanelProps) {
  const {
    radiusKm,
    notificationsEnabled,
    setRadiusKm,
    setNotificationsEnabled,
    updateNotificationLocation,
    enablePushNotifications
  } = useRunnerSettings();

  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <article className="card-static">
        <h2 className="heading-section text-lg">Peek settings</h2>
        <p className="mt-2 text-body">
          Log in to set your notification radius and nearby job alerts.
        </p>
        <Link href="/login?next=/profile" className="btn-primary mt-6 inline-flex">
          Log in
        </Link>
      </article>
    );
  }

  return (
    <article className="card-static space-y-6">
      <div>
        <h2 className="heading-section text-lg">Notification settings</h2>
        <p className="mt-2 text-body">
          These only control push alerts. You can always browse and claim any
          open request on the map.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-peek-text">
            Location for alerts
          </p>
          <button
            type="button"
            onClick={() => {
              startTransition(async () => {
                const result = await updateNotificationLocation();
                setMessage(
                  result.error ??
                    "Location saved. You'll get alerts for new requests near you."
                );
              });
            }}
            disabled={isPending}
            className="text-sm font-semibold text-peek-primary hover:underline disabled:opacity-60"
          >
            Update location
          </button>
        </div>
        <p className="text-sm text-peek-muted">
          Used only for proximity notifications — not for filtering the browse
          map.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="profile-radius" className="font-semibold text-peek-text">
            Notification radius
          </label>
          <span className="text-peek-muted">
            {radiusKm < 1 ? radiusKm.toFixed(1) : radiusKm % 1 === 0 ? radiusKm : radiusKm.toFixed(1)} km
          </span>
        </div>
        <input
          id="profile-radius"
          type="range"
          min={MIN_RADIUS_KM}
          max={MAX_RADIUS_KM}
          step={0.1}
          value={radiusKm}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-peek-primary"
        />
        <p className="text-xs text-peek-muted">
          You&apos;ll get push notifications for requests within this distance.
          Adjust anytime.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl bg-peek-card px-4 py-4">
        <div>
          <p className="font-semibold text-peek-text">Nearby request alerts</p>
          <p className="mt-1 text-sm text-peek-muted">
            Push when someone posts within your radius
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={() => {
            startTransition(async () => {
              const next = !notificationsEnabled;
              if (next) {
                const result = await enablePushNotifications();
                if (result.error) {
                  setMessage(result.error);
                  return;
                }
              }
              await setNotificationsEnabled(next);
              setMessage(
                next
                  ? "Notifications on. You'll get alerts for new nearby requests."
                  : "Notifications off."
              );
            });
          }}
          disabled={isPending}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            notificationsEnabled ? "bg-peek-accent" : "bg-zinc-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
              notificationsEnabled ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {notificationsEnabled && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await enablePushNotifications();
              setMessage(result.error ?? "Push subscription updated.");
            });
          }}
          className="btn-secondary w-full text-sm"
        >
          Refresh push subscription
        </button>
      )}

      {message && (
        <p className="text-sm text-peek-muted" role="status">
          {message}
        </p>
      )}
    </article>
  );
}
