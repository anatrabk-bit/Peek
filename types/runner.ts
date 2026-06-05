export type RunnerProfile = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  notifications_enabled: boolean;
  updated_at: string;
};

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};
