"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  GoogleMap,
  InfoWindow,
  MarkerF,
  useJsApiLoader
} from "@react-google-maps/api";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  GOOGLE_MAPS_LIBRARIES
} from "@/lib/google-maps";
import { hasValidCoordinates, type Coordinates } from "@/lib/geo";
import type { MarketplaceRequest } from "@/types/request";

type RequestsMapProps = {
  requests: MarketplaceRequest[];
  /** When set, centers the map and shows a blue "you" marker — does not filter pins */
  userLocation: Coordinates | null;
};

const mapContainerStyle = {
  width: "100%",
  height: "420px"
};

export function RequestsMap({ requests, userLocation }: RequestsMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "peek-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: "weekly"
  });

  const mappableRequests = useMemo(
    () =>
      requests.filter((request) =>
        hasValidCoordinates(request.latitude, request.longitude)
      ),
    [requests]
  );

  const defaultCenter = useMemo(() => {
    if (mappableRequests.length > 0) {
      const first = mappableRequests[0];
      return { lat: first.latitude!, lng: first.longitude! };
    }
    return DEFAULT_MAP_CENTER;
  }, [mappableRequests]);

  useEffect(() => {
    if (!userLocation || !mapRef.current) {
      return;
    }

    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(14);
  }, [userLocation]);

  const activeRequest = mappableRequests.find(
    (request) => request.id === activeId
  );

  if (!apiKey) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-peek-card text-sm text-peek-muted">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-peek-card text-sm text-red-600">
        Could not load Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-peek-card text-sm text-peek-muted">
        Loading map…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-card">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={DEFAULT_MAP_ZOOM}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#0EA5E9",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3
            }}
            title="You are here"
          />
        )}

        {mappableRequests.map((request) => (
          <MarkerF
            key={request.id}
            position={{
              lat: request.latitude!,
              lng: request.longitude!
            }}
            onClick={() => setActiveId(request.id)}
            title={request.title}
          />
        ))}

        {activeRequest && (
          <InfoWindow
            position={{
              lat: activeRequest.latitude!,
              lng: activeRequest.longitude!
            }}
            onCloseClick={() => setActiveId(null)}
          >
            <div className="max-w-[220px] space-y-2 p-1">
              <p className="font-semibold text-peek-text">{activeRequest.title}</p>
              <p className="text-sm font-semibold text-amber-600">
                Earn stars
              </p>
              <Link
                href={`/requests/${activeRequest.id}`}
                className="text-sm font-semibold text-peek-primary hover:underline"
              >
                View details →
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {userLocation && (
        <p className="border-t border-zinc-100 bg-white px-4 py-2 text-center text-xs text-peek-muted">
          Blue dot is you — map centered on your location
        </p>
      )}
    </div>
  );
}
