import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

// One shared password in front of the demo.
//
// The demo is a sales and review tool, not a private one — everything behind
// this gate is fixture data, no customer's answers are reachable through it.
// What the password is for is that a demo link, once handed out, stops being
// a walk-up door into a run of the product for anyone who guesses the URL.
//
// It is checked HERE and not in the browser on purpose. A password compared
// in front-end code ships inside the bundle, where anyone can read it with
// View Source, which is not a password at all.

function getDemoPassword() {
  return String(process.env.DEMO_ACCESS_PASSWORD || '');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'demo-login',
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many attempts. Wait a minute and try again.' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const expected = getDemoPassword();
    // No password configured means the gate cannot be satisfied. Failing
    // closed is the right way round: an unset variable should not quietly
    // open the demo to everyone, which is the failure this gate exists to
    // prevent in the first place.
    if (!expected) {
      return res.status(503).json({ error: 'The demo is not open right now.' });
    }

    const password = String(req.body?.password || '');
    if (password !== expected) {
      return res.status(401).json({ error: 'That password is not right.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return safeServerError(res, 'demo-login error:', error);
  }
}
