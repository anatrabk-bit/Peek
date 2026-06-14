-- Prevent duplicate in-app alerts (app insert + DB trigger)
create unique index if not exists idx_user_notifications_event_dedupe
  on public.user_notifications (user_id, request_id, event)
  where request_id is not null;

-- Re-apply peek decision notify trigger (safe if 017 already ran)
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

-- peek_applied dedupe (016 trigger)
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
