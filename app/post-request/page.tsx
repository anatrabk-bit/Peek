import { PostRequestForm } from "@/components/post-request-form";

export default function PostRequestPage() {
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

        <PostRequestForm />
      </div>
    </section>
  );
}
