import type { TaskScheduleFields, TaskType } from "@/types/task-schedule";

export type RequestStatus = "open" | "pending_approval" | "claimed" | "completed";

export type MarketplaceRequest = TaskScheduleFields & {
  id: string;
  title: string;
  location: string;
  budget: number;
  details: string;
  status: RequestStatus;
  user_id?: string | null;
  runner_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  claimed_at?: string | null;
  peek_check_in_at?: string | null;
};

export type RequestResponse = {
  id: string;
  request_id: string;
  runner_id: string;
  answer: string;
  photo_url: string | null;
  created_at: string;
};
