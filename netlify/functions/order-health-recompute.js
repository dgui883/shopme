import { supabaseAdmin } from './_shared/supabaseAdmin.js';
import { computeHealth } from './_shared/orderHealth.js';

// Netlify Scheduled Function — configured via the `schedule` export below.
// Runs independently of any webhook, because "tracking hasn't updated in
// N days" is a fact about the passage of time, not an event Shopify will
// ever push to us.
export default async () => {
  const admin = supabaseAdmin();

  // Only orders that aren't already terminal-healthy/cancelled are worth
  // rechecking — keeps this cheap even as order volume grows.
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, order_status, fulfillment_status, tracking_status, last_tracking_update, created_at, health_status')
    .neq('order_status', 'cancelled')
    .limit(1000);

  if (error) {
    console.error('order-health-recompute: fetch failed', error);
    return new Response('error', { status: 500 });
  }

  let changed = 0;
  for (const order of orders || []) {
    const health = computeHealth(order);
    if (health.status !== order.health_status) {
      await admin
        .from('orders')
        .update({ health_status: health.status, health_reason: health.reason, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      changed++;
    }
  }

  console.log(`order-health-recompute: checked ${orders?.length || 0}, updated ${changed}`);
  return new Response('ok', { status: 200 });
};

export const config = {
  schedule: '*/30 * * * *', // every 30 minutes — adjust once real order volume is known
};
