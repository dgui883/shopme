/**
 * userService (admin)
 * Reads use Supabase directly (RLS's is_admin() branch grants admins SELECT
 * across all tenants). Status changes and store disconnects require the
 * service-role key and go through Netlify Functions.
 */
import { supabase } from '@/lib/supabaseClient';
import { callFunction } from '@/lib/functionsClient';

function formatDate(iso, style = 'short') {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(
    'en-US',
    style === 'long' ? { month: 'long', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
  );
}

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(iso);
}

export const userService = {
  async list({ search = '', status = 'all' } = {}) {
    let query = supabase
      .from('profiles')
      .select('*, shopify_stores(shop_domain)')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error('Could not load users.');

    return (data || [])
      .filter((u) => !search || u.shopify_stores?.[0]?.shop_domain?.toLowerCase().includes(search.toLowerCase()) || true)
      .map((u) => ({
        id: u.id,
        name: u.full_name || u.email,
        email: u.email,
        store: u.shopify_stores?.[0]?.shop_domain || '—',
        status: u.status,
        activated: formatDate(u.created_at),
        lastActive: timeAgo(u.last_login_at),
      }));
  },

  async getById(id) {
    const { data: u, error } = await supabase
      .from('profiles')
      .select('*, shopify_stores(*), licenses(*)')
      .eq('id', id)
      .maybeSingle();
    if (error || !u) return null;

    const store = u.shopify_stores?.[0];
    const license = u.licenses?.[0];

    return {
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      status: u.status,
      activated: formatDate(u.created_at, 'long'),
      lastLogin: timeAgo(u.last_login_at),
      storeId: store?.id || null,
      store: store
        ? { url: store.shop_domain, status: store.connection_status, connectedDate: formatDate(store.connected_at, 'long') }
        : null,
      license: license
        ? { code: license.activation_code, status: license.status, createdDate: formatDate(license.created_at, 'long') }
        : null,
    };
  },

  async getStats() {
    const [{ count: totalUsers }, { count: activeUsers }, { count: suspended }, { count: banned }, { count: connectedStores }] =
      await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'suspended'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'banned'),
        supabase.from('shopify_stores').select('id', { count: 'exact', head: true }).eq('connection_status', 'connected'),
      ]);

    return {
      totalUsers: { value: totalUsers || 0, sub: 'registered' },
      activeUsers: { value: activeUsers || 0, sub: 'active' },
      suspended: { value: suspended || 0, sub: 'suspended' },
      banned: { value: banned || 0, sub: 'banned' },
      connectedStores: { value: connectedStores || 0, sub: 'Shopify connected' },
    };
  },

  async setStatus(userId, action) {
    return callFunction('admin-users', { body: { user_id: userId, action } });
  },

  async disconnectStore(storeId) {
    return callFunction('admin-stores', { body: { action: 'disconnect', store_id: storeId } });
  },
};
