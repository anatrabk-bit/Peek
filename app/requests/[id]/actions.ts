"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(requestId: string) {
  redirect(`/login?next=${encodeURIComponent(`/requests/${requestId}`)}`);
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

  const { data, error } = await supabase
    .from("requests")
    .update({
      status: "claimed",
      runner_id: user.id,
      claimed_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[Peek] claimRequest:", error.message);
    return {
      ok: false as const,
      error: "Something went wrong. Please try again."
    };
  }

  if (!data) {
    return {
      ok: false as const,
      error: "Something went wrong. Please try again."
    };
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/claimed`);
  revalidatePath("/requests");

  redirect(`/requests/${requestId}/claimed`);
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
    .select("runner_id, status")
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

  return { ok: true as const };
}
