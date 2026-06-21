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
        title: "A Peek wants your job",
        body: `Someone applied for "${safeTitle}". Review their profile and approve or decline.`,
        url: `/requests/${requestId}`
      };
    case "peek_approved":
      return {
        title: "You're approved!",
        body: `The client approved you for "${safeTitle}". You can start the job now.`,
        url: `/requests/${requestId}/claimed`
      };
    case "peek_declined":
      return {
        title: "Application declined",
        body: `The client declined your application for "${safeTitle}". Browse more jobs nearby.`,
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
        body: `"${safeTitle}" is open. Apply if you're nearby.`,
        url: `/requests/${requestId}`
      };
  }
}
