import { NextResponse } from "next/server";
import { getPublicUserDisplay } from "@/lib/supabase/public-user";
import { getPeekRatingSummary } from "@/lib/supabase/ratings";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requestRow, error } = await supabase
    .from("requests")
    .select("user_id, status, runner_id, title")
    .eq("id", params.id)
    .single();

  if (error || !requestRow || requestRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (requestRow.status !== "pending_approval" || !requestRow.runner_id) {
    return NextResponse.json({ error: "No pending peek" }, { status: 404 });
  }

  const runnerId = requestRow.runner_id;
  const [peek, peekRating, jobsResult] = await Promise.all([
    getPublicUserDisplay(runnerId),
    getPeekRatingSummary(runnerId),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("runner_id", runnerId)
      .eq("status", "completed")
  ]);

  if (!peek) {
    return NextResponse.json({ error: "Peek not found" }, { status: 404 });
  }

  return NextResponse.json({
    requestId: params.id,
    requestTitle: requestRow.title,
    runnerId,
    peek,
    peekRating,
    jobsCompleted: jobsResult.count ?? 0
  });
}
