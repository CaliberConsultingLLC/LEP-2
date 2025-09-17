import React from 'react';
import { Container, Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
// Firestore imports removed – dev skips will navigate to dedicated tester pages


function Home() {
  const navigate = useNavigate();



  const handleGetStarted = () => {
    console.log('Get Started button clicked, navigating to /campaign-intro');
    navigate('/form');
  };

  return (
    <Box
      sx={{
        bgcolor: 'white',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container sx={{ textAlign: 'center' }}>
        <Box sx={{ mb: 6 }}>
          <img src="/logo.jpg" alt="LEP Logo" style={{ width: '600px', height: 'auto' }} />
        </Box>
        <Stack spacing={2} direction="column" alignItems="center">
  {/* Normal flow */}
  <Button
    variant="contained"
    color="primary"
    onClick={handleGetStarted}   // navigates to /form
    sx={{ fontSize: '1.125rem', px: 4, py: 2, bgcolor: '#457089', '&:hover': { bgcolor: '#375d78' } }}
  >
    Get Started
  </Button>

  {/* Dev tester flow */}
  <Button
    variant="outlined"
    color="primary"
    onClick={() => navigate('/dev-skip-1')}
    sx={{ fontSize: '1.125rem', px: 4, py: 2 }}
  >
    Dev Skip — Random Intake + Summary
  </Button>
</Stack>


      </Container>
    </Box>
  );
}

export default Home;