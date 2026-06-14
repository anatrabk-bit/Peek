-- Generic payments table — decoupled from any single provider (Stripe, PayPal, manual pilot)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  request_id uuid not null references public.requests(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null default 'GBP',
  payment_provider text not null
    check (payment_provider in ('stripe', 'paypal', 'manual', 'dev')),
  provider_transaction_id text,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'authorized',
        'completed',
        'failed',
        'cancelled',
        'refunded'
      )
    ),
  metadata jsonb not null default '{}'::jsonb,
  constraint payments_request_id_key unique (request_id)
);

create index if not exists idx_payments_request_id on public.payments (request_id);
create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_payments_provider on public.payments (payment_provider);

comment on table public.payments is
  'One payment record per request. Provider-agnostic — stripe/paypal/manual/dev.';

comment on column public.payments.payment_provider is
  'Who processes the payment: stripe, paypal, manual (bank transfer pilot), dev (local only).';

comment on column public.payments.provider_transaction_id is
  'External id from the provider (e.g. Stripe PaymentIntent pi_xxx). Null for manual.';

comment on column public.payments.status is
  'pending=awaiting payment, authorized=card held, completed=paid, failed, cancelled, refunded';

-- Migrate legacy columns from 011 only when they exist (dynamic SQL — static
-- references to r.payment_status fail parse when the column was never added)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'requests'
      and column_name = 'payment_status'
  ) then
    execute $migrate$
      insert into public.payments (
        request_id,
        amount,
        currency,
        payment_provider,
        provider_transaction_id,
        status
      )
      select
        r.id,
        r.budget,
        'GBP',
        case
          when r.payment_status = 'dev_skipped' then 'dev'
          when r.stripe_payment_intent_id is not null then 'stripe'
          else 'manual'
        end,
        r.stripe_payment_intent_id,
        case r.payment_status
          when 'pending' then 'pending'
          when 'authorized' then 'authorized'
          when 'captured' then 'completed'
          when 'failed' then 'failed'
          when 'cancelled' then 'cancelled'
          when 'dev_skipped' then 'completed'
          else 'pending'
        end
      from public.requests r
      on conflict (request_id) do nothing
    $migrate$;
  end if;
end $$;

alter table public.requests
  drop column if exists stripe_payment_intent_id,
  drop column if exists payment_status;

drop index if exists idx_requests_payment_status;

-- RLS
alter table public.payments enable row level security;

create policy "Request owner can read own payment"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.requests r
    where r.id = payments.request_id
      and r.user_id = auth.uid()
  )
);

create policy "Assigned peek can read payment on their job"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.requests r
    where r.id = payments.request_id
      and r.runner_id = auth.uid()
  )
);

create policy "Authenticated users can read completed payment status"
on public.payments
for select
to authenticated
using (status in ('authorized', 'completed'));

create policy "Request owner can insert payment for own request"
on public.payments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.requests r
    where r.id = payments.request_id
      and r.user_id = auth.uid()
  )
);

create policy "Request owner can update own pending payment"
on public.payments
for update
to authenticated
using (
  exists (
    select 1
    from public.requests r
    where r.id = payments.request_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.requests r
    where r.id = payments.request_id
      and r.user_id = auth.uid()
  )
);
