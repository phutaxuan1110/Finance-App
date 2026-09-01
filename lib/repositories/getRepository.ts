import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocalStorageRepository } from "./localStorageRepository";
import { SupabaseRepository } from "./supabaseRepository";
import type { DataRepository } from "./types";

/**
 * - Supabase not configured yet -> always localStorage (today's behavior,
 *   zero setup required).
 * - Supabase configured and a user is signed in -> that user's cloud data.
 * - Supabase configured but nobody signed in -> callers shouldn't be
 *   rendering data screens at all (the auth gate redirects to /dang-nhap),
 *   but we fall back to localStorage rather than throwing, just in case.
 */
export function getRepository(userId: string | null): DataRepository {
  if (isSupabaseConfigured && userId) {
    return new SupabaseRepository(userId);
  }
  return new LocalStorageRepository();
}
