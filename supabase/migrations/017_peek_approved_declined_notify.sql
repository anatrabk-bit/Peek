-- Notify the Peek when the client approves or declines their application
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
    );
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
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_peek_decision on public.requests;
create trigger trg_notify_peek_decision
  after update on public.requests
  for each row
  execute function public.notify_peek_on_client_decision();
