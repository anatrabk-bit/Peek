-- הרצי ב-Supabase SQL Editor
-- 1. מפרסם רואה את הבקשות שלו
-- 2. תשובה פרטית — רק למפרסם ול-Peek שענה

drop policy if exists "Anyone can read responses" on public.responses;

create policy "Requesters and Peeks can read responses"
on public.responses
for select
to authenticated
using (
  runner_id = auth.uid()
  or exists (
    select 1 from public.requests r
    where r.id = request_id
      and r.user_id = auth.uid()
  )
);
