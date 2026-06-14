-- Payment tracking for Stripe (authorize on post, capture on answer)
alter table public.requests
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text not null default 'pending';

alter table public.requests
  drop constraint if exists requests_payment_status_check;

alter table public.requests
  add constraint requests_payment_status_check
  check (
    payment_status in (
      'pending',
      'authorized',
      'captured',
      'failed',
      'cancelled',
      'dev_skipped'
    )
  );

create index if not exists idx_requests_payment_status
  on public.requests (payment_status);

comment on column public.requests.payment_status is
  'pending=awaiting checkout, authorized=card held, captured=paid to Peek job done, dev_skipped=local dev without Stripe';
