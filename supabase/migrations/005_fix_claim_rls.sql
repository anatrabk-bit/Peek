-- הרצי פעם אחת ב-Supabase Dashboard → SQL Editor
-- מתקן את ההרשאות כדי שרצים (Peeks) יוכלו לתפוס עבודות פתוחות

drop policy if exists "Anyone can read open requests" on public.requests;

drop policy if exists "Runners can claim open requests" on public.requests;
create policy "Runners can claim open requests"
on public.requests
for update
to authenticated
using (status = 'open' and runner_id is null)
with check (status = 'claimed' and runner_id = auth.uid());

drop policy if exists "Runners can complete their claimed requests" on public.requests;
create policy "Runners can complete their claimed requests"
on public.requests
for update
to authenticated
using (runner_id = auth.uid() and status = 'claimed')
with check (runner_id = auth.uid() and status = 'completed');
