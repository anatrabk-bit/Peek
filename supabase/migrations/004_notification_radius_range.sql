alter table public.runner_profiles
  drop constraint if exists runner_profiles_radius_km_check;

alter table public.runner_profiles
  alter column radius_km set default 5;

alter table public.runner_profiles
  add constraint runner_profiles_radius_km_check
  check (radius_km >= 0.1 and radius_km <= 50);
