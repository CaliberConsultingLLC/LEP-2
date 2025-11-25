import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function UserInfo() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleContinue = async () => {
    if (!userInfo.name || !userInfo.email) {
      setError('Please fill out all fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save user info to localStorage for use throughout the app
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // Optionally save to Firestore
      try {
        await addDoc(collection(db, 'users'), {
          name: userInfo.name,
          email: userInfo.email,
          createdAt: new Date(),
        });
      } catch (firestoreError) {
        console.warn('Could not save to Firestore:', firestoreError);
        // Continue even if Firestore save fails
      }

      // Navigate to intake form
      navigate('/form');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error saving user info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        p: 5,
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            boxShadow: 8,
            mt: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '2rem',
                fontWeight: 700,
                mb: 2,
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              Let's Get Started
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                mb: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              We'll use this information to personalize your leadership development journey.
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    display: 'block',
                    mb: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  Name
                </Typography>
                <TextField
                  type="text"
                  name="name"
                  value={userInfo.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your name"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  component="label"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    display: 'block',
                    mb: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  Email
                </Typography>
                <TextField
                  type="email"
                  name="email"
                  value={userInfo.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your email"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              </Box>

              {error && (
                <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem' }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleContinue}
                disabled={isSubmitting || !userInfo.name || !userInfo.email}
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5,
                  mt: 2,
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                {isSubmitting ? 'Saving...' : 'Continue to Profile'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default UserInfo;

