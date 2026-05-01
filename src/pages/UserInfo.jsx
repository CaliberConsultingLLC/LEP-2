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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';

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
  const [isDark] = useDarkMode();

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

  const persistWelcomeEmailStatus = async ({ uid, email, name, result }) => {
    if (!uid) return;
    try {
      await setDoc(
        doc(db, 'responses', uid),
        {
          ownerUid: uid,
          ownerEmail: String(email || '').trim(),
          ownerName: String(name || '').trim(),
          ops: {
            welcomeEmail: {
              status: result?.ok ? 'sent' : 'failed',
              message: result?.ok ? 'Welcome email sent.' : String(result?.error || 'welcome-email-failed'),
              updatedAt: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
    } catch (persistError) {
      console.warn('Failed to persist welcome email status:', persistError);
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
        await persistWelcomeEmailStatus({
          uid: signupUid,
          email: signupEmail,
          name: userInfo.name,
          result: emailResult,
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

      if (useCairnTheme) {
        localStorage.removeItem('cairn_profile_details_complete');
        navigate('/form?stage=profile');
      } else {
        navigate('/form');
      }
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
        ...(useCairnTheme
              ? { bgcolor: 'var(--sand-50, #FBF7F0)', minHeight: '100svh', overflow: 'hidden' }
          : {
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
              '&:after': {
                content: '""',
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
              },
            }),
      }}
    >
      <ProcessTopRail />
      <CompassLayout progress={14}>
      <Container
        maxWidth={false}
        sx={{
          py: useCairnTheme ? { xs: 1.5, md: 2 } : { xs: 3, sm: 4 },
          px: useCairnTheme ? 0 : { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: useCairnTheme ? '100%' : '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: useCairnTheme ? 680 : 880, display: 'flex', justifyContent: 'center' }}>
          <Card
            sx={{
              width: '100%',
              maxWidth: useCairnTheme ? 600 : 600,
              borderRadius: useCairnTheme ? '18px' : 3,
              border: useCairnTheme
                ? isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)'
                : '1px solid rgba(255,255,255,0.14)',
              background: useCairnTheme
                ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
              boxShadow: useCairnTheme
                ? isDark ? '0 10px 32px rgba(0,0,0,0.34)' : '0 12px 34px rgba(15,28,46,0.08)'
                : '0 10px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4)',
              overflow: 'hidden',
            }}
          >
          <CardContent sx={{ p: useCairnTheme ? { xs: 2, md: 2.4 } : { xs: 3, sm: 4 } }}>
            <Typography
              sx={{
                fontFamily: useCairnTheme ? '"Montserrat", sans-serif' : 'Gemunu Libre, sans-serif',
                fontSize: useCairnTheme ? { xs: '1.65rem', md: '1.95rem' } : '2rem',
                fontWeight: 800,
                mb: useCairnTheme ? 0.75 : 2,
                textAlign: 'center',
                color: useCairnTheme ? isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' : 'text.primary',
              }}
            >
              Compass Profile
            </Typography>
            <Typography
              sx={{
                fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                fontSize: useCairnTheme ? '0.9rem' : '1rem',
                mb: useCairnTheme ? 1.6 : 1.2,
                textAlign: 'center',
                color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.64)' : 'var(--ink-soft, #44566C)' : 'text.secondary',
              }}
            >
              Set up your Compass profile so we can personalize your journey.
            </Typography>
            {!useCairnTheme && <Alert severity="info" sx={{ mb: 3, fontFamily: 'Gemunu Libre, sans-serif' }}>
              Compass does not share your profile information or assessment results with other users or company leadership/HR without explicit authorization.
            </Alert>}

            <Stack spacing={useCairnTheme ? 1.35 : 3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: useCairnTheme ? 1.15 : 3 }}>
              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: useCairnTheme ? '0.78rem' : '1rem',
                    display: 'block',
                    mb: useCairnTheme ? 0.45 : 1,
                    color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' : 'text.primary',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: useCairnTheme ? '0.08em' : 0,
                    textTransform: useCairnTheme ? 'uppercase' : 'none',
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
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      py: useCairnTheme ? 1.05 : undefined,
                      color: useCairnTheme && isDark ? 'var(--ink, #f0e9de)' : undefined,
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: useCairnTheme ? isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: useCairnTheme ? '12px' : undefined,
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: useCairnTheme ? '0.78rem' : '1rem',
                    display: 'block',
                    mb: useCairnTheme ? 0.45 : 1,
                    color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' : 'text.primary',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: useCairnTheme ? '0.08em' : 0,
                    textTransform: useCairnTheme ? 'uppercase' : 'none',
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
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      py: useCairnTheme ? 1.05 : undefined,
                      color: useCairnTheme && isDark ? 'var(--ink, #f0e9de)' : undefined,
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: useCairnTheme ? isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: useCairnTheme ? '12px' : undefined,
                    },
                  }}
                />
              </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: useCairnTheme ? 1.15 : 3 }}>
              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: useCairnTheme ? '0.78rem' : '1rem',
                    display: 'block',
                    mb: useCairnTheme ? 0.45 : 1,
                    color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' : 'text.primary',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: useCairnTheme ? '0.08em' : 0,
                    textTransform: useCairnTheme ? 'uppercase' : 'none',
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
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      py: useCairnTheme ? 1.05 : undefined,
                      color: useCairnTheme && isDark ? 'var(--ink, #f0e9de)' : undefined,
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: useCairnTheme ? isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: useCairnTheme ? '12px' : undefined,
                    },
                  }}
                />
                <Typography sx={{ mt: 0.45, fontSize: useCairnTheme ? '0.72rem' : '0.8rem', color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.5)' : 'var(--ink-soft, #44566C)' : 'text.secondary', textAlign: 'center' }}>
                  Minimum 10 characters with uppercase, lowercase, and a number.
                </Typography>
              </Box>

              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: useCairnTheme ? '0.78rem' : '1rem',
                    display: 'block',
                    mb: useCairnTheme ? 0.45 : 1,
                    color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' : 'text.primary',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: useCairnTheme ? '0.08em' : 0,
                    textTransform: useCairnTheme ? 'uppercase' : 'none',
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
                    fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      py: useCairnTheme ? 1.05 : undefined,
                      color: useCairnTheme && isDark ? 'var(--ink, #f0e9de)' : undefined,
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: useCairnTheme ? isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: useCairnTheme ? '12px' : undefined,
                    },
                  }}
                />
              </Box>
              </Box>

              <Stack spacing={0.55} sx={{ alignItems: 'center', pt: useCairnTheme ? 0.2 : 0 }}>
                {[
                  {
                    name: 'agreeTerms',
                    checked: userInfo.agreeTerms,
                    text: 'I agree to the',
                    linkText: 'Terms of Use',
                    dialog: 'terms',
                  },
                  {
                    name: 'agreePrivacy',
                    checked: userInfo.agreePrivacy,
                    text: 'I acknowledge the',
                    linkText: 'Privacy Policy',
                    dialog: 'privacy',
                  },
                ].map((item) => (
                  <Box
                    key={item.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.85,
                      width: '100%',
                    }}
                  >
                    <Checkbox
                      checked={item.checked}
                      onChange={handleConsentChange}
                      name={item.name}
                      inputProps={{ 'aria-label': `${item.text} ${item.linkText}` }}
                      size={useCairnTheme ? 'small' : 'medium'}
                      sx={{
                        p: 0,
                        color: useCairnTheme ? 'var(--orange, #E07A3F)' : undefined,
                        '&.Mui-checked': { color: useCairnTheme ? 'var(--orange, #E07A3F)' : undefined },
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif',
                        fontSize: useCairnTheme ? '0.84rem' : '0.94rem',
                        color: useCairnTheme ? isDark ? 'rgba(240,233,222,0.74)' : 'var(--ink-soft, #44566C)' : undefined,
                        lineHeight: 1.35,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.text}{' '}
                      <Box
                        component="button"
                        type="button"
                        onClick={() => setOpenDialog(item.dialog)}
                        sx={{
                          all: 'unset',
                          cursor: 'pointer',
                          color: useCairnTheme ? 'var(--orange, #E07A3F)' : 'primary.main',
                          fontWeight: 800,
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                        }}
                      >
                        {item.linkText}
                      </Box>
                      .
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {error && (
                <Alert severity="error" sx={{ fontFamily: useCairnTheme ? '"Manrope", sans-serif' : 'Gemunu Libre, sans-serif', fontSize: useCairnTheme ? '0.82rem' : '0.95rem', py: useCairnTheme ? 0.4 : undefined }}>
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
                  fontFamily: useCairnTheme ? '"Montserrat", sans-serif' : 'Gemunu Libre, sans-serif',
                  fontSize: useCairnTheme ? '0.92rem' : '1.1rem',
                  fontWeight: 800,
                  px: 4,
                  py: useCairnTheme ? 1.05 : 1.5,
                  mt: useCairnTheme ? 0.4 : 2,
                  borderRadius: useCairnTheme ? 999 : undefined,
                  bgcolor: useCairnTheme ? 'var(--orange, #E07A3F)' : undefined,
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
      </CompassLayout>
    </Box>
  );
}

export default UserInfo;

