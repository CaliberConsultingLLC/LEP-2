import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '');
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token.trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildWelcomeEmail({ name, email, signInUrl, forgotPasswordUrl }) {
  const safeName = escapeHtml(name || 'there');
  const safeEmail = escapeHtml(email || '');
  const safeSignInUrl = escapeHtml(signInUrl);
  const safeForgotUrl = escapeHtml(forgotPasswordUrl);

  const textBody = [
    `Thanks for signing up for Compass, ${name || 'there'}.`,
    '',
    `Sign in to your dashboard: ${signInUrl}`,
    `Username: ${email}`,
    '',
    `Forgot your password? Reset it here: ${forgotPasswordUrl}`,
    '',
    'Compass Support',
  ].join('\n');

  const htmlBody = `
    <div style="background:#f6f8fc;padding:28px 0;font-family:Inter,Segoe UI,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf2;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;background:linear-gradient(135deg,#2f4f67,#3f647b);color:#ffffff;">
            <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;">Welcome to Compass</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;color:#1f2a37;">
            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Thanks for signing up, ${safeName}.</p>
            <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">Your account is ready. Use the button below to access your dashboard.</p>
            <p style="margin:0 0 18px 0;">
              <a href="${safeSignInUrl}" style="display:inline-block;background:#3f647b;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:999px;font-size:14px;font-weight:700;">Go to Dashboard</a>
            </p>
            <p style="margin:0 0 12px 0;font-size:14px;color:#4b5c70;"><strong>Username:</strong> ${safeEmail}</p>
            <p style="margin:0;font-size:14px;color:#4b5c70;">Forgot your password? <a href="${safeForgotUrl}" style="color:#3f647b;text-decoration:underline;">Reset it here</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;border-top:1px solid #e5eaf2;color:#7b8798;font-size:12px;line-height:1.5;">
            Compass Support
          </td>
        </tr>
      </table>
    </div>
  `.trim();

  return { textBody, htmlBody };
}

function normalizeBaseUrl(input) {
  const value = String(input || '').trim();
  if (!value) {
    return '';
  }
  return value.replace(/\/+$/, '');
}

async function sendPostmarkEmail(payload, token, maxAttempts = 2) {
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': token,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return response;
      }

      lastResponse = response;
      const shouldRetry = response.status >= 500 && attempt < maxAttempts;
      if (!shouldRetry) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('postmark-send-failed');
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

    const postmarkServerToken = process.env.POSTMARK_SERVER_TOKEN;
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'YOUR_VERIFIED_SENDER@YOURDOMAIN.COM';
    const originBase = normalizeBaseUrl(req.headers.origin);
    const envBase = normalizeBaseUrl(process.env.APP_BASE_URL);
    const resolvedBaseUrl = originBase || envBase || 'https://YOUR_DOMAIN';
    const signInUrl = process.env.APP_SIGN_IN_URL || `${resolvedBaseUrl}/sign-in`;
    const forgotPasswordUrl = process.env.APP_FORGOT_PASSWORD_URL
      || `${resolvedBaseUrl}/sign-in?reset=1&email=${encodeURIComponent(requestEmail)}`;

    if (!postmarkServerToken) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const { textBody, htmlBody } = buildWelcomeEmail({
      name: requestName,
      email: requestEmail,
      signInUrl,
      forgotPasswordUrl,
    });

    const postmarkResponse = await sendPostmarkEmail({
      From: fromEmail,
      To: requestEmail,
      Subject: 'Welcome to Compass',
      TextBody: textBody,
      HtmlBody: htmlBody,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || 'outbound',
    }, postmarkServerToken);

    if (!postmarkResponse.ok) {
      const details = await postmarkResponse.text().catch(() => '');
      console.error('Postmark welcome email failed:', details);
      return res.status(502).json({ error: 'Email provider error' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return safeServerError(res, 'send-welcome-email error:', error);
  }
}
