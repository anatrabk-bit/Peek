"use client";

import { useEffect, useRef } from "react";
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

function readLatLng(location: google.maps.LatLng | google.maps.LatLngLiteral): {
  lat: number;
  lng: number;
} {
  if (typeof (location as google.maps.LatLng).lat === "function") {
    const latLng = location as google.maps.LatLng;
    return { lat: latLng.lat(), lng: latLng.lng() };
  }

  const literal = location as google.maps.LatLngLiteral;
  return { lat: literal.lat, lng: literal.lng };
}

export function PlacesAutocomplete({
  onPlaceSelect,
  disabled = false,
  defaultValue = ""
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);

  onPlaceSelectRef.current = onPlaceSelect;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "peek-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    const input = inputRef.current;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ["formatted_address", "geometry", "name", "place_id"]
    });

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener("place_changed", () => {
      // Defer so getPlace() is populated after the dropdown selection (Google quirk).
      window.setTimeout(() => {
        const place = autocomplete.getPlace();
        const geometry = place.geometry?.location;

        if (!geometry) {
          return;
        }

        const { lat, lng } = readLatLng(geometry);
        const location =
          place.formatted_address?.trim() ||
          place.name?.trim() ||
          input.value.trim();

        if (!location || Number.isNaN(lat) || Number.isNaN(lng)) {
          return;
        }

        onPlaceSelectRef.current({
          location,
          latitude: lat,
          longitude: lng
        });
      }, 0);
    });

    return () => {
      google.maps.event.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [isLoaded]);

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
        Could not load Google Maps. Check your API key.
      </p>
    );
  }

  return (
    <input
      ref={inputRef}
      id="location"
      name="location_display"
      type="text"
      defaultValue={defaultValue}
      disabled={disabled || !isLoaded}
      autoComplete="off"
      placeholder="Start typing an address…"
      className="input-field"
    />
  );
}
