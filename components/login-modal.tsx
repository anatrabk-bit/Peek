"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LoginForm } from "@/components/login-form";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-md rounded-2xl border-0 bg-white p-8 shadow-card-hover backdrop:bg-zinc-900/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="heading-section text-xl">Welcome back</h2>
          <p className="mt-2 text-body">
            Your email, a quick link - that&apos;s it.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="rounded-full px-2 py-1 text-peek-muted transition hover:bg-peek-card hover:text-peek-text"
        >
          ✕
        </button>
      </div>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-5 text-center text-xs text-peek-muted">
        <Link href="/login" className="font-semibold text-peek-primary hover:underline">
          Use the full login page instead
        </Link>
      </p>
    </dialog>
  );
}
