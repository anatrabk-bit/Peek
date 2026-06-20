import { NextResponse } from "next/server";
import { getPublicPeekDisplay } from "@/lib/supabase/peek-profile";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: { id: string };
};

/** Legacy approval flow — kept for old notifications. */
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

  if (
    !requestRow.runner_id ||
    (requestRow.status !== "claimed" &&
      requestRow.status !== "pending_approval")
  ) {
    return NextResponse.json({ error: "No peek assigned" }, { status: 404 });
  }

  const peek = await getPublicPeekDisplay(requestRow.runner_id);

  if (!peek) {
    return NextResponse.json({ error: "Peek not found" }, { status: 404 });
  }

  return NextResponse.json({
    requestId: params.id,
    requestTitle: requestRow.title,
    runnerId: requestRow.runner_id,
    peek,
    jobsCompleted: peek.jobsCompleted
  });
}
