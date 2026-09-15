import { getAuthedProfile, supabaseAdmin } from './_shared/supabaseAdmin.js';
import { json, safeError, checkRateLimit, recordRateLimitAttempt } from './_shared/http.js';

// ---- AI provider abstraction -------------------------------------------
// Swap the body of this function for a real provider call later
// (Anthropic/OpenAI/etc). Nothing else in the app needs to change —
// callers only ever see aiService.generateCustomerMessage(context).
const aiService = {
  async generateCustomerMessage(context) {
    if (process.env.AI_PROVIDER_KEY) {
      // Placeholder for a real provider call once AI_PROVIDER_KEY is set.
      // return callRealProvider(context);
    }
    return templatedMessage(context);
  },
};

function templatedMessage({ orderNumber, customerFirstName, healthReason, trackingUrl }) {
  const greeting = customerFirstName ? `Hi ${customerFirstName},` : 'Hi there,';
  const trackingLine = trackingUrl
    ? ` You can follow the latest updates here: ${trackingUrl}.`
    : '';
  return (
    `${greeting}\n\n` +
    `We wanted to reach out about your order #${orderNumber}. ` +
    `${healthReason ? `We noticed: ${healthReason.toLowerCase()}.` : "We're keeping an eye on it."} ` +
    `We're actively monitoring this and will update you as soon as we know more.${trackingLine}\n\n` +
    `Thanks for your patience — we're here if you have any questions.`
  );
}
// -------------------------------------------------------------------------

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const event = { headers: Object.fromEntries(req.headers) };
  const profile = await getAuthedProfile(event);
  if (!profile) return json(401, { error: 'Please sign in first.' });
  if (profile.status !== 'active') return json(403, { error: 'Your account cannot perform this action right now.' });

  const admin = supabaseAdmin();

  const rlKey = `messages-generate:${profile.id}`;
  const allowed = await checkRateLimit(admin, { key: rlKey, maxAttempts: 30, windowSeconds: 3600 });
  if (!allowed) return json(429, { error: 'Too many message generations. Please try again later.' });
  await recordRateLimitAttempt(admin, rlKey);

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }
  const orderId = body?.order_id;
  if (!orderId) return json(400, { error: 'Missing order_id.' });

  try {
    // Ownership check: join through shopify_stores to guarantee this order
    // belongs to a store owned by the authenticated user (admins exempt).
    const { data: order, error } = await admin
      .from('orders')
      .select('*, shopify_stores!inner(user_id)')
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    if (!order) return json(404, { error: 'Order not found.' });
    if (order.shopify_stores.user_id !== profile.id && profile.role !== 'admin') {
      return json(403, { error: 'You do not have access to this order.' });
    }

    // Build a minimal, safe context — no access tokens, no unrelated PII.
    const context = {
      orderNumber: order.order_number,
      customerFirstName: (order.customer_name || '').split(' ')[0] || null,
      healthReason: order.health_reason,
      trackingUrl: order.tracking_url,
    };

    const message = await aiService.generateCustomerMessage(context);

    await admin.from('activities').insert({
      user_id: profile.id,
      shopify_store_id: order.shopify_store_id,
      activity_type: 'message_generated',
      description: `Draft message generated for order ${order.order_number}`,
    });

    return json(200, { message });
  } catch (err) {
    return safeError('Could not generate a message right now. Please try again.', err);
  }
};
