-- הרצי רק אם כבר הרצת גרסה ישנה של 009 (עמודה runner_id + unique רק על request_id)

alter table public.ratings
  rename column runner_id to rated_id;

alter table public.ratings
  drop constraint if exists ratings_request_id_key;

alter table public.ratings
  drop constraint if exists ratings_request_id_rater_id_key;

alter table public.ratings
  add constraint ratings_request_id_rater_id_key unique (request_id, rater_id);

drop index if exists ratings_runner_id_idx;
create index if not exists ratings_rated_id_idx on public.ratings (rated_id);

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
