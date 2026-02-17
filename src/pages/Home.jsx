import React from 'react';
import { Container, Box, Button, Stack } from '@mui/material';
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
        backgroundImage: 'linear-gradient(rgba(8, 14, 26, 0.55), rgba(8, 14, 26, 0.55)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container sx={{ textAlign: 'center', maxWidth: '1100px !important' }}>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.08))',
            boxShadow: '0 18px 40px rgba(0,0,0,0.3)',
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 4 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ mb: 4, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/CompassLogo.png" alt="LEP Logo" style={{ width: '460px', maxWidth: '100%', height: 'auto' }} />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                transform: 'translateY(5%)',
              }}
            >
              <Box
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  color: '#ffffff',
                  fontSize: { xs: '1.5rem', sm: '1.95rem' },
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.6)',
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
                fontSize: '0.98rem',
                px: 3.2,
                py: 1.2,
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
                fontSize: '0.98rem',
                px: 3.2,
                py: 1.2,
                bgcolor: '#457089',
                '&:hover': { bgcolor: '#375d78' },
              }}
            >
              Resume Your Journey
            </Button>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/dev-skip-1')}
              sx={{
                fontSize: '0.9rem',
                px: 2.4,
                py: 0.9,
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
      </Container>
    </Box>
  );
}

export default Home;