// Central feature flag: as long as these two env vars are unset, the app
// behaves exactly as it always has (localStorage only, no login gate). The
// moment both are set (locally in `.env.local`, or in Vercel's project env
// vars), auth + Supabase-backed cloud storage switch on automatically —
// nothing else in the codebase needs to change.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
