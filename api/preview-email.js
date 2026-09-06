import { appBaseUrl, sendEmail } from './_email.js';
import { buildWelcomeEmail } from './send-welcome-email.js';
import { completeMail, nudgeMail } from './cron-campaign-mail.js';
import { applyRateLimit, safeServerError } from './_security.js';

/**
 * Sends the real letters to one address so they can be read in an inbox.
 *
 * Every message here is built by the same function production uses — imported,
 * not copied — so what arrives is what a customer would get. A preview that
 * drifts from the real thing is worse than none.
 *
 * Guarded by CRON_SECRET: it can mail an arbitrary address, which is the same
 * power the scheduled job already has.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const rate = applyRateLimit(req, res, { action: 'preview-email', limit: 6, windowMs: 60_000 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many requests' });

  const secret = String(process.env.CRON_SECRET || '').trim();
  const auth = String(req.headers?.authorization || '');
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const to = String(req.query?.to || '').trim();
  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Pass ?to=someone@example.com' });
  }

  const base = appBaseUrl(req);
  const name = String(req.query?.name || 'Dustin').trim();

  // Which POSTMARK_* keys does this deployment actually have? Names and
  // lengths only, never values. A variable saved to the wrong environment and
  // one saved under a slightly different name look identical from outside,
  // and guessing between them costs more than reporting it.
  const config = {
    postmarkKeysPresent: Object.keys(process.env).filter((k) => /POSTMARK/i.test(k)).sort(),
    fromLength: String(process.env.POSTMARK_FROM_EMAIL || '').trim().length,
    tokenLength: String(process.env.POSTMARK_SERVER_TOKEN || '').trim().length,
  };
  if (String(req.query?.config || '') === '1') {
    return res.status(200).json({ ok: true, config });
  }

  // Representative values, not empty ones — a template only shows its problems
  // when it has real-length copy in it.
  const letters = [
    {
      key: 'welcome',
      subject: 'Welcome to the Compass',
      ...buildWelcomeEmail({
        name,
        email: to,
        signInUrl: `${base}/sign-in`,
        forgotPasswordUrl: `${base}/forgot-password`,
      }),
    },
    {
      key: 'nudge-day-5',
      subject: '3 of 8 have answered',
      ...nudgeMail({ name, base, got: 3, declared: 8, day: 5 }),
    },
    {
      key: 'nudge-day-10-nobody',
      subject: 'Your Compass survey is still waiting',
      ...nudgeMail({ name, base, got: 0, declared: 8, day: 10 }),
    },
    {
      key: 'everyone-answered',
      subject: 'Your Compass reading is ready',
      ...completeMail({ name, base, declared: 8 }),
    },
  ];

  try {
    const sent = [];
    for (const letter of letters) {
      const result = await sendEmail({
        to,
        subject: `[preview] ${letter.subject}`,
        html: letter.html,
        text: letter.text,
      });
      sent.push({ letter: letter.key, ...result });
    }
    return res.status(200).json({ ok: true, to, base, config, sent });
  } catch (error) {
    return safeServerError(res, 'preview-email error:', error);
  }
}
