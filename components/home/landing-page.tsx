import Link from "next/link";

const steps = [
  {
    emoji: "✍️",
    badgeClass: "peek-icon-badge-sky",
    title: "Post what you need checked",
    lines: [
      "Name the café, shop, or spot.",
      "Ask your question: open hours, a shelf check, or a photo."
    ]
  },
  {
    emoji: "📍",
    badgeClass: "peek-icon-badge-emerald",
    title: "A nearby Peek goes and looks",
    lines: [
      "Someone already there taps I'm on it.",
      "They check and send you the answer."
    ]
  },
  {
    emoji: "⭐",
    badgeClass: "peek-icon-badge-amber",
    title: "You get the answer. They earn stars.",
    lines: [
      "Free to post.",
      "Peeks collect stars, not money.",
      "Everyone stays anonymous."
    ]
  }
];

const examples = [
  "Is Pret on High Street open right now?",
  "Do they have the blue Nike trainers in size 8 at Sports Direct?",
  "Can you photo the queue outside Dishoom?"
];

export function LandingPage() {
  return (
    <>
      <section className="peek-hero relative overflow-hidden px-6 py-14 text-white sm:py-20">
        <div className="peek-blob peek-blob-a" aria-hidden />
        <div className="peek-blob peek-blob-b" aria-hidden />

        <div className="relative mx-auto max-w-3xl space-y-8 text-center peek-fade-in">
          <div className="space-y-5">
            <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
              Quick checks from people already there
            </p>
            <h1 className="heading-hero text-balance text-white">
              Ask someone nearby to check for you
            </h1>
            <div className="mx-auto max-w-xl space-y-2 text-lg leading-relaxed text-sky-100">
              <p>You write the place and the question.</p>
              <p>Someone already there looks and replies.</p>
              <p>You skip the trip.</p>
            </div>
          </div>

          <div className="mx-auto grid max-w-lg gap-3 text-left sm:max-w-2xl sm:grid-cols-2">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Need an answer?</p>
              <div className="mt-2 space-y-1 text-sm leading-relaxed text-sky-100">
                <p>Post a request.</p>
                <p>Free. No payment.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Already nearby?</p>
              <div className="mt-2 space-y-1 text-sm leading-relaxed text-sky-100">
                <p>Browse open tasks.</p>
                <p>Tap I&apos;m on it.</p>
                <p>Earn stars.</p>
              </div>
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

          <div className="space-y-1 text-sm text-sky-100/90">
            <p>Anonymous nicknames.</p>
            <p>No real names shown.</p>
            <p>Free to post.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center peek-fade-in peek-delay-1">
            <h2 className="heading-section">How Peek works</h2>
            <div className="mt-2 space-y-1 text-body">
              <p>Three steps.</p>
              <p>Need help, or want to help.</p>
            </div>
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
                <div className="mt-2 space-y-1 text-body">
                  {step.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="card-static mx-auto max-w-2xl peek-fade-in peek-delay-5">
          <h2 className="heading-section text-center">What can you ask?</h2>
          <ul className="mt-4 space-y-3 text-body">
            {examples.map((example) => (
              <li key={example} className="flex gap-2">
                <span className="shrink-0 text-peek-primary" aria-hidden>
                  ·
                </span>
                <span>{example}</span>
              </li>
            ))}
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
