import type { NotificationEvent } from "@/types/notification";

type NotificationContent = {
  title: string;
  body: string;
  url: string;
};

export function buildNotificationContent(
  event: NotificationEvent,
  requestTitle: string,
  requestId: string,
  extras?: { scheduleLabel?: string }
): NotificationContent {
  const safeTitle = requestTitle.trim() || "your request";
  const when = extras?.scheduleLabel?.trim();

  switch (event) {
    case "request_live":
      return {
        title: "Your request is live",
        body: `"${safeTitle}" is now visible to Peeks nearby.`,
        url: "/my-requests"
      };
    case "peek_applied":
      return {
        title: "A Peek is on it",
        body: `Someone grabbed "${safeTitle}" and is checking now.`,
        url: `/requests/${requestId}`
      };
    case "peek_booked":
      return {
        title: "A Peek is booked",
        body: when
          ? `Someone booked "${safeTitle}" for ${when}.`
          : `Someone booked "${safeTitle}" for later.`,
        url: `/requests/${requestId}`
      };
    case "peek_approved":
      return {
        title: "You're on the task",
        body: `"${safeTitle}" is yours. Head there and submit your answer.`,
        url: `/requests/${requestId}`
      };
    case "peek_declined":
      return {
        title: "Task reopened",
        body: `"${safeTitle}" is open again. Browse more jobs nearby.`,
        url: "/requests"
      };
    case "answer_ready":
      return {
        title: "Your answer is ready",
        body: `A Peek finished "${safeTitle}". View the answer now.`,
        url: `/requests/${requestId}`
      };
    case "new_request_nearby":
      return {
        title: "New job nearby",
        body: `"${safeTitle}" is open. Tap I'm on it if you're nearby.`,
        url: `/requests/${requestId}`
      };
    case "claim_reserved":
      return {
        title: "You're booked",
        body: when
          ? `"${safeTitle}" is yours. We'll remind you when it's time to go (${when}).`
          : `"${safeTitle}" is yours. We'll remind you when it's time to go.`,
        url: `/requests/${requestId}`
      };
    case "claim_window_open":
      return {
        title: "Time to go",
        body: `"${safeTitle}" is ready. Head there when you can and submit your answer.`,
        url: `/requests/${requestId}`
      };
    case "task_reminder":
      return {
        title: "Task opens soon",
        body: when
          ? `"${safeTitle}" opens ${when.toLowerCase()}. Tap I'm on it if you're nearby.`
          : `"${safeTitle}" opens in about 15 minutes. Tap I'm on it if you're nearby.`,
        url: `/requests/${requestId}`
      };
  }
}
