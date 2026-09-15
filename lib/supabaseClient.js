import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Fail loudly in the console, but don't throw here — createClient() throws
  // synchronously on a missing/invalid URL, which would blow up this module
  // during import and leave the whole app rendering a blank page with no
  // indication why. Callers check isSupabaseConfigured and show a real
  // setup message instead.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

// This client uses the anon (publishable) key only — safe for the browser.
// RLS policies in supabase/schema.sql are what actually enforce tenant
// isolation for every query made with this client.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
