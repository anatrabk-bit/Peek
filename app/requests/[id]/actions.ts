"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyRequestWentLive, sendUserNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureClientPaymentOnAnswer } from "@/lib/payments/capture-client-payment";
import { getPaymentForRequest } from "@/lib/supabase/payments";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(requestId: string) {
  redirect(`/login?next=${encodeURIComponent(`/requests/${requestId}`)}`);
}

function isRlsError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("row-level security") === true
  );
}

const MIGRATION_014_HINT =
  "Run supabase/migrations/014_peek_approval.sql in Supabase → SQL Editor, then try again.";

async function tryAdminClaimFallback(
  requestId: string,
  userId: string
) {
  try {
    const admin = createAdminClient();
    return await tryClaimUpdate(admin, requestId, userId);
  } catch {
    return { data: null, error: null };
  }
}

async function tryClaimUpdate(
  supabase: ReturnType<typeof createClient>,
  requestId: string,
  userId: string
) {
  return supabase
    .from("requests")
    .update({
      status: "pending_approval",
      runner_id: userId,
      claimed_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();
}

export async function claimRequest(requestId: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, needsAuth: true as const };
  }

  const { data: existing } = await supabase
    .from("requests")
    .select("user_id, status, runner_id")
    .eq("id", requestId)
    .maybeSingle();

  if (existing?.user_id === user.id) {
    return {
      ok: false as const,
      error: "You can't claim your own request — ask another Peek to help."
    };
  }

  if (
    (existing?.status === "pending_approval" ||
      existing?.status === "claimed") &&
    existing.runner_id === user.id
  ) {
    redirect(`/requests/${requestId}/claimed`);
  }

  let { data, error } = await tryClaimUpdate(supabase, requestId, user.id);

  if ((!data || isRlsError(error)) && process.env.NODE_ENV === "development") {
    const adminResult = await tryAdminClaimFallback(requestId, user.id);
    if (adminResult.data) {
      data = adminResult.data;
      error = null;
    } else if (!data) {
      data = adminResult.data;
      error = adminResult.error ?? error;
    }
  }

  if (error) {
    console.error("[Peek] claimRequest:", error.message);
    if (isRlsError(error)) {
      return {
        ok: false as const,
        error: MIGRATION_014_HINT
      };
    }
    return {
      ok: false as const,
      error: "Something went wrong. Please try again."
    };
  }

  if (!data) {
    return {
      ok: false as const,
      error: `Could not apply for this job — it may already be taken. ${MIGRATION_014_HINT}`
    };
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/claimed`);
  revalidatePath("/requests");
  revalidatePath("/", "layout");

  const { data: peekRequest } = await supabase
    .from("requests")
    .select("user_id, title")
    .eq("id", requestId)
    .single();

  if (peekRequest?.user_id) {
    await sendUserNotification({
      userId: peekRequest.user_id,
      event: "peek_applied",
      requestId,
      requestTitle: peekRequest.title ?? "Your request",
      skipInApp: true
    });
  }

  redirect(`/requests/${requestId}/claimed`);
}

async function assertRequestOwner(requestId: string, userId: string) {
  const supabase = createClient();
  const { data: request, error } = await supabase
    .from("requests")
    .select("user_id, status, runner_id")
    .eq("id", requestId)
    .single();

  if (error || !request) {
    return { ok: false as const, error: "Request not found.", request: null };
  }

  if (request.user_id !== userId) {
    return { ok: false as const, error: "Only the requester can do this.", request: null };
  }

  return { ok: true as const, request, error: null };
}

export async function approvePeekForRequest(requestId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Log in to approve this Peek." };
  }

  const ownerCheck = await assertRequestOwner(requestId, user.id);
  if (!ownerCheck.ok) {
    return { ok: false as const, error: ownerCheck.error };
  }

  if (ownerCheck.request!.status !== "pending_approval") {
    return { ok: false as const, error: "This Peek is no longer waiting for approval." };
  }

  let { data, error } = await supabase
    .from("requests")
    .update({ status: "claimed" })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending_approval")
    .select("id")
    .maybeSingle();

  if (!data && !error && process.env.NODE_ENV === "development") {
    try {
      const admin = createAdminClient();
      const adminResult = await admin
        .from("requests")
        .update({ status: "claimed" })
        .eq("id", requestId)
        .eq("user_id", user.id)
        .eq("status", "pending_approval")
        .select("id")
        .maybeSingle();
      data = adminResult.data;
      error = adminResult.error;
    } catch {
      // fall through
    }
  }

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!data) {
    return {
      ok: false as const,
      error: "Could not approve this Peek. Try refreshing the page."
    };
  }

  const runnerId = ownerCheck.request!.runner_id;
  const { data: peekRequest } = await supabase
    .from("requests")
    .select("title")
    .eq("id", requestId)
    .single();

  if (runnerId) {
    await sendUserNotification({
      userId: runnerId,
      event: "peek_approved",
      requestId,
      requestTitle: peekRequest?.title ?? "This job"
    });
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/claimed`);
  revalidatePath("/my-requests");
  revalidatePath("/", "layout");

  return { ok: true as const };
}

export async function declinePeekForRequest(requestId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Log in to decline this Peek." };
  }

  const ownerCheck = await assertRequestOwner(requestId, user.id);
  if (!ownerCheck.ok) {
    return { ok: false as const, error: ownerCheck.error };
  }

  if (ownerCheck.request!.status !== "pending_approval") {
    return { ok: false as const, error: "This Peek is no longer waiting for approval." };
  }

  const runnerId = ownerCheck.request!.runner_id;
  const { data: peekRequest } = await supabase
    .from("requests")
    .select("title")
    .eq("id", requestId)
    .single();

  let { data, error } = await supabase
    .from("requests")
    .update({
      status: "open",
      runner_id: null,
      claimed_at: null
    })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending_approval")
    .select("id")
    .maybeSingle();

  if (!data && !error && process.env.NODE_ENV === "development") {
    try {
      const admin = createAdminClient();
      const adminResult = await admin
        .from("requests")
        .update({
          status: "open",
          runner_id: null,
          claimed_at: null
        })
        .eq("id", requestId)
        .eq("user_id", user.id)
        .eq("status", "pending_approval")
        .select("id")
        .maybeSingle();
      data = adminResult.data;
      error = adminResult.error;
    } catch {
      // fall through
    }
  }

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!data) {
    return {
      ok: false as const,
      error: "Could not decline this Peek. Try refreshing the page."
    };
  }

  if (runnerId) {
    await sendUserNotification({
      userId: runnerId,
      event: "peek_declined",
      requestId,
      requestTitle: peekRequest?.title ?? "This job"
    });
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/my-requests");
  revalidatePath("/", "layout");

  return { ok: true as const };
}

export async function submitResponse(requestId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    loginRedirect(requestId);
  }

  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) {
    return { ok: false as const, error: "Please write your answer before submitting." };
  }

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("runner_id, status, user_id, title")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { ok: false as const, error: "Request not found." };
  }

  if (request.runner_id !== user!.id || request.status !== "claimed") {
    return {
      ok: false as const,
      error: "You can only submit a response for a request you have claimed."
    };
  }

  const photoFile = formData.get("photo");
  let photo_url: string | null = null;

  if (photoFile instanceof File && photoFile.size > 0) {
    const extension = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${user!.id}/${requestId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("response-photos")
      .upload(path, photoFile, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      return {
        ok: false as const,
        error: `Photo upload failed: ${uploadError.message}`
      };
    }

    const { data: publicUrl } = supabase.storage
      .from("response-photos")
      .getPublicUrl(path);

    photo_url = publicUrl.publicUrl;
  }

  const { error: responseError } = await supabase.from("responses").insert({
    request_id: requestId,
    runner_id: user!.id,
    answer,
    photo_url
  });

  if (responseError) {
    return { ok: false as const, error: responseError.message };
  }

  const payment = await getPaymentForRequest(requestId);

  if (payment) {
    const captureResult = await captureClientPaymentOnAnswer(requestId, payment);
    if (!captureResult.ok) {
      return {
        ok: false as const,
        error:
          "Answer saved but payment could not be collected. Please try again or contact support."
      };
    }
  }

  const { error: completeError } = await supabase
    .from("requests")
    .update({ status: "completed" })
    .eq("id", requestId)
    .eq("runner_id", user!.id);

  if (completeError) {
    return { ok: false as const, error: completeError.message };
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/my-requests");
  revalidatePath("/profile");
  revalidatePath("/", "layout");

  if (request.user_id) {
    await sendUserNotification({
      userId: request.user_id,
      event: "answer_ready",
      requestId,
      requestTitle: request.title ?? "Your request"
    });
  }

  return { ok: true as const };
}

export async function submitRating(requestId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Log in to leave a rating." };
  }

  const score = Number(formData.get("score"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { ok: false as const, error: "Please choose a rating from 1 to 5 stars." };
  }

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("user_id, runner_id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { ok: false as const, error: "Request not found." };
  }

  if (request.status !== "completed" || !request.runner_id || !request.user_id) {
    return { ok: false as const, error: "You can rate after the request is completed." };
  }

  let ratedId: string | null = null;

  if (user.id === request.user_id) {
    ratedId = request.runner_id;
  } else if (user.id === request.runner_id) {
    ratedId = request.user_id;
  } else {
    return { ok: false as const, error: "You were not part of this request." };
  }

  const payload = {
    request_id: requestId,
    rater_id: user.id,
    rated_id: ratedId,
    score,
    comment: comment || null
  };

  let { data, error } = await supabase
    .from("ratings")
    .insert(payload)
    .select("id, request_id, rater_id, rated_id, score, comment, created_at")
    .single();

  if (error?.code === "23505") {
    return { ok: false as const, error: "You already rated this request." };
  }

  if (error && process.env.NODE_ENV === "development") {
    try {
      const admin = createAdminClient();
      const adminResult = await admin
        .from("ratings")
        .insert(payload)
        .select("id, request_id, rater_id, rated_id, score, comment, created_at")
        .single();
      data = adminResult.data;
      error = adminResult.error;
    } catch {
      // fall through
    }
  }

  if (error || !data) {
    console.error("[Peek] submitRating:", error?.message);
    return {
      ok: false as const,
      error: error?.message ?? "Could not save rating. Run migration 009 in Supabase."
    };
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/my-requests");
  revalidatePath("/profile");
  revalidatePath("/requests");

  return { ok: true as const, rating: data };
}
