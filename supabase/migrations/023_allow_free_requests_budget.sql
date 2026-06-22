-- Peek is free to post: budget is legacy (0 = no payment)

alter table public.requests
  drop constraint if exists requests_budget_check;

alter table public.requests
  add constraint requests_budget_check check (budget >= 0);

alter table public.requests
  alter column budget set default 0;
