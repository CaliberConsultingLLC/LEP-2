import { safeServerError } from './_security.js';
import { db } from './firebase.js';
import crypto from 'crypto';

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyStripeSignature(rawBody, header, secret) {
  const parts = String(header || '').split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const signature = parts.find((p) => p.startsWith('v1='))?.slice(3);
  if (!timestamp || !signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return timingSafeEqual(expected, signature);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (secret) {
    const header = req.headers['stripe-signature'];
    if (!verifyStripeSignature(rawBody, header, secret)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const type = String(event?.type || '');
    if (type !== 'checkout.session.completed') {
      res.setHeader('Content-Type', 'application/json');
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

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ received: true });
  } catch (error) {
    return safeServerError(res, 'stripe-webhook error:', error);
  }
}
