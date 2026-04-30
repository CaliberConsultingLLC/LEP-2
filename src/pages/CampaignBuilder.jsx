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
import CairnGuidePanel from '../components/CairnGuidePanel';
import CairnFlowButtons from '../components/CairnFlowButtons';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';
import { useGuide } from '../context/GuideContext';
import traitSystem from '../data/traitSystem';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';

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
  const { persona, hidden, toggleHidden, setHidden, setSuppress } = useGuide();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress, useCairnTheme]);

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

    if (useCairnTheme) {
      const cachedCampaign = normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), []));
      if (isCampaignReady(cachedCampaign, { minTraits: 1, minStatementsPerTrait: 1 })) {
        setCampaign(cachedCampaign);
        setError(null);
        setIsLoading(false);
        return;
      }
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

  const getCuratedCampaign = () => normalizeCampaignItems(
    (campaign || []).map((traitItem) => ({
      ...traitItem,
      statements: (traitItem.statements || []).filter((_, index) => (
        !dismissedStatements.some((ds) => ds.trait === traitItem.trait && ds.index === index)
      )),
    }))
  );

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
    const keptCount = activeStatements.length - activeStatements.filter((_, sIdx) => (
      dismissedStatements.some((ds) => ds.trait === activeTrait?.trait && ds.index === sIdx)
    )).length;

    const RightRail = hidden ? (
      <Box
        component="button"
        type="button"
        onClick={() => setHidden(false)}
        aria-label={`Show ${persona.name} guide`}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          position: 'fixed',
          right: 0,
          bottom: 32,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '10px 14px 10px 16px',
          borderRadius: '14px 0 0 14px',
          background: 'var(--navy-900, #10223C)',
          color: 'var(--amber-soft, #F4CEA1)',
          boxShadow: '0 12px 28px rgba(15,28,46,0.28)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)',
          '&:hover': { transform: 'translateX(-3px)' },
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
        }}
      >
        <Box
          component="img"
          src={persona.poses.idle}
          alt=""
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'top center',
            border: '2px solid var(--amber-soft, #F4CEA1)',
            background: 'var(--navy-800, #162A44)',
          }}
        />
        Guide
      </Box>
    ) : (
      <Stack
        spacing={1.5}
        sx={{
          position: 'fixed',
          right: { md: 16, lg: 24 },
          bottom: 0,
          zIndex: 1100,
          width: 'clamp(250px, 25vw, 350px)',
          alignItems: 'stretch',
          pointerEvents: 'none',
        }}
      >
        <Box sx={{
          position: 'relative',
          bgcolor: isDark ? 'rgba(8,16,28,0.68)' : 'rgba(255,255,255,0.76)',
          borderRadius: '18px',
          border: isDark ? '1px solid rgba(244,206,161,0.16)' : '1px solid var(--sand-200, #E8DBC3)',
          boxShadow: isDark ? '0 16px 42px rgba(0,0,0,0.34)' : '0 14px 32px rgba(15,28,46,0.08)',
          p: 2.25,
          pointerEvents: 'auto',
          '&:after': {
            content: '""',
            position: 'absolute',
            right: 78,
            bottom: -10,
            width: 18,
            height: 18,
            bgcolor: isDark ? 'rgba(8,16,28,0.68)' : 'rgba(255,255,255,0.76)',
            borderRight: isDark ? '1px solid rgba(244,206,161,0.16)' : '1px solid var(--sand-200, #E8DBC3)',
            borderBottom: isDark ? '1px solid rgba(244,206,161,0.16)' : '1px solid var(--sand-200, #E8DBC3)',
            transform: 'rotate(45deg)',
          },
        }}>
          <Box
            component="button"
            type="button"
            onClick={toggleHidden}
            aria-label="Hide guide"
            sx={{
              all: 'unset',
              cursor: 'pointer',
              position: 'absolute',
              top: 8,
              right: 8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)',
              fontFamily: '"Manrope", sans-serif',
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 600,
              transition: 'background 140ms',
              '&:hover': { background: isDark ? 'rgba(244,206,161,0.1)' : 'var(--sand-100, #F4ECDD)' },
              '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
            }}
          >
            ×
          </Box>
          <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.64rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 1.5 }}>
            Guide notes
          </Typography>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 1.8 }}>
            "Keep scope small enough that it fits inside a normal week. If it needs heroics, shrink it."
          </Typography>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)', mb: 1 }}>
            Your control
          </Typography>
          {[
            ['Draft prompts', 'These are testable feedback prompts, not conclusions.'],
            ['Curate before sending', 'Remove anything that would not produce fair, useful feedback.'],
            ['Verify when ready', 'The campaign only moves forward after your review.'],
          ].map(([title, body]) => (
            <Box key={title} sx={{ display: 'flex', gap: 1.15, mb: 1.75 }}>
              <Box sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'rgba(224,122,63,0.12)',
                border: '1px solid rgba(224,122,63,0.24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Typography sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '0.8rem', color: 'var(--orange, #E07A3F)' }}>✓</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', fontWeight: 800, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', lineHeight: 1.3 }}>
                  {title}
                </Typography>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.75rem', lineHeight: 1.5, color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)', mt: 0.25 }}>
                  {body}
                </Typography>
              </Box>
            </Box>
          ))}
          <Box sx={{ mt: 1.6, pt: 1.5, borderTop: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)' }}>
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.85rem', color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 0.75 }}>
              Active set
            </Typography>
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.78rem', lineHeight: 1.55, color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)' }}>
              {keptCount} of {activeStatements.length || 0} prompts kept for this focus area.
            </Typography>
          </Box>
        </Box>
        <Box
          component="img"
          src={persona.poses.lantern || persona.poses.page || persona.poses.idle}
          alt={`${persona.name} guide`}
          sx={{ width: '100%', height: 'auto', alignSelf: 'center', objectFit: 'contain', objectPosition: 'bottom right', pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={toggleHidden}
          draggable={false}
        />
      </Stack>
    );

    const GuideRail = (
      <CairnGuidePanel
        persona={persona}
        hidden={hidden}
        setHidden={setHidden}
        toggleHidden={toggleHidden}
        isDark={isDark}
        commentary="Keep scope small enough that it fits inside a normal week. If it needs heroics, shrink it."
        owlPose={persona.poses.lantern || persona.poses.page || persona.poses.idle}
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

    const NavSidebar = (
      <Box sx={{
        bgcolor: isDark ? 'var(--surface-2, #0f1c2e)' : 'white', borderRadius: '16px',
        border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
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
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2, color: active ? 'var(--amber-soft, #F4CEA1)' : isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' }}>
                  {label}
                </Typography>
                {sub && (
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.71rem', lineHeight: 1.3, mt: 0.3, color: active ? 'rgba(244,206,161,0.72)' : isDark ? 'var(--ink-soft, #a89880)' : 'var(--ink-soft, #44566C)' }}>
                    {sub}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
        <Box sx={{ borderTop: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)', mx: 2, mt: 0.5 }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.75rem', color: isDark ? 'var(--ink-soft, #a89880)' : 'var(--ink-soft, #44566C)', lineHeight: 1.5, fontStyle: 'italic' }}>
            Review each trait, then verify or rebuild.
          </Typography>
        </Box>
      </Box>
    );

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={71} rightRail={campaign ? GuideRail : null}>
          {error ? (
            <Box>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', color: 'error.main', mb: 2 }}>{error}</Typography>
              <Box component="button" type="button" onClick={() => navigate('/summary')}
                sx={{ all: 'unset', cursor: 'pointer', fontFamily: '"Manrope", sans-serif', fontWeight: 600, color: 'var(--orange, #E07A3F)', textDecoration: 'underline' }}>
                ← Return to Summary
              </Box>
            </Box>
          ) : campaign && activeTrait ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.05 }}>
              <Box sx={{ width: '100%', textAlign: 'center', maxWidth: 780, mx: 'auto', pb: 0.45 }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange, #E07A3F)', mb: 0.85 }}>
                  Chapter IV
                </Typography>
                <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: { xs: '1.52rem', md: '2rem' }, lineHeight: 1.05, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' }}>
                  Growth Campaign Creation
                </Typography>
              </Box>

              <Box sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'white',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
                p: { xs: 1.5, md: 1.8 },
              }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max((campaign || []).length, 1)}, minmax(0, 1fr))`, gap: { xs: 0.8, md: 1.2 } }}>
                  {(campaign || []).map((traitItem, idx) => {
                    const info = selectedTraitInfo[idx] || {};
                    const active = idx === expandedTrait;
                    return (
                      <Box
                        key={`${traitItem.trait || 'trait'}-${idx}`}
                        component="button"
                        type="button"
                        onClick={() => setExpandedTrait(idx)}
                        sx={{
                          all: 'unset',
                          cursor: 'pointer',
                          minWidth: 0,
                          borderRadius: '14px',
                          px: { xs: 0.9, md: 1.2 },
                          py: { xs: 1.35, md: 1.65 },
                          minHeight: { xs: 74, md: 88 },
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: active ? isDark ? 'rgba(244,206,161,0.08)' : 'rgba(224,122,63,0.07)' : 'transparent',
                          border: active ? '1px solid rgba(224,122,63,0.32)' : '1px solid transparent',
                          boxShadow: active ? '0 8px 22px rgba(224,122,63,0.12)' : 'none',
                          transition: '160ms ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(244,206,161,0.055)' : 'rgba(251,247,240,0.85)',
                            transform: 'translateY(-1px)',
                          },
                          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
                        }}
                      >
                        <Typography sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontWeight: active ? 900 : 800,
                          fontSize: { xs: '0.76rem', md: '0.94rem' },
                          lineHeight: 1.14,
                          color: active ? isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' : isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {info.subTraitName || info.coreTraitName || traitItem.trait || `Focus ${idx + 1}`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'white',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.32)' : '0 4px 20px rgba(0,0,0,0.05)',
                p: { xs: 1.9, md: 2.35 },
              }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.75, alignItems: 'center', justifyItems: 'center', mb: 1.75 }}>
                  <Box sx={{ minWidth: 0, maxWidth: 760, textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 0.65 }}>
                      {activeTraitInfo.coreTraitName || 'Feedback focus'}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: { xs: '1.34rem', md: '1.72rem' }, lineHeight: 1.08, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 0.85 }}>
                      {activeTraitInfo.subTraitName || activeTraitInfo.coreTraitName || activeTrait.trait}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.9rem', lineHeight: 1.48, color: isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' }}>
                      Review each statement as something your team may rate. Leave strong statements in place; use Remove only for wording that feels confusing, unfair, or outside the growth campaign.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.85 }}>
                  {activeStatements.map((stmt, sIdx) => {
                    const isDismissed = dismissedStatements.some((ds) => ds.trait === activeTrait.trait && ds.index === sIdx);
                    return (
                      <Box
                        key={`stmt-${sIdx}`}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                          alignItems: 'center',
                          gap: 1.25,
                        }}
                      >
                        <Box sx={{
                          borderRadius: '13px',
                          border: isDismissed ? '1px solid rgba(192,97,42,0.34)' : isDark ? '1px solid rgba(244,206,161,0.1)' : '1px solid var(--sand-200, #E8DBC3)',
                          bgcolor: isDismissed ? isDark ? 'rgba(192,97,42,0.1)' : 'rgba(192,97,42,0.06)' : isDark ? 'rgba(255,255,255,0.025)' : 'rgba(251,247,240,0.54)',
                          px: { xs: 1.35, md: 1.55 },
                          py: { xs: 1.05, md: 1.18 },
                          textAlign: 'center',
                        }}>
                          <Typography sx={{
                            fontFamily: '"Manrope", sans-serif',
                            fontSize: { xs: '0.82rem', md: '0.94rem' },
                            lineHeight: 1.42,
                            fontWeight: 700,
                            color: isDismissed ? isDark ? 'rgba(240,233,222,0.48)' : 'var(--ink-soft, #44566C)' : isDark ? 'rgba(240,233,222,0.86)' : 'var(--navy-900, #10223C)',
                            textDecoration: isDismissed ? 'line-through' : 'none',
                            opacity: isDismissed ? 0.72 : 1,
                            textAlign: 'center',
                          }}>
                            {stmt}
                          </Typography>
                        </Box>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => handleStatementDismiss(activeTrait.trait, sIdx, !isDismissed)}
                          sx={{
                            all: 'unset',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 86,
                            px: 1.6,
                            py: 0.75,
                            borderRadius: 999,
                            bgcolor: isDismissed
                              ? isDark ? 'rgba(47,133,90,0.86)' : 'var(--green, #2F855A)'
                              : isDark ? 'rgba(224,122,63,0.18)' : 'rgba(224,122,63,0.14)',
                            border: isDismissed ? '1px solid rgba(47,133,90,0.35)' : '1px solid rgba(224,122,63,0.32)',
                            color: isDismissed ? '#fff' : isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--orange-deep, #C0612A)',
                            fontFamily: '"Montserrat", sans-serif',
                            fontWeight: 900,
                            fontSize: '0.72rem',
                            boxShadow: isDismissed ? '0 6px 18px rgba(47,133,90,0.18)' : 'none',
                            transition: '180ms ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              bgcolor: isDismissed
                                ? isDark ? 'rgba(47,133,90,0.94)' : 'var(--green, #2F855A)'
                                : isDark ? 'rgba(224,122,63,0.24)' : 'rgba(224,122,63,0.2)',
                            },
                            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.38)', outlineOffset: 2 },
                          }}
                        >
                          {isDismissed ? 'Restore' : 'Remove'}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: 0.5 }}>
                <CairnFlowButtons
                  isDark={isDark}
                  backLabel="Leverage Points"
                  nextLabel="Verify Campaign"
                  onBack={() => navigate('/trait-selection')}
                  onNext={() => {
                    localStorage.setItem('currentCampaign', JSON.stringify(getCuratedCampaign()));
                    navigate('/campaign-verify');
                  }}
                  middleAction={(
                    <Box
                      component="button"
                      type="button"
                      onClick={handleRebuildCampaign}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 38,
                        px: { xs: 1.6, sm: 2.3 },
                        borderRadius: 999,
                        bgcolor: isDark ? 'rgba(244,206,161,0.08)' : 'rgba(255,255,255,0.78)',
                        border: isDark ? '1.5px solid rgba(244,206,161,0.22)' : '1.5px solid var(--sand-300, #C9B99A)',
                        color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        boxShadow: '0 1px 4px rgba(15,28,46,0.06)',
                        transition: '180ms ease',
                        '&:hover': {
                          borderColor: 'var(--orange, #E07A3F)',
                          transform: 'translateY(-1px)',
                        },
                        '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.38)', outlineOffset: 2 },
                      }}
                    >
                      Rebuild Campaign
                    </Box>
                  )}
                />
                <Typography sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft, #44566C)',
                  textAlign: 'center',
                }}>
                  Focus {expandedTrait + 1} of {(campaign || []).length}
                </Typography>
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
