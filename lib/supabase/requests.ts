import { createClient } from "@/lib/supabase/server";
import type { MarketplaceRequest, RequestResponse } from "@/types/request";
import type { ScheduleMode, TaskType } from "@/types/task-schedule";

type DbRequest = {
  id: string;
  title: string;
  location: string;
  budget: number;
  details: string | null;
  status: "open" | "pending_approval" | "claimed" | "completed";
  user_id?: string | null;
  runner_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  task_type?: TaskType | null;
  schedule_mode?: ScheduleMode | null;
  scheduled_at?: string | null;
  claimed_at?: string | null;
  peek_check_in_at?: string | null;
};

export type OpenRequestsFetchResult = {
  requests: MarketplaceRequest[];
  error: string | null;
  queryUsed: string;
};

const REQUEST_SELECT =
  "id, title, location, budget, details, status, user_id, runner_id, latitude, longitude, created_at, task_type, schedule_mode, scheduled_at, claimed_at, peek_check_in_at";

const REQUEST_SELECT_WITHOUT_CHECKIN =
  "id, title, location, budget, details, status, user_id, runner_id, latitude, longitude, created_at, task_type, schedule_mode, scheduled_at, claimed_at";

const BASE_SELECT = "id, title, location, budget, details, status";

function isMissingColumnError(message: string): boolean {
  return message.includes("does not exist");
}

function mapRequest(request: DbRequest): MarketplaceRequest {
  const taskType = request.task_type ?? "untimed";

  return {
    id: request.id,
    title: request.title,
    location: request.location,
    budget: Number(request.budget),
    details: request.details ?? "No extra details - reach out if you need more context.",
    status: request.status,
    user_id: request.user_id ?? null,
    runner_id: request.runner_id ?? null,
    created_at: request.created_at,
    latitude: request.latitude ?? null,
    longitude: request.longitude ?? null,
    task_type: taskType,
    schedule_mode:
      taskType === "scheduled" ? (request.schedule_mode ?? "live") : null,
    scheduled_at:
      taskType === "scheduled" ? (request.scheduled_at ?? null) : null,
    claimed_at: request.claimed_at ?? null,
    peek_check_in_at: request.peek_check_in_at ?? null
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

  let queryUsed = REQUEST_SELECT;
  let data: DbRequest[] | null = null;
  let error: { message: string; code?: string; details?: string; hint?: string } | null =
    null;
  let count: number | null = null;

  const result = await supabase
    .from("requests")
    .select(REQUEST_SELECT, { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false });

  data = result.data as DbRequest[] | null;
  error = result.error;
  count = result.count;

  logFetchResult("getOpenRequests", { data, error, count }, queryUsed);

  if (error && isMissingColumnError(error.message)) {
    queryUsed = REQUEST_SELECT_WITHOUT_CHECKIN;
    const withoutCheckIn = await supabase
      .from("requests")
      .select(REQUEST_SELECT_WITHOUT_CHECKIN, { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false });

    data = withoutCheckIn.data as DbRequest[] | null;
    error = withoutCheckIn.error;
    count = withoutCheckIn.count;

    logFetchResult(
      "getOpenRequests (without peek_check_in_at)",
      { data, error, count },
      queryUsed
    );
  }

  if (error) {
    queryUsed = BASE_SELECT;
    const fallback = await supabase
      .from("requests")
      .select(BASE_SELECT, { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false });

    const fallbackData = fallback.data as DbRequest[] | null;
    data = fallbackData;
    error = fallback.error;
    count = fallback.count;

    logFetchResult(
      "getOpenRequests (fallback columns)",
      { data: fallbackData, error: fallback.error, count: fallback.count },
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
  let error: { message: string; code?: string } | null = null;

  const fullResult = await supabase
    .from("requests")
    .select(REQUEST_SELECT)
    .eq("id", id)
    .single();

  data = fullResult.data as DbRequest | null;
  error = fullResult.error;

  if (error && isMissingColumnError(error.message)) {
    const withoutCheckIn = await supabase
      .from("requests")
      .select(REQUEST_SELECT_WITHOUT_CHECKIN)
      .eq("id", id)
      .single();

    data = withoutCheckIn.data as DbRequest | null;
    error = withoutCheckIn.error;
  }

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
    console.error("[Peek] getRequestById failed:", {
      id,
      message: error?.message,
      hint:
        error?.message?.includes("single JSON") || error?.code === "PGRST116"
          ? "No row returned — check RLS read policy (run 006_fix_read_requests_rls.sql)"
          : undefined
    });
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

export async function getUserPostedRequestCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[Peek] getUserPostedRequestCount failed:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getMyRequests(
  userId: string
): Promise<{ requests: MarketplaceRequest[]; error: string | null }> {
  const supabase = createClient();

  let queryUsed = REQUEST_SELECT;
  let { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  let rows = data as DbRequest[] | null;

  if (error && isMissingColumnError(error.message)) {
    queryUsed = REQUEST_SELECT_WITHOUT_CHECKIN;
    const fallback = await supabase
      .from("requests")
      .select(REQUEST_SELECT_WITHOUT_CHECKIN)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    rows = fallback.data as DbRequest[] | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[Peek] getMyRequests failed:", error.message);
    return { requests: [], error: error.message };
  }

  console.log("[Peek] getMyRequests OK", { queryUsed, count: rows?.length ?? 0 });

  return {
    requests: (rows ?? []).map((row) => mapRequest(row)),
    error: null
  };
}
