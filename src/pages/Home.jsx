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
        backgroundImage: 'linear-gradient(rgba(8, 14, 26, 0.40), rgba(8, 14, 26, 0.40)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.40), rgba(0,0,0,0.40)), url(/CompassLogo.png)',
          backgroundSize: 'min(86vw, 980px) auto',
          backgroundPosition: 'center 42%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.95,
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Stack spacing={4} alignItems="center" justifyContent="center" sx={{ width: '100%', px: 2, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                color: 'transparent',
                fontSize: { xs: '4.2rem', sm: '6.2rem', md: '8.2rem' },
                fontWeight: 800,
                lineHeight: 0.95,
                textTransform: 'uppercase',
                letterSpacing: '0.028em',
                backgroundImage:
                  'linear-gradient(135deg, rgba(215,232,255,0.95) 0%, rgba(137,187,233,0.9) 52%, rgba(93,161,227,0.95) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextStroke: '1.2px rgba(255,255,255,0.28)',
                textShadow: '0 12px 22px rgba(0,0,0,0.38)',
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