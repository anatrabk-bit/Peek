"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "peek-install-prompt-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    if (!isMobile()) return;

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="peek-install-prompt fixed inset-x-4 bottom-20 z-[90] mx-auto max-w-lg rounded-2xl border border-sky-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          className="h-12 w-12 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-peek-text">Install Peek on your phone</p>
          {iosHint ? (
            <p className="mt-1 text-sm leading-relaxed text-peek-muted">
              Tap Share, then{" "}
              <span className="font-semibold text-peek-text">
                Add to Home Screen
              </span>{" "}
              — it works like an app, with notifications and quick access.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-peek-muted">
              Add Peek to your home screen for a full-screen app experience.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-sm font-medium text-peek-muted hover:text-peek-text"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!iosHint && installEvent && (
          <button type="button" onClick={handleInstall} className="btn-primary">
            Install app
          </button>
        )}
        <button type="button" onClick={dismiss} className="btn-secondary">
          Not now
        </button>
      </div>
    </div>
  );
}
