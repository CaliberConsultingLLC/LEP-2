import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';
import { appBaseUrl, renderEmail, sendEmail } from './_email.js';

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '');
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token.trim();
}

// The first letter a customer gets, on the same letterhead as every other
// one. It was still the pre-redesign HTML table — Inter on a blue gradient —
// because the mail layer landed after it and never came back for it. Being
// the first email, it was the one most worth having in the product's voice.
function buildWelcomeEmail({ name, email, signInUrl, forgotPasswordUrl }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  return renderEmail({
    eyebrow: 'Your account is open',
    title: `Welcome to the Compass, ${first}.`,
    body: [
      'Your account is ready. What happens next is a reflection written from your own answers, then the same questions put to your team — and the distance between the two is the reading.',
      'Nothing is asked of your team until you say so, and their answers come back to you anonymously.',
      `You sign in with ${email}.`,
    ],
    cta: { label: 'Open your Compass', url: signInUrl },
    outro: `Forgotten the password already? Set a new one at ${forgotPasswordUrl}`,
  });
}
function normalizeBaseUrl(input) {
  const value = String(input || '').trim();
  if (!value) {
    return '';
  }
  return value.replace(/\/+$/, '');
}

function resolveSignInUrl(candidate, fallbackBase) {
  const fallbackUrl = fallbackBase ? `${fallbackBase}/sign-in` : '/sign-in';
  const value = normalizeBaseUrl(candidate);
  if (!value) return fallbackUrl;

  try {
    const parsed = value.startsWith('http')
      ? new URL(value)
      : new URL(value, fallbackBase || 'https://compass.local');

    if (parsed.pathname === '/user-info') {
      parsed.pathname = '/sign-in';
      parsed.search = '';
      parsed.hash = '';
      return parsed.origin === 'https://compass.local'
        ? `${parsed.pathname}${parsed.search}${parsed.hash}`
        : normalizeBaseUrl(parsed.toString());
    }

    return parsed.origin === 'https://compass.local'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : normalizeBaseUrl(parsed.toString());
  } catch {
    return fallbackUrl;
  }
}

async function resolveEmailFromIdToken(idToken) {
  const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!firebaseWebApiKey) {
    throw new Error('missing-firebase-web-api-key');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`accounts-lookup-failed:${response.status}:${body}`);
  }

  const payload = await response.json().catch(() => ({}));
  const user = Array.isArray(payload?.users) ? payload.users[0] : null;
  return String(user?.email || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'send-welcome-email',
    limit: 8,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) {
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenEmail = await resolveEmailFromIdToken(token);
    const requestEmail = String(req.body?.email || '').trim().toLowerCase();
    const requestName = String(req.body?.name || '').trim();

    if (!requestEmail || requestEmail !== tokenEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // APP_BASE_URL first, then the request's own origin — the same order the
    // rest of the mail layer uses, so one setting moves every link.
    const resolvedBaseUrl = normalizeBaseUrl(appBaseUrl(req)) || '';
    const signInUrl = resolveSignInUrl(process.env.APP_SIGN_IN_URL, resolvedBaseUrl);
    const forgotPasswordUrl = process.env.APP_FORGOT_PASSWORD_URL
      || `${resolvedBaseUrl}/sign-in?email=${encodeURIComponent(requestEmail)}`;

    const { html, text } = buildWelcomeEmail({
      name: requestName,
      email: requestEmail,
      signInUrl,
      forgotPasswordUrl,
    });

    const result = await sendEmail({
      to: requestEmail,
      subject: 'Welcome to the Compass',
      html,
      text,
    });

    // sendEmail reports a missing token or sender as `skipped` rather than
    // throwing, so the two are answered differently: not configured is ours
    // to fix, a provider error is not.
    if (result.skipped) {
      return res.status(503).json({ error: 'Email service not configured' });
    }
    if (!result.ok) {
      console.error('Postmark welcome email failed:', result.reason);
      return res.status(502).json({ error: 'Email provider error' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return safeServerError(res, 'send-welcome-email error:', error);
  }
}
