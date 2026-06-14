import { FREE_POSTED_REQUESTS } from "@/lib/constants";

export type FreePostingInfo = {
  postedCount: number;
  freeRemaining: number;
  nextPostIsFree: boolean;
  nextPostNumber: number;
};

export function getFreePostingInfo(postedCount: number): FreePostingInfo {
  const freeRemaining = Math.max(0, FREE_POSTED_REQUESTS - postedCount);
  return {
    postedCount,
    freeRemaining,
    nextPostIsFree: freeRemaining > 0,
    nextPostNumber: postedCount + 1
  };
}

export function freePromoBannerMessage(info: FreePostingInfo): string | null {
  if (info.freeRemaining === 0) {
    return null;
  }

  if (info.freeRemaining === FREE_POSTED_REQUESTS) {
    return "New to Peek? Your first 2 posted requests are completely free — no payment, no card, and no Apple Pay. After that, every new request requires payment before it goes live.";
  }

  if (info.freeRemaining === 1) {
    return "This is your last free starter request — still no payment needed. Once you post a 3rd request, you'll pay by card or Apple Pay before it goes live.";
  }

  return null;
}

export function freePromoHeadline(info: FreePostingInfo): string {
  if (info.nextPostNumber === 1) {
    return "Your first 2 requests are on us";
  }

  return "One free request left";
}

export function freePromoBadgeLabel(info: FreePostingInfo): string {
  return `${info.freeRemaining} of ${FREE_POSTED_REQUESTS} free`;
}

export function freeSubmitButtonLabel(info: FreePostingInfo): string {
  return `Post request ${info.nextPostNumber} of ${FREE_POSTED_REQUESTS} — Free`;
}

export function freeBudgetHint(): string {
  return " This one is part of your 2 free starter requests — no card or Apple Pay needed.";
}

export function paidPostingRequiredMessage(): string {
  return "You've used both free starter requests (2 of 2). From now on, each new request requires payment by card or Apple Pay before it goes live.";
}

export function paidPostingHeadline(): string {
  return "Free starter requests used up";
}

export function paidSubmitButtonLabel(
  cardCheckoutEnabled: boolean
): string {
  return cardCheckoutEnabled ? "Post & pay" : "Post it";
}
