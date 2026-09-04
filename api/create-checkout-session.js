import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function getBaseUrl(req) {
  const envBase = String(process.env.APP_BASE_URL || process.env.VITE_APP_BASE_URL || '').trim().replace(/\/+$/, '');
  if (envBase) return envBase;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (host) return `${proto}://${host}`;
  return '';
}

// Current Stripe API versions call embedded checkout 'embedded_page'; older
// ones call it 'embedded'. Try the current name first, fall back to the old.
const UI_MODES = ['embedded_page', 'embedded'];

function createSession(secret, params) {
  return fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
}

// The introductory half-price is a promotion code now, not an automatic
// discount: checkout charges list, and the leader types the code into Stripe's
// own field to take it down. Setting STRIPE_INTRO_ENABLED=true restores the
// automatic discount if we ever want an open sale again.
function introEnabled() {
  const raw = String(process.env.STRIPE_INTRO_ENABLED || 'false').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function amountCents() {
  const intro = Number(process.env.STRIPE_INTRO_PRICE_CENTS || 25000);
  const list = Number(process.env.STRIPE_LIST_PRICE_CENTS || 50000);
  return introEnabled() ? intro : list;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'create-checkout-session', limit: 12, windowMs: 60_000 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!ensureJsonObjectBody(req, res)) return;

  const secret = String(process.env.STRIPE_SECRET_KEY || '').trim();
  // The publishable key is checked up front, not after the session exists: a
  // session we cannot mount is an orphan on Stripe's side, and failing later
  // would report a missing key as a Stripe rejection.
  const publishableKey = String(
    process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
  ).trim();
  // Every problem is reported together. Stopping at the first one makes the
  // operator fix, redeploy, and discover the next one — a round trip per key.
  // A value pasted from the wrong field is named here too, because Stripe
  // reports it as "Invalid API Key provided: https://..." which reads like
  // our bug and never says which variable is wrong.
  const missing = [];
  const malformed = [];
  if (!secret) missing.push('STRIPE_SECRET_KEY');
  else if (!/^(sk|rk)_/.test(secret)) malformed.push('STRIPE_SECRET_KEY expects sk_ or rk_');
  if (!publishableKey) missing.push('STRIPE_PUBLISHABLE_KEY');
  else if (!/^pk_/.test(publishableKey)) malformed.push('STRIPE_PUBLISHABLE_KEY expects pk_');
  if (missing.length || malformed.length) {
    console.error('Stripe is not configured.', { missing, malformed });
    return res.status(503).json({
      error: 'Checkout is not configured yet.',
      configured: false,
      ...(missing.length ? { missing } : {}),
      ...(malformed.length ? { malformed } : {}),
    });
  }

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const uid = String(req.body?.uid || '').trim();
    const name = String(req.body?.name || '').trim();
    const baseUrl = getBaseUrl(req);
    if (!baseUrl) {
      return res.status(500).json({ error: 'App base URL is not configured.' });
    }

    const amount = amountCents();
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    // Embedded checkout mounts Stripe's form inside /pay rather than sending
    // the leader to buy.stripe.com. `return_url` replaces success_url and
    // cancel_url — Stripe rejects a session that carries both.
    params.set('ui_mode', UI_MODES[0]);
    params.set('return_url', `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`);
    // Stripe renders its own promotion-code field inside the form and
    // validates the code there. Nothing to collect on our side.
    params.set('allow_promotion_codes', 'true');
    // Card and bank transfer, nothing else. Stripe's dynamic defaults offered
    // Cash App Pay, Affirm, Amazon Pay and Klarna — consumer-retail and
    // buy-now-pay-later methods that do not fit a per-leader annual purchase,
    // and a company buying seats is as likely to want ACH as a card. Naming
    // the types explicitly also overrides what the dashboard has enabled, so
    // the form cannot quietly grow a method we did not choose.
    // Apple Pay and Google Pay ride on 'card' and stay.
    params.set('payment_method_types[0]', 'card');
    params.set('payment_method_types[1]', 'us_bank_account');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(amount));
    params.set('line_items[0][price_data][product_data][name]', 'The Compass');
    params.set(
      'line_items[0][price_data][product_data][description]',
      'One year of Compass for one leader — intake, reflection, team campaign, and dashboard.'
    );
    if (email) params.set('customer_email', email);
    if (uid) {
      params.set('client_reference_id', uid);
      params.set('metadata[uid]', uid);
    }
    if (email) params.set('metadata[email]', email);
    if (name) params.set('metadata[name]', name);
    params.set('metadata[product]', 'compass');

    let stripeRes = await createSession(secret, params);
    let payload = await stripeRes.json().catch(() => ({}));

    // Stripe renamed this enum: older API versions take 'embedded', current
    // ones take 'embedded_page'. Which one an account gets depends on the API
    // version pinned to that account, so rather than guess, take Stripe's word
    // for it and retry with the other name.
    if (!stripeRes.ok && payload?.error?.param === 'ui_mode') {
      const fallback = UI_MODES.find((m) => m !== params.get('ui_mode'));
      console.error(`Stripe rejected ui_mode='${params.get('ui_mode')}'; retrying with '${fallback}'.`);
      params.set('ui_mode', fallback);
      stripeRes = await createSession(secret, params);
      payload = await stripeRes.json().catch(() => ({}));
    }
    if (!stripeRes.ok || !payload?.client_secret) {
      console.error('Stripe checkout session failed:', payload);
      return res.status(502).json({ error: 'Could not start checkout.' });
    }

    // The publishable key travels with the session so the browser never needs
    // a VITE_ build-time copy of it — adding the key in Vercel is enough.
    return res.status(200).json({
      clientSecret: payload.client_secret,
      publishableKey,
      id: payload.id,
      amount,
      intro: introEnabled(),
    });
  } catch (error) {
    return safeServerError(res, 'create-checkout-session error:', error);
  }
}
