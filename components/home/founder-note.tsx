export function FounderNote() {
  return (
    <article className="card-static text-center sm:text-left">
      <p className="text-sm font-semibold uppercase tracking-wide text-peek-primary">
        Why Peek exists
      </p>
      <h2 className="heading-section mt-2 text-2xl">A note from Anat</h2>
      <div className="mt-5 space-y-4 text-body leading-relaxed">
        <p>
          I&apos;m Anat. I built Peek because I realised how much a quick
          check from someone nearby can help - without another trip across
          town.
        </p>
        <p>
          The idea sat with me for over a year. Finally I decided to build it.
        </p>
        <p className="font-medium text-peek-text">
          What I&apos;m asking: please spread the word. Tell a friend, post a
          request, or help nearby when you can. The more people on Peek, the
          better it works for everyone.
        </p>
      </div>
      <p className="mt-6 text-sm font-semibold text-peek-muted">- Anat</p>
    </article>
  );
}
