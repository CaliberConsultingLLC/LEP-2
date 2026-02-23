import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Stack, Button } from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';

function NewCampaignIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [campaignData, setCampaignData] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

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
        p: 5,
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            p: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            boxShadow: 4,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
            width: '100%',
          }}
        >
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
            {isSelfCampaign ? 'Your Benchmark Starts Here' : 'Welcome to LEP'}
          </Typography>
          <Stack spacing={2} alignItems="stretch">
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 2, color: 'text.primary' }}>
              {isSelfCampaign
                ? 'Before your team responds, you will complete your own campaign first. This creates your personal benchmark across effort and efficacy so Compass can compare your self-view with your team\'s aggregate ratings for each statement and trait.'
                : 'This journey uses a dual-dimension 9-box approach to assess your leadership. It measures Effort vs. Efficacy, offering a clear view of your strengths and growth areas. This method enhances self-awareness, aligns team feedback, and drives targeted development, empowering you to lead more effectively.'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStart}
              disabled={isNavigating}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
            >
              {isSelfCampaign ? 'Start My Benchmark Survey' : 'Ready to Grow'}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default NewCampaignIntro;