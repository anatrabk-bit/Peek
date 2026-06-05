"use client";

import { useState } from "react";
import { LoginModal } from "@/components/login-modal";

type LoginButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export function LoginButton({ className, children }: LoginButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
