import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  string | undefined;

/**
 * Supabase client — only created when both env vars are present.
 * When running locally without Supabase credentials the app falls back
 * to the Express/SQLite server or browser localStorage automatically.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/** True when the app has valid Supabase credentials configured. */
export const isSupabaseConfigured = !!supabase;
