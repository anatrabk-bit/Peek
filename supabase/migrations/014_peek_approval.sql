-- Peek must be approved by the requester before starting work (Uber-style)
alter table public.requests
  add column if not exists claimed_at timestamptz;

alter table public.requests
  drop constraint if exists requests_status_check;

alter table public.requests
  add constraint requests_status_check
  check (status in ('open', 'pending_approval', 'claimed', 'completed'));

-- Claiming sets pending_approval (not claimed directly)
drop policy if exists "Runners can claim open requests" on public.requests;
create policy "Runners can claim open requests"
on public.requests
for update
to authenticated
using (status = 'open' and runner_id is null)
with check (
  status = 'pending_approval'
  and runner_id = auth.uid()
);

-- Request owner approves or declines the assigned peek
drop policy if exists "Request owner can approve or decline peek" on public.requests;
create policy "Request owner can approve or decline peek"
on public.requests
for update
to authenticated
using (user_id = auth.uid() and status = 'pending_approval')
with check (
  user_id = auth.uid()
  and (
    (status = 'claimed' and runner_id is not null)
    or (status = 'open' and runner_id is null)
  )
);

comment on column public.requests.status is
  'open=live, pending_approval=peek assigned awaiting client OK, claimed=approved in progress, completed=done';
