import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * `null` whenever Supabase isn't configured yet, so every call site must
 * explicitly handle the "not configured" case rather than crashing at
 * import time with undefined credentials.
 */
export const supabase = isSupabaseConfigured
  ? createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null;
