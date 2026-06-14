"use client";

import { useCallback, useState, useTransition } from "react";
import {
  PlacesAutocomplete,
  type PlaceSelection
} from "@/components/maps/places-autocomplete";
import { createRequest } from "@/app/post-request/actions";
import { MIN_BUDGET_GBP, MIN_BUDGET_MESSAGE } from "@/lib/constants";
import {
  freeBudgetHint,
  freeSubmitButtonLabel,
  paidSubmitButtonLabel,
  type FreePostingInfo
} from "@/lib/free-requests";

type PostRequestFormProps = {
  freePostingInfo: FreePostingInfo;
};

export function PostRequestForm({ freePostingInfo }: PostRequestFormProps) {
  const stripeEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const paypalEnabled = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
  const cardCheckoutEnabled =
    !freePostingInfo.nextPostIsFree && (stripeEnabled || paypalEnabled);
  const nextPostIsFree = freePostingInfo.nextPostIsFree;
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
        return;
      }

      if (result?.needsManualPayment && result.requestId) {
        window.location.href = "/my-requests?payment_pending=1";
        return;
      }

      if (result?.needsPayPalCheckout && result.requestId) {
        try {
          const response = await fetch("/api/paypal/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ requestId: result.requestId })
          });
          const data = await response.json();

          if (!response.ok || !data.url) {
            setError(
              data.error ??
                "Request saved — go to My requests to complete payment."
            );
            return;
          }

          window.location.href = data.url;
          return;
        } catch {
          setError("Request saved — go to My requests to complete payment.");
          return;
        }
      }

      if (result?.needsStripeCheckout && result.requestId) {
        try {
          const response = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ requestId: result.requestId })
          });
          const data = await response.json();

          if (!response.ok || !data.url) {
            setError(
              data.error ??
                "Request saved — go to My requests to complete payment."
            );
            return;
          }

          window.location.href = data.url;
          return;
        } catch {
          setError("Request saved — go to My requests to complete payment.");
          return;
        }
      }

      window.location.href = result.isFreePromo
        ? "/my-requests?free_promo=1"
        : "/my-requests";
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
          {nextPostIsFree
            ? freeBudgetHint()
            : stripeEnabled
              ? " You'll secure payment when you post — charged only when your Peek delivers the answer."
              : paypalEnabled
                ? " You'll pay by card or Apple Pay when you post — charged only when your Peek delivers the answer."
                : " After posting you'll see payment details on My requests — your request goes live once payment is confirmed."}
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
        className={`w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60 ${
          nextPostIsFree
            ? "inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white shadow-sm transition duration-200 hover:bg-emerald-600 hover:shadow-md active:scale-[0.98]"
            : "btn-primary"
        }`}
      >
        {isPending
          ? "Posting…"
          : nextPostIsFree
            ? freeSubmitButtonLabel(freePostingInfo)
            : paidSubmitButtonLabel(cardCheckoutEnabled)}
      </button>
    </form>
  );
}
