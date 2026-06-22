"use client";

import { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { formatPlaceLocation } from "@/lib/format-place";
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";

export type PlaceSelection = {
  location: string;
  latitude: number;
  longitude: number;
};

type PlacesAutocompleteProps = {
  onPlaceSelect: (place: PlaceSelection | null) => void;
  disabled?: boolean;
  defaultValue?: string;
};

export async function geocodeAddress(
  address: string
): Promise<PlaceSelection | null> {
  const query = address.trim();
  if (!query || typeof google === "undefined") {
    return null;
  }

  const fromPlaces = await findPlaceByText(query);
  if (fromPlaces) {
    return fromPlaces;
  }

  if (!google.maps?.Geocoder) {
    return null;
  }

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }

      const result = results[0];
      resolve({
        location: formatPlaceLocation(null, result.formatted_address) || query,
        latitude: result.geometry.location.lat(),
        longitude: result.geometry.location.lng()
      });
    });
  });
}

function findPlaceByText(query: string): Promise<PlaceSelection | null> {
  return new Promise((resolve) => {
    if (!google.maps.places?.PlacesService) {
      resolve(null);
      return;
    }

    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.textSearch({ query }, (results, status) => {
      if (
        status !== google.maps.places.PlacesServiceStatus.OK ||
        !results?.[0]?.geometry?.location
      ) {
        resolve(null);
        return;
      }

      const place = results[0];
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat === undefined || lng === undefined) {
        resolve(null);
        return;
      }

      resolve({
        location: formatPlaceLocation(place.name, place.formatted_address) || query,
        latitude: lat,
        longitude: lng
      });
    });
  });
}

function LocationInput({
  onPlaceSelect,
  disabled = false,
  defaultValue = "",
  mapsReady = false
}: PlacesAutocompleteProps & { mapsReady?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [mapsHint, setMapsHint] = useState<string | null>(null);

  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    if (!mapsReady || !inputRef.current || disabled) {
      return;
    }

    if (!google.maps.places?.Autocomplete) {
      setMapsHint(
        "Address suggestions are off. Type the full address - we will pin it when you post."
      );
      return;
    }

    setMapsHint(null);

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = formatPlaceLocation(
        place.name,
        place.formatted_address
      );
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (!location || lat === undefined || lng === undefined) {
        onPlaceSelectRef.current(null);
        return;
      }

      if (inputRef.current) {
        inputRef.current.value = location;
      }

      onPlaceSelectRef.current({ location, latitude: lat, longitude: lng });
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapsReady, disabled]);

  function handleInputChange() {
    onPlaceSelectRef.current(null);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id="location"
        name="location"
        type="text"
        required
        disabled={disabled}
        defaultValue={defaultValue}
        placeholder="Shop, café, or street name…"
        autoComplete="off"
        className="input-field"
        onChange={handleInputChange}
        aria-describedby={mapsHint ? "location-maps-hint" : undefined}
      />

      {mapsReady && mapsHint && (
        <p id="location-maps-hint" className="text-sm text-peek-muted">
          {mapsHint}
        </p>
      )}

      <p className="text-xs text-peek-muted">
        Pick a suggestion, or type the full address and post.
      </p>
    </div>
  );
}

function PlacesAutocompleteWithMaps(props: PlacesAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "peek-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: "weekly"
  });

  return (
    <div className="space-y-2">
      <LocationInput {...props} mapsReady={isLoaded} />

      {!isLoaded && !loadError && (
        <p className="text-sm text-peek-muted">Loading address search…</p>
      )}

      {loadError && (
        <p className="text-sm text-amber-800">
          Could not load map search. Type the full address - we will try to pin
          it when you post.
        </p>
      )}
    </div>
  );
}

export function PlacesAutocomplete(props: PlacesAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  if (!apiKey) {
    return (
      <div className="space-y-2">
        <LocationInput {...props} />
        <p className="text-sm text-amber-800">
          Map search is not set up. Type the address anyway.
        </p>
      </div>
    );
  }

  return <PlacesAutocompleteWithMaps {...props} />;
}
