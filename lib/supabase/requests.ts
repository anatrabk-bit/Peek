import { createClient } from "@/lib/supabase/server";
import type { PaymentRecord } from "@/types/payment";
import { PAYMENT_LIVE_STATUSES } from "@/types/payment";
import type { MarketplaceRequest, RequestResponse } from "@/types/request";

type DbPaymentEmbed = {
  id: string;
  request_id: string;
  amount: number;
  currency: string;
  payment_provider: PaymentRecord["payment_provider"];
  provider_transaction_id: string | null;
  status: PaymentRecord["status"];
};

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
  payments?: DbPaymentEmbed | DbPaymentEmbed[] | null;
};

export type OpenRequestsFetchResult = {
  requests: MarketplaceRequest[];
  error: string | null;
  queryUsed: string;
};

const FULL_SELECT =
  "id, title, location, budget, details, status, user_id, runner_id, latitude, longitude, created_at";

const PAYMENT_EMBED =
  "payments (id, request_id, amount, currency, payment_provider, provider_transaction_id, status)";

const BASE_SELECT = "id, title, location, budget, details, status";

function mapPaymentEmbed(
  embed: DbPaymentEmbed | DbPaymentEmbed[] | null | undefined
): PaymentRecord | null {
  if (!embed) return null;
  const row = Array.isArray(embed) ? embed[0] : embed;
  if (!row) return null;

  return {
    id: row.id,
    request_id: row.request_id,
    amount: Number(row.amount),
    currency: row.currency,
    payment_provider: row.payment_provider,
    provider_transaction_id: row.provider_transaction_id,
    status: row.status
  };
}

function mapRequest(request: DbRequest): MarketplaceRequest {
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
    payment: mapPaymentEmbed(request.payments)
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

  let queryUsed = `${FULL_SELECT}, ${PAYMENT_EMBED}`;
  let data: DbRequest[] | null = null;
  let error: { message: string; code?: string; details?: string; hint?: string } | null =
    null;
  let count: number | null = null;

  let fullResult = await supabase
    .from("requests")
    .select(`${FULL_SELECT}, ${PAYMENT_EMBED}`, { count: "exact" })
    .eq("status", "open")
    .in("payments.status", PAYMENT_LIVE_STATUSES)
    .order("created_at", { ascending: false });

  if (fullResult.error?.message?.includes("payments")) {
    const fallback = await supabase
      .from("requests")
      .select(FULL_SELECT, { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false });
    queryUsed = FULL_SELECT;
    data = fallback.data as DbRequest[] | null;
    error = fallback.error;
    count = fallback.count;
  } else {
    data = fullResult.data as DbRequest[] | null;
    error = fullResult.error;
    count = fullResult.count;
  }

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
  let error: { message: string; code?: string } | null = null;

  const fullResult = await supabase
    .from("requests")
    .select(`${FULL_SELECT}, ${PAYMENT_EMBED}`)
    .eq("id", id)
    .single();

  data = fullResult.data as DbRequest | null;
  error = fullResult.error;

  if (error?.message?.includes("payments")) {
    const fallback = await supabase
      .from("requests")
      .select(BASE_SELECT)
      .eq("id", id)
      .single();

    data = fallback.data as DbRequest | null;
    error = fallback.error;
  } else if (error) {
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

  let { data, error } = await supabase
    .from("requests")
    .select(`${FULL_SELECT}, ${PAYMENT_EMBED}`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error?.message?.includes("payments")) {
    const fallback = await supabase
      .from("requests")
      .select(FULL_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) {
    console.error("[Peek] getMyRequests failed:", error.message);
    return { requests: [], error: error.message };
  }

  return {
    requests: (data ?? []).map((row) => mapRequest(row as DbRequest)),
    error: null
  };
}
