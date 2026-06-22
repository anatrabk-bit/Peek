import type { NotificationEvent } from "@/types/notification";

type NotificationContent = {
  title: string;
  body: string;
  url: string;
};

export function buildNotificationContent(
  event: NotificationEvent,
  requestTitle: string,
  requestId: string
): NotificationContent {
  const safeTitle = requestTitle.trim() || "your request";

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
  }
}
