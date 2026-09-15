import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev rather than silently breaking auth later.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

// This client uses the anon (publishable) key only — safe for the browser.
// RLS policies in supabase/schema.sql are what actually enforce tenant
// isolation for every query made with this client.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
