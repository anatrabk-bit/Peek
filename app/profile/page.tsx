import { RunnerSettingsPanel } from "@/components/profile/runner-settings-panel";
import { getRunnerProfile } from "@/app/profile/actions";

export default async function UserProfilePage() {
  const { user } = await getRunnerProfile();

  const history = [
    "Checked if a rental unit matched the listing photos — Elephant and Castle, London",
    "Confirmed a venue had step-free access before a guest arrived — Shoreditch, London",
    "Snapped a photo of a parking spot for someone running late — Camden Town, London"
  ];

  return (
    <section className="page-container space-y-8">
      <div>
        <h1 className="heading-section text-3xl sm:text-4xl">Your profile</h1>
        <p className="mt-3 text-body">
          Jobs you&apos;ve done, how people rate you, and your Peek preferences.
        </p>
      </div>

      <RunnerSettingsPanel isLoggedIn={!!user} />

      <div className="grid gap-5 sm:grid-cols-3">
        <article className="card text-center sm:text-left">
          <p className="text-sm font-medium text-peek-muted">Jobs completed</p>
          <p className="mt-2 text-3xl font-bold text-peek-text">12</p>
        </article>
        <article className="card text-center sm:text-left">
          <p className="text-sm font-medium text-peek-muted">Your rating</p>
          <p className="mt-2 text-3xl font-bold text-peek-text">4.9</p>
          <p className="text-sm text-peek-muted">from people you&apos;ve helped</p>
        </article>
        <article className="card text-center sm:text-left">
          <p className="text-sm font-medium text-peek-muted">Earned so far</p>
          <p className="mt-2 text-3xl font-bold text-peek-accent">£245</p>
        </article>
      </div>

      <article className="card-static">
        <h2 className="heading-section text-lg">What you&apos;ve done lately</h2>
        <ul className="mt-5 divide-y divide-zinc-100">
          {history.map((item) => (
            <li key={item} className="py-4 text-body text-peek-text first:pt-0 last:pb-0">
              {item}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
