// One row per browser session that opens the site, for the Compass Pulse
// admin dashboard.
//
// Vercel Web Analytics collects these too, but its numbers cannot be read back
// through the API this dashboard's daily sync uses, so the site keeps its own
// count. It goes into authEvents for the same reason consent does: the
// collection is already append-only and robot-readable, so no rules deploy was
// needed. Nothing identifying is kept: no IP, no user, just the path and time.

import { db } from './firebase.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'track-visit', limit: 10, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const path = String(req.body?.path || '/').slice(0, 200);

    await db.collection('authEvents').add({
      eventType: 'visit',
      status: 'success',
      path,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return safeServerError(res, 'track-visit error:', error);
  }
}
