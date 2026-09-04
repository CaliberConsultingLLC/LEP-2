import { safeServerError } from './_security.js';
import { db } from './firebase.js';
import crypto from 'crypto';

// Stripe signs the exact bytes it sent. Vercel's default JSON parser hands back
// an object, and re-serialising that object does not reproduce those bytes — so
// the parser is turned off here and the body is read off the stream instead.
// Every other endpoint keeps the parser; this is the only one that needs raw.
export const config = { api: { bodyParser: false } };

// Stripe's own tolerance. Past this a captured request cannot be replayed.
const TIMESTAMP_TOLERANCE_SECONDS = 300;

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyStripeSignature(rawBody, header, secret) {
  const parts = String(header || '').split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  // A single header can carry several v1 signatures during a secret rotation.
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!timestamp || !signatures.length) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return signatures.some((signature) => timingSafeEqual(expected, signature));
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // No secret, no webhook. Skipping verification when the secret is absent
  // left the endpoint open: a POST shaped like checkout.session.completed with
  // any uid in it marked that account paid.
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return res.status(503).json({ error: 'Webhook not configured' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    return safeServerError(res, 'stripe-webhook body read:', error);
  }

  if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'], secret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(rawBody || '{}');
    const type = String(event?.type || '');
    if (type !== 'checkout.session.completed') {
      return res.status(200).json({ received: true });
    }

    const session = event?.data?.object || {};
    const uid = String(session?.client_reference_id || session?.metadata?.uid || '').trim();
    const email = String(session?.customer_details?.email || session?.customer_email || session?.metadata?.email || '').trim().toLowerCase();
    if (uid) {
      await db.collection('responses').doc(uid).set({
        ownerUid: uid,
        billing: {
          paid: true,
          paidAt: new Date().toISOString(),
          amountTotal: session?.amount_total || null,
          currency: session?.currency || 'usd',
          stripeSessionId: session?.id || '',
          email,
          source: 'webhook',
        },
      }, { merge: true });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return safeServerError(res, 'stripe-webhook error:', error);
  }
}
