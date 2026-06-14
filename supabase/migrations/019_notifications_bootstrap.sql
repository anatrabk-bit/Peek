-- Run this ONCE in Supabase SQL Editor if notifications setup failed.
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS).
-- Order: table (015) → triggers + realtime (016) → approve/decline + dedupe (018)

-- ========== 015: notifications table ==========
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  event text not null,
  title text not null,
  body text not null,
  url text,
  read_at timestamptz
);

create index if not exists idx_user_notifications_user_unread
  on public.user_notifications (user_id, read_at)
  where read_at is null;

create index if not exists idx_user_notifications_user_created
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications"
on public.user_notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications"
on public.user_notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========== 018 dedupe (before triggers insert rows) ==========
create unique index if not exists idx_user_notifications_event_dedupe
  on public.user_notifications (user_id, request_id, event)
  where request_id is not null;

-- ========== 016: notify client when Peek applies ==========
create or replace function public.notify_request_owner_on_peek_apply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'pending_approval'
     and (OLD.status is distinct from 'pending_approval')
     and NEW.user_id is not null
     and NEW.runner_id is not null then
    insert into public.user_notifications (user_id, request_id, event, title, body, url)
    values (
      NEW.user_id,
      NEW.id,
      'peek_applied',
      'A Peek wants your job',
      format(
        'Someone applied for "%s" — review their profile and approve or decline.',
        coalesce(NEW.title, 'your request')
      ),
      '/requests/' || NEW.id::text
    )
    on conflict do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_peek_applied on public.requests;
create trigger trg_notify_peek_applied
  after update on public.requests
  for each row
  execute function public.notify_request_owner_on_peek_apply();

alter table public.user_notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_notifications'
  ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end $$;

-- ========== 018: notify Peek on approve / decline ==========
create or replace function public.notify_peek_on_client_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status = 'pending_approval'
     and NEW.status = 'claimed'
     and OLD.runner_id is not null then
    insert into public.user_notifications (user_id, request_id, event, title, body, url)
    values (
      OLD.runner_id,
      NEW.id,
      'peek_approved',
      'You''re approved!',
      format(
        'The client approved you for "%s". You can start the job now.',
        coalesce(NEW.title, 'this job')
      ),
      '/requests/' || NEW.id::text || '/claimed'
    )
    on conflict do nothing;
  elsif OLD.status = 'pending_approval'
     and NEW.status = 'open'
     and OLD.runner_id is not null
     and NEW.runner_id is null then
    insert into public.user_notifications (user_id, request_id, event, title, body, url)
    values (
      OLD.runner_id,
      NEW.id,
      'peek_declined',
      'Application declined',
      format(
        'The client declined your application for "%s". Browse more jobs nearby.',
        coalesce(NEW.title, 'this job')
      ),
      '/requests'
    )
    on conflict do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_peek_decision on public.requests;
create trigger trg_notify_peek_decision
  after update on public.requests
  for each row
  execute function public.notify_peek_on_client_decision();
