import { createAdminClient } from "@/lib/supabase/admin";
import { getFreePostingInfo } from "@/lib/free-requests";
import {
  resolveClientPaymentProvider,
  resolvePaidPaymentProvider,
  providerStartsPending
} from "@/lib/payments/resolve-provider";
import { getUserPostedRequestCount } from "@/lib/supabase/requests";
import { createClient } from "@/lib/supabase/server";
import type {
  PaymentProvider,
  PaymentRecord,
  PaymentStatus
} from "@/types/payment";
import { PAYMENT_LIVE_STATUSES } from "@/types/payment";

type DbPayment = {
  id: string;
  request_id: string;
  amount: number;
  currency: string;
  payment_provider: PaymentProvider;
  provider_transaction_id: string | null;
  status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
};

function mapPayment(row: DbPayment): PaymentRecord {
  return {
    id: row.id,
    request_id: row.request_id,
    amount: Number(row.amount),
    currency: row.currency,
    payment_provider: row.payment_provider,
    provider_transaction_id: row.provider_transaction_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function resolveInitialPaymentProvider(): PaymentProvider {
  return resolveClientPaymentProvider();
}

export function resolveInitialPaymentStatus(
  provider: PaymentProvider
): PaymentStatus {
  if (providerStartsPending(provider)) return "pending";
  return "completed";
}

export async function resolvePaymentForNewRequest(userId: string): Promise<{
  provider: PaymentProvider;
  status: PaymentStatus;
  isFreePromo: boolean;
  freePostingInfo: ReturnType<typeof getFreePostingInfo>;
}> {
  const postedCount = await getUserPostedRequestCount(userId);
  const freePostingInfo = getFreePostingInfo(postedCount);

  if (freePostingInfo.nextPostIsFree) {
    return {
      provider: "dev",
      status: "completed",
      isFreePromo: true,
      freePostingInfo
    };
  }

  const provider = resolvePaidPaymentProvider();

  return {
    provider,
    status: resolveInitialPaymentStatus(provider),
    isFreePromo: false,
    freePostingInfo
  };
}

export async function createPaymentForRequest(input: {
  requestId: string;
  amount: number;
  currency?: string;
  provider?: PaymentProvider;
  status?: PaymentStatus;
}) {
  const supabase = createClient();
  const provider = input.provider ?? resolveInitialPaymentProvider();
  const status = input.status ?? resolveInitialPaymentStatus(provider);

  const payload = {
    request_id: input.requestId,
    amount: input.amount,
    currency: input.currency ?? "GBP",
    payment_provider: provider,
    status
  };

  const { data, error } = await supabase
    .from("payments")
    .insert(payload)
    .select(
      "id, request_id, amount, currency, payment_provider, provider_transaction_id, status, created_at, updated_at"
    )
    .single();

  if (error) {
    return { payment: null, error: error.message };
  }

  return { payment: mapPayment(data as DbPayment), error: null };
}

export async function getPaymentForRequest(
  requestId: string
): Promise<PaymentRecord | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, request_id, amount, currency, payment_provider, provider_transaction_id, status, created_at, updated_at"
    )
    .eq("request_id", requestId)
    .maybeSingle();

  if (error || !data) return null;
  return mapPayment(data as DbPayment);
}

export async function updatePayment(
  requestId: string,
  patch: Partial<{
    status: PaymentStatus;
    provider_transaction_id: string | null;
    payment_provider: PaymentProvider;
  }>,
  options?: { useAdmin?: boolean }
) {
  const supabase = options?.useAdmin ? createAdminClient() : createClient();

  const { data, error } = await supabase
    .from("payments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .select(
      "id, request_id, amount, currency, payment_provider, provider_transaction_id, status, created_at, updated_at"
    )
    .maybeSingle();

  if (error || !data) {
    return { payment: null, error: error?.message ?? "Payment not found." };
  }

  return { payment: mapPayment(data as DbPayment), error: null };
}

export function isPaymentLive(status: PaymentStatus | undefined): boolean {
  if (!status) return true;
  return PAYMENT_LIVE_STATUSES.includes(status);
}

export async function getLivePaymentRequestIds(): Promise<string[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("request_id")
    .in("status", PAYMENT_LIVE_STATUSES);

  if (error) {
    if (error.message.includes("payments")) return null;
    return [];
  }

  return (data ?? []).map((row) => row.request_id as string);
}
