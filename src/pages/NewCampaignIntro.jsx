import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Stack, Button, Paper, TextField } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import { getLeaderDisplayName, isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';
import { selfAssessmentComplete } from '../data/chapterMap';
import { readLocalCampaignDoc } from '../utils/campaignBundle';
import { useCairnTheme } from '../config/runtimeFlags';
import { buttons, colors, fonts, radii, shadows } from '../styles/tokens';
function NewCampaignIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [surveyClosed, setSurveyClosed] = useState(false);
  const [slide, setSlide] = useState(0);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const SLIDES = [
    { title: 'Confidentiality turns into confidence' },
    { title: 'Honesty leads to real change' },
    { title: 'Two ratings tell the full story' },
  ];
  const leadSx = { fontFamily: fonts.serif, fontWeight: 500, fontSize: { xs: '1.1rem', md: '1.2rem' }, lineHeight: 1.4, color: colors.navy900, maxWidth: 560, mx: 'auto' };
  const bodySx = { fontFamily: fonts.sans, fontSize: '1rem', lineHeight: 1.55, color: colors.inkSoft, maxWidth: 560, mx: 'auto' };
  const goSlide = (dir) => setSlide((i) => Math.min(SLIDES.length - 1, Math.max(0, i + dir)));

  const quotes = [
    "The best leaders don’t create followers; they inspire others to become leaders. — John C. Maxwell",
    "Growth begins when we start to accept our own weaknesses. — Jean Vanier",
    "Leadership is not about being in charge. It’s about taking care of those in your charge. — Simon Sinek",
    "The only way to grow is to step outside your comfort zone. — Unknown",
  ];
  const parseJson = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCampaignData = async () => {
      try {
        const cachedCampaign = parseJson(localStorage.getItem(`campaign_${id}`), {});
        const cachedType = String(cachedCampaign?.campaignType || '').toLowerCase();
        if ((cachedType === 'self' || cachedType === 'team') && cachedCampaign?.campaignType) {
          setSurveyClosed(Boolean(cachedCampaign?.surveyClosed));
          const normalizedCached = {
            ...cachedCampaign,
            campaign: normalizeCampaignItems(cachedCampaign?.campaign),
          };
          if (isMounted) {
            setCampaignData(normalizedCached);
          }
          return;
        }

        let loaded = false;
        try {
          const introResponse = await fetch('/api/get-team-campaign-intro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: id }),
          });
          if (introResponse.ok) {
            const payload = await introResponse.json().catch(() => ({}));
            if (isMounted) {
              setSurveyClosed(Boolean(payload?.campaign?.surveyClosed));
              const cachedTeam = cachedType === 'team' ? {
                ...cachedCampaign,
                campaign: normalizeCampaignItems(cachedCampaign?.campaign),
              } : null;
              setCampaignData({
                campaignType: 'team',
                campaign: cachedTeam?.campaign || [],
                ownerId: payload?.campaign?.ownerId || cachedTeam?.ownerId || null,
                ownerUid: payload?.campaign?.ownerUid || cachedTeam?.ownerUid || null,
                bundleId: payload?.campaign?.bundleId || cachedTeam?.bundleId || null,
                accessToken: cachedTeam?.accessToken || '',
                userInfo: {
                  uid: payload?.campaign?.ownerUid || cachedTeam?.userInfo?.uid || null,
                  name: payload?.campaign?.ownerName || cachedTeam?.userInfo?.name || '',
                },
                surveyClosed: Boolean(payload?.campaign?.surveyClosed),
              });
            }
            loaded = true;
          }
        } catch (introError) {
          console.warn('Team intro API check failed:', introError);
        }

        if (loaded || !isMounted) return;

        const localCampaign = readLocalCampaignDoc(id);
        if (localCampaign && String(localCampaign.campaignType || '').toLowerCase() === 'team') {
          if (isMounted) {
            setSurveyClosed(Boolean(localCampaign?.surveyClosed));
            setCampaignData({
              ...localCampaign,
              campaign: normalizeCampaignItems(localCampaign?.campaign),
            });
          }
          return;
        }

        try {
          const docRef = doc(db, 'campaigns', id);
          const docSnap = await getDoc(docRef);
          if (isMounted && docSnap.exists()) {
            const payload = docSnap.data() || {};
            setSurveyClosed(Boolean(payload?.surveyClosed));
            setCampaignData({
              ...payload,
              password: undefined,
              campaign: normalizeCampaignItems(payload?.campaign),
            });
            loaded = true;
          }
        } catch (firestoreError) {
          console.warn('Campaign Firestore read failed:', firestoreError);
        }

        if (loaded || !isMounted) return;

        if (isMounted) {
          alert('Campaign not found.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching campaign data:', error);
        if (isMounted) {
          alert('Failed to load campaign data.');
          navigate('/');
        }
      }
    };

    fetchCampaignData();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Rotate quotes every 3 seconds during loading
  useEffect(() => {
    if (campaignData) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [campaignData]);

  const isSelfCampaign = campaignData?.campaignType === 'self';
  const leaderName = getLeaderDisplayName(campaignData);
  const hasUsableCampaign = isCampaignReady(campaignData?.campaign, { minTraits: isSelfCampaign ? 1 : 0, minStatementsPerTrait: isSelfCampaign ? 1 : 0 });

  useEffect(() => {
    if (!campaignData || !isSelfCampaign || isNavigating) return;
    if (!hasUsableCampaign) return;
    if (selfAssessmentComplete()) {
      navigate('/self-assessment?step=self', { replace: true });
      return;
    }
    localStorage.setItem(`campaign_${id}`, JSON.stringify(campaignData));
    setIsNavigating(true);
    navigate(`/campaign/${id}/survey`, { replace: true });
  }, [campaignData, hasUsableCampaign, id, isNavigating, isSelfCampaign, navigate]);

  const handleStart = () => {
    if (isNavigating) return;
    if (!isSelfCampaign && surveyClosed) {
      alert('This survey has been closed by the campaign owner. New responses are no longer accepted.');
      return;
    }
    const existingTeamAccess = localStorage.getItem(`teamCampaignAccess_${id}`);
    const cachedCampaign = parseJson(localStorage.getItem(`campaign_${id}`), {});
    if (!isSelfCampaign && existingTeamAccess && isCampaignReady(cachedCampaign?.campaign)) {
      setIsNavigating(true);
      navigate(`/campaign/${id}/survey`, { replace: true });
      setTimeout(() => setIsNavigating(false), 100);
      return;
    }

    const proceed = async () => {
      if (!isSelfCampaign) {
        const enteredPassword = String(passwordInput || '').trim();
        if (!enteredPassword) {
          setPasswordError('Enter the password your leader sent.');
          return;
        }
        setPasswordError('');

        const verifyResponse = await fetch('/api/verify-team-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: id,
            password: enteredPassword,
          }),
        });
        const verifyPayload = await verifyResponse.json().catch(() => ({}));
        if (!verifyResponse.ok) {
          if (verifyResponse.status === 401) {
            setPasswordError('Incorrect password. Please try again.');
            return;
          }
          if (verifyResponse.status === 409) {
            setSurveyClosed(true);
            setPasswordError('This survey has already been closed by the campaign owner.');
            return;
          }
          if (verifyResponse.status === 404) {
            const localTeam = readLocalCampaignDoc(id);
            if (
              localTeam
              && String(localTeam.campaignType || '').toLowerCase() === 'team'
              && String(localTeam.password || '') === enteredPassword
            ) {
              const normalizedLocal = {
                ...localTeam,
                campaign: normalizeCampaignItems(localTeam?.campaign),
                accessToken: String(localTeam?.accessToken || 'stage-team-token'),
              };
              if (!isCampaignReady(normalizedLocal.campaign)) {
                alert('Campaign is not ready yet. Please try again shortly.');
                return;
              }
              localStorage.setItem(`campaign_${id}`, JSON.stringify(normalizedLocal));
              localStorage.setItem(`teamCampaignAccess_${id}`, 'granted');
              setCampaignData(normalizedLocal);
              setIsNavigating(true);
              navigate(`/campaign/${id}/survey`, { replace: true });
              setTimeout(() => setIsNavigating(false), 100);
              return;
            }
            setPasswordError('Campaign not found.');
            return;
          }
          setPasswordError('This campaign could not be verified right now. Please refresh and try again.');
          return;
        }

        const normalizedCampaign = {
          ...(verifyPayload?.campaign || {}),
          campaign: normalizeCampaignItems(verifyPayload?.campaign?.campaign),
          surveyClosed: Boolean(verifyPayload?.campaign?.surveyClosed),
          accessToken: String(verifyPayload?.accessToken || '').trim(),
        };
        if (!isCampaignReady(normalizedCampaign.campaign)) {
          alert('Campaign is not ready yet. Please try again shortly.');
          return;
        }
        localStorage.setItem(`campaign_${id}`, JSON.stringify(normalizedCampaign));
        localStorage.setItem(`teamCampaignAccess_${id}`, 'granted');
        setCampaignData(normalizedCampaign);
      } else {
        if (!hasUsableCampaign) {
          alert('Campaign is not ready yet. Please try again shortly.');
          return;
        }
        localStorage.setItem(`campaign_${id}`, JSON.stringify(campaignData));
      }

      setIsNavigating(true);
      navigate(`/campaign/${id}/survey`, { replace: true });
      setTimeout(() => setIsNavigating(false), 100);
    };

    proceed().catch((err) => {
      console.error('Campaign start failed:', err);
      alert('Failed to start campaign. Please try again.');
      setIsNavigating(false);
    });
  };

  const handleOptOut = () => {
    if (isSelfCampaign) {
      navigate('/');
      return;
    }

    const submitOptOut = async () => {
      let accessToken = String(parseJson(localStorage.getItem(`campaign_${id}`), {})?.accessToken || '').trim();

      if (!accessToken) {
        const enteredPassword = String(passwordInput || '').trim();
        if (!enteredPassword) {
          setPasswordError('Enter the password your leader sent to continue.');
          return;
        }
        const verifyResponse = await fetch('/api/verify-team-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: id,
            password: enteredPassword,
          }),
        });
        const verifyPayload = await verifyResponse.json().catch(() => ({}));
        if (!verifyResponse.ok) {
          if (verifyResponse.status === 401) {
            setPasswordError('Incorrect password. Please try again.');
            return;
          }
          if (verifyResponse.status === 409) {
            setSurveyClosed(true);
            setPasswordError('This survey has already been closed by the campaign owner.');
            return;
          }
          setPasswordError('Campaign could not be verified. Please try again.');
          return;
        }
        accessToken = String(verifyPayload?.accessToken || '').trim();
        if (accessToken) {
          const verifiedCampaign = {
            ...(verifyPayload?.campaign || {}),
            campaign: normalizeCampaignItems(verifyPayload?.campaign?.campaign),
            surveyClosed: Boolean(verifyPayload?.campaign?.surveyClosed),
            accessToken,
          };
          localStorage.setItem(`campaign_${id}`, JSON.stringify(verifiedCampaign));
          localStorage.setItem(`teamCampaignAccess_${id}`, 'granted');
        }
      }

      if (!accessToken) {
        alert('Unable to validate campaign access right now.');
        return;
      }

      await fetch('/api/submit-team-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: id,
          accessToken,
          optedOut: true,
        }),
      }).catch((error) => {
        console.warn('Unable to record anonymous opt-out:', error);
      });

      navigate(`/campaign/${id}/complete`);
    };

    submitOptOut().catch((error) => {
      console.warn('Opt-out flow failed:', error);
      navigate(`/campaign/${id}/complete`);
    });
  };


  if (!campaignData) {
    return (
      <LoadingScreen
        title="Loading your campaign..."
        subtitle="Pulling your campaign details and preparing your next steps."
        hint={quotes[currentQuoteIndex]}
      />
    );
  }

  return (
    <Box
      sx={useCairnTheme
        ? {
            position: 'relative',
            minHeight: '100vh',
            width: '100%',
            overflowX: 'hidden',
            bgcolor: colors.sand50,
          }
        : {
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP1.jpg)',
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
      }}
    >
      {useCairnTheme
        ? <ProcessTopRail {...(isSelfCampaign ? { chapterId: 'self', activeStepId: 'self' } : { utilityOnly: true })} />
        : <ProcessTopRail />}
      <Container maxWidth={false} disableGutters sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: useCairnTheme ? 'calc(100vh - 80px)' : undefined,
      }}>
        <Paper
          sx={useCairnTheme
            ? {
                p: { xs: 3, md: 4.5 },
                border: `1px solid ${colors.sand200}`,
                borderRadius: radii.lg,
                boxShadow: shadows.card,
                bgcolor: colors.surface1,
                maxWidth: 920,
                mx: 'auto',
                width: '100%',
              }
            : {
            p: { xs: 2.2, md: 3.2 },
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
            boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
            bgcolor: 'rgba(255,255,255,0.94)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.82))',
            maxWidth: 1280,
            mx: 'auto',
          }}
        >
          <Typography sx={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: colors.orangeDeep,
            mb: 1,
          }}>
            The Compass
          </Typography>
          <Typography component="h1" sx={{
            fontFamily: fonts.serif,
            fontSize: { xs: '1.8rem', md: '2.3rem' },
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            mb: 1.25,
            color: colors.navy900,
          }}>
            Leadership Growth Assessment
          </Typography>
          <Typography sx={{
            fontFamily: fonts.sans,
            fontSize: { xs: '1rem', md: '1.05rem' },
            color: colors.inkSoft,
            mb: 3,
            maxWidth: 640,
            mx: 'auto',
            lineHeight: 1.55,
          }}>
            15 short questions about the leadership you see day to day in your manager. This takes about 5 minutes. Your answers are completely confidential.
          </Typography>

          {/* Three short cards, one at a time, so the page stays one page. */}
          <Box
            role="group"
            aria-roledescription="carousel"
            aria-label="How this works"
            sx={{ mb: 2.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'stretch', gap: { xs: 0.75, md: 1.5 } }}>
              <Button
                onClick={() => goSlide(-1)}
                disabled={slide <= 0}
                aria-label="Previous"
                sx={{ ...buttons.secondary, minWidth: 44, px: 0, alignSelf: 'center', opacity: slide <= 0 ? 0.35 : 1 }}
              >
                ‹
              </Button>

              <Box
                aria-live="polite"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: { xs: 360, md: 270 },
                  textAlign: 'center',
                  bgcolor: colors.sand50,
                  border: `1px solid ${colors.sand200}`,
                  borderRadius: radii.md,
                  p: { xs: 2, md: 2.75 },
                }}
              >
                <Typography sx={{
                  fontFamily: fonts.serif, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.4rem' },
                  color: colors.orangeDeep, mb: 1.5, lineHeight: 1.2,
                }}>
                  {SLIDES[slide].title}
                </Typography>

                {slide === 0 && (
                  <Stack spacing={1.75} alignItems="center" sx={{ textAlign: 'center' }}>
                    <Typography sx={{ ...leadSx, fontWeight: 800, color: colors.orangeDeep, fontFamily: fonts.sans }}>
                      No names, no accounts, no tracking. You can be confident that your answers are stored without anything that identifies you.
                    </Typography>
                    <Typography sx={bodySx}>
                      We do not ask for your email, and we do not store your IP address with your answers.
                    </Typography>
                    <Typography sx={{ ...bodySx, fontWeight: 800, color: colors.navy500 }}>
                      Only your leader will see the combined results. No one else in the organization sees them at all, so you can be confident your answers are going to the right place.
                    </Typography>
                    <Typography sx={bodySx}>
                      Taking part is optional. You can opt out below, and your leader will not be told it was you.
                    </Typography>
                  </Stack>
                )}

                {slide === 1 && (
                  <Stack spacing={1.75} alignItems="center" sx={{ textAlign: 'center' }}>
                    <Typography sx={{ ...leadSx, fontWeight: 800, color: colors.orangeDeep, fontFamily: fonts.sans }}>
                      Rate your honest experience.
                    </Typography>
                    <Typography sx={bodySx}>
                      This campaign was built specifically for {leaderName}. No other leader has one like it. They are choosing to work on a few aspects of their leadership approach, and your honesty helps them make the right changes.
                    </Typography>
                    <Typography sx={bodySx}>
                      Take your time. There are no right or wrong answers.
                    </Typography>
                    <Typography sx={{ ...bodySx, fontWeight: 800, color: colors.navy500 }}>
                      Each question has two parts: you will rate their effort and their effectiveness.
                    </Typography>
                  </Stack>
                )}

                {slide === 2 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, mb: 1.75 }}>
                      {[
                        {
                          key: 'effort', color: '#E07A3F', tint: 'rgba(224,122,63,0.08)', line: 'rgba(224,122,63,0.35)',
                          title: 'Effort', def: 'How much they try at this.',
                          example: 'A manager who checks in with you every week is putting in a lot of effort.', bar: 0.9,
                        },
                        {
                          key: 'efficacy', color: '#6393AA', tint: 'rgba(99,147,170,0.08)', line: 'rgba(99,147,170,0.38)',
                          title: 'Effectiveness', def: 'How well it actually lands for you.',
                          example: 'But if those check-ins never clear anything up, effectiveness is low.', bar: 0.3,
                        },
                      ].map((scale) => (
                        <Box key={scale.key} sx={{ bgcolor: scale.tint, border: `1px solid ${scale.line}`, borderRadius: radii.md, p: 1.75 }}>
                          <Typography sx={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: '1.1rem', color: scale.color }}>
                            {scale.title}
                          </Typography>
                          <Typography sx={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: '0.95rem', color: colors.navy900, mb: 0.75 }}>
                            {scale.def}
                          </Typography>
                          <Box aria-hidden sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(15,30,58,0.08)', mb: 0.9, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${scale.bar * 100}%`, bgcolor: scale.color, borderRadius: 999 }} />
                          </Box>
                          <Typography sx={{ fontFamily: fonts.sans, fontSize: '0.86rem', color: colors.inkSoft, lineHeight: 1.5 }}>
                            {scale.example}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography sx={bodySx}>
                      These two ratings are separate and both meaningful. Together they will help guide the leader&rsquo;s action planning.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Button
                onClick={() => goSlide(1)}
                disabled={slide >= SLIDES.length - 1}
                aria-label="Next"
                sx={{ ...buttons.secondary, minWidth: 44, px: 0, alignSelf: 'center', opacity: slide >= SLIDES.length - 1 ? 0.35 : 1 }}
              >
                ›
              </Button>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
              {SLIDES.map((s, i) => (
                <Box
                  key={s.title}
                  component="button"
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Go to ${s.title}`}
                  aria-current={i === slide ? 'true' : undefined}
                  sx={{
                    all: 'unset', cursor: 'pointer', width: 10, height: 10, borderRadius: '50%',
                    bgcolor: i === slide ? colors.orangeDeep : colors.sand300,
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{
            maxWidth: 460,
            mx: 'auto',
            pt: 2.5,
            borderTop: `1px solid ${colors.sand200}`,
          }}>
            {!isSelfCampaign && (
              <>
                <Typography sx={{
                  fontFamily: fonts.sans,
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  color: colors.inkSoft,
                  lineHeight: 1.55,
                  mb: 1.5,
                }}>
                  Enter the password your leader sent you. You do not need to sign up for an account.
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  autoComplete="off"
                  label="Campaign password"
                  value={passwordInput}
                  onChange={(event) => {
                    setPasswordInput(event.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  error={Boolean(passwordError)}
                  helperText={passwordError || ' '}
                  sx={{ mb: 1 }}
                />
              </>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                onClick={handleStart}
                disabled={isNavigating || (!isSelfCampaign && surveyClosed)}
                sx={{ ...buttons.primary, minHeight: 48, px: 4, flex: { sm: 1 } }}
              >
                {!isSelfCampaign && surveyClosed ? 'Survey closed' : 'Take the survey'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleOptOut}
                disabled={isNavigating}
                sx={{ ...buttons.secondary, minHeight: 48, px: 4, flex: { sm: 1 } }}
              >
                Opt out
              </Button>
            </Stack>
            {!isSelfCampaign && surveyClosed && (
              <Typography sx={{ fontFamily: fonts.sans, fontSize: '0.86rem', color: colors.orangeDeep, mt: 1.25 }}>
                This campaign has been closed by the person who sent it. New responses are no longer accepted.
              </Typography>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default NewCampaignIntro;