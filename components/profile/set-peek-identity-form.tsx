"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updatePeekIdentityAction } from "@/app/profile/peek-identity-actions";
import {
  avatarIconForForm,
  PEEK_AVATAR_OPTIONS
} from "@/lib/avatar-icons";
import { NICKNAME_MAX_LENGTH } from "@/lib/nickname-suggestions";
import type { PeekProfile } from "@/lib/supabase/peek-profile";

type SetPeekIdentityFormProps = {
  profile: PeekProfile;
  nicknameSuggestions: string[];
  setupMode?: boolean;
};

export function SetPeekIdentityForm({
  profile,
  nicknameSuggestions,
  setupMode = false
}: SetPeekIdentityFormProps) {
  const router = useRouter();
  const initialNickname = useMemo(
    () => profile.nickname ?? "",
    [profile.nickname]
  );
  const initialAvatar = useMemo(
    () => avatarIconForForm(profile.avatar_icon),
    [profile.avatar_icon]
  );
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarIcon, setAvatarIcon] = useState(initialAvatar);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSave =
    nickname.trim().length >= 2 && avatarIcon.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!canSave) {
      setError("Pick a nickname and an icon to continue.");
      return;
    }

    startTransition(async () => {
      const result = await updatePeekIdentityAction({ nickname, avatarIcon });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        setupMode
          ? "You're all set — welcome to Peek!"
          : "Saved — this is how others see you on Peek."
      );
      if (setupMode) {
        router.replace("/profile");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-static space-y-5">
      <div>
        <h3 className="heading-section text-lg">
          {setupMode ? "Pick your Peek identity" : "Your anonymous identity"}
        </h3>
        <p className="mt-2 text-sm text-peek-muted">
          {setupMode
            ? "Choose a fun nickname and icon — nothing is picked for you until you tap."
            : "Others only see your nickname and icon — never your real name or email."}{" "}
          Use spaces, not hyphens (e.g. Day Maker).
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
          maxLength={NICKNAME_MAX_LENGTH}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          disabled={isPending}
          className="input-field"
          placeholder="Tap a suggestion or type your own"
        />
        <p className="text-xs text-peek-muted">Suggestions — tap one you like:</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {nicknameSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setNickname(suggestion)}
              disabled={isPending}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                nickname === suggestion
                  ? "border-peek-primary bg-sky-50 text-peek-primary"
                  : "border-zinc-200 bg-white text-peek-text hover:border-sky-200"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-peek-text">Profile icon</p>
        <p className="text-xs text-peek-muted">
          {avatarIcon ? "Selected — tap another to change." : "Pick one:"}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {PEEK_AVATAR_OPTIONS.map(({ emoji, ring }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatarIcon(emoji)}
              disabled={isPending}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl shadow-sm transition ${ring} ${
                avatarIcon === emoji
                  ? "border-peek-primary ring-2 ring-sky-200 scale-105"
                  : "border-transparent hover:border-sky-200 hover:scale-105"
              }`}
              aria-label={`Choose icon ${emoji}`}
              aria-pressed={avatarIcon === emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="peek-callout-success text-sm" role="status">
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
        disabled={isPending || !canSave}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Saving…"
          : setupMode
            ? "Save and continue"
            : "Save identity"}
      </button>
    </form>
  );
}
