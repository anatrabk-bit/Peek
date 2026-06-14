import type { RequestStatus } from "@/types/request";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: "Waiting for a Peek",
  pending_approval: "Peek awaiting approval",
  claimed: "Peek on it",
  completed: "Answer ready"
};

export const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  open: "bg-sky-100 text-sky-700",
  pending_approval: "bg-violet-100 text-violet-800",
  claimed: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800"
};

export function isRequestActive(status: RequestStatus): boolean {
  return (
    status === "open" ||
    status === "pending_approval" ||
    status === "claimed"
  );
}

export function peekCanSubmitResponse(status: RequestStatus): boolean {
  return status === "claimed";
}
