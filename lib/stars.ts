export const STARS_PER_COMPLETION = 10;
export const STARS_FIRST_PEEK_JOB = 20;
export const STARS_VOUCHER_THRESHOLD = 50;

export function starsEarnedForJob(isFirstPeekJob: boolean): number {
  return isFirstPeekJob ? STARS_FIRST_PEEK_JOB : STARS_PER_COMPLETION;
}

export type StarsProgress = {
  totalStars: number;
  vouchersEarned: number;
  progressInCurrentVoucher: number;
  percentToNextVoucher: number;
  starsUntilNextVoucher: number;
};

export function getStarsProgress(totalStars: number): StarsProgress {
  const progressInCurrentVoucher = totalStars % STARS_VOUCHER_THRESHOLD;
  const vouchersEarned = Math.floor(totalStars / STARS_VOUCHER_THRESHOLD);
  const starsUntilNextVoucher =
    progressInCurrentVoucher === 0 && totalStars > 0
      ? 0
      : STARS_VOUCHER_THRESHOLD - progressInCurrentVoucher;

  return {
    totalStars,
    vouchersEarned,
    progressInCurrentVoucher,
    percentToNextVoucher: Math.round(
      (progressInCurrentVoucher / STARS_VOUCHER_THRESHOLD) * 100
    ),
    starsUntilNextVoucher:
      totalStars > 0 && progressInCurrentVoucher === 0
        ? STARS_VOUCHER_THRESHOLD
        : starsUntilNextVoucher
  };
}
