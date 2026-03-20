import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AltRoute,
  Lightbulb,
  OutlinedFlag,
  ReportProblemOutlined,
} from '@mui/icons-material';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ProcessTopRail from '../components/ProcessTopRail';
import { auth, db } from '../firebase';

const parseJson = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const SECTION_META = [
  {
    title: 'Trailhead',
    description: 'A static copy of your original leadership reflection.',
    icon: OutlinedFlag,
  },
  {
    title: 'Current Trail Markers',
    description: 'Signals that stood out in your first reflection pass.',
    icon: AltRoute,
  },
  {
    title: 'Upcoming Hazards',
    description: 'Risks identified if the current pattern continues unchanged.',
    icon: ReportProblemOutlined,
  },
  {
    title: 'A New Trail',
    description: 'The forward-looking direction captured in your summary output.',
    icon: Lightbulb,
  },
];

function SummarySnapshot() {
  const [aiSummary, setAiSummary] = useState(() => String(localStorage.getItem('aiSummary') || '').trim());
  const [userName, setUserName] = useState(() => {
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    return String(userInfo?.name || '').trim();
  });
  const [savedAt, setSavedAt] = useState(() => String(localStorage.getItem('summarySavedAt') || '').trim());
  const [isHydrating, setIsHydrating] = useState(true);

  const formatSavedAt = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.uid) {
        if (active) setIsHydrating(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'responses', user.uid));
        if (!active) return;
        if (!snap.exists()) {
          setIsHydrating(false);
          return;
        }
        const payload = snap.data() || {};
        const summaryCache = payload?.summaryCache || {};
        const cachedSummary = String(summaryCache?.aiSummary || '').trim();
        if (cachedSummary) {
          setAiSummary(cachedSummary);
          localStorage.setItem('aiSummary', cachedSummary);
        }
        if (summaryCache?.savedAt) {
          const savedValue = String(summaryCache.savedAt || '').trim();
          setSavedAt(savedValue);
          localStorage.setItem('summarySavedAt', savedValue);
        }
        if (!userName && payload?.ownerName) {
          setUserName(String(payload.ownerName || '').trim());
        }
      } catch (err) {
        console.warn('Unable to load cached summary snapshot:', err);
      } finally {
        if (active) setIsHydrating(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [userName]);

  const sections = useMemo(() => {
    const parts = String(aiSummary || '')
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    return SECTION_META.map((meta, index) => ({
      ...meta,
      text: parts[index] || '',
    }));
  }, [aiSummary]);

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
            'linear-gradient(120deg, rgba(14,26,40,0.84), rgba(22,38,56,0.82)), url(/LEP2.jpg)',
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
      <ProcessTopRail titleOverride="Leadership Reflection Snapshot" />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack spacing={2.4}>
          <Paper
            elevation={0}
            sx={{
              px: { xs: 2.4, md: 3.2 },
              py: { xs: 2.6, md: 3 },
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(243,247,252,0.9))',
              boxShadow: '0 14px 34px rgba(15,23,42,0.18)',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: { xs: '1.7rem', md: '2.1rem' },
                fontWeight: 800,
                color: '#13263A',
              }}
            >
              {userName ? `${userName}'s Reflection Snapshot` : 'Reflection Snapshot'}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.98rem',
                color: 'rgba(19,38,58,0.72)',
                maxWidth: 760,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              This is a static copy of the original leadership summary so you can revisit the reflection without rerunning the experience.
            </Typography>
            {savedAt && (
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.9rem',
                  color: 'rgba(19,38,58,0.58)',
                }}
              >
                Saved to your account on {formatSavedAt(savedAt)}.
              </Typography>
            )}
          </Paper>

          {isHydrating && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Loading your saved reflection snapshot...
            </Alert>
          )}

          {sections.some((section) => section.text) ? (
            sections.map(({ title, description, text, icon: Icon }) => (
              <Paper
                key={title}
                elevation={0}
                sx={{
                  px: { xs: 2.2, md: 3 },
                  py: { xs: 2.2, md: 2.6 },
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.14)',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(224,122,63,0.14)',
                      border: '1px solid rgba(224,122,63,0.34)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 30, color: '#E07A3F' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: { xs: '1.2rem', md: '1.35rem' },
                        fontWeight: 800,
                        color: '#13263A',
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.4,
                        mb: 1.2,
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '0.94rem',
                        color: 'rgba(19,38,58,0.64)',
                      }}
                    >
                      {description}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: { xs: '1rem', md: '1.06rem' },
                        color: '#20384F',
                        lineHeight: 1.9,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {text || 'No cached text available for this section yet.'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))
          ) : (
            <Paper
              elevation={0}
              sx={{
                px: { xs: 2.2, md: 3 },
                py: { xs: 2.4, md: 2.8 },
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
                boxShadow: '0 12px 28px rgba(15,23,42,0.14)',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '1.08rem',
                  color: '#20384F',
                }}
              >
                Your reflection snapshot is not cached yet. Complete the intake summary once and it will appear here for future review.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default SummarySnapshot;
