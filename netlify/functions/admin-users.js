import { getAuthedProfile, supabaseAdmin } from './_shared/supabaseAdmin.js';
import { json, safeError } from './_shared/http.js';

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
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';

    let query = admin.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return safeError('Could not load users.', error);
    return json(200, { users: data });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid request.' });
    }

    const { user_id, action } = body || {};
    if (!user_id || !['suspend', 'ban', 'reactivate'].includes(action)) {
      return json(400, { error: 'Invalid request.' });
    }

    const newStatus = action === 'suspend' ? 'suspended' : action === 'ban' ? 'banned' : 'active';

    try {
      const { data: updated, error } = await admin
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', user_id)
        .select()
        .single();
      if (error) throw error;

      await admin.from('activities').insert({
        user_id: adminProfile.id,
        activity_type: action === 'suspend' ? 'user_suspended' : action === 'ban' ? 'user_banned' : 'user_reactivated',
        description: `Admin ${adminProfile.email} set user ${updated.email} to ${newStatus}`,
        metadata: { target_user_id: user_id, action },
      });

      return json(200, { success: true, user: updated });
    } catch (err) {
      return safeError('Could not update user.', err);
    }
  }

  return json(405, { error: 'Method not allowed' });
};
