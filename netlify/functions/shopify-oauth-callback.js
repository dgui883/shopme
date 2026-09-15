import crypto from 'crypto';
import { supabaseAdmin } from './_shared/supabaseAdmin.js';
import { verifyState, encryptToken } from './_shared/crypto.js';

const FRONTEND_URL = () => process.env.SHOPIFY_APP_URL || '/';

function redirect(path) {
  return {
    statusCode: 302,
    headers: { Location: `${FRONTEND_URL()}${path}` },
  };
}

export default async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  const shopDomain = (params.get('shop') || '').toLowerCase();
  const code = params.get('code');
  const state = params.get('state');
  const hmac = params.get('hmac');

  // 1. Verify the signed state — proves this callback corresponds to a
  //    request we actually initiated, and tells us which SHOPME user it's for.
  const statePayload = verifyState(state);
  if (!statePayload || statePayload.shop_domain !== shopDomain) {
    return redirect('/connect-shopify?error=invalid_state');
  }

  // 2. Verify Shopify's HMAC on the query string itself (separate from the
  //    webhook HMAC check — this one covers the OAuth redirect).
  if (!hmac || !verifyOAuthHmac(params)) {
    return redirect('/connect-shopify?error=invalid_hmac');
  }

  const admin = supabaseAdmin();

  try {
    // 3. Exchange the temporary code for a permanent access token.
    const tokenResp = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });
    if (!tokenResp.ok) throw new Error(`Token exchange failed: ${tokenResp.status}`);
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;
    const grantedScopes = tokenData.scope;
    if (!accessToken) throw new Error('No access token returned by Shopify');

    // 4. Fetch basic shop info for display purposes.
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01';
    const shopResp = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const shopJson = shopResp.ok ? await shopResp.json() : { shop: {} };

    // 5. Upsert shopify_stores. UNIQUE(shop_domain) prevents one Shopify
    //    store from silently attaching to two different SHOPME accounts —
    //    if it's already connected to someone else, this fails safely.
    const { data: existingStore } = await admin
      .from('shopify_stores')
      .select('id,user_id')
      .eq('shop_domain', shopDomain)
      .maybeSingle();

    if (existingStore && existingStore.user_id !== statePayload.user_id) {
      return redirect('/connect-shopify?error=store_already_connected');
    }

    let storeId = existingStore?.id;
    if (existingStore) {
      await admin
        .from('shopify_stores')
        .update({
          shop_name: shopJson.shop?.name,
          shopify_store_id: String(shopJson.shop?.id || ''),
          connection_status: 'connected',
          scopes: grantedScopes,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from('shopify_stores')
        .insert({
          user_id: statePayload.user_id,
          shop_domain: shopDomain,
          shop_name: shopJson.shop?.name,
          shopify_store_id: String(shopJson.shop?.id || ''),
          connection_status: 'connected',
          scopes: grantedScopes,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      storeId = inserted.id;
    }

    // 6. Store the token encrypted. Never logged, never returned to the client.
    const encrypted = encryptToken(accessToken);
    await admin.from('shopify_connections').upsert(
      {
        user_id: statePayload.user_id,
        shopify_store_id: storeId,
        shop_domain: shopDomain,
        encrypted_access_token: encrypted,
        scopes: grantedScopes,
        updated_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: 'shopify_store_id' }
    );

    await admin.from('activities').insert({
      user_id: statePayload.user_id,
      shopify_store_id: storeId,
      activity_type: 'shopify_connected',
      description: `Connected Shopify store ${shopDomain}`,
    });

    // 7. Register webhooks for this store (best-effort; failures here
    //    shouldn't block the user from reaching the dashboard).
    try {
      await registerWebhooks(shopDomain, accessToken, apiVersion);
    } catch (whErr) {
      console.error('Webhook registration failed', whErr);
    }

    return redirect('/dashboard?connected=1');
  } catch (err) {
    console.error('Shopify OAuth callback error', err);
    return redirect('/connect-shopify?error=connection_failed');
  }
};

function verifyOAuthHmac(params) {
  const map = {};
  for (const [k, v] of params.entries()) {
    if (k !== 'hmac' && k !== 'signature') map[k] = v;
  }
  const message = Object.keys(map)
    .sort()
    .map((k) => `${k}=${map[k]}`)
    .join('&');
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(params.get('hmac')));
  } catch {
    return false;
  }
}

async function registerWebhooks(shopDomain, accessToken, apiVersion) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  const topics = [
    'orders/create',
    'orders/updated',
    'orders/fulfilled',
    'orders/cancelled',
    'fulfillments/create',
    'fulfillments/update',
    'app/uninstalled',
  ];
  for (const topic of topics) {
    await fetch(`https://${shopDomain}/admin/api/${apiVersion}/webhooks.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address: `${appUrl}/.netlify/functions/shopify-webhook`,
          format: 'json',
        },
      }),
    }).catch((e) => console.error(`Failed to register webhook ${topic}`, e));
  }
}
