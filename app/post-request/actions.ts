"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyRequestWentLive } from "@/lib/notifications/send";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/post-request");
  }

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (!title || !location) {
    return { error: "Please fill in the task and location." };
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return {
      error: "Select a location from the address suggestions."
    };
  }

  try {
    const { data, error } = await supabase
      .from("requests")
      .insert({
        title,
        location,
        latitude,
        longitude,
        budget: 0,
        details: "Posted via Peek",
        status: "open",
        user_id: user.id
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Could not save request." };
    }

    await supabase.functions.invoke("notify-nearby-runners", {
      body: {
        request_id: data.id,
        title,
        budget: 0,
        latitude,
        longitude
      }
    });
    await notifyRequestWentLive(data.id);

    return {
      ok: true as const,
      requestId: data.id as string
    };
  } catch {
    return {
      error:
        "Could not save the request. Check your Supabase connection and schema."
    };
  }
}
