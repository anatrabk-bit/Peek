export type NotificationEvent =
  | "request_live"
  | "peek_applied"
  | "peek_approved"
  | "peek_declined"
  | "answer_ready"
  | "new_request_nearby";

export type UserNotification = {
  id: string;
  user_id: string;
  request_id: string | null;
  event: NotificationEvent;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
};
