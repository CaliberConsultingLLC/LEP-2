// Password reset, sent by us instead of by Firebase.
//
// The client used to call sendPasswordResetEmail(), which sends Firebase's own
// template from a firebaseapp.com address. In a product that charges $250 and
// spends this much care on its own voice, the one email a locked-out leader
// actually receives should not look like infrastructure.
//
// The Admin SDK generates the same signed link; we put it in our own letter and
// send it from our own domain.
//
// This endpoint always answers the same way. Telling an unauthenticated caller
// whether an address has an account turns the login form into a way to
// enumerate customers.

import { adminAuth } from './firebase.js';
import { appBaseUrl, renderEmail, sendEmail } from './_email.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'send-password-reset', limit: 5, windowMs: 60_000 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!ensureJsonObjectBody(req, res)) return;

  // The answer a caller sees, whatever actually happened.
  const uniform = () => res.status(200).json({ ok: true });

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return uniform();

    const base = appBaseUrl(req);
    let link;
    try {
      link = await adminAuth.generatePasswordResetLink(email, {
        url: `${base}/sign-in`,
        handleCodeInApp: false,
      });
    } catch (err) {
      // auth/user-not-found lands here. Same response as success, on purpose.
      const code = String(err?.code || '');
      if (code.includes('user-not-found') || code.includes('invalid-email')) return uniform();
      throw err;
    }

    const { html, text } = renderEmail({
      eyebrow: 'Account',
      title: 'Set a new password.',
      body: [
        'Someone asked to reset the password for this Compass account. If that was you, use the button below.',
        'If it was not you, nothing has changed and you can ignore this — your current password still works.',
      ],
      cta: { label: 'Set a new password', url: link },
      outro: 'This link works once, and expires in an hour.',
    });

    await sendEmail({ to: email, subject: 'Reset your Compass password', html, text });
    return uniform();
  } catch (error) {
    return safeServerError(res, 'send-password-reset error:', error);
  }
}
