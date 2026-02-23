import React, { useState } from 'react';
import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = () => {
    setError('');
    const stored = localStorage.getItem('dashboardCredentials');
    let credentials = null;
    try {
      credentials = stored ? JSON.parse(stored) : null;
    } catch {
      credentials = null;
    }

    const savedEmail = String(credentials?.email || '').trim().toLowerCase();
    const savedPassword = String(credentials?.password || '');
    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPassword = String(password || '');

    if (!savedEmail || !savedPassword) {
      setError('No dashboard credentials were found on this browser yet.');
      return;
    }

    if (inputEmail === savedEmail && inputPassword === savedPassword) {
      localStorage.setItem(
        'dashboardSession',
        JSON.stringify({
          active: true,
          email: savedEmail,
          signedInAt: new Date().toISOString(),
        })
      );
      const selfCompleted = localStorage.getItem('selfCampaignCompleted') === 'true';
      const nextPath = selfCompleted ? (location?.state?.from || '/dashboard') : '/campaign-verify';
      navigate(nextPath, { replace: true });
      return;
    }

    setError('Invalid email or password.');
  };

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
                if (e.key === 'Enter') handleSignIn();
              }}
            />

            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={() => navigate('/')}>
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={handleSignIn}>
                Sign In
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default SignIn;
