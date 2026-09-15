/**
 * shopifyService
 * Real Supabase-backed Shopify connection interface. RLS on shopify_stores
 * guarantees these reads only ever return the current user's own store.
 * shopify_connections (which holds the encrypted token) is never queried
 * from here — it has no SELECT policy for regular users at all.
 */
import { supabase } from '@/lib/supabaseClient';
import { callFunction } from '@/lib/functionsClient';

const TOKEN_MASK = '••••••••••••••••';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export const shopifyService = {
  async getConnection() {
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('connection_status', 'connected')
      .maybeSingle();

    if (!store) return { connected: false };

    return {
      connected: true,
      storeName: store.shop_name || store.shop_domain,
      storeUrl: store.shop_domain,
      connectedDate: formatDate(store.connected_at),
      plan: null, // Shopify Admin API shop.json plan_name could be synced in later if needed
      status: store.connection_status,
      accessToken: TOKEN_MASK, // never fetched, never exposed — this is a display placeholder only
    };
  },

  async getStoreStats() {
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('id')
      .eq('connection_status', 'connected')
      .maybeSingle();
    if (!store) return { products: 0, orders: 0, customers: 0, inventory: 0 };

    const [{ count: orders }, { count: customers }] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shopify_store_id', store.id),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('shopify_store_id', store.id),
    ]);

    // Product count isn't synced yet (SHOPME currently tracks orders/customers,
    // not the full catalog) — surfaced as 0 rather than a fabricated number.
    return { products: 0, orders: orders || 0, customers: customers || 0, inventory: 0 };
  },

  /** Kicks off real Shopify OAuth. Prefer calling this via AuthContext's
   * connectShopify(), which also handles the redirect — exposed here mainly
   * for symmetry with the rest of this service's public surface. */
  async beginOAuth(shopDomain) {
    return callFunction('shopify-oauth-begin', { body: { shop_domain: shopDomain } });
  },

  async syncOrders() {
    return callFunction('shopify-sync-orders', {});
  },
};
