import { redirect } from "next/navigation";
import { PostRequestForm } from "@/components/post-request-form";
import { createClient } from "@/lib/supabase/server";

export default async function PostRequestPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/post-request");
  }

  return (
    <section className="page-container">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="heading-section text-3xl sm:text-4xl">
            What do you need someone to check?
          </h1>
          <p className="mt-3 text-body">
            Be specific about the place and what you want to know. A nearby Peek
            can pick this up while they&apos;re already there.
          </p>
        </div>

        <PostRequestForm />
      </div>
    </section>
  );
}
