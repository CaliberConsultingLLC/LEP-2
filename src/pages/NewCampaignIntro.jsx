import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Stack, Button, Paper, Grid } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';

function NewCampaignIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('what');

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
        if (cachedCampaign?.campaignType) {
          const normalizedCached = {
            ...cachedCampaign,
            campaign: normalizeCampaignItems(cachedCampaign?.campaign),
          };
          if (isMounted) {
            setCampaignData(normalizedCached);
          }
          return;
        }

        const localCampaignDocs = parseJson(localStorage.getItem('localCampaignDocs'), {});
        if (localCampaignDocs && localCampaignDocs[id]) {
          const normalizedLocal = {
            ...localCampaignDocs[id],
            campaign: normalizeCampaignItems(localCampaignDocs[id]?.campaign),
          };
          if (isMounted) {
            setCampaignData(normalizedLocal);
          }
          return;
        }

        let loaded = false;
        try {
          const docRef = doc(db, 'campaigns', id);
          const docSnap = await getDoc(docRef);
          if (isMounted && docSnap.exists()) {
            const payload = docSnap.data() || {};
            setCampaignData({
              ...payload,
              campaign: normalizeCampaignItems(payload?.campaign),
            });
            loaded = true;
          }
        } catch (firestoreError) {
          console.warn('Campaign Firestore read failed, trying anonymous intro path:', firestoreError);
        }

        if (loaded || !isMounted) return;

        const introResp = await fetch('/api/get-team-campaign-intro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: id }),
        });
        if (introResp.ok) {
          const payload = await introResp.json();
          if (isMounted) {
            setCampaignData({
              ...(payload?.campaign || { campaignType: 'team' }),
              campaign: normalizeCampaignItems(payload?.campaign?.campaign),
            });
          }
          return;
        }

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
  const hasUsableCampaign = isCampaignReady(campaignData?.campaign, { minTraits: isSelfCampaign ? 1 : 0, minStatementsPerTrait: isSelfCampaign ? 1 : 0 });

  useEffect(() => {
    if (!campaignData || !isSelfCampaign || isNavigating) return;
    if (!hasUsableCampaign) return;
    localStorage.setItem(`campaign_${id}`, JSON.stringify(campaignData));
    setIsNavigating(true);
    navigate(`/campaign/${id}/survey`, { replace: true });
  }, [campaignData, hasUsableCampaign, id, isNavigating, isSelfCampaign, navigate]);

  const handleStart = () => {
    if (isNavigating) return;
    const existingTeamAccess = localStorage.getItem(`teamCampaignAccess_${id}`);
    if (!isSelfCampaign && existingTeamAccess && hasUsableCampaign) {
      setIsNavigating(true);
      navigate(`/campaign/${id}/survey`, { replace: true });
      setTimeout(() => setIsNavigating(false), 100);
      return;
    }

    const proceed = async () => {
      if (!isSelfCampaign) {
        const enteredPassword = prompt('Please enter the campaign password:');
        if (!enteredPassword) return;

        const verifyResp = await fetch('/api/verify-team-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: id, password: enteredPassword }),
        });
        if (!verifyResp.ok) {
          alert('Incorrect password. Please try again.');
          return;
        }

        const payload = await verifyResp.json();
        const normalizedCampaign = {
          ...(payload?.campaign || {}),
          campaign: normalizeCampaignItems(payload?.campaign?.campaign),
        };
        if (!isCampaignReady(normalizedCampaign.campaign)) {
          alert('Campaign is not ready yet. Please try again shortly.');
          return;
        }
        localStorage.setItem(`campaign_${id}`, JSON.stringify(normalizedCampaign));
        localStorage.setItem(`teamCampaignAccess_${id}`, String(payload?.accessToken || ''));
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
    navigate('/');
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
          backgroundImage: 'url(/LEP1.jpg)',
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
      <Container maxWidth={false} disableGutters sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Paper
          sx={{
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
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, mb: 0.8, color: 'text.primary' }}>
            {isSelfCampaign ? 'Welcome to the Compass' : 'Welcome to the Compass'}
          </Typography>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.98rem', color: 'text.secondary', mb: 2.2 }}>
            {isSelfCampaign
              ? 'This personal benchmark helps compare your self-assessment to team feedback later.'
              : 'You are invited to provide feedback that helps your leader grow with clearer, data-backed insight.'}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1} justifyContent="center" sx={{ mb: 2 }}>
            <Button
              variant={activeSection === 'what' ? 'contained' : 'outlined'}
              onClick={() => setActiveSection('what')}
              sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700 }}
            >
              What is the Compass
            </Button>
            <Button
              variant={activeSection === 'how' ? 'contained' : 'outlined'}
              onClick={() => setActiveSection('how')}
              sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700 }}
            >
              How Does it Work
            </Button>
            <Button
              variant={activeSection === 'agreement' ? 'contained' : 'outlined'}
              onClick={() => setActiveSection('agreement')}
              sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700 }}
            >
              Agreement
            </Button>
          </Stack>

          {activeSection === 'what' && (
            <Grid container spacing={1.2} sx={{ textAlign: 'left' }}>
              {[
                {
                  title: 'Description',
                  body: 'The Compass is a leadership growth system that compares intent to lived team experience across key leadership traits.',
                },
                {
                  title: 'Purpose',
                  body: 'It helps reveal where leadership behaviors are landing well and where gaps may be limiting trust, alignment, and momentum.',
                },
                {
                  title: 'Intent',
                  body: 'The intent is practical growth over time through clear insights, focused action, and repeated measurement across campaigns.',
                },
              ].map((card) => (
                <Grid item xs={12} md={4} key={card.title}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, minHeight: 128, border: '1px solid rgba(69,112,137,0.24)', bgcolor: 'rgba(255,255,255,0.86)' }}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.98rem', mb: 0.6 }}>{card.title}</Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.5 }}>
                      {card.body}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {activeSection === 'how' && (
            <Box
              sx={{
                display: 'grid',
                gap: 1.2,
                textAlign: 'left',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(5, minmax(0, 1fr))',
                },
              }}
            >
              {[
                {
                  title: 'Discovery (AI-powered gap analysis)',
                  body: 'The platform identifies likely leadership friction points and surfaces where effort and efficacy may be misaligned.',
                },
                {
                  title: 'Self-Assessment',
                  body: 'The leader first completes the campaign personally to set a baseline for later comparison against team feedback.',
                },
                {
                  title: 'Team Assessment',
                  body: 'Team members then complete the same campaign experience so aggregate feedback can be compared to self-perception.',
                },
                {
                  title: 'Insights Lead to Action',
                  body: 'Results are translated into focused priorities and practical actions tied to the most meaningful growth opportunities.',
                },
                {
                  title: 'Rinse and Repeat',
                  body: 'Leaders run additional campaigns over time to track progress, close gaps, and sustain measurable leadership growth.',
                },
              ].map((card) => (
                <Paper key={card.title} sx={{ p: 1.5, borderRadius: 2, minHeight: 128, border: '1px solid rgba(69,112,137,0.24)', bgcolor: 'rgba(255,255,255,0.86)' }}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.98rem', mb: 0.6 }}>{card.title}</Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.5 }}>
                    {card.body}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}

          {activeSection === 'agreement' && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(224,122,63,0.32)', bgcolor: 'rgba(255,250,244,0.92)' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.93rem', lineHeight: 1.6, color: 'text.primary', textAlign: 'left', mb: 1.2 }}>
                Please provide candid, honest feedback so this process can be useful for leadership growth. Your participation is optional. If you do not wish to provide feedback for any reason, you may opt out anonymously.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1} justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStart}
                  disabled={isNavigating}
                  sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700, px: 3 }}
                >
                  Proceed with Feedback
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleOptOut}
                  sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700, px: 3 }}
                >
                  Opt Out Anonymously
                </Button>
              </Stack>
            </Paper>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default NewCampaignIntro;