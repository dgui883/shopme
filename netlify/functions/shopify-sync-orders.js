import { getAuthedProfile, supabaseAdmin } from './_shared/supabaseAdmin.js';
import { json, safeError } from './_shared/http.js';
import { decryptToken } from './_shared/crypto.js';
import { computeHealth } from './_shared/orderHealth.js';

const SYNC_WINDOW_DAYS = Number(process.env.INITIAL_SYNC_WINDOW_DAYS || 90);
const PAGE_LIMIT = 50;
const MAX_PAGES = 20; // hard ceiling: never pull unbounded history in one run

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const event = { headers: Object.fromEntries(req.headers) };
  const profile = await getAuthedProfile(event);
  if (!profile) return json(401, { error: 'Please sign in first.' });

  const admin = supabaseAdmin();

  const { data: store } = await admin
    .from('shopify_stores')
    .select('*')
    .eq('user_id', profile.id)
    .eq('connection_status', 'connected')
    .maybeSingle();
  if (!store) return json(404, { error: 'No connected Shopify store found.' });

  const { data: connection } = await admin
    .from('shopify_connections')
    .select('encrypted_access_token')
    .eq('shopify_store_id', store.id)
    .is('revoked_at', null)
    .maybeSingle();
  if (!connection) return json(404, { error: 'Shopify connection not found.' });

  try {
    const accessToken = decryptToken(connection.encrypted_access_token);
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01';
    const sinceDate = new Date(Date.now() - SYNC_WINDOW_DAYS * 86400000).toISOString();

    let pageInfo = null;
    let page = 0;
    let totalSynced = 0;

    do {
      const url = new URL(`https://${store.shop_domain}/admin/api/${apiVersion}/orders.json`);
      url.searchParams.set('status', 'any');
      url.searchParams.set('limit', String(PAGE_LIMIT));
      if (pageInfo) {
        url.searchParams.set('page_info', pageInfo);
      } else {
        url.searchParams.set('created_at_min', sinceDate);
      }

      const resp = await fetchWithRetry(url.toString(), {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });
      if (!resp.ok) throw new Error(`Shopify orders fetch failed: ${resp.status}`);

      const data = await resp.json();
      const orders = data.orders || [];

      for (const o of orders) {
        await upsertOne(admin, store, o);
        totalSynced++;
      }

      pageInfo = extractNextPageInfo(resp.headers.get('link'));
      page++;
    } while (pageInfo && page < MAX_PAGES);

    await admin.from('shopify_stores').update({ last_sync_at: new Date().toISOString() }).eq('id', store.id);
    await admin.from('activities').insert({
      user_id: profile.id,
      shopify_store_id: store.id,
      activity_type: 'orders_synced',
      description: `Initial sync: ${totalSynced} orders (last ${SYNC_WINDOW_DAYS} days)`,
    });

    return json(200, { success: true, synced: totalSynced });
  } catch (err) {
    return safeError('Order sync failed. It will retry automatically.', err);
  }
};

async function fetchWithRetry(url, opts, attempt = 1) {
  const resp = await fetch(url, opts);
  if (resp.status === 429 && attempt <= 3) {
    const retryAfter = Number(resp.headers.get('retry-after') || 1);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchWithRetry(url, opts, attempt + 1);
  }
  return resp;
}

function extractNextPageInfo(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function upsertOne(admin, store, o) {
  const fulfillment = o.fulfillments?.[0];
  const fields = {
    shopify_order_id: String(o.id),
    shopify_store_id: store.id,
    order_number: o.name,
    customer_name: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : null,
    customer_email: o.customer?.email || o.email,
    currency: o.currency,
    total_price: o.total_price ? Number(o.total_price) : null,
    financial_status: o.financial_status,
    fulfillment_status: o.fulfillment_status,
    order_status: o.cancelled_at ? 'cancelled' : o.closed_at ? 'closed' : 'open',
    shipping_address: o.shipping_address || null,
    tracking_number: fulfillment?.tracking_number || null,
    tracking_url: fulfillment?.tracking_url || null,
    carrier: fulfillment?.tracking_company || null,
    tracking_status: fulfillment?.shipment_status || null,
    last_tracking_update: fulfillment?.updated_at || null,
    fulfilled_at: fulfillment?.created_at || null,
    created_at: o.created_at,
    updated_at: new Date().toISOString(),
  };
  const health = computeHealth(fields);
  fields.health_status = health.status;
  fields.health_reason = health.reason;

  const { data: order, error } = await admin
    .from('orders')
    .upsert(fields, { onConflict: 'shopify_store_id,shopify_order_id' })
    .select()
    .single();
  if (error) throw error;

  if (Array.isArray(o.line_items) && o.line_items.length) {
    await admin.from('order_items').delete().eq('order_id', order.id);
    await admin.from('order_items').insert(
      o.line_items.map((li) => ({
        order_id: order.id,
        shopify_product_id: String(li.product_id || ''),
        shopify_variant_id: String(li.variant_id || ''),
        product_title: li.title,
        quantity: li.quantity,
        price: li.price ? Number(li.price) : null,
      }))
    );
  }
}
