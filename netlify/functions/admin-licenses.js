import { getAuthedProfile, supabaseAdmin } from './_shared/supabaseAdmin.js';
import { json, safeError } from './_shared/http.js';
import { generateActivationCode } from './_shared/crypto.js';

async function requireAdmin(req) {
  const event = { headers: Object.fromEntries(req.headers) };
  const profile = await getAuthedProfile(event);
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') return null;
  return profile;
}

export default async (req) => {
  const admin = supabaseAdmin();
  const adminProfile = await requireAdmin(req);
  if (!adminProfile) return json(403, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'all';
    let query = admin
      .from('licenses')
      .select('*, profiles:assigned_user_id(email, full_name)')
      .order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return safeError('Could not load licenses.', error);
    return json(200, { licenses: data });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid request.' });
    }

    if (body.action === 'generate') {
      const count = Math.min(Math.max(Number(body.count) || 1, 1), 100);
      try {
        const rows = Array.from({ length: count }, () => ({ activation_code: generateActivationCode() }));
        const { data, error } = await admin.from('licenses').insert(rows).select();
        if (error) throw error;

        await admin.from('activities').insert({
          user_id: adminProfile.id,
          activity_type: 'license_created',
          description: `Admin ${adminProfile.email} generated ${count} license(s)`,
        });

        return json(200, { success: true, licenses: data });
      } catch (err) {
        return safeError('Could not generate licenses.', err);
      }
    }

    if (body.action === 'revoke' || body.action === 'suspend') {
      const status = body.action === 'revoke' ? 'revoked' : 'suspended';
      try {
        const { data, error } = await admin
          .from('licenses')
          .update({ status, revoked_at: body.action === 'revoke' ? new Date().toISOString() : undefined })
          .eq('id', body.license_id)
          .select()
          .single();
        if (error) throw error;

        await admin.from('activities').insert({
          user_id: adminProfile.id,
          activity_type: `license_${status}`,
          description: `Admin ${adminProfile.email} set license ${data.activation_code} to ${status}`,
        });

        return json(200, { success: true, license: data });
      } catch (err) {
        return safeError('Could not update license.', err);
      }
    }

    return json(400, { error: 'Unknown action.' });
  }

  return json(405, { error: 'Method not allowed' });
};
