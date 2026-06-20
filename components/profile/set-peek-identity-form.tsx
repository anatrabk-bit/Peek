"use client";

import { useState, useTransition } from "react";
import { updatePeekIdentityAction } from "@/app/profile/peek-identity-actions";
import { PEEK_AVATAR_ICONS } from "@/lib/avatar-icons";
import type { PeekProfile } from "@/lib/supabase/peek-profile";

type SetPeekIdentityFormProps = {
  profile: PeekProfile;
};

export function SetPeekIdentityForm({ profile }: SetPeekIdentityFormProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatarIcon, setAvatarIcon] = useState(profile.avatar_icon);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updatePeekIdentityAction({ nickname, avatarIcon });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage("Saved — this is how others see you on Peek.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-static space-y-5">
      <div>
        <h3 className="heading-section text-lg">Your anonymous identity</h3>
        <p className="mt-2 text-sm text-peek-muted">
          Others only see your nickname and icon — never your real name or
          email.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-semibold text-peek-text">
          Nickname
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          maxLength={24}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          disabled={isPending}
          className="input-field"
          placeholder="e.g., SunnyFox"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-peek-text">Profile icon</p>
        <div className="flex flex-wrap gap-2">
          {PEEK_AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setAvatarIcon(icon)}
              disabled={isPending}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl transition ${
                avatarIcon === icon
                  ? "border-peek-primary bg-sky-50"
                  : "border-zinc-200 bg-white hover:border-sky-200"
              }`}
              aria-label={`Choose icon ${icon}`}
              aria-pressed={avatarIcon === icon}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="status">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save identity"}
      </button>
    </form>
  );
}
