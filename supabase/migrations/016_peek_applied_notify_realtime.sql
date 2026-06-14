-- In-app notification when a Peek applies (works even without Next.js service role key)
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
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_peek_applied on public.requests;
create trigger trg_notify_peek_applied
  after update on public.requests
  for each row
  execute function public.notify_request_owner_on_peek_apply();

-- Live bell + popup while browsing the site
alter table public.user_notifications replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_notifications'
  ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end $$;
