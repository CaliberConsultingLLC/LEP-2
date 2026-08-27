import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import { colors, fonts, radii, shadows } from '../styles/tokens';
import {
  INTRO_PRICE_USD,
  LIST_PRICE_USD,
  isIntakeUnlocked,
  setPaymentStatus,
  stripeIsConfigured,
} from '../utils/billing';
import { isDemoSession } from '../utils/demoMode';

function readUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
}

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const canceled = new URLSearchParams(location.search || '').get('canceled') === '1';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const stripeReady = stripeIsConfigured();
  const userInfo = useMemo(() => readUserInfo(), []);

  useEffect(() => {
    if (isDemoSession()) navigate('/form?stage=intake', { replace: true });
  }, [navigate]);

  const startCheckout = async () => {
    setError('');
    if (!stripeReady) {
      setPaymentStatus('preview');
      navigate('/form?stage=intake');
      return;
    }
    if (isIntakeUnlocked()) {
      navigate('/form?stage=intake');
      return;
    }

    setBusy(true);
    try {
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
      if (!response.ok || !payload?.url) {
        setError(payload?.error || 'Could not start checkout. Please try again.');
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError('Could not start checkout. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: colors.sand50, display: 'flex', flexDirection: 'column' }}>
      <ProcessTopRail utilityOnly />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2, py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 520,
            bgcolor: colors.surface1,
            border: `1px solid ${colors.sand200}`,
            borderRadius: radii.lg,
            boxShadow: shadows.card,
            p: { xs: 3, md: 4 },
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.orangeDeep, mb: 1.5 }}>
            Per leader / year
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1.25, mb: 1 }}>
            <Typography sx={{ fontFamily: fonts.serif, fontSize: 22, color: colors.inkSoft, textDecoration: 'line-through' }}>
              ${LIST_PRICE_USD}
            </Typography>
            <Typography sx={{ fontFamily: fonts.serif, fontSize: 48, fontWeight: 600, color: colors.navy900, letterSpacing: '-0.04em' }}>
              ${INTRO_PRICE_USD}
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 1.55, color: colors.inkSoft, mb: 2.5 }}>
            Introductory price for the first set of users. Then ${LIST_PRICE_USD} per leader, per year.
            Same Compass either way: intake, written reflection, team campaign, and the year on the dashboard.
          </Typography>

          {canceled && (
            <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
              Payment was canceled. You can try again when you are ready.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>
          )}
          {!stripeReady && (
            <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
              Checkout is not live yet. Continue to the intake while Stripe is being connected.
            </Alert>
          )}

          <Box
            component="button"
            type="button"
            onClick={startCheckout}
            disabled={busy}
            sx={{
              all: 'unset',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              px: '32px',
              borderRadius: 999,
              bgcolor: colors.navy900,
              color: colors.amberSoft,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: '0 10px 32px rgba(16,34,60,0.28)',
              '&:hover': busy ? {} : { bgcolor: colors.navy800 },
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            {busy ? 'Opening checkout…' : stripeReady ? `Pay $${INTRO_PRICE_USD} and begin intake` : 'Continue to intake'}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Checkout;
