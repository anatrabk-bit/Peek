-- הרצי ב-Supabase SQL Editor
-- דירוגים דו-כיווניים: מפרסם מדרג Peek, ו-Peek מדרג מפרסם (1–5 כוכבים)

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_id uuid not null references public.requests(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  rated_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score >= 1 and score <= 5),
  comment text,
  unique (request_id, rater_id)
);

create index if not exists ratings_rated_id_idx on public.ratings (rated_id);

alter table public.ratings enable row level security;

drop policy if exists "Anyone can read ratings" on public.ratings;
create policy "Anyone can read ratings"
on public.ratings
for select
using (true);

drop policy if exists "Requesters can rate completed requests" on public.ratings;
drop policy if exists "Requesters can rate their Peek" on public.ratings;
create policy "Requesters can rate their Peek"
on public.ratings
for insert
to authenticated
with check (
  rater_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id
      and r.user_id = auth.uid()
      and r.runner_id = rated_id
      and r.status = 'completed'
  )
);

drop policy if exists "Peeks can rate their client" on public.ratings;
create policy "Peeks can rate their client"
on public.ratings
for insert
to authenticated
with check (
  rater_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id
      and r.runner_id = auth.uid()
      and r.user_id = rated_id
      and r.status = 'completed'
  )
);
