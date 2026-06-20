import Link from "next/link";

const steps = [
  {
    emoji: "✍️",
    cardClass: "card-pink",
    title: "Describe what you need",
    description:
      "Is the place open? Is the item in stock? Does it look like the photos? Just ask — it's free."
  },
  {
    emoji: "📍",
    cardClass: "card-mint",
    title: "A nearby Peek checks for you",
    description:
      "Someone already on the ground confirms what you need — with photos if you want."
  },
  {
    emoji: "⭐",
    cardClass: "card-sunny",
    title: "Everyone wins",
    description:
      "You get your answer. Peeks earn stars (and vouchers!) for spreading a little good."
  }
];

const floaters = [
  { emoji: "🌻", className: "left-[8%] top-[18%] peek-delay-2", slow: true },
  { emoji: "🦊", className: "right-[10%] top-[22%] peek-delay-3" },
  { emoji: "☕", className: "left-[12%] bottom-[20%] peek-delay-4", slow: true },
  { emoji: "🌈", className: "right-[8%] bottom-[18%] peek-delay-1" }
];

export function LandingPage() {
  return (
    <>
      <section className="peek-hero relative overflow-hidden px-6 py-20 text-center text-white sm:py-28">
        <div className="peek-blob peek-blob-a" aria-hidden />
        <div className="peek-blob peek-blob-b" aria-hidden />
        <div className="peek-blob peek-blob-c" aria-hidden />
        {floaters.map((item) => (
          <span
            key={item.emoji}
            className={`peek-float-emoji ${item.className} ${item.slow ? "animate-float-slow" : ""}`}
            aria-hidden
          >
            {item.emoji}
          </span>
        ))}

        <div className="relative mx-auto max-w-3xl space-y-6 peek-fade-in">
          <p className="inline-flex rounded-full border-2 border-white/30 bg-white/20 px-5 py-2 text-sm font-bold backdrop-blur">
            Kindness nearby 🌈
          </p>
          <h1 className="heading-hero mx-auto max-w-3xl leading-tight text-white drop-shadow-sm sm:text-balance">
            Skip the trip.
            <br />
            Spread a little good.
          </h1>
          <p className="mx-auto max-w-xl text-lg font-semibold leading-relaxed text-white/95">
            Ask someone nearby for a quick check — or help out and earn stars.
            Anonymous, friendly, and totally free.
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 pt-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/post-request"
                className="btn-primary btn-fun w-full justify-center px-4 py-3.5 text-center shadow-bubbly"
              >
                Post a request 📝
              </Link>
              <span className="text-sm font-semibold text-white/90">
                Free · no payment
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/requests"
                className="btn-hero-outline btn-fun w-full justify-center px-4 py-3.5 text-center"
              >
                Become a Peek 🦊
              </Link>
              <span className="text-sm font-semibold text-white/90">
                Earn stars, stay anonymous
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center peek-fade-in peek-delay-1">
            <p className="text-3xl" aria-hidden>
              💫
            </p>
            <h2 className="heading-section mt-2">How it works</h2>
            <p className="mt-3 text-body">
              You post. A Peek verifies. Good vibes all round.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className={`card card-fun text-left ${step.cardClass} peek-fade-in peek-delay-${index + 2}`}
              >
                <div className="flex h-16 w-16 animate-wiggle items-center justify-center rounded-[1.25rem] bg-white text-4xl shadow-sm">
                  {step.emoji}
                </div>
                <p className="mt-4 text-sm font-bold text-peek-primary">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-peek-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-body">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 pt-4">
        <div className="card-static card-fun card-lavender mx-auto max-w-3xl text-center peek-fade-in peek-delay-5">
          <p className="text-4xl" aria-hidden>
            ✨
          </p>
          <h2 className="heading-section mt-3">Two ways to spread good</h2>
          <p className="mt-3 text-body">
            Post when you need eyes somewhere you can&apos;t be. Browse open
            requests when you want to help — pick a fun nickname and go.
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
