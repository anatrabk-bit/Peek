export type RequestStatus = "open" | "claimed" | "completed";

export type MarketplaceRequest = {
  id: string;
  title: string;
  location: string;
  budget: number;
  details: string;
  status: RequestStatus;
  runner_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type RequestResponse = {
  id: string;
  request_id: string;
  runner_id: string;
  answer: string;
  photo_url: string | null;
  created_at: string;
};
