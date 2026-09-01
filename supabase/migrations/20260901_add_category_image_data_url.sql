-- Existing Supabase projects created before category images were introduced
-- do not receive new columns from CREATE TABLE IF NOT EXISTS in schema.sql.
-- Keep this migration idempotent so it is safe to run more than once.
alter table public.categories
  add column if not exists image_data_url text;

-- Ask PostgREST to reload its schema cache immediately. Supabase normally
-- detects DDL changes automatically, but this prevents a stale cache from
-- continuing to reject image_data_url after the column has been added.
notify pgrst, 'reload schema';
