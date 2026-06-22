-- Peek check-in while a task is claimed (10-min prompt, 15-min window)

alter table public.requests
  add column if not exists peek_check_in_at timestamptz;

comment on column public.requests.peek_check_in_at is
  'When the assigned Peek tapped Still on it during the 15-minute claim window.';
