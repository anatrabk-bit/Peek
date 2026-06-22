"use client";

import { getSiteUrl } from "@/lib/site-url";

type SharePeekButtonProps = {
  title?: string;
  text?: string;
  path?: string;
  className?: string;
  label?: string;
};

function resolveShareUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }
  return `${getSiteUrl()}${normalized}`;
}

export function SharePeekButton({
  title = "Peek",
  text = "Quick checks from people nearby - free to post.",
  path = "/",
  className = "btn-secondary text-sm",
  label = "Share Peek"
}: SharePeekButtonProps) {
  async function handleShare() {
    const url = resolveShareUrl(path);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      window.alert("Link copied!");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button type="button" onClick={handleShare} className={className}>
      {label}
    </button>
  );
}
