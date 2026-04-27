import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Stack, LinearProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';

function CampaignIntro() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { aiSummary } = location.state || {};

  useEffect(() => {
    console.log('CampaignIntro: aiSummary from state:', aiSummary);
    if (!aiSummary || aiSummary.trim() === '') {
      console.error('No leadership summary available, redirecting to summary');
      navigate('/summary');
    }
  }, [aiSummary, navigate]);

  const handleProceed = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/campaign-builder', { state: { aiSummary } });
    }, 1000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        ...(useCairnTheme
          ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
          : {
              p: 5,
              width: '100vw',
              backgroundImage: 'url(/LEP2.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }),
      }}
    >
      <ProcessTopRail />
      <CompassLayout progress={57}>
      <Container maxWidth="md" sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
        <Box
          sx={{
            p: 6,
            border: '1px solid black',
            borderRadius: 2,
            boxShadow: 3,
            bgcolor: 'white',
            opacity: 0.925,
            width: '100%',
          }}
        >
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 'bold', mb: 3 }}>
            Building Your Leadership Campaign
          </Typography>
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.125rem', mb: 4 }}>
            Based on your leadership summary, we’re about to create a personalized continuous improvement campaign. This will include 5 core leadership traits to focus on, each with 3 team-facing survey statements for your team to rate. Let’s get started!
          </Typography>
          <Stack spacing={2} direction="column" alignItems="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleProceed}
              disabled={isLoading}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1, bgcolor: '#457089', '&:hover': { bgcolor: '#375d78' } }}
              startIcon={isLoading ? <LinearProgress color="inherit" sx={{ width: '100%' }} /> : null}
            >
              Build My Campaign
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/summary')}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1, bgcolor: '#457089', '&:hover': { bgcolor: '#375d78' } }}
            >
              Back to Summary
            </Button>
          </Stack>
        </Box>
      </Container>
      </CompassLayout>
    </Box>
  );
}

export default CampaignIntro;