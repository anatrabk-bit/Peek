"use client";

import { useCallback, useState, useTransition } from "react";
import {
  PlacesAutocomplete,
  type PlaceSelection
} from "@/components/maps/places-autocomplete";
import { createRequest } from "@/app/post-request/actions";
import { MIN_BUDGET_GBP, MIN_BUDGET_MESSAGE } from "@/lib/constants";

export function PostRequestForm() {
  const [place, setPlace] = useState<PlaceSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePlaceSelect = useCallback((selection: PlaceSelection) => {
    setPlace(selection);
    setError(null);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const budget = Number(formData.get("budget"));

    const locationFromForm = String(formData.get("location") ?? "").trim();
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));

    const selectedPlace: PlaceSelection | null =
      place ??
      (locationFromForm &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude)
        ? { location: locationFromForm, latitude, longitude }
        : null);

    if (!selectedPlace) {
      setError("Pick a place from the suggestions so we can pin it on the map.");
      return;
    }

    if (Number.isNaN(budget) || budget < MIN_BUDGET_GBP) {
      setError(MIN_BUDGET_MESSAGE);
      return;
    }

    formData.set("location", selectedPlace.location);
    formData.set("latitude", String(selectedPlace.latitude));
    formData.set("longitude", String(selectedPlace.longitude));

    startTransition(async () => {
      const result = await createRequest(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-static space-y-5">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-semibold text-peek-text">
          What&apos;s the task?
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          disabled={isPending}
          placeholder="e.g., Is the apartment lobby wheelchair accessible?"
          className="input-field"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="location"
          className="text-sm font-semibold text-peek-text"
        >
          Where is it?
        </label>
        <PlacesAutocomplete
          onPlaceSelect={handlePlaceSelect}
          disabled={isPending}
        />
        {place && (
          <>
            <input type="hidden" name="location" value={place.location} />
            <input type="hidden" name="latitude" value={place.latitude} />
            <input type="hidden" name="longitude" value={place.longitude} />
            <p className="text-sm text-peek-muted">
              Pinned: {place.location}
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="budget" className="text-sm font-semibold text-peek-text">
          What&apos;s it worth to you? (£)
        </label>
        <input
          id="budget"
          name="budget"
          type="number"
          min={MIN_BUDGET_GBP}
          step={1}
          required
          disabled={isPending}
          placeholder="e.g., 10"
          className="input-field"
        />
        <p className="text-sm text-peek-muted">
          Suggested: £5-£20 for a quick check.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Posting…" : "Post it"}
      </button>
    </form>
  );
}
