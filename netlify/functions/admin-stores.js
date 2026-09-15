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
    const { data, error } = await admin
      .from('shopify_stores')
      .select('*, profiles:user_id(email, full_name), orders(count)')
      .order('connected_at', { ascending: false });
    if (error) return safeError('Could not load stores.', error);
    return json(200, { stores: data });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid request.' });
    }
    if (body.action !== 'disconnect' || !body.store_id) return json(400, { error: 'Invalid request.' });

    try {
      const { data: store, error } = await admin
        .from('shopify_stores')
        .update({ connection_status: 'disconnected', updated_at: new Date().toISOString() })
        .eq('id', body.store_id)
        .select()
        .single();
      if (error) throw error;

      // Revoke, don't delete — Phase 14: don't destroy unrelated order history.
      await admin
        .from('shopify_connections')
        .update({ revoked_at: new Date().toISOString() })
        .eq('shopify_store_id', body.store_id);

      await admin.from('activities').insert({
        user_id: adminProfile.id,
        shopify_store_id: store.id,
        activity_type: 'shopify_disconnected',
        description: `Admin ${adminProfile.email} disconnected store ${store.shop_domain}`,
      });

      return json(200, { success: true, store });
    } catch (err) {
      return safeError('Could not disconnect store.', err);
    }
  }

  return json(405, { error: 'Method not allowed' });
};
