import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function CampaignVerify() {
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [campaignLink, setCampaignLink] = useState('');
  const [campaignPassword, setCampaignPassword] = useState('');
  const [company, setCompany] = useState('');
  const [participants, setParticipants] = useState('');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const navigate = useNavigate();

  const quotes = [
    "The best leaders don’t create followers; they inspire others to become leaders. — John C. Maxwell",
    "Growth begins when we start to accept our own weaknesses. — Jean Vanier",
    "Leadership is not about being in charge. It’s about taking care of those in your charge. — Simon Sinek",
    "The only way to grow is to step outside your comfort zone. — Unknown",
  ];

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  // Rotate quotes every 3 seconds during saving
  React.useEffect(() => {
    if (!isSaving) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isSaving]);

  const handleGenerateCampaignLink = async () => {
    if (!userInfo.name || !userInfo.email || !company || !participants) {
      setError('Please fill out all fields.');
      return;
    }

    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const password = Math.random().toString(36).substr(2, 8);
    setCampaignPassword(password);

    const campaignData = JSON.parse(localStorage.getItem('currentCampaign') || '[]');
    try {
      setIsSaving(true);
      console.log('Attempting to save campaign to Firestore:', { userInfo, campaign: campaignData, password, company, participants });
      const docRef = await addDoc(collection(db, 'campaigns'), {
        userInfo,
        campaign: campaignData,
        password,
        company,
        participants: parseInt(participants) || 0,
        timestamp: new Date(),
      });
      console.log('Campaign saved with ID:', docRef.id);
      const link = `${window.location.origin}/campaign/${docRef.id}`;
      setCampaignLink(link);
      setError(null);
    } catch (error) {
      console.error('Error saving campaign to Firestore:', error);
      setError('Failed to save campaign. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(campaignLink);
    alert('Link copied to clipboard!');
  };

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
        {isSaving ? (
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
              Saving your leadership campaign...
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
        ) : (
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
              Verify Your Campaign
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 4, color: 'text.primary' }}>
              Please provide your information to save your leadership campaign.
            </Typography>
            <Stack spacing={2} alignItems="stretch">
              <Box>
                <Typography component="label" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', display: 'block', mb: 1, color: 'text.primary' }}>
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
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}
                />
              </Box>
              <Box>
                <Typography component="label" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', display: 'block', mb: 1, color: 'text.primary' }}>
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
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}
                />
              </Box>
              <Box>
                <Typography component="label" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', display: 'block', mb: 1, color: 'text.primary' }}>
                  Company
                </Typography>
                <TextField
                  type="text"
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}
                />
              </Box>
              <Box>
                <Typography component="label" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', display: 'block', mb: 1, color: 'text.primary' }}>
                  Number of Participants
                </Typography>
                <TextField
                  type="number"
                  name="participants"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}
                />
              </Box>
              {error && (
                <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'error.main' }}>
                  {error}
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateCampaignLink}
                disabled={isSaving || !userInfo.name || !userInfo.email || !company || !participants}
                sx={{ mt: 1, fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
              >
                {isSaving ? 'Saving...' : 'Save & Build my Growth Campaign'}
              </Button>
              {campaignLink && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                    <strong>Campaign Link:</strong> {campaignLink}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                    <strong>Password:</strong> {campaignPassword}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.875rem', color: 'text.secondary' }}>
                    Copy the link and password above to share with your team. They will need the password to access the campaign.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={copyToClipboard}
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
                  >
                    Copy Link
                  </Button>
                </Stack>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/campaign-builder')}
                sx={{ mt: 1, fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
              >
                Back to Campaign Builder
              </Button>
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default CampaignVerify;