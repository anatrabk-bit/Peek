"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitResponse } from "@/app/requests/[id]/actions";

type SubmitResponseFormProps = {
  requestId: string;
  redirectOnSuccess?: string;
};

export function SubmitResponseForm({
  requestId,
  redirectOnSuccess
}: SubmitResponseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await submitResponse(requestId, formData);
      if (result?.ok) {
        setMessage("Response submitted. Nice work!");
        if (redirectOnSuccess) {
          router.push(redirectOnSuccess);
        } else {
          router.refresh();
        }
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <form action={handleSubmit} className="card-static space-y-5">
        <div className="space-y-2">
          <label htmlFor="answer" className="text-sm font-semibold text-peek-text">
            Your answer
          </label>
          <textarea
            id="answer"
            name="answer"
            required
            rows={5}
            disabled={isPending}
            placeholder="What did you find? Include anything they asked for."
            className="input-field resize-y"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="photo" className="text-sm font-semibold text-peek-text">
            Photo (optional)
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            disabled={isPending}
            className="block w-full text-sm text-peek-muted file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-peek-primary hover:file:bg-sky-100"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Submitting…" : "Submit response"}
        </button>
      </form>

      {message && (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
