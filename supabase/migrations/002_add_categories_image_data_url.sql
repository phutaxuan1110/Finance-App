-- Fixes: "Could not find the 'image_data_url' column of 'categories' in
-- the schema cache" when saving a category.
--
-- Cause: supabase/schema.sql already defines `categories.image_data_url`,
-- but this Supabase project's live database was provisioned before that
-- column was added and never got this migration applied — so the app and
-- the real database schema are out of sync. Every category save sends this
-- column (as `null` when no image is set), so ALL category saves fail
-- until this is run, not just ones with an image.
--
-- How to apply:
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run.
-- Safe to run multiple times (idempotent) and safe to run even if the
-- column already exists.

alter table public.categories
  add column if not exists image_data_url text;

-- Ask PostgREST to reload its schema cache immediately instead of waiting
-- for its normal refresh interval, so the fix takes effect right away.
notify pgrst, 'reload schema';
