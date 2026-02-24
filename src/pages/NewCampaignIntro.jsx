import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Stack, Button, Paper, Grid } from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';

function NewCampaignIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    let isMounted = true;

    const fetchCampaignData = async () => {
      try {
        console.log('Fetching campaign data for ID:', id);
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);
        if (isMounted && docSnap.exists()) {
          console.log('Campaign data found:', docSnap.data());
          setCampaignData(docSnap.data());
        } else if (isMounted) {
          console.log('Campaign not found for ID:', id);
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

  const isSelfCampaign = campaignData?.campaignType === 'self' || new URLSearchParams(location.search).get('mode') === 'self';

  const handleStart = () => {
    if (isNavigating) return;
    if (!isSelfCampaign) {
      const enteredPassword = prompt('Please enter the campaign password:');
      if (enteredPassword !== campaignData?.password) {
        alert('Incorrect password. Please try again.');
        return;
      }
    }
    localStorage.setItem(`campaign_${id}`, JSON.stringify(campaignData));
    setIsNavigating(true);
    navigate(`/campaign/${id}/survey`, { replace: true });
    setTimeout(() => setIsNavigating(false), 100);
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
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4.5 }, textAlign: 'center' }}>
        <Paper
          sx={{
            p: { xs: 2.2, md: 3.2 },
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
            boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
            bgcolor: 'rgba(255,255,255,0.94)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.82))',
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
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(69,112,137,0.24)', bgcolor: 'rgba(255,255,255,0.82)' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', lineHeight: 1.62, color: 'text.primary', textAlign: 'left' }}>
                The Compass is a leadership growth system built around two signals: effort and efficacy. It helps leaders see how their intent compares with how their team experiences them. The goal is clearer leadership behavior, better trust, and measurable improvement over time.
              </Typography>
            </Paper>
          )}

          {activeSection === 'how' && (
            <Grid container spacing={1.2} sx={{ textAlign: 'left' }}>
              {[
                {
                  title: 'Purpose',
                  body: 'Reveal the difference between how leadership is intended and how it is experienced by others.',
                },
                {
                  title: 'Process',
                  body: 'Responses are grouped and scored at statement and trait level to highlight patterns, not personalities.',
                },
                {
                  title: 'Anonymity',
                  body: 'Feedback is aggregated and not presented as individual identifiable responses.',
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

          {activeSection === 'agreement' && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(224,122,63,0.32)', bgcolor: 'rgba(255,250,244,0.92)' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.93rem', lineHeight: 1.6, color: 'text.primary', textAlign: 'left', mb: 1.2 }}>
                Please provide candid, honest feedback so this process can be useful for leadership growth. Your participation is optional. If you do not trust this process or do not want to share feedback, you may opt out anonymously.
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