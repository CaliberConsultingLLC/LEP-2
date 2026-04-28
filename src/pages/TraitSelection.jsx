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
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import traitSystem from '../data/traitSystem';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function TraitSelection() {
  const navigate = useNavigate();
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [loadError, setLoadError] = useState('');

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

  const [activeIndex, setActiveIndex] = useState(0);

  const handleContinue = () => {
    if (selectedTraits.length !== 3) {
      return;
    }
    // Store selected traits and navigate to campaign builder
    localStorage.setItem('selectedTraits', JSON.stringify(selectedTraits));
    navigate('/campaign-builder');
  };

  // ── Cairn theme render ──────────────────────────────────────────────────────
  if (useCairnTheme && focusAreas.length > 0) {
    const activeFocus = focusAreas[activeIndex];
    const isActiveSelected = selectedTraits.includes(activeFocus?.id);
    const canSelectMore = selectedTraits.length < 3;
    const trailMarker = activeFocus ? buildTrailMarker(activeFocus) : '';
    const hazard = activeFocus ? buildHazard(activeFocus) : '';
    const impact = activeFocus ? buildImpactPreview(activeFocus) : '';

    const handleToggleActive = () => {
      if (!activeFocus) return;
      if (isActiveSelected) {
        setSelectedTraits((prev) => prev.filter((id) => id !== activeFocus.id));
      } else if (canSelectMore) {
        setSelectedTraits((prev) => [...prev, activeFocus.id]);
      }
    };

    const NavSidebar = (
      <Box sx={{
        bgcolor: 'white', borderRadius: '16px',
        border: '1px solid var(--sand-200, #E8DBC3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'sticky', top: 96,
      }}>
        {focusAreas.map((fa, idx) => {
          const active = idx === activeIndex;
          const selected = selectedTraits.includes(fa.id);
          return (
            <Box
              key={fa.id}
              component="button"
              type="button"
              onClick={() => setActiveIndex(idx)}
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
                bgcolor: selected ? 'var(--orange, #E07A3F)' : active ? 'rgba(255,255,255,0.15)' : 'var(--sand-100, #F3EAD8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '0.72rem', color: selected || active ? '#fff' : 'var(--navy-900, #10223C)' }}>
                  {selected ? '✓' : ROMAN[idx]}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2, color: active ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)' }}>
                  {fa.subTraitName}
                </Typography>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.71rem', lineHeight: 1.3, mt: 0.3, color: active ? 'rgba(244,206,161,0.72)' : 'var(--ink-soft, #44566C)' }}>
                  {fa.traitName}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ borderTop: '1px solid var(--sand-200, #E8DBC3)', mx: 2, mt: 0.5 }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', fontWeight: 600, color: selectedTraits.length === 3 ? 'var(--orange, #E07A3F)' : 'var(--ink-soft, #44566C)' }}>
            {selectedTraits.length} of 3 selected
          </Typography>
        </Box>
      </Box>
    );

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={57} sidebar={NavSidebar}>
          {loadError ? (
            <Alert severity="warning" sx={{ fontFamily: '"Manrope", sans-serif' }}>{loadError}</Alert>
          ) : activeFocus ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Trait header */}
              <Box>
                <Typography sx={{
                  fontFamily: '"Manrope", sans-serif', fontWeight: 700,
                  fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--orange, #E07A3F)', mb: 0.75,
                }}>
                  {activeFocus.traitName}
                </Typography>
                <Typography sx={{
                  fontFamily: '"Montserrat", sans-serif', fontWeight: 800,
                  fontSize: { xs: '1.75rem', md: '2.1rem' }, lineHeight: 1.1,
                  color: 'var(--navy-900, #10223C)', mb: 0.5,
                }}>
                  {activeFocus.subTraitName}
                </Typography>
                {activeFocus.subTraitDefinition && (
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.95rem', color: 'var(--ink-soft, #44566C)', lineHeight: 1.6 }}>
                    {activeFocus.subTraitDefinition}
                  </Typography>
                )}
              </Box>

              {/* What's at stake / What changes */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{
                  bgcolor: 'white', borderRadius: '12px',
                  border: '1px solid var(--sand-200, #E8DBC3)',
                  p: 2.5,
                }}>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--orange, #E07A3F)', mb: 1 }}>
                    What's At Stake
                  </Typography>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--navy-900, #10223C)' }}>
                    {hazard}
                  </Typography>
                </Box>
                <Box sx={{
                  bgcolor: 'white', borderRadius: '12px',
                  border: '1px solid var(--sand-200, #E8DBC3)',
                  p: 2.5,
                }}>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy-500, #3F647B)', mb: 1 }}>
                    What Changes
                  </Typography>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--navy-900, #10223C)' }}>
                    {impact}
                  </Typography>
                </Box>
              </Box>

              {/* Trail marker quote */}
              {trailMarker && (
                <Box sx={{
                  bgcolor: 'white', borderRadius: '12px',
                  border: '1px solid var(--sand-200, #E8DBC3)',
                  p: 2.5,
                }}>
                  <Typography sx={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.05rem',
                    lineHeight: 1.7,
                    color: 'var(--navy-900, #10223C)',
                    fontStyle: 'italic',
                  }}>
                    "{trailMarker}"
                  </Typography>
                </Box>
              )}

              {/* Action row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5, flexWrap: 'wrap', gap: 2 }}>
                {/* Choose / unchoose this trail */}
                <Box
                  component="button"
                  type="button"
                  onClick={handleToggleActive}
                  disabled={!isActiveSelected && !canSelectMore}
                  sx={{
                    all: 'unset',
                    cursor: (!isActiveSelected && !canSelectMore) ? 'default' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    px: '24px', py: '12px', borderRadius: 999,
                    bgcolor: isActiveSelected ? 'var(--navy-900, #10223C)' : 'var(--orange, #E07A3F)',
                    color: '#fff',
                    fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '0.9rem',
                    opacity: (!isActiveSelected && !canSelectMore) ? 0.4 : 1,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
                    transition: '180ms ease',
                    '&:hover': (!isActiveSelected && !canSelectMore) ? {} : { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
                    '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.48)', outlineOffset: 3 },
                  }}
                >
                  {isActiveSelected ? '✓ Selected' : 'Choose This Trail'}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigate('/summary')}
                    sx={{
                      all: 'unset', cursor: 'pointer',
                      fontFamily: '"Manrope", sans-serif', fontWeight: 600, fontSize: '0.88rem',
                      color: 'var(--ink-soft, #44566C)',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      '&:hover': { color: 'var(--navy-900, #10223C)' },
                    }}
                  >
                    ← Summary
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={handleContinue}
                    disabled={selectedTraits.length !== 3}
                    sx={{
                      all: 'unset',
                      cursor: selectedTraits.length === 3 ? 'pointer' : 'default',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      px: '20px', py: '10px', borderRadius: 999,
                      bgcolor: selectedTraits.length === 3 ? 'var(--navy-900, #10223C)' : 'var(--sand-200, #E8DBC3)',
                      color: selectedTraits.length === 3 ? 'var(--amber-soft, #F4CEA1)' : 'var(--ink-soft, #44566C)',
                      fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '0.88rem',
                      transition: '180ms ease',
                      '&:hover': selectedTraits.length === 3 ? { transform: 'translateY(-1px)' } : {},
                      '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.4)', outlineOffset: 3 },
                    }}
                  >
                    Build Campaign →
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : null}
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
      <ProcessTopRail />
      <CompassLayout progress={57}>
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
        <Box sx={{ width: '100%', maxWidth: 1120 }}>
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

