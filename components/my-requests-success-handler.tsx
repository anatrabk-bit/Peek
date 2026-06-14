"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PaymentSuccessModal } from "@/components/payment-success-modal";

type MyRequestsSuccessHandlerProps = {
  showPaid: boolean;
  showFreePromo: boolean;
};

export function MyRequestsSuccessHandler({
  showPaid,
  showFreePromo
}: MyRequestsSuccessHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(showPaid || showFreePromo);
  const variant = showFreePromo ? "free" : "paid";

  function handleClose() {
    setOpen(false);
    router.replace(pathname, { scroll: false });
  }

  if (!showPaid && !showFreePromo) {
    return null;
  }

  return (
    <PaymentSuccessModal open={open} onClose={handleClose} variant={variant} />
  );
}
