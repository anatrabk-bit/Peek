import { FREE_POSTED_REQUESTS } from "@/lib/constants";
import {
  type FreePostingInfo,
  freePromoBadgeLabel,
  freePromoBannerMessage,
  freePromoHeadline
} from "@/lib/free-requests";

type FreeRequestPromoBannerProps = {
  info: FreePostingInfo;
};

export function FreeRequestPromoBanner({ info }: FreeRequestPromoBannerProps) {
  const message = freePromoBannerMessage(info);
  if (!message) {
    return null;
  }

  const slotsUsed = info.postedCount;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm">
      <div className="border-b border-emerald-200/80 bg-emerald-500 px-5 py-2 text-center text-xs font-bold uppercase tracking-widest text-white">
        Starter perk — {FREE_POSTED_REQUESTS} free requests
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
            <span className="text-2xl font-bold leading-none">
              {info.freeRemaining}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
              left
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              {freePromoBadgeLabel(info)}
            </p>
            <h2 className="mt-1 text-xl font-bold text-emerald-950 sm:text-2xl">
              {freePromoHeadline(info)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">
              {message}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-emerald-800">
            <span>Free starter requests</span>
            <span>
              {slotsUsed} used · {info.freeRemaining} remaining
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: FREE_POSTED_REQUESTS }, (_, index) => {
              const slotNumber = index + 1;
              const isUsed = slotNumber <= slotsUsed;
              const isNext = slotNumber === info.nextPostNumber;

              return (
                <div
                  key={slotNumber}
                  className={`flex h-3 flex-1 rounded-full ${
                    isUsed
                      ? "bg-emerald-400"
                      : isNext
                        ? "bg-emerald-500 ring-2 ring-emerald-300 ring-offset-1"
                        : "bg-emerald-200"
                  }`}
                  aria-hidden
                />
              );
            })}
          </div>
          <p className="text-xs text-emerald-800">
            Request {info.nextPostNumber} of {FREE_POSTED_REQUESTS} is free.
            Request {FREE_POSTED_REQUESTS + 1} and beyond require payment.
          </p>
        </div>
      </div>
    </div>
  );
}
