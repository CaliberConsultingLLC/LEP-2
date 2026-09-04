import { isDemoSession } from './demoMode';

const PAID_KEY = 'compassPaid';

export const INTRO_PRICE_USD = 250;
export const LIST_PRICE_USD = 500;

// Where a leader lands once payment clears. Payment sits between account
// creation and guide selection, so the next thing they owe us is a guide.
export const POST_PAYMENT_ROUTE = '/guide-select';

// Checkout is embedded by default: /pay creates a Checkout Session server-side
// and mounts Stripe's own form inside the page. A Payment Link cannot be
// embedded — it is only ever a redirect to buy.stripe.com — so the link path
// is now opt-in, kept for a deployment that has no secret key.
//
// Set VITE_STRIPE_PAYMENT_LINK to a buy.stripe.com URL to take that path
// instead, or to 'off' to state plainly that there is no link.
export function paymentLinkUrl() {
  const raw = String(import.meta.env.VITE_STRIPE_PAYMENT_LINK ?? '').trim();
  if (!raw) return '';
  const off = raw.toLowerCase();
  if (off === 'off' || off === 'false' || off === '0') return '';
  return raw;
}

/** 'link' | 'embedded' — which checkout path this build should take. */
export function checkoutMode() {
  return paymentLinkUrl() ? 'link' : 'embedded';
}

export function stripeIsConfigured() {
  return true;
}

/**
 * The payment link with this leader stapled to it. `client_reference_id` is
 * what lets the webhook and the confirmation page tie the payment back to the
 * account that was just created.
 */
export function buildPaymentLink({ uid = '', email = '' } = {}) {
  const base = paymentLinkUrl();
  if (!base) return '';
  try {
    const url = new URL(base);
    const ref = String(uid || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 200);
    if (ref) url.searchParams.set('client_reference_id', ref);
    const mail = String(email || '').trim();
    if (mail) url.searchParams.set('prefilled_email', mail);
    return url.toString();
  } catch {
    return base;
  }
}

export function getPaymentStatus() {
  try {
    return String(localStorage.getItem(PAID_KEY) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export function setPaymentStatus(status) {
  try {
    localStorage.setItem(PAID_KEY, String(status || '').trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function isIntakeUnlocked() {
  if (isDemoSession()) return true;
  const status = getPaymentStatus();
  // 'preview' is written only when the server has told us it carries no Stripe
  // keys. Without it an unconfigured deployment would paywall a door it cannot
  // open, and Guide Select would bounce the leader straight back to /pay.
  return status === 'paid' || status === 'preview';
}
