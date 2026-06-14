import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/login?signed_out=1`);
  const supabase = createRouteHandlerClient(request, response);

  await supabase.auth.signOut({ scope: "global" });

  return response;
}
