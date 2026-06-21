import Link from "next/link";

const steps = [
  {
    emoji: "✍️",
    badgeClass: "peek-icon-badge-sky",
    title: "Post what you need checked",
    description:
      "Say the place and the question — open hours, stock, queue, or a photo."
  },
  {
    emoji: "📍",
    badgeClass: "peek-icon-badge-emerald",
    title: "A nearby Peek goes and looks",
    description:
      "Someone already there taps I'm on it, checks, and sends you the answer."
  },
  {
    emoji: "⭐",
    badgeClass: "peek-icon-badge-amber",
    title: "You get the answer. They earn stars.",
    description:
      "Free to post. Peeks collect stars (not money). Everyone stays anonymous."
  }
];

export function LandingPage() {
  return (
    <>
      <section className="peek-hero relative overflow-hidden px-6 py-14 text-white sm:py-20">
        <div className="peek-blob peek-blob-a" aria-hidden />
        <div className="peek-blob peek-blob-b" aria-hidden />

        <div className="relative mx-auto max-w-3xl space-y-8 text-center peek-fade-in">
          <div className="space-y-4">
            <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
              Quick checks from people already there
            </p>
            <h1 className="heading-hero text-white text-balance">
              Ask someone nearby to check — without going yourself
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-sky-100">
              Peek matches you with someone at the place you care about. They
              confirm what you need — a photo, stock, opening hours, or anything
              quick — and you get the answer in minutes.
            </p>
          </div>

          <div className="mx-auto grid max-w-lg gap-3 text-left sm:max-w-2xl sm:grid-cols-2">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Need an answer?</p>
              <p className="mt-1 text-sm leading-relaxed text-sky-100">
                Post a request — free, no payment.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Already nearby?</p>
              <p className="mt-1 text-sm leading-relaxed text-sky-100">
                Browse tasks, tap I&apos;m on it, earn stars.
              </p>
            </div>
          </div>

          <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-lg sm:flex-row sm:justify-center">
            <Link
              href="/post-request"
              className="btn-primary btn-fun flex-1 justify-center px-5 py-3"
            >
              Post a request
            </Link>
            <Link
              href="/requests"
              className="btn-hero-outline btn-fun flex-1 justify-center px-5 py-3"
            >
              Help nearby
            </Link>
          </div>

          <p className="text-sm text-sky-100/90">
            Anonymous nicknames · no real names shown · free to post
          </p>
        </div>
      </section>

      <section className="px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center peek-fade-in peek-delay-1">
            <h2 className="heading-section">How Peek works</h2>
            <p className="mt-2 text-body">
              Three steps — whether you need help or want to help.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className={`card card-fun text-left peek-fade-in peek-delay-${index + 2}`}
              >
                <div className={`peek-icon-badge ${step.badgeClass}`}>
                  {step.emoji}
                </div>
                <p className="mt-4 text-sm font-semibold text-peek-primary">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-peek-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-body">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="card-static mx-auto max-w-2xl peek-fade-in peek-delay-5">
          <h2 className="heading-section text-center">What can you ask?</h2>
          <ul className="mt-4 space-y-2 text-body">
            <li className="flex gap-2">
              <span className="text-peek-primary" aria-hidden>
                ·
              </span>
              Is this café open right now?
            </li>
            <li className="flex gap-2">
              <span className="text-peek-primary" aria-hidden>
                ·
              </span>
              Is this item still in stock on the shelf?
            </li>
            <li className="flex gap-2">
              <span className="text-peek-primary" aria-hidden>
                ·
              </span>
              Can you send a photo of the queue or the menu board?
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/post-request" className="btn-primary btn-fun">
              Post a request
            </Link>
            <Link href="/login" className="btn-secondary btn-fun">
              Join Peek
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
