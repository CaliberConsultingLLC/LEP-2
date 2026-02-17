import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleBeginJourney = () => {
    console.log('Begin Your Journey button clicked, navigating to /landing');
    navigate('/landing');
  };

  const handleResumeJourney = () => {
    console.log('Resume Your Journey button clicked, navigating to /sign-in');
    navigate('/sign-in');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: 'linear-gradient(rgba(8, 14, 26, 0.78), rgba(8, 14, 26, 0.78)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Stack spacing={4} alignItems="center" justifyContent="center" sx={{ width: '100%', px: 2 }}>
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/CompassLogo.png"
            alt="Compass Logo"
            style={{ width: '620px', maxWidth: '82vw', height: 'auto' }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              transform: 'translateY(3%)',
            }}
          >
            <Box
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                color: '#ffffff',
                fontSize: { xs: '1.9rem', sm: '2.45rem' },
                fontWeight: 700,
                letterSpacing: '0.035em',
                textShadow: '0 3px 14px rgba(0,0,0,0.75)',
              }}
            >
              THE COMPASS
            </Box>
          </Box>
        </Box>

        <Stack spacing={2} direction="row" justifyContent="center" alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={handleBeginJourney}
            sx={{
              fontSize: '0.92rem',
              px: 2.8,
              py: 1.05,
              bgcolor: '#457089',
              '&:hover': { bgcolor: '#375d78' },
            }}
          >
            Begin Your Journey
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResumeJourney}
            sx={{
              fontSize: '0.92rem',
              px: 2.8,
              py: 1.05,
              bgcolor: '#457089',
              '&:hover': { bgcolor: '#375d78' },
            }}
          >
            Resume Your Journey
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ position: 'absolute', right: 28, bottom: 24 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/dev-skip-1')}
          sx={{
            fontSize: '0.82rem',
            px: 2.1,
            py: 0.7,
            color: 'rgba(255,255,255,0.92)',
            borderColor: 'rgba(255,255,255,0.45)',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.75)',
              backgroundColor: 'rgba(255,255,255,0.06)',
            },
          }}
        >
          Dev Skip
        </Button>
      </Box>
    </Box>
  );
}

export default Home;