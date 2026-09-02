-- Adds first-run onboarding tracking to user_settings.
--
-- Safety for existing users: `default true` means every row that already
-- exists gets backfilled as "onboarding completed" automatically by
-- Postgres when this column is added — existing users are never sent
-- through onboarding retroactively. Only brand-new signups see it,
-- because the application code explicitly writes `false` when it creates
-- a user's settings row for the very first time (see
-- lib/repositories/supabaseRepository.ts, getSettings()).
--
-- Safe to run multiple times.

alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default true;

notify pgrst, 'reload schema';
