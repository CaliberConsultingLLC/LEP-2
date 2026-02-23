// src/pages/CampaignBuilder.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Checkbox,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import traitSystem from '../data/traitSystem';

function CampaignBuilder() {
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedStatements, setDismissedStatements] = useState([]);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [selectedTraitInfo, setSelectedTraitInfo] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Load selectedTraits first
    let selectedTraits = null;
    try {
      const selectedTraitsStr = localStorage.getItem('selectedTraits');
      if (!selectedTraitsStr) {
        console.warn('No selectedTraits found in localStorage');
        navigate('/summary');
        return;
      }

      selectedTraits = JSON.parse(selectedTraitsStr);
      
      if (!Array.isArray(selectedTraits) || selectedTraits.length === 0) {
        console.warn('selectedTraits is not a valid array or is empty');
        navigate('/summary');
        return;
      }
    } catch (err) {
      console.error('Error loading selectedTraits:', err);
      setError('Failed to load trait information. Please try again.');
      navigate('/summary');
      return;
    }

    // Ensure selectedTraits is valid before proceeding
    if (!selectedTraits || !Array.isArray(selectedTraits) || selectedTraits.length === 0) {
      console.error('selectedTraits validation failed');
      navigate('/summary');
      return;
    }

    // Parse trait IDs to get display names with proper error handling
    let traitInfo = [];
    try {
      traitInfo = selectedTraits.map((traitId) => {
        try {
          if (!traitId || typeof traitId !== 'string') {
            console.warn('Invalid traitId:', traitId);
            return {
              coreTraitName: '',
              subTraitName: '',
              fullDisplayName: `Trait ${traitId || 'unknown'}`,
            };
          }

          const parts = traitId.split('-');
          const coreTraitId = parts[0];
          const subTraitId = parts[1];

          // Check if traitSystem and CORE_TRAITS exist
          const coreTraits = traitSystem?.CORE_TRAITS || traitSystem?.coreTraits;
          if (!traitSystem || !coreTraits || !Array.isArray(coreTraits)) {
            console.warn('traitSystem.CORE_TRAITS is not available');
            return {
              coreTraitName: '',
              subTraitName: '',
              fullDisplayName: traitId,
            };
          }

          const coreTrait = coreTraits.find((t) => t && t.id === coreTraitId);
          
          if (!coreTrait) {
            console.warn(`Core trait not found for ID: ${coreTraitId}`);
            return {
              coreTraitName: '',
              subTraitName: '',
              fullDisplayName: traitId,
            };
          }

          let subTrait = null;
          if (subTraitId && coreTrait.subTraits && Array.isArray(coreTrait.subTraits)) {
            subTrait = coreTrait.subTraits.find((st) => st && st.id === subTraitId);
          }

          return {
            coreTraitName: coreTrait.name || '',
            subTraitName: subTrait?.name || '',
            fullDisplayName: subTrait 
              ? `${coreTrait.name || ''} - ${subTrait.name || ''}`.trim()
              : (coreTrait.name || traitId),
          };
        } catch (err) {
          console.error('Error parsing trait info for', traitId, ':', err);
          return {
            coreTraitName: '',
            subTraitName: '',
            fullDisplayName: traitId || 'Unknown Trait',
          };
        }
      });
      setSelectedTraitInfo(traitInfo);
    } catch (err) {
      console.error('Error parsing trait info:', err);
      // Set default trait info to prevent crashes
      setSelectedTraitInfo(selectedTraits.map((traitId) => ({
        coreTraitName: '',
        subTraitName: '',
        fullDisplayName: String(traitId || 'Unknown Trait'),
      })));
    }

    // Get summary from state, localStorage, or location state
    let effectiveSummary = null;
    try {
      const storedSummary = localStorage.getItem('aiSummary');
      effectiveSummary =
        (location.state?.aiSummary && location.state.aiSummary.trim() !== '') ? location.state.aiSummary :
        (storedSummary && storedSummary.trim() !== '') ? storedSummary :
        null;
    } catch (err) {
      console.error('Error loading summary:', err);
    }

    // If no summary available, redirect to form
    if (!effectiveSummary) {
      console.warn('No summary available – redirecting to form');
      navigate('/form');
      return;
    }

    // Ensure selectedTraits is available before making the request
    if (!selectedTraits || !Array.isArray(selectedTraits) || selectedTraits.length === 0) {
      console.error('selectedTraits is not available for API call');
      setError('Invalid trait selection. Please return to the summary page.');
      setIsLoading(false);
      return;
    }

    // Proceed with campaign generation using selected traits
    setIsLoading(true);
    setError(null);
    
    fetch('/api/get-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ 
        aiSummary: effectiveSummary,
        selectedTraits: selectedTraits,
      }),
    })
      .then(async (resp) => {
        if (!resp.ok) {
          let errorMessage = `Server error (${resp.status})`;
          try {
            const errData = await resp.json();
            errorMessage = errData.error || errData.message || errorMessage;
          } catch {
            try {
              const errText = await resp.text();
              if (errText) errorMessage = errText.substring(0, 200);
            } catch {
              // Use default errorMessage
            }
          }
          throw new Error(errorMessage);
        }
        
        try {
          return await resp.json();
        } catch (parseError) {
          console.error('Failed to parse campaign response:', parseError);
          throw new Error('Invalid response from server');
        }
      })
      .then((data) => {
        if (!data) {
          throw new Error('No data received from server');
        }

        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }

        // Expect exactly 3 traits with up to 5 statements each
        const campaignData = Array.isArray(data.campaign) ? data.campaign.slice(0, 3) : [];
        if (campaignData.length === 0) {
          console.warn('No campaign data received');
          setError('No campaign data was generated. Please try again.');
        } else {
          setCampaign(campaignData);
          setError(null);
          // Show welcome dialog after campaign loads
          if (!localStorage.getItem('campaignWelcomeDismissed')) {
            setShowWelcomeDialog(true);
          }
        }
      })
      .catch((err) => {
        console.error('Campaign fetch error:', err);
        const errorMessage = err.message || 'Failed to generate campaign. Please check your connection and try again.';
        setError(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [navigate, location.state]);

  const handleStatementDismiss = (trait, index, checked) => {
    if (checked) {
      setDismissedStatements((prev) => [...prev, { trait, index }]);
    } else {
      setDismissedStatements((prev) => prev.filter((ds) => !(ds.trait === trait && ds.index === index)));
    }
  };

  const handleRebuildCampaign = () => {
    try {
      const storedSummary = localStorage.getItem('aiSummary');
      if (!storedSummary || storedSummary.trim() === '') {
        setError('No summary found. Please complete the assessment first.');
        return;
      }

      let selectedTraits;
      try {
        const traitsStr = localStorage.getItem('selectedTraits') || '[]';
        selectedTraits = JSON.parse(traitsStr);
      } catch (parseError) {
        console.error('Failed to parse selectedTraits:', parseError);
        setError('Invalid trait selection data. Please return to the summary page.');
        return;
      }
      
      if (!Array.isArray(selectedTraits) || selectedTraits.length === 0) {
        setError('No traits selected. Please return to the summary page to select traits.');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      fetch('/api/get-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          aiSummary: storedSummary,
          selectedTraits: selectedTraits,
        }),
      })
        .then(async (resp) => {
          if (!resp.ok) {
            let errorMessage = `Server error (${resp.status})`;
            try {
              const errData = await resp.json();
              errorMessage = errData.error || errData.message || errorMessage;
            } catch {
              try {
                const errText = await resp.text();
                if (errText) errorMessage = errText.substring(0, 200);
              } catch {
                // Use default errorMessage
              }
            }
            throw new Error(errorMessage);
          }
          
          try {
            return await resp.json();
          } catch (parseError) {
            console.error('Failed to parse campaign response:', parseError);
            throw new Error('Invalid response from server');
          }
        })
        .then((data) => {
          if (!data) {
            throw new Error('No data received from server');
          }

          if (data.error) {
            setError(data.error);
            return;
          }

          const campaignData = Array.isArray(data.campaign) ? data.campaign.slice(0, 3) : [];
          if (campaignData.length === 0) {
            setError('No campaign data was generated. Please try again.');
          } else {
            setCampaign(campaignData);
            setDismissedStatements([]);
            setError(null);
          }
        })
        .catch((err) => {
          console.error('Campaign rebuild error:', err);
          const errorMessage = err.message || 'Failed to rebuild campaign. Please check your connection and try again.';
          setError(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (err) {
      console.error('Error in handleRebuildCampaign:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowWelcomeDialog(false);
    localStorage.setItem('campaignWelcomeDismissed', 'true');
  };

  if (isLoading) {
    return (
      <LoadingScreen
        title="Generating your leadership campaign..."
        subtitle="Creating statements aligned to your selected traits."
      />
    );
  }

  return (
    <>
      <Dialog
        open={showWelcomeDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
            boxShadow: '0 10px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.14)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center',
            pb: 1,
          }}
        >
          Welcome to Your Campaign Builder
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1rem',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            Review the leadership traits and statements below. These were generated based on your
            assessment and selected focus areas. You can dismiss any statements that don't fit, then
            verify your campaign to proceed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={handleDialogClose}
            variant="contained"
            color="primary"
            sx={{ fontFamily: 'Gemunu Libre, sans-serif', px: 4, py: 1 }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
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
        <ProcessTopRail />
        <Container
          maxWidth={false}
          sx={{
            py: { xs: 3, sm: 4 },
            px: { xs: 2, sm: 4 },
            display: 'flex',
            justifyContent: 'center',
            width: '100vw',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 880 }}>
          {error ? (
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
            <>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontWeight: 700,
                  color: 'white',
                  mb: 2,
                  textAlign: 'center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                Your Leadership Campaign
              </Typography>
              
              <Paper
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'rgba(255,255,255,0.14)',
                  borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.92)',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
                  width: '100%',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    mb: 1.5,
                    color: 'text.primary',
                    textAlign: 'center',
                  }}
                >
                  Below are <strong>3 core leadership traits</strong> to focus on improving, each with{' '}
                  <strong>5 team-facing survey statements</strong>. Your team can rate these using a
                  dual-axis system (Effort vs. Efficacy). Check boxes to dismiss statements, then
                  click "Rebuild my Growth Campaign" to refresh.
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 1.5 }}>
                  {(campaign || []).map((traitItem, traitIndex) => {
                    const statements = (Array.isArray(traitItem?.statements) ? traitItem.statements : [])
                      .map((s) => String(s || '').trim())
                      .filter(Boolean)
                      .slice(0, 5);

                    if (statements.length === 0) {
                      return (
                        <Box
                          key={`trait-${traitIndex}-empty`}
                          sx={{
                            p: 2,
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

                    // Get proper trait name from selectedTraitInfo
                    const traitInfo = selectedTraitInfo[traitIndex];
                    const displayName = traitInfo?.fullDisplayName || traitItem.trait || `Trait ${traitIndex + 1}`;
                    const coreTraitName = traitInfo?.coreTraitName || '';
                    const subTraitName = traitInfo?.subTraitName || '';

                    return (
                      <Paper
                        key={`trait-${traitIndex}`}
                        sx={{
                          p: 0,
                          mb: 1.5,
                          border: '1px solid',
                          borderColor: '#457089',
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.95)',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Header matching Summary page style */}
                        <Box sx={{ p: 1.5, bgcolor: '#457089', background: 'linear-gradient(135deg, #457089, #375d78)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              color: 'white',
                              textAlign: 'center',
                              mb: 0.5,
                            }}
                          >
                            {coreTraitName}
                          </Typography>
                          {subTraitName && (
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color: 'rgba(255,255,255,0.9)',
                                textAlign: 'center',
                                fontStyle: 'italic',
                              }}
                            >
                              {subTraitName}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ p: 1.5 }}>
                          <Stack spacing={0.5}>
                            {statements.map((stmt, sIdx) => (
                              <Box
                                key={`stmt-${sIdx}`}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: sIdx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1.5,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    bgcolor: 'rgba(224,122,63,0.08)',
                                    transform: 'translateX(2px)',
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
                                  size="small"
                                  sx={{ mt: 0.25 }}
                                />
                                <Typography
                                  sx={{
                                    fontFamily: 'Gemunu Libre, sans-serif',
                                    fontSize: '0.95rem',
                                    color: 'text.primary',
                                    flex: 1,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {sIdx + 1}. {stmt}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 1.5, mt: 1.5 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRebuildCampaign}
                    disabled={isLoading}
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', px: 3, py: 1 }}
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
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', px: 3, py: 1 }}
                  >
                    Verify Campaign
                  </Button>
                </Stack>

                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/summary')}
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', px: 3, py: 1 }}
                  >
                    Back to Summary
                  </Button>
                </Box>
              </Paper>
            </>
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
    </>
  );
}

export default CampaignBuilder;
