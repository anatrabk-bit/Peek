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

const MAPS_DENIED_MESSAGE =
  "Google denied address search. In Google Cloud enable Maps JavaScript API, Places API, and Places API (New). Add https://peek-eta.vercel.app/* to your API key referrers.";

function initLegacyAutocomplete(
  container: HTMLDivElement,
  defaultValue: string,
  onSelect: (place: PlaceSelection) => void
) {
  const input = document.createElement("input");
  input.type = "text";
  input.name = "location-search";
  input.placeholder = "Search for an address";
  input.defaultValue = defaultValue;
  input.autocomplete = "off";
  input.className =
    "w-full border-none bg-transparent px-4 py-3 text-base text-peek-text outline-none placeholder:text-peek-muted";
  container.appendChild(input);

  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ["formatted_address", "geometry", "name"]
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    const location =
      place.formatted_address?.trim() || place.name?.trim() || "";
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();

    if (!location || lat === undefined || lng === undefined) return;

    onSelect({ location, latitude: lat, longitude: lng });
  });
}

async function initNewAutocomplete(
  container: HTMLDivElement,
  onSelect: (place: PlaceSelection) => void,
  onError: (message: string) => void
) {
  const placesLib = (await google.maps.importLibrary(
    "places"
  )) as google.maps.PlacesLibrary & {
    PlaceAutocompleteElement?: new (
      options?: Record<string, unknown>
    ) => HTMLElement;
  };

  const PlaceAutocompleteElement = placesLib.PlaceAutocompleteElement;

  if (!PlaceAutocompleteElement) {
    throw new Error(
      "Places API (New) is required. Enable it in Google Cloud Console."
    );
  }

  const autocomplete = new PlaceAutocompleteElement({});
  autocomplete.style.width = "100%";
  autocomplete.style.border = "none";
  autocomplete.style.background = "transparent";
  autocomplete.style.colorScheme = "light";
  container.appendChild(autocomplete);

  autocomplete.addEventListener("gmp-select", async (event: Event) => {
    try {
      const selectEvent = event as PlacePredictionSelectEvent;
      const placePrediction = selectEvent.placePrediction;
      if (!placePrediction) return;

      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "displayName", "location"]
      });

      const location =
        place.formattedAddress?.trim() || place.displayName?.trim() || "";
      const lat = place.location?.lat();
      const lng = place.location?.lng();

      if (!location || lat === undefined || lng === undefined) return;

      onSelect({ location, latitude: lat, longitude: lng });
    } catch {
      onError("Could not read the selected address. Try picking again.");
    }
  });

  autocomplete.addEventListener("gmp-error", () => {
    onError(MAPS_DENIED_MESSAGE);
  });
}

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
    id: "peek-google-maps-places",
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
      setSetupError(null);
      container.innerHTML = "";

      const onSelect = (place: PlaceSelection) => {
        onPlaceSelectRef.current(place);
      };

      const onError = (message: string) => {
        if (!cancelled) setSetupError(message);
      };

      try {
        // Legacy widget is more stable on iOS Safari and production.
        if (google.maps.places?.Autocomplete) {
          initLegacyAutocomplete(container, defaultValue, onSelect);
          return;
        }

        if (cancelled) return;
        await initNewAutocomplete(container, onSelect, onError);
      } catch (err) {
        if (cancelled) return;

        // If the new widget fails, try legacy before showing an error.
        try {
          container.innerHTML = "";
          if (google.maps.places?.Autocomplete) {
            initLegacyAutocomplete(container, defaultValue, onSelect);
            return;
          }
        } catch {
          // fall through to error message
        }

        onError(
          err instanceof Error ? err.message : "Could not start address search."
        );
      }
    }

    void initAutocomplete();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [isLoaded, disabled, defaultValue]);

  if (!apiKey) {
    return (
      <p className="text-sm text-red-600">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to use address search.
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
