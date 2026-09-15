export function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function safeError(publicMessage, err) {
  // Log full detail server-side only; never leak stack/DB/Shopify internals.
  console.error(publicMessage, err);
  return json(500, { error: publicMessage });
}

// Best-effort rate limiting using the Supabase DB as the shared store
// (Netlify Functions are stateless across invocations/instances, so an
// in-memory counter is not reliable — a table is the pragmatic option
// at pilot scale without adding Redis).
export async function checkRateLimit(admin, { key, maxAttempts, windowSeconds }) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await admin
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('activity_type', `ratelimit:${key.split(':')[0]}`)
    .eq('description', key)
    .gte('created_at', since);

  return (count || 0) < maxAttempts;
}

export async function recordRateLimitAttempt(admin, key) {
  await admin.from('activities').insert({
    activity_type: `ratelimit:${key.split(':')[0]}`,
    description: key,
    metadata: {},
  });
}
