import { adminAuth, db } from './firebase.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '');
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-user-journey',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = String(decoded?.uid || '').trim();
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const responseSnap = await db.collection('responses').doc(uid).get();
    const payload = responseSnap.exists ? (responseSnap.data() || {}) : {};

    return res.status(200).json({
      ok: true,
      journey: {
        ownerUid: uid,
        ownerEmail: String(payload?.ownerEmail || decoded?.email || '').trim(),
        ownerName: String(payload?.ownerName || '').trim(),
        intakeDraft: payload?.intakeDraft || null,
        intakeStatus: payload?.intakeStatus || null,
        latestFormData: payload?.latestFormData || null,
        summaryCache: payload?.summaryCache || null,
        campaignBundle: payload?.campaignBundle || null,
        ops: payload?.ops || null,
      },
    });
  } catch (error) {
    return safeServerError(res, 'get-user-journey error:', error);
  }
}
