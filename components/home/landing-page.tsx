import Link from "next/link";

const steps = [
  {
    emoji: "✍️",
    title: "Describe what you need",
    description:
      "Is the place open? Is the item in stock? Does it look like the photos? Just ask — it's free."
  },
  {
    emoji: "📍",
    title: "A nearby Peek checks for you",
    description:
      "Someone already on the ground confirms what you need — with photos if you want."
  },
  {
    emoji: "⭐",
    title: "Everyone wins",
    description:
      "You get your answer. Peeks earn stars (and vouchers!) for spreading a little good."
  }
];

export function LandingPage() {
  return (
    <>
      <section className="peek-hero relative overflow-hidden px-6 py-20 text-center text-white sm:py-28">
        <div className="peek-blob peek-blob-a" aria-hidden />
        <div className="peek-blob peek-blob-b" aria-hidden />
        <div className="peek-blob peek-blob-c" aria-hidden />

        <div className="relative mx-auto max-w-3xl space-y-6 peek-fade-in">
          <p className="inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur">
            Kindness nearby 🌈 Real people. Real answers.
          </p>
          <h1 className="heading-hero mx-auto max-w-3xl text-white leading-tight sm:text-balance">
            <span className="mb-2 block sm:mb-0 sm:inline">Skip the trip.</span>{" "}
            <span className="block sm:inline">Spread a little good.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-sky-100">
            Ask someone nearby for a quick check — or help out and earn stars.
            Anonymous, friendly, and free to post.
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 pt-2 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/post-request"
                className="btn-primary btn-fun w-full justify-center px-4 py-3 text-center"
              >
                Post a request
              </Link>
              <span className="text-sm text-sky-100">Free · no payment</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/requests"
                className="btn-hero-outline btn-fun w-full justify-center px-4 py-3 text-center"
              >
                Become a Peek
              </Link>
              <span className="text-sm text-sky-100">
                Earn stars, stay anonymous
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center peek-fade-in peek-delay-1">
            <h2 className="heading-section">How it works</h2>
            <p className="mt-3 text-body">
              You post. A Peek verifies. Good vibes all round.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className={`card card-fun text-left peek-fade-in peek-delay-${index + 2}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-amber-50 text-3xl">
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

      <section className="px-6 py-16">
        <div className="card-static card-fun mx-auto max-w-3xl border border-amber-100 bg-gradient-to-br from-amber-50/50 via-white to-sky-50/50 text-center peek-fade-in peek-delay-5">
          <p className="text-3xl" aria-hidden>
            ✨
          </p>
          <h2 className="heading-section mt-3">Two ways to spread good</h2>
          <p className="mt-3 text-body">
            Post when you need eyes somewhere you can&apos;t be. Browse open
            requests when you want to help as a Peek — pick a fun nickname and
            go.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
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
