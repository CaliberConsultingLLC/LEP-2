import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import createCheckoutSession from './api/create-checkout-session.js';
import confirmCheckout from './api/confirm-checkout.js';
import sendPasswordReset from './api/send-password-reset.js';
import cronCampaignMail from './api/cron-campaign-mail.js';
import sendWelcomeEmail from './api/send-welcome-email.js';

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

// api/firebase.js initialises the same default app, and importing any handler
// that uses it runs first. Guard so whichever gets there first wins.
if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: process.env.GCLOUD_PROJECT || 'leadership-evolution-project',
  });
}

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

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '');
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token.trim();
}

app.post('/api/send-password-reset', (req, res) => sendPasswordReset(req, res));
app.post('/api/cron-campaign-mail', (req, res) => cronCampaignMail(req, res));

// Delegated like every other mail route. This used to carry its own copy of
// the welcome letter, which then drifted from the one the deployed function
// sends — two versions of the first email a customer gets.
app.post('/api/send-welcome-email', (req, res) => sendWelcomeEmail(req, res));

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