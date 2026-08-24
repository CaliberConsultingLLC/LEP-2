const PAID_KEY = 'compassPaid';

export const INTRO_PRICE_USD = 250;
export const LIST_PRICE_USD = 500;

export function stripeIsConfigured() {
  return Boolean(String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim());
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
  if (!stripeIsConfigured()) return true;
  return getPaymentStatus() === 'paid';
}
