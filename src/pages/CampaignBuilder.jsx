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
            spacing={3}
            sx={{
              width: '100%',
              py: 8,
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
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Generating your leadership campaign...
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.25rem',
                color: 'white',
                fontStyle: 'italic',
                animation: 'fadeInOut 3s ease-in-out infinite',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                textAlign: 'center',
                maxWidth: '600px',
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
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontWeight: 700,
                color: 'white',
                mb: 3,
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Your Leadership Campaign
            </Typography>
            
            <Box
              sx={{
                p: 4,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                bgcolor: 'rgba(255, 255, 255, 0.98)',
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
                width: '100%',
              }}
            >

            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                mb: 4,
                color: 'text.primary',
                textAlign: 'center',
              }}
            >
              Below are <strong>3 core leadership traits</strong> to focus on improving, each with{' '}
              <strong>5 team-facing survey statements</strong>. Your team can rate these using a
              dual-axis system (Effort vs. Efficacy). Check boxes to dismiss statements, then
              click "Rebuild my Growth Campaign" to refresh.
            </Typography>

            <Stack spacing={4} sx={{ mb: 4 }}>
              {(campaign || []).map((traitItem, traitIndex) => {
                const statements = (Array.isArray(traitItem?.statements) ? traitItem.statements : [])
                  .map((s) => String(s || '').trim())
                  .filter(Boolean)
                  .slice(0, 5); // ensure ≤5 items

                if (statements.length === 0) {
                  return (
                    <Box
                      key={`trait-${traitIndex}-empty`}
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>
                        {traitItem?.trait || 'Trait'} — no statements provided.
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <Box
                    key={`trait-${traitIndex}`}
                    sx={{
                      p: 3,
                      mb: 4,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.95)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(220,230,255,0.85))',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Box sx={{ p: 2, mb: 2, bgcolor: 'primary.main', borderRadius: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        {traitItem.trait}
                      </Typography>
                    </Box>
                    <Stack spacing={1.5}>
                      {statements.map((stmt, sIdx) => (
                        <Box
                          key={`stmt-${sIdx}`}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: sIdx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: 'rgba(224,122,63,0.08)',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Checkbox
                            checked={dismissedStatements.some(
                              (ds) => ds.trait === traitItem.trait && ds.index === sIdx
                            )}
                            onChange={(e) =>
                              handleStatementDismiss(traitItem.trait, sIdx, e.target.checked)
                            }
                            color="error"
                            sx={{ mt: 0.5 }}
                          />
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1rem',
                              color: 'text.primary',
                              flex: 1,
                              lineHeight: 1.6,
                            }}
                          >
                            {sIdx + 1}. {stmt}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2, mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRebuildCampaign}
                disabled={isLoading}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1.5 }}
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
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1.5 }}
              >
                Verify Campaign
              </Button>
            </Stack>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/summary')}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1.5 }}
              >
                Back to Summary
              </Button>
            </Box>
          </Box>
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
