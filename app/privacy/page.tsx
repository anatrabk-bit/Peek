import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Peek",
  description: "How Peek handles your data."
};

export default function PrivacyPage() {
  return (
    <section className="page-container">
      <article className="card-static mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-peek-muted">
        <div>
          <h1 className="heading-section text-3xl text-peek-text">
            Privacy Policy
          </h1>
          <p className="mt-2">Last updated: June 2026</p>
        </div>

        <p>
          Peek helps people ask someone nearby for a quick check. This policy
          explains what we collect and why.
        </p>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-peek-text">What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Email address when you sign up (for login and notifications).</li>
            <li>Nickname and emoji you choose (shown anonymously to others).</li>
            <li>Task details you post (location, title, description).</li>
            <li>Answers and photos you submit as a Peek.</li>
            <li>Approximate location when you allow it (to show nearby tasks).</li>
            <li>Push notification tokens if you turn notifications on.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-peek-text">How we use it</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Run the service (matching requests with nearby Peeks).</li>
            <li>Send notifications about your tasks or nearby jobs.</li>
            <li>Keep the community safe and fix bugs.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-peek-text">What we share</h2>
          <p>
            We do not sell your data. Other users see only your anonymous
            nickname and emoji, not your email. We use Supabase for hosting and
            may use email/push providers to deliver messages.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-peek-text">Your choices</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>You can turn off push notifications in your device settings.</li>
            <li>You can delete your account by contacting us.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-peek-text">Contact</h2>
          <p>
            Questions? Use the support link in the app footer or email the
            address listed on peek-eta.vercel.app.
          </p>
        </div>

        <Link href="/" className="inline-block font-semibold text-peek-primary hover:underline">
          ← Back to Peek
        </Link>
      </article>
    </section>
  );
}
