import { createClient } from "@/lib/supabase/server";
import type { MarketplaceRequest, RequestResponse } from "@/types/request";

type DbRequest = {
  id: string;
  title: string;
  location: string;
  budget: number;
  details: string | null;
  status: "open" | "claimed" | "completed";
  runner_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type OpenRequestsFetchResult = {
  requests: MarketplaceRequest[];
  error: string | null;
  queryUsed: string;
};

const FULL_SELECT =
  "id, title, location, budget, details, status, runner_id, latitude, longitude";

const BASE_SELECT = "id, title, location, budget, details, status";

function mapRequest(request: DbRequest): MarketplaceRequest {
  return {
    id: request.id,
    title: request.title,
    location: request.location,
    budget: Number(request.budget),
    details: request.details ?? "No extra details - reach out if you need more context.",
    status: request.status,
    runner_id: request.runner_id ?? null,
    latitude: request.latitude ?? null,
    longitude: request.longitude ?? null
  };
}

function logFetchResult(
  label: string,
  result: {
    data: DbRequest[] | null;
    error: { message: string; code?: string; details?: string; hint?: string } | null;
    count: number | null;
  },
  select: string
) {
  if (result.error) {
    console.error(`[Peek] ${label} FAILED`, {
      select,
      message: result.error.message,
      code: result.error.code,
      details: result.error.details,
      hint: result.error.hint
    });
    return;
  }

  console.log(`[Peek] ${label} OK`, {
    select,
    rowCount: result.data?.length ?? 0,
    count: result.count,
    rows: result.data
  });
}

export async function getOpenRequests(): Promise<OpenRequestsFetchResult> {
  const supabase = createClient();

  console.log("[Peek] getOpenRequests: fetching status=open (no radius/location filter)");

  let queryUsed = FULL_SELECT;
  let data: DbRequest[] | null = null;
  let error: { message: string; code?: string; details?: string; hint?: string } | null =
    null;
  let count: number | null = null;

  const fullResult = await supabase
    .from("requests")
    .select(FULL_SELECT, { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false });

  data = fullResult.data as DbRequest[] | null;
  error = fullResult.error;
  count = fullResult.count;

  logFetchResult("getOpenRequests (full columns)", { data, error, count }, queryUsed);

  if (error) {
    queryUsed = BASE_SELECT;
    const fallback = await supabase
      .from("requests")
      .select(BASE_SELECT, { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false });

    data = fallback.data as DbRequest[] | null;
    error = fallback.error;
    count = fallback.count;

    logFetchResult(
      "getOpenRequests (fallback columns)",
      { data, error, count },
      queryUsed
    );
  }

  if (error) {
    return {
      requests: [],
      error: error.message,
      queryUsed
    };
  }

  const requests = (data ?? []).map(mapRequest);

  console.log("[Peek] getOpenRequests: mapped requests for browse", {
    count: requests.length,
    withCoordinates: requests.filter(
      (r) => r.latitude != null && r.longitude != null
    ).length
  });

  return {
    requests,
    error: null,
    queryUsed
  };
}

export async function getRequestById(
  id: string
): Promise<MarketplaceRequest | null> {
  const supabase = createClient();

  let data: DbRequest | null = null;
  let error: { message: string } | null = null;

  const fullResult = await supabase
    .from("requests")
    .select(FULL_SELECT)
    .eq("id", id)
    .single();

  data = fullResult.data as DbRequest | null;
  error = fullResult.error;

  if (error) {
    const fallback = await supabase
      .from("requests")
      .select(BASE_SELECT)
      .eq("id", id)
      .single();

    data = fallback.data as DbRequest | null;
    error = fallback.error;
  }

  if (error || !data) {
    console.error("[Peek] getRequestById failed:", id, error?.message);
    return null;
  }

  return mapRequest(data as DbRequest);
}

export async function getResponseForRequest(
  requestId: string
): Promise<RequestResponse | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("responses")
    .select("id, request_id, runner_id, answer, photo_url, created_at")
    .eq("request_id", requestId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as RequestResponse;
}
