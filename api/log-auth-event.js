import { db } from './firebase.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const ALLOWED_EVENT_TYPES = new Set(['password-reset']);
const ALLOWED_STATUSES = new Set(['success', 'failed']);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'log-auth-event',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const email = normalizeEmail(req.body?.email);
    const eventType = String(req.body?.eventType || '').trim();
    const status = String(req.body?.status || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!email || !ALLOWED_EVENT_TYPES.has(eventType) || !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid auth event payload' });
    }

    await db.collection('authEvents').add({
      email,
      eventType,
      status,
      message,
      createdAt: new Date().toISOString(),
      origin: String(req.headers?.origin || '').trim(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return safeServerError(res, 'log-auth-event error:', error);
  }
}
