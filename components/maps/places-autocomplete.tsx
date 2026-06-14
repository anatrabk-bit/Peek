"use client";

import { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";

export type PlaceSelection = {
  location: string;
  latitude: number;
  longitude: number;
};

type PlacesAutocompleteProps = {
  onPlaceSelect: (place: PlaceSelection) => void;
  disabled?: boolean;
  defaultValue?: string;
};

// Google Places API החדש (מ-2025) — PlaceAutocompleteElement
type PlacePredictionSelectEvent = Event & {
  placePrediction?: {
    toPlace: () => {
      fetchFields: (opts: { fields: string[] }) => Promise<void>;
      formattedAddress?: string;
      displayName?: string;
      location?: { lat: () => number; lng: () => number };
    };
  };
};

export function PlacesAutocomplete({
  onPlaceSelect,
  disabled = false,
  defaultValue = ""
}: PlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [setupError, setSetupError] = useState<string | null>(null);

  onPlaceSelectRef.current = onPlaceSelect;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "peek-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: "weekly"
  });

  useEffect(() => {
    if (!isLoaded || !containerRef.current || disabled) {
      return;
    }

    let cancelled = false;
    const container = containerRef.current;

    async function initAutocomplete() {
      try {
        const placesLib = (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary & {
          PlaceAutocompleteElement?: new (
            options?: Record<string, unknown>
          ) => HTMLElement;
        };

        const PlaceAutocompleteElement = placesLib.PlaceAutocompleteElement;

        if (!PlaceAutocompleteElement) {
          setSetupError(
            "Places API (New) is required. Enable it in Google Cloud Console."
          );
          return;
        }

        if (cancelled) return;

        container.innerHTML = "";
        const autocomplete = new PlaceAutocompleteElement({});
        // עיצוב שיתאים לשאר שדות הטופס (.input-field)
        autocomplete.style.width = "100%";
        autocomplete.style.border = "none";
        autocomplete.style.background = "transparent";
        autocomplete.style.colorScheme = "light";
        container.appendChild(autocomplete);

        autocomplete.addEventListener("gmp-select", async (event: Event) => {
          const selectEvent = event as PlacePredictionSelectEvent;
          const placePrediction = selectEvent.placePrediction;
          if (!placePrediction) return;

          const place = placePrediction.toPlace();
          await place.fetchFields({
            fields: ["formattedAddress", "displayName", "location"]
          });

          const location =
            place.formattedAddress?.trim() ||
            place.displayName?.trim() ||
            "";
          const lat = place.location?.lat();
          const lng = place.location?.lng();

          if (!location || lat === undefined || lng === undefined) return;

          onPlaceSelectRef.current({
            location,
            latitude: lat,
            longitude: lng
          });
        });

        autocomplete.addEventListener("gmp-error", () => {
          setSetupError(
            "Google denied the address search. Add http://localhost:3001/* to your API key referrers and enable Places API (New)."
          );
        });
      } catch (err) {
        if (!cancelled) {
          setSetupError(
            err instanceof Error
              ? err.message
              : "Could not start address search."
          );
        }
      }
    }

    initAutocomplete();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [isLoaded, disabled, defaultValue]);

  if (!apiKey) {
    return (
      <p className="text-sm text-red-600">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to use address search.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="text-sm text-red-600">
        Could not load Google Maps. Check your API key and Google Cloud settings.
      </p>
    );
  }

  if (setupError) {
    return <p className="text-sm text-red-600">{setupError}</p>;
  }

  return (
    <div className="space-y-2">
      <div
        className={`input-field p-0 focus-within:border-peek-primary focus-within:ring-2 focus-within:ring-sky-100 ${
          disabled ? "pointer-events-none opacity-60" : ""
        } ${!isLoaded ? "bg-peek-card" : ""}`}
      >
        <div
          ref={containerRef}
          className="places-autocomplete-host w-full"
          aria-busy={!isLoaded}
        />
      </div>
      {!isLoaded && (
        <p className="text-sm text-peek-muted">Connecting to Google Maps…</p>
      )}
    </div>
  );
}
