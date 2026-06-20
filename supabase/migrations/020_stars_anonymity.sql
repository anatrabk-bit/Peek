-- Peek v2: stars rewards, anonymous nicknames, direct race claims

create table if not exists public.peek_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  avatar_icon text not null default '🙂',
  peek_stars integer not null default 0 check (peek_stars >= 0),
  vouchers_earned integer not null default 0 check (vouchers_earned >= 0),
  first_peek_bonus_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists peek_profiles_nickname_idx on public.peek_profiles (nickname);

alter table public.peek_profiles enable row level security;

drop policy if exists "peek_profiles_select_all" on public.peek_profiles;
create policy "peek_profiles_select_all"
  on public.peek_profiles for select
  using (true);

drop policy if exists "peek_profiles_insert_own" on public.peek_profiles;
create policy "peek_profiles_insert_own"
  on public.peek_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "peek_profiles_update_own" on public.peek_profiles;
create policy "peek_profiles_update_own"
  on public.peek_profiles for update
  using (auth.uid() = user_id);

comment on table public.peek_profiles is
  'Anonymous Peek identity (nickname + icon) and star rewards.';

-- Direct claim: open -> claimed (race). Keep pending_approval for legacy rows.
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
