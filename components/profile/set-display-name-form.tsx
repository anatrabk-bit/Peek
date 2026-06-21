"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateDisplayName } from "@/app/profile/actions";

export function SetDisplayNameForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateDisplayName(name);
      if (result?.ok) {
        router.refresh();
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-static mt-4 space-y-3 border border-zinc-200">
      <p className="text-sm font-semibold text-peek-text">Your name</p>
      <p className="text-sm text-peek-muted">
        We use this for &ldquo;Hey, Anat!&rdquo;, not your email.
      </p>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Anat"
        required
        className="input-field"
        dir="ltr"
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save name"}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
