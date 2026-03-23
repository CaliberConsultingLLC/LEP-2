import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { buildPasswordResetActionSettings } from '../utils/authActionLinks';

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

  const clearLocalCampaignState = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          key === 'campaignRecords'
          || key === 'currentCampaign'
          || key === 'selfCampaignCompleted'
          || key === 'teamCampaignCompleted'
          || key.startsWith('selfCampaignCompleted_')
          || key.startsWith('teamCampaignAccess_')
          || /^campaign_[^/]+$/.test(key)
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      localStorage.removeItem('campaignRecords');
      localStorage.removeItem('currentCampaign');
      localStorage.removeItem('selfCampaignCompleted');
      localStorage.removeItem('teamCampaignCompleted');
    }
  };

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

  const hydrateJourneyState = (responseData, setSyncedName) => {
    const intakeDraft = responseData?.intakeDraft || null;
    const intakeStatus = responseData?.intakeStatus || {
      started: Boolean(intakeDraft),
      complete: Boolean(responseData?.latestFormData),
      currentStep: intakeDraft?.currentStep ?? 0,
    };
    const summaryCache = responseData?.summaryCache || {};
    const campaignBundle = responseData?.campaignBundle || {};

    if (intakeDraft) {
      localStorage.setItem('intakeDraft', JSON.stringify(intakeDraft));
    } else {
      localStorage.removeItem('intakeDraft');
    }
    localStorage.setItem('intakeStatus', JSON.stringify(intakeStatus));

    if (responseData?.latestFormData) {
      localStorage.setItem('latestFormData', JSON.stringify(responseData.latestFormData));
    } else {
      localStorage.removeItem('latestFormData');
    }
    if (summaryCache?.aiSummary) {
      localStorage.setItem('aiSummary', summaryCache.aiSummary);
    } else {
      localStorage.removeItem('aiSummary');
    }
    if (summaryCache?.savedAt) {
      localStorage.setItem('summarySavedAt', String(summaryCache.savedAt || '').trim());
    } else {
      localStorage.removeItem('summarySavedAt');
    }
    if (Array.isArray(summaryCache?.focusAreas)) {
      localStorage.setItem('focusAreas', JSON.stringify(summaryCache.focusAreas));
    } else {
      localStorage.removeItem('focusAreas');
    }
    if (campaignBundle?.campaignRecords && typeof campaignBundle.campaignRecords === 'object') {
      const records = campaignBundle.campaignRecords;
      localStorage.setItem('campaignRecords', JSON.stringify(records));
      if (records?.selfCampaignId) {
        const selfDone = Boolean(records?.selfCompleted);
        localStorage.setItem(`selfCampaignCompleted_${records.selfCampaignId}`, selfDone ? 'true' : 'false');
        localStorage.setItem('selfCampaignCompleted', selfDone ? 'true' : 'false');
      }
      localStorage.setItem('teamCampaignCompleted', String(Boolean(records?.teamCampaignClosed)));
    } else {
      localStorage.removeItem('campaignRecords');
      localStorage.removeItem('selfCampaignCompleted');
      localStorage.removeItem('teamCampaignCompleted');
    }
    if (Array.isArray(campaignBundle?.currentCampaign)) {
      localStorage.setItem('currentCampaign', JSON.stringify(campaignBundle.currentCampaign));
    } else {
      clearLocalCampaignState();
    }
    if (responseData?.ownerName) {
      setSyncedName(String(responseData.ownerName || '').trim());
    }
  };

  const logAuthEvent = async ({ emailAddress, status, message }) => {
    try {
      await fetch('/api/log-auth-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'password-reset',
          email: String(emailAddress || '').trim().toLowerCase(),
          status,
          message,
        }),
      });
    } catch (logError) {
      console.warn('Failed to log auth event:', logError);
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
      const credential = await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
      const signedInUser = credential?.user || null;
      const existingUserInfo = (() => {
        try {
          return JSON.parse(localStorage.getItem('userInfo') || '{}');
        } catch {
          return {};
        }
      })();
      let syncedName = String(existingUserInfo?.name || '').trim();

      try {
        if (signedInUser?.uid) {
          const responseSnap = await getDoc(doc(db, 'responses', signedInUser.uid));
          if (responseSnap.exists()) {
            hydrateJourneyState(responseSnap.data() || {}, (nextName) => {
              syncedName = nextName;
            });
          } else {
            localStorage.removeItem('intakeDraft');
            localStorage.removeItem('intakeStatus');
            localStorage.removeItem('latestFormData');
            localStorage.removeItem('aiSummary');
            localStorage.removeItem('summarySavedAt');
            localStorage.removeItem('focusAreas');
            clearLocalCampaignState();
          }
        }
      } catch (syncError) {
        console.warn('Unable to sync saved journey data on sign in:', syncError);
      }

      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          ...existingUserInfo,
          uid: signedInUser?.uid || existingUserInfo?.uid || '',
          email: signedInUser?.email || inputEmail,
          name: syncedName || signedInUser?.displayName || '',
        })
      );

      localStorage.setItem(
        'dashboardSession',
        JSON.stringify({
          active: true,
          email: inputEmail,
          uid: signedInUser?.uid || '',
          signedInAt: new Date().toISOString(),
        })
      );
      const nextPath = location?.state?.from || '/dashboard';
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
      await sendPasswordResetEmail(auth, inputEmail, buildPasswordResetActionSettings(inputEmail));
      logAuthEvent({ emailAddress: inputEmail, status: 'success', message: 'Password reset email sent.' });
      setInfoMessage('Password reset link sent. Check your inbox.');
    } catch (resetError) {
      logAuthEvent({
        emailAddress: inputEmail,
        status: 'failed',
        message: String(resetError?.code || resetError?.message || 'Password reset failed.'),
      });
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
        await sendPasswordResetEmail(auth, prefilledEmail, buildPasswordResetActionSettings(prefilledEmail));
        logAuthEvent({ emailAddress: prefilledEmail, status: 'success', message: 'Password reset email sent.' });
        setInfoMessage('Password reset link sent. Check your inbox.');
      } catch (resetError) {
        logAuthEvent({
          emailAddress: prefilledEmail,
          status: 'failed',
          message: String(resetError?.code || resetError?.message || 'Password reset failed.'),
        });
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
