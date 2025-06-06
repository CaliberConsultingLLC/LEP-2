import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Table, TableBody, TableRow, TableCell, Button, Checkbox, Stack } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

function CampaignBuilder() {
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedStatements, setDismissedStatements] = useState([]);
  const [showAnnouncement, setShowAnnouncement] = useState(!localStorage.getItem('campaignAnnouncementDismissed'));
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const quotes = [
    "The best leaders don’t create followers; they inspire others to become leaders. — John C. Maxwell",
    "Growth begins when we start to accept our own weaknesses. — Jean Vanier",
    "Leadership is not about being in charge. It’s about taking care of those in your charge. — Simon Sinek",
    "The only way to grow is to step outside your comfort zone. — Unknown",
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const { aiSummary: aiSummaryFromState } = location.state || {};
  const aiSummaryFromStorage = localStorage.getItem('aiSummary');
  const aiSummary = aiSummaryFromState || aiSummaryFromStorage || null;

  useEffect(() => {
    console.log('CampaignBuilder: aiSummary from state:', aiSummaryFromState);
    console.log('CampaignBuilder: aiSummary from localStorage:', aiSummaryFromStorage);
    console.log('CampaignBuilder: final aiSummary:', aiSummary);

    if (!aiSummary || aiSummary.trim() === '') {
      console.error('No leadership summary available, redirecting to summary');
      navigate('/summary');
      return;
    }

    setIsLoading(true);
    fetch('/api/get-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ aiSummary })
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          console.error('Campaign fetch error:', data.error);
          setError(data.error);
          setCampaign(null);
        } else {
          console.log('Fetched campaign:', data.campaign);
          setCampaign(data.campaign);
          setError(null);
        }
      })
      .catch((error) => {
        console.error('Error fetching campaign:', error);
        setError('Failed to load campaign: ' + error.message);
        setCampaign(null);
      })
      .finally(() => setIsLoading(false));
  }, [aiSummary, navigate]);

  // Rotate quotes every 3 seconds during loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleRebuildCampaign = async () => {
    setIsLoading(true);
    try {
      const finalCampaign = await Promise.all(campaign.map(async (trait) => {
        if (dismissedStatements.some(ds => ds.trait === trait.trait)) {
          const newStatements = [...trait.statements];
          const indicesToReplace = dismissedStatements
            .filter(ds => ds.trait === trait.trait)
            .map(ds => ds.index);

          for (const idx of indicesToReplace) {
            const response = await fetch('/api/dismiss-statement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ traitName: trait.trait, statementIndex: idx, currentTraits: campaign, aiSummary }),
            });
            const data = await response.json();
            if (!data.error) {
              newStatements[idx] = data.campaign.find(t => t.trait === trait.trait).statements[idx];
            } else {
              throw new Error(data.error);
            }
          }
          return { ...trait, statements: newStatements };
        }
        return trait;
      }));

      setCampaign(finalCampaign);
      setDismissedStatements([]);
      setError(null);
    } catch (error) {
      console.error('Error rebuilding campaign:', error);
      setError('Failed to rebuild campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatementDismiss = (trait, index, checked) => {
    setDismissedStatements(prev => {
      const existing = prev.find(ds => ds.trait === trait && ds.index === index);
      if (checked && !existing) {
        return [...prev, { trait, index }];
      } else if (!checked && existing) {
        return prev.filter(ds => !(ds.trait === trait && ds.index === index));
      }
      return prev;
    });
  };

  const handleDismissAnnouncement = () => {
    localStorage.setItem('campaignAnnouncementDismissed', 'true');
    setShowAnnouncement(false);
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
      <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
        {isLoading ? (
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
              Generating your leadership campaign...
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
        ) : error ? (
          <Box>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mt: 4, color: 'error.main', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/summary')}
              sx={{ mt: 2, fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
            >
              Return to Summary
            </Button>
          </Box>
        ) : campaign ? (
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
            {showAnnouncement && (
              <Box
                sx={{
                  p: 3,
                  mb: 4,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                  Building Your Leadership Campaign
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 2, color: 'text.primary' }}>
                  Based on your leadership summary, we’ve created a personalized continuous improvement campaign. This includes 5 core leadership traits to focus on, each with 3 team-facing survey statements for your team to rate. Let’s get started!
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleDismissAnnouncement}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  Dismiss
                </Button>
              </Box>
            )}
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
              Your Leadership Continuous Improvement Campaign
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 4, color: 'text.primary' }}>
              Below are 5 core leadership traits to focus on improving, each with 3 team-facing survey statements. Your team can rate these using a dual-axis 9-box grid (Effort vs. Efficacy). Check boxes to dismiss statements, then click "Rebuild my Growth Campaign" to refresh.
            </Typography>
            <Table sx={{ mb: 4 }}>
              <TableBody>
                {campaign.map((traitItem, traitIndex) => (
                  <React.Fragment key={traitIndex}>
                    <TableRow>
                      <TableCell rowSpan={3} sx={{ verticalAlign: 'middle', p: 1 }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color: 'text.primary' }}>
                          {traitItem.trait}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1 }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                          {traitItem.statements[0]}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1, verticalAlign: 'middle' }}>
                        <Checkbox
                          checked={dismissedStatements.some(ds => ds.trait === traitItem.trait && ds.index === 0)}
                          onChange={(e) => handleStatementDismiss(traitItem.trait, 0, e.target.checked)}
                          color="error"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ p: 1 }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                          {traitItem.statements[1]}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1, verticalAlign: 'middle' }}>
                        <Checkbox
                          checked={dismissedStatements.some(ds => ds.trait === traitItem.trait && ds.index === 1)}
                          onChange={(e) => handleStatementDismiss(traitItem.trait, 1, e.target.checked)}
                          color="error"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ p: 1 }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                          {traitItem.statements[2]}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1, verticalAlign: 'middle' }}>
                        <Checkbox
                          checked={dismissedStatements.some(ds => ds.trait === traitItem.trait && ds.index === 2)}
                          onChange={(e) => handleStatementDismiss(traitItem.trait, 2, e.target.checked)}
                          color="error"
                        />
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRebuildCampaign}
                disabled={isLoading}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
              >
                Rebuild my Growth Campaign
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  localStorage.setItem('currentCampaign', JSON.stringify(campaign));
                  navigate('/campaign-verify');
                }}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
              >
                Verify Campaign
              </Button>
            </Stack>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/summary')}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
            >
              Back to Summary
            </Button>
          </Box>
        ) : (
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mt: 4, color: 'text.primary', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
            No campaign data available.
          </Typography>
        )}
      </Container>
    </Box>
  );
}

export default CampaignBuilder;