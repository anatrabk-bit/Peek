-- Direct claim: open -> claimed (race). Fixes 014 policy that required pending_approval.

drop policy if exists "Runners can claim open requests" on public.requests;

create policy "Runners can claim open requests"
on public.requests
for update
to authenticated
using (
  status = 'open'
  and runner_id is null
  and user_id is distinct from auth.uid()
)
with check (
  status = 'claimed'
  and runner_id = auth.uid()
);

create or replace function public.claim_request_race(p_request_id uuid, p_runner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  update public.requests
  set
    status = 'claimed',
    runner_id = p_runner_id,
    claimed_at = now()
  where id = p_request_id
    and status = 'open'
    and (user_id is null or user_id <> p_runner_id)
  returning id into updated_id;

  return updated_id is not null;
end;
$$;

grant execute on function public.claim_request_race(uuid, uuid) to authenticated;
