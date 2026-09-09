// One shared password in front of the demo.
//
// The demo used to be reachable by anyone who typed /demo. That was fine
// while the only host running it was a staging URL nobody had been given,
// and stops being fine the moment the same build answers to a public domain.
//
// The check runs server-side in `api/demo-login.js`. Nothing is compared
// here, because anything compared here would be sitting in the bundle for
// anyone to read. What this component holds is the result: a session flag
// that lasts until the tab closes.
//
// Dev hosts skip the gate. Typing a password to look at your own work in
// progress is friction with nothing on the other side of it.

import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { buttons, colors, fonts, radii, surfaces, type } from '../styles/tokens';
import '../styles/compass-auth.css';
import { isDevHost } from '../config/runtimeFlags';

const UNLOCK_KEY = 'compassDemoUnlocked';

function readUnlocked() {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

function DemoGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => isDevHost || readUnlocked());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isDevHost) return;
    setUnlocked(readUnlocked());
  }, []);

  const submit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (busy) return;
      setError('');
      setBusy(true);
      try {
        const response = await fetch('/api/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const payload = await response.json().catch(() => ({}));
        // `response.ok` alone is not enough. If /api/demo-login is ever
        // missing or misrouted, the SPA fallback answers with index.html and
        // a cheerful 200 — which would open the demo to any password typed.
        // The server has to say `ok` for itself.
        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.error || 'Could not open the demo.');
        }
        try {
          sessionStorage.setItem(UNLOCK_KEY, '1');
        } catch {
          /* a locked-down browser still gets through for this tab */
        }
        setUnlocked(true);
      } catch (err) {
        setError(err?.message || 'Could not open the demo.');
      } finally {
        setBusy(false);
      }
    },
    [busy, password]
  );

  if (unlocked) return children;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.sand50 || colors.surface1,
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={submit}
        sx={{ ...surfaces.card, width: '100%', maxWidth: 420, p: { xs: 3, md: 4 } }}
      >
        <Typography sx={{ ...type.eyebrow, color: colors.inkSoft, mb: '6px' }}>
          The Compass
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.2,
            color: colors.ink,
            mb: '10px',
          }}
        >
          This demo is by invitation
        </Typography>
        <Typography sx={{ ...type.body, mb: 2.4 }}>
          Enter the password you were given. If you don&rsquo;t have one and think
          you should, ask the person who sent you the link.
        </Typography>

        <Box
          component="input"
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          aria-label="Demo password"
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError('');
          }}
          sx={{
            width: '100%',
            boxSizing: 'border-box',
            px: '14px',
            py: '11px',
            mb: '12px',
            borderRadius: radii.sm,
            border: `1px solid ${colors.navy500}`,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.ink,
            outline: 'none',
            bgcolor: '#fff',
          }}
        />

        {/* Same notice treatment the sign-in page uses; the token set has no
            error colour of its own. */}
        {error && (
          <Box className="ca-notice ca-notice-error" role="alert" sx={{ mb: '12px' }}>
            {error}
          </Box>
        )}

        <Box
          component="button"
          type="submit"
          disabled={busy || !password}
          sx={{
            all: 'unset',
            ...buttons.primary,
            display: 'block',
            boxSizing: 'border-box',
            textAlign: 'center',
            width: '100%',
            cursor: busy || !password ? 'default' : 'pointer',
            opacity: busy || !password ? 0.55 : 1,
          }}
        >
          {busy ? 'Checking…' : 'Open the demo'}
        </Box>
      </Box>
    </Box>
  );
}

export default DemoGate;
