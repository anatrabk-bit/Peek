import type { PeekPayoutDetails } from "@/types/payout";

export type RunnerProfile = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  notifications_enabled: boolean;
  updated_at: string;
} & PeekPayoutDetails;

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};
