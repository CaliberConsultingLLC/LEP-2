// The record of what a leader agreed to, written by the server.
//
// The consent card is the delivery; this is the evidence. What the checkout
// consent handoff asks to be kept at the moment of acceptance — the account,
// the time in UTC, the IP address, the edition of each document presented, and
// whether the marketing box was ticked — and every one of those is taken here
// rather than from the browser: the uid from a verified ID token, the time off
// this clock, the IP off the request, and the editions from legalVersions.js.
// The browser only says which boxes were ticked, which is the one thing only
// it knows.
//
// It goes into authEvents because that collection is already append-only —
// rules allow create and nothing else, and only the robot can read it back —
// which is the shape a consent log should have. No rules deploy was needed to
// start keeping it.

import { adminAuth, db } from './firebase.js';
import { applyRateLimit, ensureJsonObjectBody, getClientIp, safeServerError } from './_security.js';
import { LEGAL_VERSIONS, REQUIRED_CONSENTS } from '../src/data/legalVersions.js';

function getBearerToken(req) {
  const [scheme, token] = String(req.headers?.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token.trim() : null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'record-consent', limit: 10, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    let user;
    try {
      user = await adminAuth.verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const agreed = Array.isArray(req.body?.agreed) ? req.body.agreed.map(String) : [];
    if (!REQUIRED_CONSENTS.every((id) => agreed.includes(id))) {
      return res.status(400).json({ error: 'Required consent missing' });
    }

    const acceptedAt = new Date().toISOString();
    await db.collection('authEvents').add({
      eventType: 'consent-accepted',
      status: 'success',
      uid: user.uid,
      email: user.email,
      acceptedAt,
      createdAt: acceptedAt,
      ip: getClientIp(req),
      userAgent: String(req.headers?.['user-agent'] || '').slice(0, 400),
      origin: String(req.headers?.origin || '').trim(),
      documents: Object.fromEntries(REQUIRED_CONSENTS.map((id) => [id, LEGAL_VERSIONS[id]])),
      marketingOptIn: req.body?.marketingOptIn === true,
      source: 'account-creation',
    });

    return res.status(200).json({ ok: true, acceptedAt, documents: LEGAL_VERSIONS });
  } catch (error) {
    return safeServerError(res, 'record-consent error:', error);
  }
}
