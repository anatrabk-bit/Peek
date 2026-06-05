create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  runner_id uuid references auth.users(id) on delete set null,
  title text not null,
  location text not null,
  latitude double precision,
  longitude double precision,
  budget numeric(10,2) not null check (budget > 0),
  details text,
  status text not null default 'open' check (status in ('open', 'claimed', 'completed'))
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_id uuid not null references public.requests(id) on delete cascade,
  runner_id uuid not null references auth.users(id) on delete cascade,
  answer text not null,
  photo_url text,
  unique (request_id)
);

alter table public.requests enable row level security;
alter table public.responses enable row level security;

-- Requests: read all (browse + detail), create when authenticated, claim when open
create policy "Anyone can read requests"
on public.requests
for select
using (true);

create policy "Authenticated users can create requests"
on public.requests
for insert
to authenticated
with check (auth.uid() = user_id or user_id is null);

create policy "Runners can claim open requests"
on public.requests
for update
to authenticated
using (status = 'open' and runner_id is null)
with check (status = 'claimed' and runner_id = auth.uid());

create policy "Runners can complete their claimed requests"
on public.requests
for update
to authenticated
using (runner_id = auth.uid() and status = 'claimed')
with check (runner_id = auth.uid() and status = 'completed');

-- Responses: runner who claimed can insert; anyone can read (requester + runner)
create policy "Anyone can read responses"
on public.responses
for select
using (true);

create policy "Runners can submit responses for their claims"
on public.responses
for insert
to authenticated
with check (
  runner_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id
      and r.runner_id = auth.uid()
      and r.status = 'claimed'
  )
);

-- Storage bucket for response photos (create bucket "response-photos" as public in dashboard, or run below)
insert into storage.buckets (id, name, public)
values ('response-photos', 'response-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload response photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'response-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view response photos"
on storage.objects
for select
using (bucket_id = 'response-photos');

-- Runner location, notification radius, and web push subscriptions
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
