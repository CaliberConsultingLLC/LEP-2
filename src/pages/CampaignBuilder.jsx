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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import traitSystem from '../data/traitSystem';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';

function CampaignBuilder() {
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedStatements, setDismissedStatements] = useState([]);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [selectedTraitInfo, setSelectedTraitInfo] = useState([]);
  const [expandedTrait, setExpandedTrait] = useState(0);
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
        const campaignData = normalizeCampaignItems(data?.campaign);
        if (!isCampaignReady(campaignData, { minTraits: 1, minStatementsPerTrait: 1 })) {
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

          const campaignData = normalizeCampaignItems(data?.campaign);
          if (!isCampaignReady(campaignData, { minTraits: 1, minStatementsPerTrait: 1 })) {
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

  // ── Cairn theme render ──────────────────────────────────────────────────────
  if (useCairnTheme) {
    const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
    const activeTrait = campaign ? campaign[expandedTrait] : null;
    const activeTraitInfo = selectedTraitInfo[expandedTrait] || {};
    const activeStatements = activeTrait
      ? (Array.isArray(activeTrait.statements) ? activeTrait.statements : []).map((s) => String(s || '').trim()).filter(Boolean).slice(0, 5)
      : [];

    const NavSidebar = (
      <Box sx={{
        bgcolor: 'white', borderRadius: '16px',
        border: '1px solid var(--sand-200, #E8DBC3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'sticky', top: 96,
      }}>
        {(campaign || []).map((traitItem, idx) => {
          const info = selectedTraitInfo[idx] || {};
          const label = info.subTraitName || info.coreTraitName || traitItem.trait || `Trait ${idx + 1}`;
          const sub = info.subTraitName ? info.coreTraitName : null;
          const active = idx === expandedTrait;
          return (
            <Box
              key={`nav-${idx}`}
              component="button"
              type="button"
              onClick={() => setExpandedTrait(idx)}
              sx={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                px: 2, py: 1.5, width: '100%', boxSizing: 'border-box',
                bgcolor: active ? 'var(--navy-900, #10223C)' : 'transparent',
                transition: '140ms',
                '&:hover': { bgcolor: active ? 'var(--navy-800, #162A44)' : 'var(--sand-50, #FBF7F0)' },
                '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: -3 },
              }}
            >
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, mt: '2px',
                bgcolor: active ? 'rgba(255,255,255,0.15)' : 'var(--sand-100, #F3EAD8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '0.72rem', color: active ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)' }}>
                  {ROMAN[idx]}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2, color: active ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)' }}>
                  {label}
                </Typography>
                {sub && (
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.71rem', lineHeight: 1.3, mt: 0.3, color: active ? 'rgba(244,206,161,0.72)' : 'var(--ink-soft, #44566C)' }}>
                    {sub}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
        <Box sx={{ borderTop: '1px solid var(--sand-200, #E8DBC3)', mx: 2, mt: 0.5 }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.75rem', color: 'var(--ink-soft, #44566C)', lineHeight: 1.5, fontStyle: 'italic' }}>
            Review each trait, then verify or rebuild.
          </Typography>
        </Box>
      </Box>
    );

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={71} sidebar={campaign ? NavSidebar : null}>
          {error ? (
            <Box>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', color: 'error.main', mb: 2 }}>{error}</Typography>
              <Box component="button" type="button" onClick={() => navigate('/summary')}
                sx={{ all: 'unset', cursor: 'pointer', fontFamily: '"Manrope", sans-serif', fontWeight: 600, color: 'var(--orange, #E07A3F)', textDecoration: 'underline' }}>
                ← Return to Summary
              </Box>
            </Box>
          ) : campaign && activeTrait ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Trait header */}
              <Box>
                {activeTraitInfo.subTraitName && (
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange, #E07A3F)', mb: 0.75 }}>
                    {activeTraitInfo.coreTraitName}
                  </Typography>
                )}
                <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.1rem' }, lineHeight: 1.1, color: 'var(--navy-900, #10223C)', mb: 0.5 }}>
                  {activeTraitInfo.subTraitName || activeTraitInfo.coreTraitName || activeTrait.trait}
                </Typography>
              </Box>

              {/* Statements card */}
              <Box sx={{
                bgcolor: 'white', borderRadius: '16px',
                border: '1px solid var(--sand-200, #E8DBC3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid var(--sand-200, #E8DBC3)' }}>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft, #44566C)' }}>
                    Team-Facing Statements — Check to Dismiss
                  </Typography>
                </Box>
                <Stack>
                  {activeStatements.map((stmt, sIdx) => {
                    const isDismissed = dismissedStatements.some((ds) => ds.trait === activeTrait.trait && ds.index === sIdx);
                    return (
                      <Box
                        key={`stmt-${sIdx}`}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          px: 3, py: 1.75,
                          borderBottom: sIdx < activeStatements.length - 1 ? '1px solid var(--sand-100, #F3EAD8)' : 'none',
                          transition: 'background 140ms',
                          bgcolor: isDismissed ? 'rgba(0,0,0,0.02)' : 'transparent',
                          '&:hover': { bgcolor: 'var(--sand-50, #FBF7F0)' },
                        }}
                      >
                        <Checkbox
                          checked={isDismissed}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDismissedStatements((prev) => [...prev, { trait: activeTrait.trait, index: sIdx }]);
                            } else {
                              setDismissedStatements((prev) => prev.filter((ds) => !(ds.trait === activeTrait.trait && ds.index === sIdx)));
                            }
                          }}
                          size="small"
                          sx={{
                            p: 0.25, flexShrink: 0,
                            color: 'var(--sand-200, #E8DBC3)',
                            '&.Mui-checked': { color: 'var(--orange, #E07A3F)' },
                          }}
                        />
                        <Typography sx={{
                          fontFamily: '"Manrope", sans-serif',
                          fontSize: '0.95rem', lineHeight: 1.55,
                          color: isDismissed ? 'var(--ink-soft, #44566C)' : 'var(--navy-900, #10223C)',
                          textDecoration: isDismissed ? 'line-through' : 'none',
                          opacity: isDismissed ? 0.5 : 1,
                          transition: 'all 200ms ease',
                        }}>
                          {sIdx + 1}. {stmt}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Bottom nav */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, pt: 0.5 }}>
                <Box
                  component="button" type="button"
                  onClick={() => navigate('/trait-selection')}
                  sx={{ all: 'unset', cursor: 'pointer', fontFamily: '"Manrope", sans-serif', fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-soft, #44566C)', display: 'inline-flex', alignItems: 'center', gap: '6px', '&:hover': { color: 'var(--navy-900, #10223C)' } }}
                >
                  ← Back to Traits
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Box
                    component="button" type="button"
                    onClick={handleRebuildCampaign}
                    sx={{
                      all: 'unset', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center',
                      px: '20px', py: '10px', borderRadius: 999,
                      bgcolor: 'var(--orange, #E07A3F)', color: '#fff',
                      fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '0.88rem',
                      boxShadow: '0 4px 14px rgba(224,122,63,0.32)',
                      transition: '180ms ease',
                      '&:hover': { transform: 'translateY(-1px)' },
                      '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.48)', outlineOffset: 3 },
                    }}
                  >
                    Rebuild Campaign
                  </Box>
                  <Box
                    component="button" type="button"
                    onClick={() => {
                      localStorage.setItem('currentCampaign', JSON.stringify(normalizeCampaignItems(campaign || [])));
                      navigate('/campaign-verify');
                    }}
                    sx={{
                      all: 'unset', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      px: '20px', py: '10px', borderRadius: 999,
                      bgcolor: 'var(--navy-900, #10223C)', color: 'var(--amber-soft, #F4CEA1)',
                      fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '0.88rem',
                      boxShadow: '0 6px 20px rgba(16,34,60,0.22)',
                      transition: '180ms ease',
                      '&:hover': { bgcolor: 'var(--navy-800, #162A44)', transform: 'translateY(-1px)' },
                      '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.4)', outlineOffset: 3 },
                    }}
                  >
                    Verify Campaign
                    <Box component="span">✓</Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', color: 'var(--ink-soft, #44566C)' }}>No campaign data available.</Typography>
          )}
        </CompassLayout>
      </Box>
    );
  }
  // ── End cairn theme render ──────────────────────────────────────────────────

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
          ...(useCairnTheme
            ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
            : {
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
                '&:after': {
                  content: '""',
                  position: 'fixed',
                  inset: 0,
                  zIndex: -1,
                  background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
                },
              }),
        }}
      >
        <ProcessTopRail />
        <CompassLayout progress={57}>
        <Container
          maxWidth={false}
          sx={{
            py: { xs: 1.5, sm: 2 },
            px: useCairnTheme ? 0 : { xs: 2, sm: 4 },
            display: 'flex',
            justifyContent: 'center',
            width: useCairnTheme ? '100%' : '100vw',
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
              <Paper
                sx={{
                  p: 1.5,
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
                  variant="h5"
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontWeight: 700,
                    color: 'text.primary',
                    textAlign: 'center',
                    mb: 1.5,
                  }}
                >
                  Your Growth Campaign
                </Typography>

                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.95rem',
                    mb: 2,
                    mt: 1.5,
                    color: 'text.primary',
                    textAlign: 'center',
                    lineHeight: 1.55,
                  }}
                >
                  Below are the three leadership traits you chose to focus on, each with 5 team-facing survey statements generated by your AI agent. You and your team will rate these using a dual-measurement approach, giving you clear actionable feedback on the effectiveness of your leadership.
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.95rem',
                    mb: 2,
                    color: 'text.primary',
                    textAlign: 'center',
                    lineHeight: 1.55,
                  }}
                >
                  Review these statements thoroughly before we finalize your campaign. If any statements are irrelevant to you or your team, you may select them and choose &quot;Rebuild my Growth Campaign&quot;. Once you feel good about all statements, select &quot;Verify Campaign&quot;.
                </Typography>

                <Box sx={{ mb: 1 }}>
                  {(campaign || []).map((traitItem, traitIndex) => {
                    const statements = (Array.isArray(traitItem?.statements) ? traitItem.statements : [])
                      .map((s) => String(s || '').trim())
                      .filter(Boolean)
                      .slice(0, 5);

                    const traitInfo = selectedTraitInfo[traitIndex];
                    const coreTraitName = traitInfo?.coreTraitName || '';
                    const subTraitName = traitInfo?.subTraitName || '';
                    const primaryLabel = subTraitName || coreTraitName || traitItem.trait || `Trait ${traitIndex + 1}`;
                    const secondaryLabel = subTraitName ? coreTraitName : null;
                    const isExpanded = expandedTrait === traitIndex;

                    return (
                      <Accordion
                        key={`trait-${traitIndex}`}
                        expanded={isExpanded}
                        onChange={() => setExpandedTrait(isExpanded ? -1 : traitIndex)}
                        sx={{
                          '&:before': { display: 'none' },
                          boxShadow: 'none',
                          border: '1px solid #457089',
                          borderRadius: '12px !important',
                          mb: 0.75,
                          overflow: 'hidden',
                          bgcolor: 'rgba(255,255,255,0.95)',
                          '&.Mui-expanded': { margin: '0 0 6px 0' },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                          sx={{
                            minHeight: 44,
                            bgcolor: '#457089',
                            background: 'linear-gradient(135deg, #457089, #375d78)',
                            '& .MuiAccordionSummary-content': { my: 0.6 },
                            '&.Mui-expanded': { minHeight: 44 },
                          }}
                        >
                          <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '1.08rem',
                                fontWeight: 700,
                                color: 'white',
                              }}
                            >
                              {primaryLabel}
                            </Typography>
                            {secondaryLabel && (
                              <Typography
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontSize: '0.88rem',
                                  fontWeight: 500,
                                  color: 'rgba(255,255,255,0.85)',
                                  fontStyle: 'italic',
                                }}
                              >
                                {secondaryLabel}
                              </Typography>
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 1, pt: 0.5 }}>
                          {statements.length === 0 ? (
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem' }}>
                              No statements provided.
                            </Typography>
                          ) : (
                            <Stack spacing={0.25}>
                              {statements.map((stmt, sIdx) => (
                                <Box
                                  key={`stmt-${sIdx}`}
                                  sx={{
                                    py: 0.55,
                                    px: 1,
                                    borderRadius: 1.5,
                                    bgcolor: sIdx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { bgcolor: 'rgba(224,122,63,0.08)' },
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
                                    sx={{ p: 0.25 }}
                                  />
                                  <Typography
                                    sx={{
                                      fontFamily: 'Gemunu Libre, sans-serif',
                                      fontSize: '0.94rem',
                                      color: 'text.primary',
                                      flex: 1,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {sIdx + 1}. {stmt}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>

                <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 1, mt: 1 }} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRebuildCampaign}
                    disabled={isLoading}
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.875rem', px: 2, py: 0.75 }}
                  >
                    Rebuild my Growth Campaign
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      localStorage.setItem('currentCampaign', JSON.stringify(normalizeCampaignItems(campaign || [])));
                      navigate('/campaign-verify');
                    }}
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.875rem', px: 2, py: 0.75 }}
                  >
                    Verify Campaign
                  </Button>
                </Stack>

                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => navigate('/summary')}
                    sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem', px: 2, py: 0.5 }}
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
        </CompassLayout>
      </Box>
    </>
  );
}

export default CampaignBuilder;
