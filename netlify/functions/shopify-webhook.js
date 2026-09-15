import { supabaseAdmin } from './_shared/supabaseAdmin.js';
import { verifyShopifyWebhook } from './_shared/crypto.js';
import { computeHealth } from './_shared/orderHealth.js';

export default async (req) => {
  // IMPORTANT: read the raw body for HMAC verification before any parsing.
  const rawBody = await req.text();
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  const topic = req.headers.get('x-shopify-topic');
  const shopDomain = (req.headers.get('x-shopify-shop-domain') || '').toLowerCase();
  const webhookId = req.headers.get('x-shopify-webhook-id');

  // 1. Verify authenticity FIRST. Never touch the DB for an unverified request.
  if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
    return { statusCode: 401, body: 'Invalid signature' };
  }
  if (!shopDomain || !topic) {
    return { statusCode: 400, body: 'Missing required headers' };
  }

  const admin = supabaseAdmin();

  // 2. Idempotency: Shopify retries on timeout/non-2xx, so the same
  //    webhook_id can arrive more than once. Record it once; if it's
  //    already there, acknowledge success without reprocessing.
  if (webhookId) {
    const { error: dupErr } = await admin
      .from('webhook_events')
      .insert({ shopify_webhook_id: webhookId, topic, shop_domain: shopDomain });
    if (dupErr) {
      // Unique violation => already processed.
      return { statusCode: 200, body: 'Already processed' };
    }
  }

  // 3. Resolve the SHOPME tenant strictly from the verified shop domain —
  //    never from anything in the payload body.
  const { data: store } = await admin
    .from('shopify_stores')
    .select('id,user_id,connection_status')
    .eq('shop_domain', shopDomain)
    .maybeSingle();

  if (!store) {
    // Store not known to us (e.g. leftover webhook after disconnect). Ack
    // with 200 so Shopify stops retrying, but do nothing.
    return { statusCode: 200, body: 'Unknown store, ignored' };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  try {
    if (topic === 'app/uninstalled') {
      await admin
        .from('shopify_stores')
        .update({ connection_status: 'disconnected', updated_at: new Date().toISOString() })
        .eq('id', store.id);
      await admin
        .from('shopify_connections')
        .update({ revoked_at: new Date().toISOString() })
        .eq('shopify_store_id', store.id);
      await admin.from('activities').insert({
        user_id: store.user_id,
        shopify_store_id: store.id,
        activity_type: 'shopify_disconnected',
        description: 'Merchant uninstalled the Shopify app',
      });
      return { statusCode: 200, body: 'ok' };
    }

    if (topic.startsWith('orders/') || topic.startsWith('fulfillments/')) {
      await upsertOrderFromPayload(admin, store, topic, payload);
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Webhook processing error', { topic, shopDomain, err: err.message });
    // Return 500 so Shopify retries transient failures (DB hiccup, etc.)
    return { statusCode: 500, body: 'Processing error' };
  }
};

async function upsertOrderFromPayload(admin, store, topic, payload) {
  // fulfillments/* webhooks carry the order id under order_id; orders/*
  // webhooks carry it as the top-level id.
  const shopifyOrderId = String(payload.order_id || payload.id);
  if (!shopifyOrderId) return;

  const orderFields = {
    shopify_order_id: shopifyOrderId,
    shopify_store_id: store.id,
    order_number: payload.order_number || payload.name,
    customer_name: payload.customer
      ? `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim()
      : undefined,
    customer_email: payload.customer?.email || payload.email,
    currency: payload.currency,
    total_price: payload.total_price ? Number(payload.total_price) : undefined,
    financial_status: payload.financial_status,
    fulfillment_status: payload.fulfillment_status,
    order_status: payload.cancelled_at ? 'cancelled' : payload.closed_at ? 'closed' : 'open',
    shipping_address: payload.shipping_address || undefined,
    fulfilled_at: payload.fulfillments?.[0]?.created_at || undefined,
    updated_at: new Date().toISOString(),
  };

  const fulfillment = payload.fulfillments?.[0];
  if (fulfillment) {
    orderFields.tracking_number = fulfillment.tracking_number;
    orderFields.tracking_url = fulfillment.tracking_url;
    orderFields.carrier = fulfillment.tracking_company;
    orderFields.tracking_status = fulfillment.shipment_status;
    orderFields.last_tracking_update = fulfillment.updated_at;
  }

  // Strip undefined so we don't overwrite existing fields with nothing on
  // partial webhook payloads (e.g. fulfillments/update only has fulfillment data).
  Object.keys(orderFields).forEach((k) => orderFields[k] === undefined && delete orderFields[k]);

  const health = computeHealth(orderFields);
  orderFields.health_status = health.status;
  orderFields.health_reason = health.reason;

  const { data: order, error } = await admin
    .from('orders')
    .upsert(orderFields, { onConflict: 'shopify_store_id,shopify_order_id' })
    .select()
    .single();
  if (error) throw error;

  if (Array.isArray(payload.line_items)) {
    await admin.from('order_items').delete().eq('order_id', order.id);
    const items = payload.line_items.map((li) => ({
      order_id: order.id,
      shopify_product_id: String(li.product_id || ''),
      shopify_variant_id: String(li.variant_id || ''),
      product_title: li.title,
      quantity: li.quantity,
      price: li.price ? Number(li.price) : null,
    }));
    if (items.length) await admin.from('order_items').insert(items);
  }

  await admin
    .from('shopify_stores')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', store.id);

  await admin.from('activities').insert({
    user_id: store.user_id,
    shopify_store_id: store.id,
    activity_type: topic.startsWith('orders/') ? 'order_synced' : 'fulfillment_synced',
    description: `Order ${orderFields.order_number || shopifyOrderId} updated (${topic})`,
    metadata: { health_status: health.status },
  });
}
