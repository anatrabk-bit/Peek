-- הרצי ב-Supabase Dashboard → SQL Editor (חלונית חדשה → Run)
-- בלי זה: רשימת העבודות אולי נראית, אבל "Take a look" מציג Can't find that one

drop policy if exists "Anyone can read open requests" on public.requests;

drop policy if exists "Anyone can read requests" on public.requests;
create policy "Anyone can read requests"
on public.requests
for select
using (true);
