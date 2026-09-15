/**
 * storeService (admin)
 * Reads go straight through Supabase — RLS's is_admin() branch grants
 * admins SELECT across all tenants' shopify_stores rows. Disconnecting a
 * store requires the service-role key, so that goes through admin-stores.js.
 */
import { supabase } from '@/lib/supabaseClient';
import { callFunction } from '@/lib/functionsClient';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export const storeService = {
  async list() {
    const { data, error } = await supabase
      .from('shopify_stores')
      .select('*, profiles:user_id(full_name, email), orders(count)')
      .order('connected_at', { ascending: false });
    if (error) throw new Error('Could not load stores.');
    return (data || []).map((s) => ({
      id: s.id,
      url: s.shop_domain,
      owner: s.profiles?.full_name || s.profiles?.email || '—',
      status: s.connection_status,
      connected: formatDate(s.connected_at),
      lastSync: timeAgo(s.last_sync_at),
      orders: s.orders?.[0]?.count || 0,
    }));
  },

  async disconnect(storeId) {
    return callFunction('admin-stores', { body: { action: 'disconnect', store_id: storeId } });
  },
};
