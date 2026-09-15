// Service-role Supabase client. ONLY ever imported inside netlify/functions/*.
// Never import this from src/ (frontend) — it bypasses RLS entirely.
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function supabaseAdmin() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

// Verifies the bearer token from an incoming request and returns the
// caller's profile row (or null). Use this instead of trusting any
// user_id/store_id sent in the request body.
export async function getAuthedProfile(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  const admin = supabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .single();

  return profile || null;
}
