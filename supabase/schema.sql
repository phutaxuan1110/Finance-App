-- SNEK cloud schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> paste
-- this whole file -> Run.
--
-- Design notes:
--  - Every row carries a `user_id` pointing at auth.users, and Row Level
--    Security (RLS) ensures a signed-in user can only ever see/modify their
--    own rows. This is enforced by Postgres itself, not by app code, so it
--    holds even if the client is compromised.
--  - Primary keys are `text`, not `uuid`, because the app already generates
--    ids client-side (e.g. "acc_x7f2k9", "txn_a91c3d") via lib/utils.ts's
--    uid() helper, including for existing localStorage data that will be
--    migrated up. Using `text` means that migration needs no id remapping.
--  - Money stays `bigint` (integer VND), matching the app's "never use
--    floating point for money" rule.

-- ---------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------
create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text not null,
  type text not null check (type in ('bank', 'cash', 'savings')),
  last_four_digits text,
  balance bigint not null default 0,
  color text not null,
  is_primary boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_user_id_idx on public.accounts(user_id);

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  type text not null check (type in ('income', 'expense')),
  is_default boolean not null default false,
  image_data_url text null
);
create index if not exists categories_user_id_idx on public.categories(user_id);

-- ---------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount bigint not null,
  account_id text not null references public.accounts(id) on delete cascade,
  destination_account_id text references public.accounts(id) on delete set null,
  category_id text references public.categories(id) on delete set null,
  merchant text,
  note text,
  date timestamptz not null,
  receipt_url text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- recurring series metadata, all optional
  recurring_series_id text,
  recurrence_index int,
  recurrence_frequency text check (recurrence_frequency in ('weekly', 'monthly', 'yearly')),
  recurrence_interval int,
  recurrence_start_date timestamptz,
  recurrence_end_date timestamptz,
  recurrence_count int
);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(user_id, date);
create index if not exists transactions_series_idx on public.transactions(recurring_series_id);

-- ---------------------------------------------------------------------
-- Monthly budgets
-- ---------------------------------------------------------------------
create table if not exists public.budgets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  "limit" bigint not null default 0,
  category_limits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, year)
);
create index if not exists budgets_user_id_idx on public.budgets(user_id);

-- ---------------------------------------------------------------------
-- Per-user settings (one row per user) + free-form meta blob
-- ---------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Bạn',
  avatar_emoji text,
  currency text not null default 'VND',
  financial_month_start_day int not null default 1,
  default_account_id text,
  theme text not null default 'dark',
  default_monthly_limit bigint not null default 0,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security: a user may only ever touch their own rows
-- ---------------------------------------------------------------------
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.user_settings enable row level security;

create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_owner" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_owner" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets_owner" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings_owner" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
