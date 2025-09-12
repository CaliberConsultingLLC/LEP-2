import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Stack, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function NewCampaignIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const handleStart = () => {
  if (isNavigating) return;
  const enteredPassword = prompt('Please enter the campaign password:');
  if (enteredPassword === campaignData?.password) {
    localStorage.setItem(`campaign_${id}`, JSON.stringify(campaignData));
    setIsNavigating(true);
    navigate('/societal-norms', { replace: true });
    setTimeout(() => setIsNavigating(false), 100);
  } else {
    alert('Incorrect password. Please try again.');
  }
};


  if (!campaignData) {
    return (
      <Box
        sx={{
          p: 5,
          minHeight: '100vh',
          width: '100vw',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(/LEP1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center', position: 'relative' }}>
          <Stack
            direction="column"
            alignItems="center"
            sx={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
            }}
          >
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0s',
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.3s',
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.6s',
                }}
              />
            </Stack>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.125rem', color: 'text.primary', mb: 4 }}>
              Loading your campaign...
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.25rem',
                color: 'text.primary',
                fontStyle: 'italic',
                animation: 'fadeInOut 3s ease-in-out infinite',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {quotes[currentQuoteIndex]}
            </Typography>
            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.5); opacity: 0.7; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeInOut {
                  0% { opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { opacity: 0; }
                }
              `}
            </style>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 5,
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(/LEP1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
            Welcome to LEP
          </Typography>
          <Stack spacing={2} alignItems="stretch">
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 2, color: 'text.primary' }}>
              This journey uses a dual-dimension 9-box approach to assess your leadership. It measures Effort vs. Efficacy, offering a clear view of your strengths and growth areas. This method enhances self-awareness, aligns team feedback, and drives targeted development, empowering you to lead more effectively.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStart}
              disabled={isNavigating}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
            >
              Ready to Grow
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default NewCampaignIntro;