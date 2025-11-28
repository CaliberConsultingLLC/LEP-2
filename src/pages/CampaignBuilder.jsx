// src/pages/CampaignBuilder.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Checkbox,
  Stack
} from '@mui/material';
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
    // Get selected traits from localStorage
    const selectedTraitsStr = localStorage.getItem('selectedTraits');
    if (!selectedTraitsStr) {
      console.warn('No selected traits found – redirecting to trait selection');
      navigate('/trait-selection');
      return;
    }

    let selectedTraits;
    try {
      selectedTraits = JSON.parse(selectedTraitsStr);
    } catch (err) {
      console.error('Error parsing selected traits:', err);
      navigate('/trait-selection');
      return;
    }

    if (!Array.isArray(selectedTraits) || selectedTraits.length !== 3) {
      console.warn('Invalid selected traits – redirecting to trait selection');
      navigate('/trait-selection');
      return;
    }

    // Get summary from state, localStorage, or location state
    const storedSummary = localStorage.getItem('aiSummary');
    const effectiveSummary =
      (aiSummary && aiSummary.trim() !== '') ? aiSummary :
      (storedSummary && storedSummary.trim() !== '') ? storedSummary :
      null;

    // If no summary available, redirect to form
    if (!effectiveSummary) {
      console.warn('No summary available – redirecting to form');
      navigate('/form');
      return;
    }

    // Proceed with campaign generation using selected traits
    setIsLoading(true);
    fetch('/api/get-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ 
        aiSummary: effectiveSummary,
        selectedTraits: selectedTraits
      })
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
          // Expect exactly 3 traits with up to 5 statements each
          setCampaign(Array.isArray(data.campaign) ? data.campaign.slice(0, 3) : []);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign: ' + err.message);
        setCampaign(null);
      })
      .finally(() => setIsLoading(false));
  }, [aiSummary, navigate]);

  // Rotate quotes every 3 seconds during loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleRebuildCampaign = async () => {
    setIsLoading(true);
    try {
      const finalCampaign = await Promise.all(
        (campaign || []).map(async (trait) => {
          const dismisses = dismissedStatements.filter((ds) => ds.trait === trait.trait);
          if (dismisses.length === 0) return trait;

          const newStatements = [...trait.statements];
          // Replace each dismissed statement via API
          for (const ds of dismisses) {
            const idx = ds.index;
            const response = await fetch('/api/dismiss-statement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                traitName: trait.trait,
                statementIndex: idx,
                currentTraits: campaign,
                aiSummary
              }),
            });
            const data = await response.json();
            if (data?.error) throw new Error(data.error);
            const updatedTrait = (data.campaign || []).find((t) => t.trait === trait.trait);
            if (updatedTrait && Array.isArray(updatedTrait.statements) && updatedTrait.statements[idx]) {
              newStatements[idx] = String(updatedTrait.statements[idx] || '').trim();
            }
          }
          return { ...trait, statements: newStatements };
        })
      );

      setCampaign(finalCampaign);
      setDismissedStatements([]);
      setError(null);
    } catch (err) {
      console.error('Error rebuilding campaign:', err);
      setError('Failed to rebuild campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatementDismiss = (trait, index, checked) => {
    setDismissedStatements((prev) => {
      const exists = prev.find((ds) => ds.trait === trait && ds.index === index);
      if (checked && !exists) return [...prev, { trait, index }];
      if (!checked && exists) return prev.filter((ds) => !(ds.trait === trait && ds.index === index));
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
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        py: 4,
        // full bleed bg
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP2.jpg)',
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

      <Container 
        maxWidth={false}
        sx={{ 
          textAlign: 'center', 
          position: 'relative',
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 880 }}>
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
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.125rem',
                color: 'text.primary',
                mb: 4,
              }}
            >
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
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                mt: 4,
                color: 'error.main',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
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
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
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
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    mb: 1,
                    color: 'text.primary',
                  }}
                >
                  Building Your Leadership Campaign
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    mb: 2,
                    color: 'text.primary',
                  }}
                >
                  Based on your leadership summary, we’ve created a personalized continuous
                  improvement campaign. This includes <strong>3 core leadership traits</strong> to
                  focus on, each with <strong>5 team-facing survey statements</strong> for your team
                  to rate. Let’s get started!
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

            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                mb: 3,
                color: 'text.primary',
              }}
            >
              Your Leadership Continuous Improvement Campaign
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                mb: 4,
                color: 'text.primary',
              }}
            >
              Below are <strong>3 core leadership traits</strong> to focus on improving, each with{' '}
              <strong>5 team-facing survey statements</strong>. Your team can rate these using a
              dual-axis 9-box grid (Effort vs. Efficacy). Check boxes to dismiss statements, then
              click “Rebuild my Growth Campaign” to refresh.
            </Typography>

            <Table sx={{ mb: 4 }}>
              <TableBody>
                {(campaign || []).map((traitItem, traitIndex) => {
                  const statements = (Array.isArray(traitItem?.statements) ? traitItem.statements : [])
                    .map((s) => String(s || '').trim())
                    .filter(Boolean)
                    .slice(0, 5); // ensure ≤5 items

                  if (statements.length === 0) {
                    return (
                      <TableRow key={`trait-${traitIndex}-empty`}>
                        <TableCell colSpan={3} sx={{ p: 1 }}>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>
                            {traitItem?.trait || 'Trait'} — no statements provided.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return statements.map((stmt, sIdx) => (
                    <TableRow key={`trait-${traitIndex}-row-${sIdx}`}>
                      {sIdx === 0 && (
                        <TableCell rowSpan={statements.length} sx={{ verticalAlign: 'middle', p: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1.25rem',
                              fontWeight: 'bold',
                              color: 'text.primary',
                            }}
                          >
                            {traitItem.trait}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell sx={{ p: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '1rem',
                            color: 'text.primary',
                          }}
                        >
                          {stmt}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1, verticalAlign: 'middle' }}>
                        <Checkbox
                          checked={dismissedStatements.some(
                            (ds) => ds.trait === traitItem.trait && ds.index === sIdx
                          )}
                          onChange={(e) =>
                            handleStatementDismiss(traitItem.trait, sIdx, e.target.checked)
                          }
                          color="error"
                        />
                      </TableCell>
                    </TableRow>
                  ));
                })}
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
                  localStorage.setItem('currentCampaign', JSON.stringify(campaign || []));
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
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1rem',
              mt: 4,
              color: 'text.primary',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            No campaign data available.
          </Typography>
        )}
        </Box>
      </Container>
    </Box>
  );
}

export default CampaignBuilder;
