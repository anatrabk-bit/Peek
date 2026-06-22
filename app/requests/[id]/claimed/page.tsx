import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestById } from "@/lib/supabase/requests";

type ClaimedPageProps = {
  params: {
    id: string;
  };
};

/** Legacy route - tasks now live on the main request page. */
export default async function ClaimedConfirmationPage({
  params
}: ClaimedPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/requests/${params.id}`)}`
    );
  }

  const request = await getRequestById(params.id);

  if (!request) {
    redirect("/requests");
  }

  if (request.runner_id !== user.id) {
    redirect(`/requests/${params.id}`);
  }

  redirect(`/requests/${params.id}`);
}
