import { getRunnerProfile } from "@/app/profile/actions";
import { RunnerSettingsProvider } from "@/components/runner-settings-provider";
import type { RunnerProfile } from "@/types/runner";

export async function AppProviders({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getRunnerProfile();

  return (
    <RunnerSettingsProvider initialProfile={profile as RunnerProfile | null}>
      {children}
    </RunnerSettingsProvider>
  );
}
