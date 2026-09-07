import { adminAuth, db } from './firebase.js';
import { applyRateLimit, safeServerError } from './_security.js';

/**
 * Whether this leader has actually paid, according to Firestore.
 *
 * The browser kept the only copy of that answer: a 'compassPaid' key in
 * localStorage, written once when checkout returned and never questioned
 * again. Two things fell out of that. A refund set billing.paid to false on
 * the server and the refunded leader kept the whole year, because nothing ever
 * asked the server again. And the flag was one console line away for anyone
 * who wanted the product for free.
 *
 * The token is the proof of identity — the uid comes out of the token, never
 * off the request body, so nobody can ask about somebody else's account.
 */
function getBearerToken(req) {
  const [scheme, token] = String(req.headers?.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Called on every gated page load, so the ceiling is generous — a leader
  // moving through the product should never trip it.
  const rate = applyRateLimit(req, res, { action: 'get-entitlement', limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many requests' });

  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
    const uid = String(decoded?.uid || '').trim();
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const snap = await db.collection('responses').doc(uid).get();
    const billing = (snap.exists ? snap.data() : null)?.billing || {};

    return res.status(200).json({
      ok: true,
      paid: billing?.paid === true,
      paidAt: billing?.paidAt || null,
      refundedAt: billing?.refundedAt || null,
    });
  } catch (error) {
    return safeServerError(res, 'get-entitlement error:', error);
  }
}
