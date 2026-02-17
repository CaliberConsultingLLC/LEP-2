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
      }}
    >
      <Box
        component="img"
        src="/CompassLogo.png"
        alt=""
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '86vw', md: '72vw' },
          maxWidth: 900,
          aspectRatio: '1 / 1',
          objectFit: 'cover',
          borderRadius: '50%',
          opacity: 0.96,
          filter: 'brightness(0.68)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Stack spacing={0.2} alignItems="center" justifyContent="center" sx={{ width: '100%', px: 2, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Box
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            color: 'rgba(255,255,255,0.85)',
            fontSize: { xs: '4.3rem', sm: '6.3rem', md: '8.2rem' },
            fontWeight: 800,
            lineHeight: 0.9,
            textTransform: 'uppercase',
            letterSpacing: '0.018em',
            WebkitTextStroke: '1px rgba(0,0,0,0.92)',
            textShadow: 'none',
            pointerEvents: 'none',
            transform: 'translateY(-0.5in)',
          }}
        >
          <Box component="span" sx={{ display: 'block' }}>THE</Box>
          <Box component="span" sx={{ display: 'block' }}>COMPASS</Box>
        </Box>
      </Stack>

      <Stack
        spacing={2}
        direction="row"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        sx={{ position: 'absolute', bottom: '18vh', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}
      >
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

      <Box sx={{ position: 'absolute', right: 28, bottom: 24, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/dashboard')}
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
          Dev Dashboard
        </Button>
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