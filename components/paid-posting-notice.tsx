import {
  paidPostingHeadline,
  paidPostingRequiredMessage,
  type FreePostingInfo
} from "@/lib/free-requests";
import { FREE_POSTED_REQUESTS } from "@/lib/constants";

type PaidPostingNoticeProps = {
  info: FreePostingInfo;
};

export function PaidPostingNotice({ info }: PaidPostingNoticeProps) {
  if (info.freeRemaining > 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-relaxed text-sky-900">
      <p className="font-semibold">{paidPostingHeadline()}</p>
      <p className="mt-2">{paidPostingRequiredMessage()}</p>
      <p className="mt-3 text-xs font-medium text-sky-800">
        {FREE_POSTED_REQUESTS} of {FREE_POSTED_REQUESTS} free starter requests
        used
      </p>
    </div>
  );
}
