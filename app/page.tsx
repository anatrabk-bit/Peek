import { HomeDashboard } from "@/components/home/dashboard";
import { LandingPage } from "@/components/home/landing-page";
import { getUserSummary } from "@/lib/auth-user";
import { getDashboardSummary } from "@/lib/supabase/dashboard";
import { getOrCreatePeekProfile } from "@/lib/supabase/peek-profile";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const [summary, peekProfile] = await Promise.all([
      getDashboardSummary(user.id),
      getOrCreatePeekProfile(user.id)
    ]);
    const display = getUserSummary(user, peekProfile);

    if (display) {
      return <HomeDashboard user={display} summary={summary} />;
    }
  }

  return <LandingPage />;
}
