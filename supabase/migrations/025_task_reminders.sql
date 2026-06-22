-- Remind Peeks 15 minutes before a scheduled task opens

create table if not exists public.request_reminders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  remind_at timestamptz not null,
  notified_at timestamptz,
  unique (user_id, request_id)
);

create index if not exists request_reminders_due_idx
  on public.request_reminders (remind_at)
  where notified_at is null;

alter table public.request_reminders enable row level security;

drop policy if exists "Users read own task reminders" on public.request_reminders;
create policy "Users read own task reminders"
  on public.request_reminders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own task reminders" on public.request_reminders;
create policy "Users insert own task reminders"
  on public.request_reminders for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own task reminders" on public.request_reminders;
create policy "Users update own task reminders"
  on public.request_reminders for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own task reminders" on public.request_reminders;
create policy "Users delete own task reminders"
  on public.request_reminders for delete to authenticated
  using (auth.uid() = user_id);
