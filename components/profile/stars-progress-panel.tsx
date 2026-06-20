import { getStarsProgress, STARS_VOUCHER_THRESHOLD } from "@/lib/stars";
import type { PeekProfile } from "@/lib/supabase/peek-profile";

type StarsProgressPanelProps = {
  profile: PeekProfile;
};

export function StarsProgressPanel({ profile }: StarsProgressPanelProps) {
  const progress = getStarsProgress(profile.peek_stars);

  return (
    <article className="card-static space-y-4">
      <div>
        <h3 className="heading-section text-lg">Your stars</h3>
        <p className="mt-2 text-sm text-peek-muted">
          Complete tasks to earn stars. Every {STARS_VOUCHER_THRESHOLD} stars =
          one voucher. First task earns 20 stars as a welcome bonus.
        </p>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-peek-text">
            {profile.peek_stars} ⭐
          </p>
          <p className="mt-1 text-sm text-peek-muted">
            {profile.vouchers_earned} voucher
            {profile.vouchers_earned === 1 ? "" : "s"} earned
          </p>
        </div>
        <p className="text-sm font-semibold text-peek-primary">
          {progress.starsUntilNextVoucher} to next voucher
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
          style={{ width: `${Math.max(progress.percentToNextVoucher, 4)}%` }}
        />
      </div>
    </article>
  );
}
