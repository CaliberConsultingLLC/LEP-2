import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';
import { db } from './firebase.js';

async function retrieveSession(secret, sessionId) {
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const payload = await stripeRes.json().catch(() => ({}));
  if (!stripeRes.ok) return null;
  return payload;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'confirm-checkout', limit: 20, windowMs: 60_000 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!ensureJsonObjectBody(req, res)) return;

  const secret = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secret) {
    return res.status(503).json({ error: 'Checkout is not configured yet.', paid: false });
  }

  try {
    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'Missing session.' });

    const session = await retrieveSession(secret, sessionId);
    const paid = String(session?.payment_status || '').toLowerCase() === 'paid'
      || String(session?.status || '').toLowerCase() === 'complete';
    if (!paid) {
      return res.status(200).json({ paid: false });
    }

    const uid = String(session?.client_reference_id || session?.metadata?.uid || req.body?.uid || '').trim();
    const email = String(session?.customer_details?.email || session?.customer_email || session?.metadata?.email || '').trim().toLowerCase();
    const paidAt = new Date().toISOString();

    if (uid) {
      await db.collection('responses').doc(uid).set({
        ownerUid: uid,
        billing: {
          paid: true,
          paidAt,
          amountTotal: session?.amount_total || null,
          currency: session?.currency || 'usd',
          stripeSessionId: sessionId,
          email,
        },
      }, { merge: true });
    }

    return res.status(200).json({ paid: true, uid, email, paidAt });
  } catch (error) {
    return safeServerError(res, 'confirm-checkout error:', error);
  }
}
