"use server";

import { redirect } from "next/navigation";
import { MIN_BUDGET_GBP, MIN_BUDGET_MESSAGE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const budget = Number(formData.get("budget") ?? 0);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (!title || !location) {
    return { error: "Please fill in the task and location." };
  }

  if (Number.isNaN(budget) || budget < MIN_BUDGET_GBP) {
    return { error: MIN_BUDGET_MESSAGE };
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return {
      error: "Select a location from the address suggestions."
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("requests")
      .insert({
        title,
        location,
        latitude,
        longitude,
        budget,
        details: "Posted via Peek",
        status: "open"
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
        budget,
        latitude,
        longitude
      }
    });
  } catch {
    return {
      error:
        "Could not save the request. Check your Supabase connection and schema."
    };
  }

  redirect("/requests");
}
