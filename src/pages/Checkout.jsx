import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
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

function readUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
}

/**
 * Payment is not a screen the leader stops on — it is the Stripe form itself.
 * Nothing is rendered in front of it: the session is created on arrival and
 * Stripe's own checkout mounts in place, carrying the price, the product line
 * and its promotion-code field.
 */
function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const canceled = new URLSearchParams(location.search || '').get('canceled') === '1';
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const mountRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Only a real payment skips checkout. A 'preview' unlock is provisional —
    // it was written because the server had no Stripe keys at the time, and
    // treating it as settled would bounce the leader past payment forever,
    // long after the keys arrived. Falling through re-asks the server, so the
    // bypass heals itself the moment checkout is configured.
    if (isDemoSession() || getPaymentStatus() === 'paid') {
      navigate(POST_PAYMENT_ROUTE, { replace: true });
      return undefined;
    }

    // A Payment Link cannot be embedded, so that path stays a redirect — but
    // it happens on arrival rather than behind a button, so there is still no
    // page in between.
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

    // React runs effects twice in StrictMode; a second mount would create a
    // second Stripe session and leave two forms fighting over the node.
    if (startedRef.current) return undefined;
    startedRef.current = true;

    let cancelledRun = false;
    let checkout = null;
    let stopWatching = null;

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

        // The server carries no Stripe keys. Paywalling a door we cannot open
        // would strand the leader, so this deployment lets them through.
        if (response.status === 503 || payload?.configured === false) {
          setPaymentStatus('preview');
          navigate(POST_PAYMENT_ROUTE, { replace: true });
          return;
        }

        if (!response.ok || !payload?.clientSecret || !payload?.publishableKey) {
          setError(payload?.error || 'Could not start checkout. Please refresh and try again.');
          return;
        }

        // Checkout is configured after all — retire any provisional unlock so
        // the gates stop honouring it.
        if (getPaymentStatus() === 'preview') setPaymentStatus('');

        const stripe = await loadStripe(payload.publishableKey);
        if (cancelledRun) return;
        if (!stripe) {
          setError('Could not reach Stripe. Please refresh and try again.');
          return;
        }

        // Stripe renamed this alongside the session's ui_mode: current
        // stripe.js exposes createEmbeddedCheckoutPage, older builds only
        // initEmbeddedCheckout. Calling the removed one throws rather than
        // returning undefined, so pick by what the loaded copy actually has.
        const create = typeof stripe.createEmbeddedCheckoutPage === 'function'
          ? stripe.createEmbeddedCheckoutPage.bind(stripe)
          : stripe.initEmbeddedCheckout.bind(stripe);
        checkout = await create({ clientSecret: payload.clientSecret });
        if (cancelledRun || !mountRef.current) {
          checkout.destroy();
          return;
        }
        checkout.mount(mountRef.current);

        // mount() returns before Stripe has painted: it inserts an iframe at
        // zero height and grows it once the inner page reports its size.
        // Treating mount as "done" leaves a blank page under a hidden spinner,
        // so wait for the frame to actually take up room.
        const node = mountRef.current;
        const painted = () => {
          const frame = node?.querySelector('iframe');
          return Boolean(frame && frame.getBoundingClientRect().height > 0);
        };
        if (painted()) {
          setMounted(true);
        } else {
          const observer = new ResizeObserver(() => {
            if (cancelledRun) return;
            if (painted()) {
              setMounted(true);
              observer.disconnect();
            }
          });
          observer.observe(node);
          stopWatching = () => observer.disconnect();
        }
      } catch {
        if (!cancelledRun) {
          setError('Could not start checkout. Please refresh and try again.');
        }
      }
    };

    start();
    return () => {
      cancelledRun = true;
      stopWatching?.();
      try {
        checkout?.destroy();
      } catch {
        /* already gone */
      }
    };
  }, [navigate]);

  const waiting = !error && !mounted;

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

        {/* Stripe's form is a fixed single column that does not reflow, so the
            page makes its own second column rather than leaving a narrow strip
            stranded on a wide screen. Stacks below the md breakpoint. */}
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
                    sx={{
                      mt: '7px',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: colors.orange,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 1.5, color: colors.inkSoft }}>
                    {line}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Stripe's form carries the live total. This says what the price
                is without competing with it — a static number here would
                contradict the form the moment a code is applied. */}
            <Box sx={{ borderTop: `1px solid ${colors.sand200}`, pt: 2.5 }}>
              <Typography sx={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 1.55, color: colors.inkSoft }}>
                List price is <strong style={{ color: colors.navy900 }}>${LIST_PRICE_USD} per leader, per year</strong>.
                If you were given an introductory code, enter it with <strong style={{ color: colors.navy900 }}>Add code</strong> and
                the total updates before you pay.
              </Typography>
            </Box>
          </Box>

          <Box>
            {/* Stripe paints its own surface here — nothing wraps it. */}
            <Box ref={mountRef} sx={{ width: '100%' }} />

            {waiting && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 8,
                }}
              >
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
