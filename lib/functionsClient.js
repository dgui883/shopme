import { supabase } from '@/lib/supabaseClient';

// Friendly wrapper so callers don't repeat the token-fetch + error-shape
// boilerplate. Every privileged action (license activation, Shopify OAuth
// kickoff, admin actions, message generation) goes through this — the
// service-role key that these functions use server-side never reaches here.
export async function callFunction(name, { method = 'POST', body, params } = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  let url = `/.netlify/functions/${name}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await resp.json();
  } catch {
    /* non-JSON response (rare) */
  }

  if (!resp.ok) {
    const message = payload?.error || 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return payload;
}
