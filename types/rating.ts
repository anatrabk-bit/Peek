export type RequestRating = {
  id: string;
  request_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  created_at: string;
};

export type UserRatingSummary = {
  averageScore: number | null;
  ratingCount: number;
};

export type RequestRatings = {
  fromRequester: RequestRating | null;
  fromPeek: RequestRating | null;
};

export type PublicUserReview = {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  requestTitle: string;
};
