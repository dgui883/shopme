import crypto from 'crypto';

// TOKEN_ENCRYPTION_KEY must be a 32-byte key, base64-encoded, set in
// Netlify env vars. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
function getKey() {
  const b64 = process.env.TOKEN_ENCRYPTION_KEY;
  if (!b64) throw new Error('Missing TOKEN_ENCRYPTION_KEY env var');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must decode to 32 bytes');
  return key;
}

// Returns "iv:authTag:ciphertext" (all base64), safe to store as text.
export function encryptToken(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decryptToken(stored) {
  const key = getKey();
  const [ivB64, tagB64, ctB64] = stored.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ctB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

// Signed, self-contained OAuth "state" param — avoids needing server-side
// session storage across the redirect-out / redirect-back hop.
export function signState(payload, expiresInSeconds = 600) {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error('Missing OAUTH_STATE_SECRET env var');
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const json = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  return `${json}.${sig}`;
}

export function verifyState(state) {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error('Missing OAUTH_STATE_SECRET env var');
  const [json, sig] = String(state || '').split('.');
  if (!json || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const body = JSON.parse(Buffer.from(json, 'base64url').toString('utf8'));
  if (body.exp < Math.floor(Date.now() / 1000)) return null;
  return body;
}

// Constant-time-ish HMAC verification for Shopify webhooks.
export function verifyShopifyWebhook(rawBody, hmacHeader) {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader || ''));
  } catch {
    return false;
  }
}

// Cryptographically random activation codes: SHOPME-XXXX-XXXX-XXXX
export function generateActivationCode() {
  const seg = () => crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 4);
  return `SHOPME-${seg()}-${seg()}-${seg()}`;
}
