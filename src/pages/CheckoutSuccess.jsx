import React, { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import { colors, fonts, radii, shadows } from '../styles/tokens';
import { setPaymentStatus } from '../utils/billing';

function CheckoutSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('confirming');

  useEffect(() => {
    const sessionId = String(params.get('session_id') || '').trim();
    if (!sessionId) {
      setStatus('missing');
      setError('No checkout session was found. Return to payment and try again.');
      return undefined;
    }

    let cancelled = false;
    const confirm = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const response = await fetch('/api/confirm-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, uid: userInfo?.uid || '' }),
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok || !payload?.paid) {
          setStatus('unpaid');
          setError(payload?.error || 'Payment is not confirmed yet. If you were charged, wait a moment and refresh.');
          return;
        }
        setPaymentStatus('paid');
        setStatus('paid');
        navigate('/form?stage=intake', { replace: true });
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError('Could not confirm payment. Please refresh this page.');
        }
      }
    };
    confirm();
    return () => { cancelled = true; };
  }, [navigate, params]);

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: colors.sand50, display: 'flex', flexDirection: 'column' }}>
      <ProcessTopRail titleOverride="Payment" subtitleOverride="Confirming your year of Compass." metaOverride={null} />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2, py: 5 }}>
        <Box sx={{ maxWidth: 480, width: '100%', bgcolor: colors.surface1, border: `1px solid ${colors.sand200}`, borderRadius: radii.lg, boxShadow: shadows.card, p: 4, textAlign: 'center' }}>
          <Typography sx={{ fontFamily: fonts.serif, fontSize: 28, color: colors.navy900, mb: 1.5 }}>
            {status === 'paid' ? 'You are in.' : 'Confirming payment'}
          </Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkSoft, mb: 2 }}>
            {status === 'paid'
              ? 'Taking you to the intake.'
              : 'This takes a few seconds. Stay on this page.'}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </Box>
    </Box>
  );
}

export default CheckoutSuccess;
