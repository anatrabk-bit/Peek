"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const RequestsMap = dynamic(
  () =>
    import("@/components/maps/requests-map").then((mod) => mod.RequestsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-peek-card text-sm text-peek-muted">
        Loading map…
      </div>
    )
  }
);
import { getDistanceKm, hasValidCoordinates, type Coordinates } from "@/lib/geo";
import { UserProfilePreview } from "@/components/user-profile-preview";
import type { AuthUserSummary } from "@/lib/auth-user";
import type { MarketplaceRequest } from "@/types/request";
import type { UserRatingSummary } from "@/types/rating";

type BrowseRequestsViewProps = {
  requests: MarketplaceRequest[];
  fetchError?: string | null;
  requesterRatings?: Record<string, UserRatingSummary>;
  requesterDisplays?: Record<string, AuthUserSummary>;
  fetchMeta?: {
    queryUsed: string;
    fetchedAt: string;
  };
};

export function BrowseRequestsView({
  requests,
  fetchError = null,
  requesterRatings = {},
  requesterDisplays = {},
  fetchMeta
}: BrowseRequestsViewProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    console.log("[Peek Browse] Rendered with requests from server:", {
      count: requests.length,
      fetchError,
      fetchMeta,
      noRadiusFilter: true,
      noLocationFilterOnList: true,
      requests
    });
  }, [requests, fetchError, fetchMeta]);

  const centerOnMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  if (requests.length === 0) {
    return (
      <div className="space-y-4">
        {fetchError && (
          <article className="rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800">
            <p className="font-semibold">Could not load requests from Supabase</p>
            <p className="mt-1">{fetchError}</p>
            <p className="mt-2 text-xs">
              Check the terminal (server logs) and browser console for [Peek]
              details. Common fix: run migrations for latitude/longitude columns.
            </p>
          </article>
        )}
        <article className="card-static border-2 border-dashed border-zinc-200 bg-peek-card text-center">
          <p className="font-semibold text-peek-text">
            {fetchError
              ? "No requests loaded"
              : "No open requests nearby yet. Be the first to post one!"}
          </p>
          <Link href="/post-request" className="btn-primary mt-6 inline-flex">
            Post a request
          </Link>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card-static space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-peek-text">Map view</h2>
            <p className="mt-1 text-sm text-peek-muted">
              All open requests on the map. Tap a pin to apply — the client
              approves you before you start.
            </p>
          </div>

          <button
            type="button"
            onClick={centerOnMyLocation}
            disabled={locating}
            className="btn-secondary shrink-0 text-sm disabled:opacity-60"
          >
            {locating ? "Getting location…" : "Use my location"}
          </button>
        </div>

        <RequestsMap requests={requests} userLocation={userLocation} />
      </div>

      <div className="space-y-5">
        <h2 className="heading-section text-xl">
          {requests.length} open job{requests.length === 1 ? "" : "s"}
        </h2>

        {requests.map((request) => (
          <article key={request.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-peek-text">
                  {request.title}
                </h3>
                <p className="mt-1 text-body">{request.location}</p>
                {request.user_id && requesterDisplays[request.user_id] && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-peek-muted">
                      Posted by
                    </p>
                    <UserProfilePreview
                      display={requesterDisplays[request.user_id]}
                      userId={request.user_id}
                      role="client"
                      summary={requesterRatings[request.user_id] ?? null}
                      size="sm"
                    />
                  </div>
                )}
                {userLocation &&
                  hasValidCoordinates(request.latitude, request.longitude) && (
                    <p className="mt-1 text-xs text-peek-muted">
                      {getDistanceKm(userLocation, {
                        lat: request.latitude!,
                        lng: request.longitude!
                      }).toFixed(1)}{" "}
                      km away
                    </p>
                  )}
              </div>
              <span className="badge-open">open</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
              <p className="text-xl font-bold text-peek-accent">
                £{request.budget}
              </p>
              <Link
                href={`/requests/${request.id}`}
                className="btn-secondary px-5 py-2 text-sm"
              >
                Take a look
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
