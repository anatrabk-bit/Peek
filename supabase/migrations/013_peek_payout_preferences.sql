-- How Peeks receive earnings (Wise or bank transfer — manual for now, Stripe Connect later)

alter table public.runner_profiles
  add column if not exists payout_method text
    check (payout_method is null or payout_method in ('wise', 'bank_transfer')),
  add column if not exists wise_email text,
  add column if not exists bank_account_name text,
  add column if not exists bank_sort_code text,
  add column if not exists bank_account_number text,
  add column if not exists bank_iban text;

comment on column public.runner_profiles.payout_method is
  'Peek payout preference: wise or bank_transfer (manual payouts until Stripe Connect).';
