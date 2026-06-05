-- Run this in Supabase SQL editor if you already applied the original schema.

alter table public.requests
  add column if not exists runner_id uuid references auth.users(id) on delete set null;

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_id uuid not null references public.requests(id) on delete cascade,
  runner_id uuid not null references auth.users(id) on delete cascade,
  answer text not null,
  photo_url text,
  unique (request_id)
);

alter table public.responses enable row level security;

drop policy if exists "Anyone can read open requests" on public.requests;

create policy "Anyone can read requests"
on public.requests for select using (true);

create policy "Runners can claim open requests"
on public.requests for update to authenticated
using (status = 'open' and runner_id is null)
with check (status = 'claimed' and runner_id = auth.uid());

create policy "Runners can complete their claimed requests"
on public.requests for update to authenticated
using (runner_id = auth.uid() and status = 'claimed')
with check (runner_id = auth.uid() and status = 'completed');

create policy "Anyone can read responses"
on public.responses for select using (true);

create policy "Runners can submit responses for their claims"
on public.responses for insert to authenticated
with check (
  runner_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id
      and r.runner_id = auth.uid()
      and r.status = 'claimed'
  )
);

insert into storage.buckets (id, name, public)
values ('response-photos', 'response-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload response photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'response-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view response photos"
on storage.objects for select
using (bucket_id = 'response-photos');
