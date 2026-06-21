-- Task types: scheduled (precise time) vs untimed (anytime)

alter table public.requests
  add column if not exists task_type text not null default 'untimed',
  add column if not exists schedule_mode text,
  add column if not exists scheduled_at timestamptz;

alter table public.requests
  drop constraint if exists requests_task_type_check;

alter table public.requests
  add constraint requests_task_type_check
  check (task_type in ('scheduled', 'untimed'));

alter table public.requests
  drop constraint if exists requests_schedule_mode_check;

alter table public.requests
  add constraint requests_schedule_mode_check
  check (
    schedule_mode is null
    or schedule_mode in ('live', 'today', 'tomorrow', 'custom')
  );

alter table public.requests
  drop constraint if exists requests_schedule_consistency_check;

alter table public.requests
  add constraint requests_schedule_consistency_check
  check (
    (
      task_type = 'untimed'
      and schedule_mode is null
      and scheduled_at is null
    )
    or (
      task_type = 'scheduled'
      and schedule_mode is not null
    )
  );

create index if not exists idx_requests_scheduled_at
  on public.requests (scheduled_at)
  where task_type = 'scheduled';

comment on column public.requests.task_type is
  'scheduled = check at a specific time; untimed = Peek checks when convenient.';
comment on column public.requests.schedule_mode is
  'live | today | tomorrow | custom — only when task_type = scheduled.';
comment on column public.requests.scheduled_at is
  'When the check should happen (UTC). Null for untimed tasks.';
