import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';

function RepositoryLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/repository-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'repository-login-failed');
      }

      localStorage.setItem(
        'repositoryAdminSession',
        JSON.stringify({
          active: true,
          username: payload?.username || username,
          token: payload?.token || '',
          signedInAt: new Date().toISOString(),
        })
      );
      navigate('/dev-repository', { replace: true });
    } catch (loginErr) {
      setError(loginErr?.message || 'Could not sign in to repository.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage:
            'linear-gradient(120deg, rgba(14,26,40,0.86), rgba(22,38,56,0.84)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        },
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            'radial-gradient(760px 360px at 82% 16%, rgba(61,90,120,0.2), transparent 70%), radial-gradient(620px 320px at 12% 40%, rgba(63,92,121,0.16), transparent 75%)',
        },
      }}
    >
      <ProcessTopRail titleOverride="Repository Login" />

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.6, md: 3.2 },
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
            boxShadow: '0 14px 34px rgba(15,23,42,0.18)',
          }}
        >
          <Stack spacing={2}>
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: { xs: '1.55rem', md: '1.9rem' },
                fontWeight: 800,
                color: '#13263A',
                textAlign: 'center',
              }}
            >
              Repository Admin Login
            </Typography>
            <Typography sx={{ textAlign: 'center', color: 'rgba(19,38,58,0.68)' }}>
              Use the static repository credentials to access readonly user and campaign data.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
            <Button variant="contained" onClick={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default RepositoryLogin;
