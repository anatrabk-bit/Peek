import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-container">
      <div className="card-static mx-auto max-w-lg text-center">
        <h1 className="heading-section text-3xl">Can&apos;t find that one</h1>
        <p className="mt-3 text-body">
          It might be gone already - claimed, finished, or removed.
        </p>
        <Link href="/requests" className="btn-primary mt-8 inline-flex">
          See what&apos;s open nearby
        </Link>
      </div>
    </section>
  );
}
