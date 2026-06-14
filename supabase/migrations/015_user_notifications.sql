-- In-app notifications (bell icon) — one row per alert
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  event text not null,
  title text not null,
  body text not null,
  url text,
  read_at timestamptz
);

create index if not exists idx_user_notifications_user_unread
  on public.user_notifications (user_id, read_at)
  where read_at is null;

create index if not exists idx_user_notifications_user_created
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

create policy "Users read own notifications"
on public.user_notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Users update own notifications"
on public.user_notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

comment on table public.user_notifications is
  'In-app alerts shown in the header bell — peek applied, approved, answer ready, etc.';
