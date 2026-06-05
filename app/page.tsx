import Link from "next/link";

const steps = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    title: "Describe what you need",
    description:
      "Is the place accessible? Is the item in stock? Does it look like the photos? Just ask."
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: "A nearby Peek checks it for you",
    description:
      "Someone already on the ground confirms what you need - with photos if you want them."
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Get your answer fast",
    description:
      "Real confirmation, photos if needed, and payment only when the job is done."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-peek-primary to-peek-primary-dark px-6 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl space-y-6">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            Real people. Real places. Real answers.
          </p>
          <h1 className="heading-hero mx-auto max-w-3xl text-white leading-tight sm:text-balance">
            <span className="mb-2 block sm:mb-0 sm:inline">Skip the trip.</span>{" "}
            <span className="block sm:inline">Ask a Peek.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-sky-100">
            Get real answers from someone already there.
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 pt-2 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/post-request"
                className="btn-primary w-full justify-center px-4 py-3 text-center"
              >
                Post a request
              </Link>
              <span className="text-sm text-sky-100">Get your answer fast</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/requests"
                className="btn-hero-outline w-full justify-center px-4 py-3 text-center"
              >
                Become a Peek
              </Link>
              <span className="text-sm text-sky-100">Already there. Earn from it.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="heading-section">How it works</h2>
            <p className="mt-3 text-body">
              You post. A Peek verifies. You get the answer.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="card text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-peek-primary">
                  {step.icon}
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
        <div className="card-static mx-auto max-w-3xl text-center">
          <h2 className="heading-section">Two ways to use Peek</h2>
          <p className="mt-3 text-body">
            Post when you need eyes somewhere you can&apos;t be. Browse open
            requests when you want to help as a Peek.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/post-request" className="btn-primary">
              Post a request
            </Link>
            <Link href="/requests" className="btn-secondary">
              Earn as a Peek
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
