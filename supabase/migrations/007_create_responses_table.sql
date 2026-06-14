-- הרצי ב-Supabase Dashboard → SQL Editor → New query → Run
-- יוצר את הטבלה לשמירת תשובות (Submit response)
--
-- הערה: בעמודות כתוב runner_id — זה אותו דבר כמו "Peek" באפליקציה.
-- בקוד ובמסד נתונים נשאר runner (מונח טכני ישן), למשתמשים מוצג Peek.

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

drop policy if exists "Anyone can read responses" on public.responses;
create policy "Anyone can read responses"
on public.responses
for select
using (true);

drop policy if exists "Runners can submit responses for their claims" on public.responses;
drop policy if exists "Peeks can submit responses for their claims" on public.responses;
create policy "Peeks can submit responses for their claims"
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

-- אחסון לתמונות (אופציונלי — רק אם מעלים תמונה)
insert into storage.buckets (id, name, public)
values ('response-photos', 'response-photos', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload response photos" on storage.objects;
create policy "Authenticated users can upload response photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'response-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Anyone can view response photos" on storage.objects;
create policy "Anyone can view response photos"
on storage.objects
for select
using (bucket_id = 'response-photos');
