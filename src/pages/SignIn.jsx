import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [hasAutoResetRun, setHasAutoResetRun] = useState(false);

  const mapSignInError = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network issue detected. Please check your connection and try again.';
      default:
        return 'Could not sign in right now. Please try again.';
    }
  };

  const handleSignIn = async () => {
    setError('');
    setInfoMessage('');
    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPassword = String(password || '');

    if (!inputEmail || !inputPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
      localStorage.setItem(
        'dashboardSession',
        JSON.stringify({
          active: true,
          email: inputEmail,
          signedInAt: new Date().toISOString(),
        })
      );
      const selfCompleted = localStorage.getItem('selfCampaignCompleted') === 'true';
      const nextPath = selfCompleted ? (location?.state?.from || '/dashboard') : '/campaign-verify';
      navigate(nextPath, { replace: true });
      return;
    } catch (signInError) {
      setError(mapSignInError(signInError?.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfoMessage('');
    const inputEmail = String(email || '').trim().toLowerCase();
    if (!inputEmail) {
      setError('Enter your email first, then click Forgot Password.');
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, inputEmail);
      setInfoMessage('Password reset link sent. Check your inbox.');
    } catch (resetError) {
      if (resetError?.code === 'auth/user-not-found' || resetError?.code === 'auth/invalid-email') {
        setError('Please enter a valid account email address.');
      } else if (resetError?.code === 'auth/too-many-requests') {
        setError('Too many reset attempts. Please wait and try again.');
      } else {
        setError('Could not send reset email right now. Please try again.');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  useEffect(() => {
    if (hasAutoResetRun) {
      return;
    }

    const params = new URLSearchParams(location.search || '');
    const shouldReset = params.get('reset') === '1';
    const prefilledEmail = String(params.get('email') || '').trim().toLowerCase();
    if (!shouldReset || !prefilledEmail) {
      return;
    }

    setHasAutoResetRun(true);
    setEmail(prefilledEmail);

    const runAutoReset = async () => {
      setError('');
      setInfoMessage('');
      setIsResettingPassword(true);
      try {
        await sendPasswordResetEmail(auth, prefilledEmail);
        setInfoMessage('Password reset link sent. Check your inbox.');
      } catch (resetError) {
        if (resetError?.code === 'auth/user-not-found' || resetError?.code === 'auth/invalid-email') {
          setError('Please enter a valid account email address.');
        } else if (resetError?.code === 'auth/too-many-requests') {
          setError('Too many reset attempts. Please wait and try again.');
        } else {
          setError('Could not send reset email right now. Please try again.');
        }
      } finally {
        setIsResettingPassword(false);
      }
    };

    runAutoReset();
  }, [hasAutoResetRun, location.search]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.52)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.88))',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          }}
        >
          <Stack spacing={2.25}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '2rem', sm: '2.3rem' },
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              Dashboard Sign In
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              Enter your email and password to resume your journey.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}
            {infoMessage && <Alert severity="success">{infoMessage}</Alert>}

            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSignIn();
                }
              }}
            />
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: -0.5 }}>
              <Button
                variant="text"
                size="small"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                sx={{ minWidth: 0, px: 0.4 }}
              >
                {isResettingPassword ? 'Sending reset link...' : 'Forgot Password?'}
              </Button>
            </Stack>

            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={() => navigate('/')}>
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={handleSignIn} disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default SignIn;
