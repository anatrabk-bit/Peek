create table if not exists public.runner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  radius_km numeric(5,1) not null default 5 check (radius_km >= 0.1 and radius_km <= 50),
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.runner_profiles enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users manage own runner profile"
on public.runner_profiles
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
