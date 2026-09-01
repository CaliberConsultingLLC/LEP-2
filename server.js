import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import createCheckoutSession from './api/create-checkout-session.js';
import confirmCheckout from './api/confirm-checkout.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- Firebase Admin initialization (works locally and in prod) ---
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Expecting FIREBASE_SERVICE_ACCOUNT to be a JSON string of the service account
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  // Falls back to ADC if running in an environment with GOOGLE_APPLICATION_CREDENTIALS set
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({
  credential,
  projectId: process.env.GCLOUD_PROJECT || 'leadership-evolution-project',
});

const db = admin.firestore();

// Model calls live in api/* and use the shared Anthropic client in
// api/_anthropic.js. This dev server only proxies to those handlers.

async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !error.message.includes('rateLimitExceeded')) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed due to rate limit, retrying in ${delayMs}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '');
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token.trim();
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

app.get('/test', (req, res) => {
  res.send('Server is running!');
});

app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenEmail = await resolveEmailFromIdToken(bearerToken);
    const requestEmail = String(req.body?.email || '').trim().toLowerCase();
    const requestName = String(req.body?.name || '').trim();

    if (!requestEmail || tokenEmail !== requestEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const postmarkServerToken = process.env.POSTMARK_SERVER_TOKEN;
    if (!postmarkServerToken) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const originBase = normalizeBaseUrl(req.headers.origin);
    const envBase = normalizeBaseUrl(process.env.APP_BASE_URL);
    const resolvedBaseUrl = originBase || envBase || 'https://YOUR_DOMAIN';
    const signInUrl = process.env.APP_SIGN_IN_URL || `${resolvedBaseUrl}/sign-in`;
    const forgotPasswordUrl = process.env.APP_FORGOT_PASSWORD_URL
      || `${resolvedBaseUrl}/sign-in?reset=1&email=${encodeURIComponent(requestEmail)}`;
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'YOUR_VERIFIED_SENDER@YOURDOMAIN.COM';
    const { textBody, htmlBody } = buildWelcomeEmail({
      name: requestName,
      email: requestEmail,
      signInUrl,
      forgotPasswordUrl,
    });

    const postmarkResponse = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmarkServerToken,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: requestEmail,
        Subject: 'Welcome to Compass',
        TextBody: textBody,
        HtmlBody: htmlBody,
        MessageStream: process.env.POSTMARK_MESSAGE_STREAM || 'outbound',
      }),
    });

    if (!postmarkResponse.ok) {
      const details = await postmarkResponse.text().catch(() => '');
      console.error('Postmark welcome email failed:', details);
      return res.status(502).json({ error: 'Email provider error' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/get-user-journey', async (req, res) => {
  try {
    const bearerToken = getBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = await admin.auth().verifyIdToken(bearerToken);
    const uid = String(decoded?.uid || '').trim();
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const responseSnap = await db.collection('responses').doc(uid).get();
    const payload = responseSnap.exists ? (responseSnap.data() || {}) : {};

    return res.json({
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
    console.error('Error fetching user journey:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/log-auth-event', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const eventType = String(req.body?.eventType || '').trim();
    const status = String(req.body?.status || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!email || eventType !== 'password-reset' || !['success', 'failed'].includes(status)) {
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

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error logging auth event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/get-latest-response', async (req, res) => {
  try {
    const snapshot = await withRetry(() =>
      db.collection('responses').orderBy('timestamp', 'desc').limit(1).get()
    );
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No responses found' });
    }
    const latestResponse = snapshot.docs[0].data();
    res.json(latestResponse);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Error fetching response', details: error.message });
  }
});

app.post('/api/create-checkout-session', (req, res) => createCheckoutSession(req, res));
app.post('/api/confirm-checkout', (req, res) => confirmCheckout(req, res));

// Legacy single-pass gpt-3.5-turbo routes (/get-ai-summary, /get-campaign,
// /dismiss-trait, /dismiss-statement) were removed here. They were only
// reachable through this local Express server — Vercel serves api/* — and
// they duplicated the prompt logic in api/ with a divergent implementation.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LEP-2 API listening on http://localhost:${PORT}`);
});