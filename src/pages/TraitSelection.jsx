import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Warning, CheckCircle, TrendingUp } from '@mui/icons-material';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CairnGuidePanel from '../components/CairnGuidePanel';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';
import { useGuide } from '../context/GuideContext';
import { spokenGuide } from '../data/guideContent';
import traitSystem from '../data/traitSystem';
import { colors, fonts, radii, shadows, surfaces } from '../styles/tokens';

const SELECTED_COUNT_WORDS = ['Zero', 'One', 'Two', 'Three'];

function TraitSelection() {
  const navigate = useNavigate();
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [loadError, setLoadError] = useState('');
  const { persona, personaId, hidden, toggleHidden, setHidden, setSuppress, setGuideStep } = useGuide();

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    setHidden(true);
    return () => setSuppress(false);
  }, [setSuppress, setHidden, useCairnTheme]);

  const getTraitLibraryEntry = (focusArea) => {
    const [traitId, subTraitId] = String(focusArea?.id || '').split('-');
    const coreTraits = traitSystem?.CORE_TRAITS || [];
    const trait = coreTraits.find((t) => t?.id === traitId) || null;
    const subTrait = trait?.subTraits?.find((st) => st?.id === subTraitId) || null;
    return { trait, subTrait };
  };

  const sentenceCase = (value) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return /[.!?]$/.test(text) ? text : `${text}.`;
  };

  const takeSentences = (value, max = 3, fallback = '') => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return fallback;
    const parts = text.match(/[^.!?]+[.!?]?/g) || [text];
    return parts
      .map((part) => sentenceCase(part))
      .filter(Boolean)
      .slice(0, max)
      .join(' ');
  };

  const uniqueSentences = (values, max = 3, fallback = '') => {
    const seen = new Set();
    const out = [];
    values.forEach((value) => {
      const text = sentenceCase(value);
      const key = text.toLowerCase();
      if (!text || seen.has(key)) return;
      seen.add(key);
      out.push(text);
    });
    return out.slice(0, max).join(' ') || fallback;
  };

  const buildTrailMarker = (focusArea) => {
    const { subTrait } = getTraitLibraryEntry(focusArea);
    const underuse = Array.isArray(subTrait?.riskSignals?.underuse) ? subTrait.riskSignals.underuse : [];
    const examples = Array.isArray(subTrait?.examples) ? subTrait.examples : [];
    const teamSignalRe = /\b(team|people|trust|morale|confidence|alignment|engagement|retention|clarity|ownership|follow[-\s]?through|execution|safety)\b/i;
    const source =
      [focusArea?.example, ...underuse, ...examples]
        .map((x) => String(x || '').trim())
        .find((x) => teamSignalRe.test(x))
      || [focusArea?.example, ...underuse, ...examples]
        .map((x) => String(x || '').trim())
        .find(Boolean)
      || '';

    if (source) {
      const cleaned = source
        .replace(/\byou\b/gi, 'the leader')
        .replace(/\byour\b/gi, 'the leader\'s')
        .replace(/\s+/g, ' ')
        .trim();
      return sentenceCase(`Likely team signal: ${cleaned}`);
    }

    return sentenceCase(
      `Likely team signal: people may experience lower trust, less clarity, and weaker execution when ${String(
        focusArea?.subTraitName || 'this subtrait'
      ).toLowerCase()} remains low`
    );
  };

  const buildHazard = (focusArea) => {
    const { subTrait } = getTraitLibraryEntry(focusArea);
    const sourceRisk = sentenceCase(focusArea?.risk)
      || sentenceCase(Array.isArray(subTrait?.riskSignals?.underuse) ? subTrait.riskSignals.underuse?.[1] : '')
      || sentenceCase(Array.isArray(subTrait?.riskSignals?.underuse) ? subTrait.riskSignals.underuse?.[0] : '');
    if (sourceRisk) {
      const core = sourceRisk.replace(/\.$/, '');
      return `${core} if this subtrait remains underdeveloped.`;
    }
    return sentenceCase(`If ${String(focusArea?.subTraitName || 'this subtrait').toLowerCase()} does not improve, team confidence and execution consistency are likely to decline`);
  };

  const buildImpactPreview = (focusArea) => {
    const { subTrait } = getTraitLibraryEntry(focusArea);
    return sentenceCase(focusArea?.impact)
      || sentenceCase(subTrait?.impact)
      || sentenceCase(`Strengthening ${String(focusArea?.subTraitName || 'this subtrait').toLowerCase()} increases trust, alignment, and execution quality`);
  };

  const buildPositiveIntent = (focusArea) => {
    const name = String(focusArea?.subTraitName || 'this pattern').toLowerCase();
    const trait = String(focusArea?.traitName || '').toLowerCase();
    if (/delegat|ownership|empower/.test(name)) {
      return 'This often begins as a useful instinct to protect quality, pace, and accountability when the stakes are high.';
    }
    if (/clarity|communicat|framing/.test(name) || /communication/.test(trait)) {
      return 'This often begins as a useful instinct to keep people aligned and reduce confusion before work accelerates.';
    }
    if (/decision|judgment|pace/.test(name) || /decision/.test(trait)) {
      return 'This often begins as a useful instinct to make the right call without creating unnecessary risk.';
    }
    if (/safety|trust|emotional|relationship/.test(name) || /emotional/.test(trait)) {
      return 'This often begins as a useful instinct to protect relationships and keep the team steady under pressure.';
    }
    if (/strategic|vision|priority/.test(name) || /strategic/.test(trait)) {
      return 'This often begins as a useful instinct to keep the bigger picture visible while daily work keeps moving.';
    }
    return `This is not a flaw to fix. It is a leadership pattern with a useful purpose that can become stronger when ${name} is practiced with intention.`;
  };

  useEffect(() => {
    const stored = localStorage.getItem('focusAreas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 5) {
          setFocusAreas(parsed);
          return;
        }
      } catch {
        // fall through to error
      }
    }
    setLoadError('Focus areas not found. Please generate your summary first.');
  }, []);

  const handleTraitToggle = (traitId) => {
    setSelectedTraits((prev) => {
      if (prev.includes(traitId)) {
        return prev.filter((id) => id !== traitId);
      } else if (prev.length < 3) {
        return [...prev, traitId];
      }
      return prev;
    });
  };

  useEffect(() => {
    let key = 'default';
    if (selectedTraits.length === 3) key = 'selected-3';
    else if (selectedTraits.length === 2) key = 'selected-2';
    else if (selectedTraits.length === 1) key = 'selected-1';
    else if (focusAreas.length > 0) key = 'focus-trait';
    setGuideStep(key);
    return () => setGuideStep('default');
  }, [selectedTraits.length, focusAreas, setGuideStep]);

  const handleContinue = () => {
    if (selectedTraits.length !== 3) {
      return;
    }
    localStorage.setItem('selectedTraits', JSON.stringify(selectedTraits));
    navigate('/campaign-builder');
  };

  // ── Cairn theme render ──────────────────────────────────────────────────────
  const [isDark] = useDarkMode();
  if (useCairnTheme && focusAreas.length > 0) {
    const selectedCountLabel = SELECTED_COUNT_WORDS[selectedTraits.length] || String(selectedTraits.length);
    const guideLine = spokenGuide(
      personaId,
      'traitSelection',
      selectedTraits.length === 3
        ? 'selected-3'
        : selectedTraits.length === 2
          ? 'selected-2'
          : selectedTraits.length === 1
            ? 'selected-1'
            : 'focus-trait',
      "If you're drawn to all of them, start with the one that's been on your mind the longest.",
      'think',
    );
    const guideCommentary = guideLine.text;

    const GuideRail = (
      <CairnGuidePanel
        persona={persona}
        hidden={hidden}
        setHidden={setHidden}
        toggleHidden={toggleHidden}
        isDark={isDark}
        commentary={guideCommentary}
        owlPose={persona.poses[guideLine.pose] || persona.poses.think || persona.poses.idle}
      >
        <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)', mb: 1 }}>
          How to choose
        </Typography>
        {[
          'Pick one area that feels immediately true.',
          'Pick one your team would probably notice.',
          'Pick one that would make the next 90 days easier.',
        ].map((item, idx) => (
          <Box key={item} sx={{ display: 'flex', gap: 1.1, mb: 1.1 }}>
            <Box sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: idx < selectedTraits.length ? 'var(--orange, #E07A3F)' : isDark ? 'rgba(244,206,161,0.08)' : 'var(--sand-100, #F3EAD8)',
              color: idx < selectedTraits.length ? '#fff' : isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              fontSize: '0.68rem',
            }}>
              {idx + 1}
            </Box>
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.76rem', lineHeight: 1.45, color: isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' }}>
              {item}
            </Typography>
          </Box>
        ))}
        <Box sx={{ mt: 1.4, pt: 1.35, borderTop: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)' }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 0.75 }}>
            Your control point
          </Typography>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.76rem', lineHeight: 1.5, color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)' }}>
            You are choosing where to focus first. The campaign only moves forward after you confirm these three areas.
          </Typography>
        </Box>
      </CairnGuidePanel>
    );

    return (
      <Box
        sx={{
          height: '100svh',
          overflow: 'hidden',
          bgcolor: 'var(--sand-50, #FBF7F0)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <ProcessTopRail
            chapterId="campaign"
            activeStepId="traits"
            chip={{ variant: 'sequence', label: 'Selected', current: selectedTraits.length, total: 3 }}
          />
        </Box>
        <CompassLayout rightRail={GuideRail} contentMaxWidth={1180} viewportFit afterTopbar>
          {loadError ? (
            <Alert severity="warning" sx={{ fontFamily: '"Manrope", sans-serif' }}>{loadError}</Alert>
          ) : (
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
              <Box sx={{ flexShrink: 0 }}>
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
                  Trait Selection
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
                  Choose the traits you'll focus on
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
                  Five came out of your reflection. Pick the three that would change the most for the people you lead — you can change them until you build.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {focusAreas.map((focusArea, idx) => {
                  const isSelected = selectedTraits.includes(focusArea.id);
                  const isDisabled = !isSelected && selectedTraits.length >= 3;
                  const riskBody = String(focusArea.risk || '').trim()
                    || String(buildHazard(focusArea) || '')
                      .replace(/\s+if this subtrait remains underdeveloped\.?/i, '')
                      .replace(/\s+if this focus remains underdeveloped\.?/i, '')
                      .trim();
                  const payoffBody = String(focusArea.impact || '').trim() || buildImpactPreview(focusArea);

                  return (
                    <Box
                      key={focusArea.id}
                      component="button"
                      type="button"
                      onClick={() => {
                        if (!isDisabled) handleTraitToggle(focusArea.id);
                      }}
                      disabled={isDisabled}
                      sx={{
                        all: 'unset',
                        boxSizing: 'border-box',
                        display: 'grid',
                        gridTemplateColumns: '34px 232px 1fr 116px',
                        alignItems: 'center',
                        gap: '18px',
                        px: '16px',
                        py: '9px',
                        borderRadius: radii.md,
                        bgcolor: isSelected
                          ? 'color-mix(in srgb, var(--green) 6%, var(--surface-1))'
                          : colors.sand50,
                        border: isSelected
                          ? '1px solid color-mix(in srgb, var(--green) 34%, var(--sand-200))'
                          : `1px solid ${colors.sand200}`,
                        cursor: isDisabled ? 'default' : 'pointer',
                        opacity: isDisabled ? 0.55 : 1,
                        width: '100%',
                        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: radii.circle,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isSelected ? colors.green : colors.sand200,
                          color: '#fff',
                          fontFamily: fonts.serif,
                          fontWeight: 700,
                          fontSize: 12.5,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        {isSelected ? '✓' : ''}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: fonts.sans,
                            fontWeight: 800,
                            fontSize: 15,
                            lineHeight: 1.2,
                            color: colors.navy900,
                          }}
                        >
                          {focusArea.subTraitName}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            mt: '3px',
                            flexWrap: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: fonts.sans,
                              fontSize: 11.5,
                              color: colors.inkSoft,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {focusArea.traitName}
                          </Typography>
                          {idx < 3 && (
                            <Box
                              component="span"
                              sx={{
                                fontFamily: fonts.mono,
                                fontSize: 8,
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: colors.orangeDeep,
                                bgcolor: 'rgba(224,122,63,0.1)',
                                px: '5px',
                                py: '2px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              Suggested
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: '22px',
                          minWidth: 0,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: fonts.mono,
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: colors.orangeDeep,
                              mb: '4px',
                            }}
                          >
                            Risk
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: fonts.sans,
                              fontSize: 12,
                              lineHeight: 1.4,
                              color: colors.ink,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {riskBody}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: fonts.mono,
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: colors.navy500,
                              mb: '4px',
                            }}
                          >
                            Payoff
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: fonts.sans,
                              fontSize: 12,
                              lineHeight: 1.4,
                              color: colors.ink,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {payoffBody}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: '9px',
                          px: 0,
                          borderRadius: radii.pill,
                          bgcolor: isSelected ? colors.green : colors.surface1,
                          border: isSelected ? `1px solid ${colors.green}` : `1px solid ${colors.sand300}`,
                          color: isSelected ? '#fff' : colors.navy900,
                          fontFamily: fonts.sans,
                          fontWeight: 800,
                          fontSize: 12,
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        {isSelected ? 'Selected' : 'Choose'}
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
                <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkSoft }}>
                  {`${selectedCountLabel} of three selected. Swap any of them before you build.`}
                </Typography>
                <Box
                  component="button"
                  type="button"
                  onClick={handleContinue}
                  disabled={selectedTraits.length !== 3}
                  sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: selectedTraits.length !== 3 ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: '24px',
                    py: '12px',
                    borderRadius: radii.pill,
                    bgcolor: selectedTraits.length !== 3 ? colors.sand200 : colors.navy900,
                    color: selectedTraits.length !== 3 ? colors.inkSoft : colors.amberSoft,
                    fontFamily: fonts.sans,
                    fontWeight: 800,
                    fontSize: 13.5,
                    boxShadow: selectedTraits.length !== 3 ? 'none' : shadows.buttonPrimary,
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                >
                  Build the campaign
                </Box>
              </Box>
            </Box>
          )}
        </CompassLayout>
      </Box>
    );
  }
  // ── End cairn theme render ──────────────────────────────────────────────────

  return (
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
        activeStepId="traits"
        chip={{ variant: 'sequence', label: 'Selected', current: 0, total: 3 }}
      />
      <CompassLayout contentMaxWidth={1180}>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, sm: 4 },
          px: useCairnTheme ? 0 : { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: useCairnTheme ? '100%' : '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1180 }}>
        <Stack spacing={4} sx={{ width: '100%' }}>
          <Paper
            sx={{
              p: 1.6,
              borderRadius: 2.2,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(240,247,255,0.86))',
              boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.96rem',
                color: 'text.primary',
                textAlign: 'center',
                lineHeight: 1.55,
              }}
            >
              Select exactly three traits to anchor your campaign. These choices determine the statements your team will rate and where your growth plan will focus first.
            </Typography>
          </Paper>

          {/* Selection Counter */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: selectedTraits.length === 3 ? 'success.main' : 'rgba(255,255,255,0.9)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              {selectedTraits.length} of 3 selected
            </Typography>
          </Box>

          {/* Trait Focus Bars */}
          <Stack spacing={2}>
            {focusAreas.map((focusArea) => {
              const isSelected = selectedTraits.includes(focusArea.id);
              const isDisabled = !isSelected && selectedTraits.length >= 3;
              const trailMarker = buildTrailMarker(focusArea);
              const hazard = buildHazard(focusArea);
              const impact = buildImpactPreview(focusArea);
              const headingTextSx = {
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#111111',
                lineHeight: 1.3,
                mb: 0.5,
              };

              return (
                <Paper
                  key={focusArea.id}
                  onClick={() => !isDisabled && handleTraitToggle(focusArea.id)}
                  sx={{
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    border: isSelected ? '2px solid #2d4a5a' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: 3,
                    boxShadow: isSelected
                      ? '0 8px 24px rgba(45,74,90,0.35)'
                      : '0 4px 16px rgba(0,0,0,0.12)',
                    bgcolor: isSelected
                      ? 'rgba(255,255,255,0.98)'
                      : 'rgba(255,255,255,0.95)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,245,255,0.95))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: isDisabled ? 'none' : 'translateY(-3px)',
                      boxShadow: isDisabled
                        ? '0 4px 16px rgba(0,0,0,0.1)'
                        : '0 12px 32px rgba(45,74,90,0.25)',
                      borderColor: isDisabled ? 'rgba(255,255,255,0.2)' : (isSelected ? '#2d4a5a' : '#E07A3F'),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'stretch', minHeight: '140px' }}>
                    {/* Subtrait */}
                    <Box
                      sx={{
                        width: '25%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        p: 2.5,
                        borderRight: '2px solid',
                        borderColor: 'divider',
                        bgcolor: isSelected ? 'rgba(224,122,63,0.05)' : 'transparent',
                      }}
                    >
                      <Typography
                        sx={headingTextSx}
                      >
                        {focusArea.subTraitName}
                      </Typography>
                      {focusArea.subTraitDefinition && (
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            lineHeight: 1.2,
                          }}
                        >
                          {focusArea.subTraitDefinition}
                        </Typography>
                      )}
                    </Box>

                    {/* Parent Trait */}
                    <Box
                      sx={{
                        width: '25%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        p: 2.5,
                        borderRight: '2px solid',
                        borderColor: 'divider',
                        bgcolor: isSelected ? 'rgba(99,147,170,0.05)' : 'transparent',
                      }}
                    >
                      <Typography
                        sx={headingTextSx}
                      >
                        {focusArea.traitName}
                      </Typography>
                      {focusArea.traitDefinition && (
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.7rem',
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            lineHeight: 1.2,
                          }}
                        >
                          {focusArea.traitDefinition}
                        </Typography>
                      )}
                    </Box>

                    {isSelected ? (
                      <Box
                        sx={{
                          width: '50%',
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          bgcolor: '#457089',
                          background: 'linear-gradient(135deg, #457089, #375d78)',
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                          <TrendingUp sx={{ color: 'white', fontSize: 16 }} />
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'white',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Impact
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.75rem',
                            color: 'white',
                            lineHeight: 1.4,
                          }}
                        >
                          {impact}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {/* Trail Marker */}
                        <Box
                          sx={{
                            width: '25%',
                            p: 2,
                            borderRight: '1px solid',
                            borderColor: 'rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'primary.main',
                            background: 'linear-gradient(135deg, #E07A3F, #C85A2A)',
                          }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                            <Lightbulb sx={{ color: 'white', fontSize: 16 }} />
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                textAlign: 'center',
                              }}
                            >
                              Trail Marker
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.75rem',
                              color: 'white',
                              lineHeight: 1.4,
                              textAlign: 'center',
                            }}
                          >
                            {trailMarker}
                          </Typography>
                        </Box>
                        {/* Hazard */}
                        <Box
                          sx={{
                            width: '25%',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'warning.main',
                            background: 'linear-gradient(135deg, #ED6C02, #D84315)',
                          }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                            <Warning sx={{ color: 'white', fontSize: 16 }} />
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                textAlign: 'center',
                              }}
                            >
                              Hazard
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.75rem',
                              color: 'white',
                              lineHeight: 1.4,
                              textAlign: 'center',
                            }}
                          >
                            {hazard}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
          {loadError && (
            <Alert
              severity="warning"
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                mt: 2,
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              {loadError}
            </Alert>
          )}

          {/* Continue Button */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            {selectedTraits.length !== 3 && (
              <Alert
                severity="info"
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  mb: 2,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Please select exactly 3 traits to continue.
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleContinue}
              disabled={selectedTraits.length !== 3}
              startIcon={selectedTraits.length === 3 ? <CheckCircle /> : null}
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.1rem',
                px: 6,
                py: 1.5,
                minWidth: '250px',
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              {selectedTraits.length === 3 ? 'Build My Growth Campaign' : `Select ${3 - selectedTraits.length} more`}
            </Button>
          </Box>
        </Stack>
        </Box>
      </Container>
      </CompassLayout>
    </Box>
  );
}

export default TraitSelection;

