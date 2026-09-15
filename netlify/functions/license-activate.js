import { supabaseAdmin, getAuthedProfile } from './_shared/supabaseAdmin.js';
import { json, safeError, checkRateLimit, recordRateLimitAttempt } from './_shared/http.js';

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const event = { headers: Object.fromEntries(req.headers) };
  const profile = await getAuthedProfile(event);
  if (!profile) return json(401, { error: 'Please sign in first.' });
  if (profile.status !== 'active') {
    return json(403, { error: 'Your account cannot perform this action right now.' });
  }

  const admin = supabaseAdmin();

  // Rate limit: 5 attempts per 10 minutes per authenticated user.
  const rlKey = `license-activate:${profile.id}`;
  const allowed = await checkRateLimit(admin, { key: rlKey, maxAttempts: 5, windowSeconds: 600 });
  if (!allowed) {
    return json(429, { error: 'Too many attempts. Please wait a few minutes and try again.' });
  }
  await recordRateLimitAttempt(admin, rlKey);

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  const code = String(body?.activation_code || '').trim().toUpperCase();
  if (!/^SHOPME-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return json(400, { error: 'That activation code doesn\'t look right. Please check and try again.' });
  }

  try {
    const { data: license, error: findErr } = await admin
      .from('licenses')
      .select('*')
      .eq('activation_code', code)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!license) return json(404, { error: 'Activation code not found.' });

    if (license.status === 'revoked') {
      return json(400, { error: 'This activation code has been revoked.' });
    }
    if (license.status === 'suspended') {
      return json(400, { error: 'This activation code is suspended. Please contact support.' });
    }
    if (license.status === 'active' && license.assigned_user_id) {
      return json(400, { error: 'This activation code has already been used.' });
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return json(400, { error: 'This activation code has expired.' });
    }

    // Atomic-ish claim: only succeeds if still unused (guards against a
    // race between two simultaneous activation attempts for the same code).
    const { data: updated, error: updateErr } = await admin
      .from('licenses')
      .update({
        status: 'active',
        assigned_user_id: profile.id,
        activated_at: new Date().toISOString(),
      })
      .eq('id', license.id)
      .eq('status', 'unused')
      .select()
      .maybeSingle();

    if (updateErr) throw updateErr;
    if (!updated) {
      return json(400, { error: 'This activation code has already been used.' });
    }

    await admin.from('activities').insert({
      user_id: profile.id,
      activity_type: 'license_activated',
      description: `License ${code} activated`,
      metadata: { license_id: license.id },
    });

    return json(200, { success: true, license: { code, status: 'active', activated_at: updated.activated_at } });
  } catch (err) {
    return safeError('Activation failed. Please try again.', err);
  }
};
