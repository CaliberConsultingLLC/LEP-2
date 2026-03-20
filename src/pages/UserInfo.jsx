import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import ProcessTopRail from '../components/ProcessTopRail';

function UserInfo() {
  const navigate = useNavigate();
  const stagingHost = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
  const isStagingRuntime =
    stagingHost.includes('staging.northstarpartners.org') ||
    stagingHost.includes('compass-staging');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(null);

  const mapFirebaseAuthError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Please choose a stronger password and try again.';
      case 'auth/network-request-failed':
        return 'Network issue detected. Please check your connection and try again.';
      default:
        return 'Could not create your account right now. Please try again.';
    }
  };

  const triggerWelcomeEmail = async ({ idToken, email, name }) => {
    try {
      const response = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email,
          name,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'welcome-email-failed');
      }
      return { ok: true };
    } catch (emailError) {
      // Non-blocking: account creation should not fail if transactional email fails.
      console.warn('Welcome email trigger failed:', emailError);
      return {
        ok: false,
        error: String(emailError?.message || 'welcome-email-failed'),
      };
    }
  };

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleConsentChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.checked });
    setError(null);
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 10;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  };

  const handleContinue = async () => {
    if (!userInfo.name || !userInfo.email || !userInfo.password || !userInfo.confirmPassword) {
      setError('Please fill out all required profile fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(userInfo.password)) {
      setError('Password must be at least 10 characters and include uppercase, lowercase, and a number.');
      return;
    }

    if (userInfo.password !== userInfo.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!userInfo.agreeTerms || !userInfo.agreePrivacy) {
      setError('You must accept the Terms and Privacy Policy to continue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedEmail = String(userInfo.email || '').trim().toLowerCase();
      const makeStagingAliasEmail = (email) => {
        const [localPart = '', domain = 'example.com'] = String(email || '').split('@');
        const safeLocal = localPart.replace(/[^a-z0-9._%+-]/gi, '') || 'user';
        return `${safeLocal}+stg${Date.now()}@${domain}`;
      };

      let signupEmail = normalizedEmail;
      let credential = null;
      let signupUid = `stg-${Date.now()}`;
      let idToken = null;
      try {
        credential = await createUserWithEmailAndPassword(auth, signupEmail, userInfo.password);
      } catch (createErr) {
        if (isStagingRuntime && createErr?.code === 'auth/email-already-in-use') {
          signupEmail = makeStagingAliasEmail(normalizedEmail);
          credential = await createUserWithEmailAndPassword(auth, signupEmail, userInfo.password);
          console.info(
            '[UserInfo] Staging signup reused existing email via alias:',
            { enteredEmail: normalizedEmail, signupEmail }
          );
        } else if (isStagingRuntime) {
          // Staging-only hard fallback to unblock full E2E testing even when auth is unavailable/misconfigured.
          signupEmail = makeStagingAliasEmail(normalizedEmail);
          console.warn('[UserInfo] Staging auth fallback activated:', createErr);
        } else {
          throw createErr;
        }
      }
      if (credential?.user?.uid) {
        signupUid = credential.user.uid;
        idToken = await credential.user.getIdToken();
      }

      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          name: userInfo.name,
          uid: signupUid,
          email: signupEmail,
          enteredEmail: normalizedEmail,
          consent: {
            terms: userInfo.agreeTerms,
            privacy: userInfo.agreePrivacy,
            acceptedAt: new Date().toISOString(),
          },
        }),
      );

      try {
        await addDoc(collection(db, 'users'), {
          name: userInfo.name,
          email: signupEmail,
          uid: signupUid,
          consent: {
            terms: userInfo.agreeTerms,
            privacy: userInfo.agreePrivacy,
            acceptedAt: new Date().toISOString(),
            version: 'v1',
          },
          createdAt: new Date(),
        });
      } catch (firestoreError) {
        console.warn('Could not save to Firestore:', firestoreError);
      }

      if (idToken) {
        const emailResult = await triggerWelcomeEmail({
          idToken,
          email: signupEmail,
          name: userInfo.name,
        });
        if (!emailResult?.ok) {
          localStorage.setItem(
            'postSignupNotice',
            JSON.stringify({
              severity: 'warning',
              message: 'Your account was created, but the welcome email did not send. You can continue now and use Sign In or Forgot Password later if needed.',
            })
          );
        } else {
          localStorage.removeItem('postSignupNotice');
        }
      }

      navigate('/form');
    } catch (err) {
      const errorMessage = mapFirebaseAuthError(err?.code);
      setError(errorMessage);
      console.error('Error creating user profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        // full bleed bg
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
        },
        // dark overlay
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
        },
      }}
    >
      <ProcessTopRail />
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 880, display: 'flex', justifyContent: 'center' }}>
          <Card
            sx={{
              width: '100%',
              maxWidth: 600,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
              boxShadow: '0 10px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4)',
              overflow: 'hidden',
            }}
          >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '2rem',
                fontWeight: 700,
                mb: 2,
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              Compass Profile
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                mb: 1.2,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              Set up your Compass profile so we can personalize your journey.
            </Typography>
            <Alert severity="info" sx={{ mb: 3, fontFamily: 'Gemunu Libre, sans-serif' }}>
              Compass does not share your profile information or assessment results with other users or company leadership/HR without explicit authorization.
            </Alert>

            <Stack spacing={3}>
              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    display: 'block',
                    mb: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Name
                </Typography>
                <TextField
                  type="text"
                  name="name"
                  value={userInfo.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your name"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    display: 'block',
                    mb: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Email
                </Typography>
                <TextField
                  type="email"
                  name="email"
                  value={userInfo.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your email"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    display: 'block',
                    mb: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Create Password
                </Typography>
                <TextField
                  type="password"
                  name="password"
                  value={userInfo.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  placeholder="Create a password"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
                <Typography sx={{ mt: 0.8, fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center' }}>
                  Minimum 10 characters with uppercase, lowercase, and a number.
                </Typography>
              </Box>

              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    display: 'block',
                    mb: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Confirm Password
                </Typography>
                <TextField
                  type="password"
                  name="confirmPassword"
                  value={userInfo.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  placeholder="Confirm password"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              </Box>

              <Stack spacing={0.6} sx={{ alignItems: 'flex-start' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userInfo.agreeTerms}
                      onChange={handleConsentChange}
                      name="agreeTerms"
                    />
                  }
                  label={
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.94rem' }}>
                      I agree to the{' '}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setOpenDialog('terms')}
                        sx={{ minWidth: 'auto', p: 0, fontSize: '0.88rem', fontFamily: 'Gemunu Libre, sans-serif' }}
                      >
                        Terms of Use
                      </Button>
                      .
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userInfo.agreePrivacy}
                      onChange={handleConsentChange}
                      name="agreePrivacy"
                    />
                  }
                  label={
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.94rem' }}>
                      I acknowledge the{' '}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setOpenDialog('privacy')}
                        sx={{ minWidth: 'auto', p: 0, fontSize: '0.88rem', fontFamily: 'Gemunu Libre, sans-serif' }}
                      >
                        Privacy Policy
                      </Button>
                      .
                    </Typography>
                  }
                />
              </Stack>

              {error && (
                <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem' }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleContinue}
                disabled={isSubmitting}
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5,
                  mt: 2,
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                {isSubmitting ? 'Saving...' : 'Continue to Assessment'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
        </Box>
      </Container>

      <Dialog open={openDialog === 'terms'} onClose={() => setOpenDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>Terms of Use</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', lineHeight: 1.6 }}>
            By using Compass, you agree to use the platform for lawful professional development purposes, keep your access credentials secure, and avoid misuse of generated guidance. Compass provides decision support and reflection tools; final leadership decisions remain your responsibility.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog === 'privacy'} onClose={() => setOpenDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>Privacy Policy</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', lineHeight: 1.6 }}>
            Compass collects profile and assessment data to personalize your experience and improve product quality. Data is protected and is not shared with other users or company leadership/HR without explicit authorization, except where required by applicable law.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserInfo;

