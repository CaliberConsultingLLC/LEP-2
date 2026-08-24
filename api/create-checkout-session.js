import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function getBaseUrl(req) {
  const envBase = String(process.env.APP_BASE_URL || process.env.VITE_APP_BASE_URL || '').trim().replace(/\/+$/, '');
  if (envBase) return envBase;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (host) return `${proto}://${host}`;
  return '';
}

function introEnabled() {
  const raw = String(process.env.STRIPE_INTRO_ENABLED || 'true').trim().toLowerCase();
  return raw !== 'false' && raw !== '0';
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
  if (!secret) {
    return res.status(503).json({ error: 'Checkout is not configured yet.', configured: false });
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
    params.set('success_url', `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${baseUrl}/pay?canceled=1`);
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

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const payload = await stripeRes.json().catch(() => ({}));
    if (!stripeRes.ok || !payload?.url) {
      console.error('Stripe checkout session failed:', payload);
      return res.status(502).json({ error: 'Could not start checkout.' });
    }

    return res.status(200).json({
      url: payload.url,
      id: payload.id,
      amount,
      intro: introEnabled(),
    });
  } catch (error) {
    return safeServerError(res, 'create-checkout-session error:', error);
  }
}
