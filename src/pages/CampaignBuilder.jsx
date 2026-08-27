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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CairnGuidePanel from '../components/CairnGuidePanel';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';
import { useGuide } from '../context/GuideContext';
import { spokenGuide } from '../data/guideContent';
import traitSystem from '../data/traitSystem';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';
import { seedStagingData } from '../utils/stagingSeed';
import { demoRequestFields, isDemoSession } from '../utils/demoMode';
import { colors, fonts, radii, shadows, surfaces } from '../styles/tokens';

const CAMPAIGN_ROMAN = ['I', 'II', 'III'];
const parseJson = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function CampaignBuilder() {
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedStatements, setDismissedStatements] = useState([]);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [selectedTraitInfo, setSelectedTraitInfo] = useState([]);
  const [expandedTrait, setExpandedTrait] = useState(0);
  const [isDark] = useDarkMode();
  const { persona, personaId, hidden, toggleHidden, setHidden, setSuppress, setGuideStep } = useGuide();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    setHidden(true);
    return () => setSuppress(false);
  }, [setSuppress, setHidden, useCairnTheme]);

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    const key = (campaign || []).length ? 'curating' : 'default';
    setGuideStep(key);
    return () => setGuideStep('default');
  }, [campaign, setGuideStep]);

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

    if (useCairnTheme && !isDemoSession()) {
      const cachedCampaign = normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), []));
      if (isCampaignReady(cachedCampaign, { minTraits: 1, minStatementsPerTrait: 1 })) {
        setCampaign(cachedCampaign);
        setError(null);
        setIsLoading(false);
        return;
      }
      setError('Static staging campaign data is missing. Use the Stage Navigator reset to reseed the review flow.');
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
        ...demoRequestFields(),
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
      if (useCairnTheme && !isDemoSession()) {
        seedStagingData();
        const cachedCampaign = normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), []));
        setCampaign(cachedCampaign);
        setDismissedStatements([]);
        setError(null);
        setIsLoading(false);
        return;
      }

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
          ...demoRequestFields(),
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
    const activeTrait = campaign ? campaign[expandedTrait] : null;
    const activeTraitInfo = selectedTraitInfo[expandedTrait] || {};
    const activeStatements = activeTrait
      ? (Array.isArray(activeTrait.statements) ? activeTrait.statements : []).map((s) => String(s || '').trim()).filter(Boolean).slice(0, 5)
      : [];
    const keptCount = activeStatements.length - activeStatements.filter((_, sIdx) => (
      dismissedStatements.some((ds) => ds.trait === activeTrait?.trait && ds.index === sIdx)
    )).length;
    const guideLine = spokenGuide(
      personaId,
      'campaignBuilder',
      keptCount > 0 ? 'curating' : 'default',
      'Keep scope small enough that it fits inside a normal week. If it needs heroics, shrink it.',
      'page',
    );
    const activeName = activeTraitInfo.subTraitName || activeTraitInfo.coreTraitName || activeTrait?.trait || 'this focus';
    const guideCommentary = `${guideLine.text} Read the ${activeName} statements as if you had to answer them yourself.`;
    const statementChip = (campaign || []).reduce(
      (acc, trait) => {
        const stmts = (Array.isArray(trait?.statements) ? trait.statements : []).slice(0, 5);
        acc.total += stmts.length;
        acc.current += stmts.filter((_, index) => (
          !dismissedStatements.some((ds) => ds.trait === trait?.trait && ds.index === index)
        )).length;
        return acc;
      },
      { current: 0, total: 0 }
    );

    const GuideRail = (
      <CairnGuidePanel
        persona={persona}
        hidden={hidden}
        setHidden={setHidden}
        toggleHidden={toggleHidden}
        isDark={isDark}
        commentary={guideCommentary}
        owlPose={persona.poses[guideLine.pose] || persona.poses.lantern || persona.poses.page || persona.poses.idle}
      >
        {[
          ['Draft prompts', 'These are testable feedback prompts, not conclusions.'],
          ['Curate before sending', 'Remove anything that would not produce fair, useful feedback.'],
          ['Verify when ready', 'The campaign only moves forward after your review.'],
        ].map(([title, body]) => (
          <Box key={title} sx={{ display: 'flex', gap: 1.1, mb: 1.2 }}>
            <Box sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'rgba(224,122,63,0.12)',
              border: '1px solid rgba(224,122,63,0.24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Typography sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '0.76rem', color: 'var(--orange, #E07A3F)' }}>✓</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', lineHeight: 1.3 }}>
                {title}
              </Typography>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.74rem', lineHeight: 1.45, color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)', mt: 0.25 }}>
                {body}
              </Typography>
            </Box>
          </Box>
        ))}
        <Box sx={{ mt: 1.4, pt: 1.35, borderTop: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)' }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 0.75 }}>
            Active set
          </Typography>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.76rem', lineHeight: 1.5, color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)' }}>
            {keptCount} of {activeStatements.length || 0} prompts kept for this focus area.
          </Typography>
        </Box>
      </CairnGuidePanel>
    );

    return (
      <Box sx={{ height: '100svh', bgcolor: 'var(--sand-50, #FBF7F0)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ProcessTopRail
          chapterId="campaign"
          activeStepId="builder"
          chip={{ variant: 'sequence', label: 'Statements', current: statementChip.current, total: statementChip.total }}
          onStepSelect={(step) => {
            if (step.id === 'verify') {
              localStorage.setItem('currentCampaign', JSON.stringify(normalizeCampaignItems(campaign || [])));
            }
            if (step.path) navigate(step.path);
          }}
        />
        <CompassLayout rightRail={campaign ? GuideRail : null} viewportFit>
          {error ? (
            <Box>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', color: 'error.main', mb: 2 }}>{error}</Typography>
              <Box component="button" type="button" onClick={() => navigate('/summary')}
                sx={{ all: 'unset', cursor: 'pointer', fontFamily: '"Manrope", sans-serif', fontWeight: 600, color: 'var(--orange, #E07A3F)', textDecoration: 'underline' }}>
                ← Return to Summary
              </Box>
            </Box>
          ) : campaign && activeTrait ? (
            <Box
              sx={{
                ...surfaces.card,
                boxSizing: 'border-box',
                height: 'auto',
                minHeight: 0,
                p: '26px 28px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '32px',
                  flexShrink: 0,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: fonts.mono,
                      fontWeight: 700,
                      fontSize: 10.2,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: colors.orangeDeep,
                      mb: '7px',
                    }}
                  >
                    Campaign Builder
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fonts.serif,
                      fontWeight: 500,
                      fontSize: 28,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      color: colors.ink,
                    }}
                  >
                    The sentences your team will rate
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fonts.sans,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: colors.inkSoft,
                      mt: '6px',
                      maxWidth: '56ch',
                    }}
                  >
                    Built from the three traits you chose. Keep what feels fair and useful. Remove anything confusing, unfair, or outside this stretch.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '8px', flexShrink: 0, mt: '24px' }}>
                  {(campaign || []).map((traitItem, idx) => {
                    const info = selectedTraitInfo[idx] || {};
                    const label = info.subTraitName || info.coreTraitName || traitItem.trait || `Trait ${idx + 1}`;
                    const isActive = idx === expandedTrait;
                    return (
                      <Box
                        key={`trait-pill-${idx}`}
                        component="button"
                        type="button"
                        onClick={() => setExpandedTrait(idx)}
                        sx={{
                          all: 'unset',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: '18px',
                          py: '11px',
                          borderRadius: radii.md,
                          whiteSpace: 'nowrap',
                          fontFamily: fonts.sans,
                          fontWeight: 700,
                          fontSize: 13.5,
                          lineHeight: 1.2,
                          bgcolor: isActive ? colors.navy900 : colors.surface1,
                          color: isActive ? colors.amberSoft : colors.navy900,
                          border: isActive ? `1px solid ${colors.navy900}` : `1px solid ${colors.sand200}`,
                          boxShadow: isActive ? shadows.buttonPrimary : 'none',
                          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                        }}
                      >
                        {label}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '9px',
                }}
              >
                {activeStatements.map((stmt, sIdx) => {
                  const isDismissed = dismissedStatements.some((ds) => ds.trait === activeTrait.trait && ds.index === sIdx);
                  return (
                    <Box
                      key={`stmt-${sIdx}`}
                      sx={{
                        boxSizing: 'border-box',
                        display: 'grid',
                        gridTemplateColumns: '30px 1fr 108px',
                        alignItems: 'center',
                        gap: '16px',
                        px: '16px',
                        py: '14px',
                        borderRadius: radii.md,
                        bgcolor: isDismissed
                          ? 'color-mix(in srgb, var(--orange-deep) 7%, var(--sand-50))'
                          : colors.sand50,
                        border: isDismissed
                          ? '1px solid color-mix(in srgb, var(--orange-deep) 32%, transparent)'
                          : `1px solid ${colors.sand200}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: fonts.mono,
                          fontSize: 11,
                          fontWeight: 700,
                          color: isDismissed ? colors.orangeDeep : colors.inkSoft,
                        }}
                      >
                        {sIdx + 1}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: fonts.sans,
                          fontSize: 15,
                          lineHeight: 1.45,
                          fontWeight: 600,
                          color: isDismissed ? colors.inkSoft : colors.navy900,
                          textDecoration: isDismissed ? 'line-through' : 'none',
                          textAlign: 'left',
                        }}
                      >
                        {stmt}
                      </Typography>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => handleStatementDismiss(activeTrait.trait, sIdx, !isDismissed)}
                        sx={{
                          all: 'unset',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: '8px',
                          px: 0,
                          width: '100%',
                          borderRadius: radii.pill,
                          fontFamily: fonts.sans,
                          fontWeight: 800,
                          fontSize: 11.8,
                          bgcolor: isDismissed ? colors.green : 'rgba(224,122,63,0.12)',
                          border: isDismissed ? `1px solid ${colors.green}` : '1px solid rgba(224,122,63,0.32)',
                          color: isDismissed ? '#fff' : colors.orangeDeep,
                          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                        }}
                      >
                        {isDismissed ? 'Restore' : 'Remove'}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${colors.sand200}`,
                  pt: '14px',
                  flexShrink: 0,
                  gap: 2,
                }}
              >
                <Box sx={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkSoft }}>
                  {`${statementChip.current} of ${statementChip.total} statements kept across three traits.`}
                  {' '}
                  <Box
                    component="button"
                    type="button"
                    onClick={handleRebuildCampaign}
                    sx={{
                      all: 'unset',
                      cursor: 'pointer',
                      color: colors.orangeDeep,
                      fontWeight: 700,
                      '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                    }}
                  >
                    Rebuild campaign
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 800,
                      fontSize: 13,
                      color: colors.inkSoft,
                    }}
                  >
                    Traits
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigate('/trait-selection')}
                    aria-label="Back to traits"
                    sx={{
                      all: 'unset',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      width: 38,
                      height: 38,
                      borderRadius: radii.circle,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1.5px solid ${colors.sand300}`,
                      color: colors.inkSoft,
                      '&:hover': { borderColor: colors.orange, color: colors.navy900 },
                      '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                    }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 19 }} />
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      localStorage.setItem('currentCampaign', JSON.stringify(normalizeCampaignItems(campaign || [])));
                      navigate('/campaign-verify');
                    }}
                    sx={{
                      all: 'unset',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: '24px',
                      py: '12px',
                      borderRadius: radii.pill,
                      bgcolor: colors.navy900,
                      color: colors.amberSoft,
                      fontFamily: fonts.sans,
                      fontWeight: 800,
                      fontSize: 13.5,
                      boxShadow: shadows.buttonPrimary,
                      '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                    }}
                  >
                    Review & send
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
        <ProcessTopRail
          chapterId="campaign"
          activeStepId="builder"
          chip={{ variant: 'sequence', label: 'Statements', current: 0, total: 0 }}
        />
        <CompassLayout>
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
          <Box sx={{ width: '100%', maxWidth: 1180 }}>
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
