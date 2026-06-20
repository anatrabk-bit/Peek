import Link from "next/link";

const steps = [
  {
    emoji: "✍️",
    badgeClass: "peek-icon-badge-sky",
    title: "Describe what you need",
    description:
      "Is the place open? Is the item in stock? Does it look like the photos? Just ask — it's free."
  },
  {
    emoji: "📍",
    badgeClass: "peek-icon-badge-emerald",
    title: "A nearby Peek checks for you",
    description:
      "Someone already there confirms what you need — with photos if you want."
  },
  {
    emoji: "⭐",
    badgeClass: "peek-icon-badge-amber",
    title: "Everyone wins",
    description:
      "You get your answer. Peeks earn stars for helping out — no money involved."
  }
];

export function LandingPage() {
  return (
    <>
      <section className="peek-hero relative overflow-hidden px-6 py-16 text-white sm:py-24">
        <div className="peek-blob peek-blob-a" aria-hidden />
        <div className="peek-blob peek-blob-b" aria-hidden />

        <div className="relative mx-auto max-w-3xl space-y-6 text-center peek-fade-in">
          <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
            Real people · real places · real answers
          </p>
          <h1 className="heading-hero text-white">
            Skip the trip. Ask a Peek.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-sky-100">
            Get a quick check from someone nearby — or help out and earn stars.
            Free to post, anonymous, and friendly.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-3 pt-2 sm:max-w-lg sm:flex-row sm:justify-center">
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
              Help as a Peek
            </Link>
          </div>
          <p className="text-sm text-sky-100/90">
            Free · no payment · stay anonymous
          </p>
        </div>
      </section>

      <section className="px-6 py-14 sm:py-18">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center peek-fade-in peek-delay-1">
            <h2 className="heading-section">How it works</h2>
            <p className="mt-2 text-body">
              Three simple steps — clear for everyone.
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
        <div className="card-static mx-auto max-w-2xl text-center peek-fade-in peek-delay-5">
          <h2 className="heading-section">Ready to try it?</h2>
          <p className="mt-3 text-body">
            Post when you need eyes somewhere you can&apos;t be, or browse open
            tasks when you want to help nearby.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
