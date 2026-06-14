import { redirect } from "next/navigation";
import { FreeRequestPromoBanner } from "@/components/free-request-promo-banner";
import { PaidPostingNotice } from "@/components/paid-posting-notice";
import { PostRequestForm } from "@/components/post-request-form";
import { getFreePostingInfo } from "@/lib/free-requests";
import { getUserPostedRequestCount } from "@/lib/supabase/requests";
import { createClient } from "@/lib/supabase/server";

export default async function PostRequestPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/post-request");
  }

  const postedCount = await getUserPostedRequestCount(user.id);
  const freePostingInfo = getFreePostingInfo(postedCount);

  return (
    <section className="page-container">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="heading-section text-3xl sm:text-4xl">
            What do you need someone to check?
          </h1>
          <p className="mt-3 text-body">
            Be specific about the place and what you want to know. Search for an
            address and a Peek nearby can pick this up in minutes.
          </p>
        </div>

        <FreeRequestPromoBanner info={freePostingInfo} />
        <PaidPostingNotice info={freePostingInfo} />

        <PostRequestForm freePostingInfo={freePostingInfo} />
      </div>
    </section>
  );
}
