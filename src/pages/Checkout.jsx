import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutFormProvider, CheckoutForm, useCheckoutForm } from '@stripe/react-stripe-js/checkout';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import { colors, fonts } from '../styles/tokens';
import {
  LIST_PRICE_USD,
  POST_PAYMENT_ROUTE,
  buildPaymentLink,
  checkoutMode,
  getPaymentStatus,
  setPaymentStatus,
} from '../utils/billing';
import { isDemoSession } from '../utils/demoMode';

// What the money buys, in the order the year actually happens.
const INCLUDED = [
  'The intake — about 32 questions on how you actually lead',
  'A written reflection in your guide’s voice, built from your own answers',
  'An anonymous team campaign, three times across the year',
  'The dashboard for a year: your sentiment, the evidence, and an action plan',
];

// Cairn, resolved. The form renders inside a Stripe-owned iframe, so our
// stylesheet and CSS custom properties cannot reach it — every value has to
// cross as a literal through the Appearance API.
const CAIRN = {
  sand50: '#FBF7F0',
  sand200: '#E8DBC3',
  navy900: '#10223C',
  ink: '#0F1C2E',
  inkSoft: '#44566C',
  orange: '#E07A3F',
  orangeDeep: '#C0612A',
  danger: '#B4321F',
  surface: '#FFFFFF',
};

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  // Labels above spaced inputs: the intake reads that way, and a floating
  // label inside a card field is the most widget-like thing on the page.
  inputs: 'spaced',
  labels: 'above',
  variables: {
    fontFamily: '"Manrope", "Segoe UI", system-ui, sans-serif',
    fontSizeBase: '15px',
    spacingUnit: '4px',
    borderRadius: '10px',
    colorPrimary: CAIRN.orangeDeep,
    colorBackground: CAIRN.surface,
    colorText: CAIRN.ink,
    colorTextSecondary: CAIRN.inkSoft,
    colorTextPlaceholder: '#8A8272',
    colorDanger: CAIRN.danger,
    inputColorBorder: CAIRN.sand200,
    inputFocusColorBorder: CAIRN.orange,
    inputFocusBoxShadow: `0 0 0 3px ${CAIRN.orange}33`,
    labelColorText: CAIRN.ink,
    labelFontWeight: '600',
    labelFontSize: '13.5px',
    // The pay button is the navy plate the product uses for its primary
    // action everywhere else, not Stripe's blue.
    buttonColorBackground: CAIRN.navy900,
    buttonColorText: '#F4CEA1',
    buttonBorderRadius: '999px',
    buttonFontWeight: '800',
    focusOutline: `2px solid ${CAIRN.orange}`,
  },
};

// Manrope has to be handed to the iframe by URL for the same reason.
const STRIPE_FONTS = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap' },
];

/**
 * A bad option throws an IntegrationError out of Stripe's provider, which
 * without this takes the whole page down to a white screen — on the one screen
 * where that costs a sale. The column fails on its own instead.
 */
class CheckoutBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    console.error('Checkout failed to mount:', err);
  }

  render() {
    if (this.state.failed) {
      return (
        <Alert severity="error">
          Checkout could not load. Please refresh the page, and let us know if it keeps happening.
        </Alert>
      );
    }
    return this.props.children;
  }
}

function readUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
}

/** Owns confirmation. The form raises `confirm`; we hand it back to Stripe. */
function PaymentForm() {
  const checkoutState = useCheckoutForm();
  const [error, setError] = useState('');

  if (checkoutState.type === 'error') {
    return <Alert severity="error">{checkoutState.error?.message || 'Checkout could not load.'}</Alert>;
  }

  const onConfirm = async (event) => {
    if (checkoutState.type !== 'success') return;
    setError('');
    try {
      await checkoutState.checkout.confirm({ formConfirmEvent: event });
    } catch (err) {
      // Stripe renders field-level errors itself; this is for the ones that
      // stop confirmation before it can.
      setError(String(err?.message || 'Payment could not be completed. Please try again.'));
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <CheckoutForm options={{ layout: 'expanded' }} onConfirm={onConfirm} />
    </>
  );
}

/**
 * Payment is not a screen the leader stops on — it is the form itself. The
 * session is created on arrival and Stripe's embedded form mounts in place,
 * wearing the product's own type and colour through the Appearance API.
 */
function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const canceled = new URLSearchParams(location.search || '').get('canceled') === '1';

  const [error, setError] = useState('');
  const [session, setSession] = useState(null); // { clientSecret, stripe, uiMode }
  const startedRef = useRef(false);
  const legacyMountRef = useRef(null);

  useEffect(() => {
    // Only a real payment skips checkout. A 'preview' unlock is provisional —
    // written because the server had no Stripe keys at the time — so it falls
    // through and re-asks rather than bouncing the leader past payment forever.
    if (isDemoSession() || getPaymentStatus() === 'paid') {
      navigate(POST_PAYMENT_ROUTE, { replace: true });
      return undefined;
    }

    // A Payment Link cannot be embedded at all, so that path stays a redirect —
    // on arrival, so there is still no page in between.
    if (checkoutMode() === 'link') {
      const userInfo = readUserInfo();
      const url = buildPaymentLink({ uid: userInfo?.uid || '', email: userInfo?.email || '' });
      if (url) {
        window.location.assign(url);
        return undefined;
      }
      setError('Could not start checkout. Please refresh and try again.');
      return undefined;
    }

    // StrictMode runs effects twice; a second run would create a second Stripe
    // session and leave two forms fighting over the node.
    if (startedRef.current) return undefined;
    startedRef.current = true;

    let cancelledRun = false;
    let legacyCheckout = null;

    const start = async () => {
      try {
        const userInfo = readUserInfo();
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userInfo?.uid || '',
            email: userInfo?.email || '',
            name: userInfo?.name || '',
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelledRun) return;

        // No Stripe keys on the server. Paywalling a door we cannot open would
        // strand the leader, so this deployment lets them through.
        if (response.status === 503 || payload?.configured === false) {
          setPaymentStatus('preview');
          navigate(POST_PAYMENT_ROUTE, { replace: true });
          return;
        }
        if (!response.ok || !payload?.clientSecret || !payload?.publishableKey) {
          setError(payload?.error || 'Could not start checkout. Please refresh and try again.');
          return;
        }

        // Checkout is configured after all — retire any provisional unlock.
        if (getPaymentStatus() === 'preview') setPaymentStatus('');

        const stripe = await loadStripe(payload.publishableKey);
        if (cancelledRun) return;
        if (!stripe) {
          setError('Could not reach Stripe. Please refresh and try again.');
          return;
        }

        const uiMode = payload.uiMode || 'form';
        if (uiMode === 'form') {
          setSession({ clientSecret: payload.clientSecret, stripe, uiMode });
          return;
        }

        // The account's API version refused 'form', so the session is an
        // embedded page instead — a different SDK, and no Appearance API.
        const create = typeof stripe.createEmbeddedCheckoutPage === 'function'
          ? stripe.createEmbeddedCheckoutPage.bind(stripe)
          : stripe.initEmbeddedCheckout.bind(stripe);
        legacyCheckout = await create({ clientSecret: payload.clientSecret });
        if (cancelledRun || !legacyMountRef.current) {
          legacyCheckout.destroy();
          return;
        }
        legacyCheckout.mount(legacyMountRef.current);
        setSession({ clientSecret: payload.clientSecret, stripe, uiMode });
      } catch {
        if (!cancelledRun) setError('Could not start checkout. Please refresh and try again.');
      }
    };

    start();
    return () => {
      cancelledRun = true;
      try {
        legacyCheckout?.destroy();
      } catch {
        /* already gone */
      }
    };
  }, [navigate]);

  const providerOptions = useMemo(
    () => (session?.uiMode === 'form'
      // `appearance` and `fonts` are both top-level here. They are nested
      // under `elementsOptions` for initCheckoutElementsSdk, a different SDK —
      // passing that shape to the form SDK throws an IntegrationError.
      ? { clientSecret: session.clientSecret, appearance: STRIPE_APPEARANCE, fonts: STRIPE_FONTS }
      : null),
    [session],
  );

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: colors.sand50, display: 'flex', flexDirection: 'column' }}>
      <ProcessTopRail utilityOnly />
      <CompassLayout contentMaxWidth={1060}>
        {canceled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Payment was canceled. Your details are below when you are ready.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 480px' },
            gap: { xs: 4, md: 6 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ pt: { md: 1 } }}>
            <Typography
              sx={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: colors.orangeDeep,
                mb: 1.5,
              }}
            >
              Per leader / year
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontSize: { xs: 30, md: 38 },
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: colors.navy900,
                mb: 2,
              }}
            >
              The Compass
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 3 }}>
              {INCLUDED.map((line) => (
                <Box key={line} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <Box
                    aria-hidden
                    sx={{ mt: '7px', width: 5, height: 5, borderRadius: '50%', bgcolor: colors.orange, flexShrink: 0 }}
                  />
                  <Typography sx={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 1.5, color: colors.inkSoft }}>
                    {line}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Stripe carries the live total. Saying it twice would contradict
                the form the moment a code is applied. */}
            <Box sx={{ borderTop: `1px solid ${colors.sand200}`, pt: 2.5 }}>
              <Typography sx={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 1.55, color: colors.inkSoft }}>
                List price is <strong style={{ color: CAIRN.navy900 }}>${LIST_PRICE_USD} per leader, per year</strong>.
                If you were given an introductory code, enter it with <strong style={{ color: CAIRN.navy900 }}>Add code</strong> and
                the total updates before you pay.
              </Typography>
            </Box>
          </Box>

          <Box>
            {providerOptions ? (
              <CheckoutBoundary>
                <CheckoutFormProvider stripe={session.stripe} options={providerOptions}>
                  <PaymentForm />
                </CheckoutFormProvider>
              </CheckoutBoundary>
            ) : (
              <Box ref={legacyMountRef} sx={{ width: '100%' }} />
            )}

            {!session && !error && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 8 }}>
                <CircularProgress size={22} sx={{ color: colors.orangeDeep }} />
                <Typography sx={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSoft }}>
                  Opening secure checkout…
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default Checkout;
