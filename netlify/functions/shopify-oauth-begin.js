import { getAuthedProfile, supabaseAdmin } from './_shared/supabaseAdmin.js';
import { json, safeError } from './_shared/http.js';
import { signState } from './_shared/crypto.js';

const SCOPES = 'read_orders,read_products,read_customers,read_fulfillments';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const event = { headers: Object.fromEntries(req.headers) };
  const profile = await getAuthedProfile(event);
  if (!profile) return json(401, { error: 'Please sign in first.' });
  if (profile.status !== 'active') return json(403, { error: 'Your account cannot perform this action right now.' });

  // Require an active license before allowing a Shopify connection.
  const admin = supabaseAdmin();
  const { data: license } = await admin
    .from('licenses')
    .select('id,status')
    .eq('assigned_user_id', profile.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!license) return json(403, { error: 'Please activate your license before connecting Shopify.' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  const shopDomain = String(body?.shop_domain || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shopDomain)) {
    return json(400, { error: 'Please enter a valid myshopify.com store domain.' });
  }

  try {
    const state = signState({ user_id: profile.id, shop_domain: shopDomain });

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const appUrl = process.env.SHOPIFY_APP_URL; // e.g. https://your-site.netlify.app
    const redirectUri = `${appUrl}/.netlify/functions/shopify-oauth-callback`;

    const authorizeUrl =
      `https://${shopDomain}/admin/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    return json(200, { authorize_url: authorizeUrl });
  } catch (err) {
    return safeError('Could not start the Shopify connection. Please try again.', err);
  }
};
