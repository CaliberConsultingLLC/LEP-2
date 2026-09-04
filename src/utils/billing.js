import { isDemoSession } from './demoMode';

const PAID_KEY = 'compassPaid';

export const INTRO_PRICE_USD = 250;
export const LIST_PRICE_USD = 500;

// Where a leader lands once payment clears. Payment sits between account
// creation and guide selection, so the next thing they owe us is a guide.
export const POST_PAYMENT_ROUTE = '/guide-select';

// The Stripe Payment Link. This is the whole integration for link mode: no
// secret key, no session API — the button just walks the leader over to
// Stripe and Stripe walks them back.
//
// TEST LINK. Swap this for the live link (or set VITE_STRIPE_PAYMENT_LINK in
// the Vercel project) before real money is expected — a test-mode link accepts
// test cards and charges nobody.
const DEFAULT_PAYMENT_LINK = 'https://buy.stripe.com/test_fZuaEPeUC88Y99m1tDfAc00';

/** The configured payment link, or '' when link checkout is switched off. */
export function paymentLinkUrl() {
  const raw = String(import.meta.env.VITE_STRIPE_PAYMENT_LINK ?? '').trim();
  if (!raw) return DEFAULT_PAYMENT_LINK;
  const off = raw.toLowerCase();
  if (off === 'off' || off === 'false' || off === '0') return '';
  return raw;
}

/** True when the server-side Checkout Session path is wired up instead. */
export function stripeSessionIsConfigured() {
  return Boolean(String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim());
}

/** 'link' | 'session' | 'off' — which checkout path this build should take. */
export function checkoutMode() {
  if (paymentLinkUrl()) return 'link';
  if (stripeSessionIsConfigured()) return 'session';
  return 'off';
}

export function stripeIsConfigured() {
  return checkoutMode() !== 'off';
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
  if (!stripeIsConfigured()) return true;
  return getPaymentStatus() === 'paid';
}
