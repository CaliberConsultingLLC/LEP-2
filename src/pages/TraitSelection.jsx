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
import CairnGuidePanel from '../components/CairnGuidePanel';
import CairnFlowButtons from '../components/CairnFlowButtons';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';
import { useGuide } from '../context/GuideContext';
import traitSystem from '../data/traitSystem';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function TraitSelection() {
  const navigate = useNavigate();
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [loadError, setLoadError] = useState('');
  const { persona, hidden, toggleHidden, setHidden, setSuppress } = useGuide();

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress, useCairnTheme]);

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

  const compactText = (value, maxLength = 120) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}...`;
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

  const [activeIndex, setActiveIndex] = useState(0);

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
    const activeFocus = focusAreas[activeIndex];
    const isActiveSelected = selectedTraits.includes(activeFocus?.id);
    const canSelectMore = selectedTraits.length < 3;
    const trailMarker = activeFocus ? buildTrailMarker(activeFocus) : '';
    const hazard = activeFocus ? buildHazard(activeFocus) : '';
    const impact = activeFocus ? buildImpactPreview(activeFocus) : '';
    const positiveIntent = activeFocus ? buildPositiveIntent(activeFocus) : '';
    const activeDefinition = compactText(
      [activeFocus?.subTraitDefinition, positiveIntent].filter(Boolean).join(' '),
      255
    );
    const signalText = compactText(trailMarker.replace(/^Likely team signal:\s*/i, ''), 118);
    const hazardText = compactText(hazard, 118);
    const impactText = compactText(impact, 118);
    const contextBullets = [
      compactText(signalText, 82),
      `Look for this in ${String(activeFocus?.traitName || 'team behavior').toLowerCase()} moments.`,
    ];
    const riskBullets = [
      compactText(hazardText, 82),
      'This can quietly become a repeat pattern if it is not named.',
    ];
    const payoffBullets = [
      compactText(impactText, 82),
      'The team should feel more clarity, trust, or momentum quickly.',
    ];
    const handleToggleActive = () => {
      if (!activeFocus) return;
      if (isActiveSelected) {
        setSelectedTraits((prev) => prev.filter((id) => id !== activeFocus.id));
      } else if (canSelectMore) {
        setSelectedTraits((prev) => [...prev, activeFocus.id]);
      }
    };

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
          <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.64rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 1.6 }}>
            Guide notes
          </Typography>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 1.8 }}>
            "If you're drawn to all of them, start with the one that's been on your mind the longest."
          </Typography>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)', mb: 1 }}>
            How to choose
          </Typography>
          {[
            'Pick one area that feels immediately true.',
            'Pick one your team would probably notice.',
            'Pick one that would make the next 90 days easier.',
          ].map((item, idx) => (
            <Box key={item} sx={{ display: 'flex', gap: 1.1, mb: 1.35 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: idx < selectedTraits.length ? 'var(--orange, #E07A3F)' : isDark ? 'rgba(244,206,161,0.08)' : 'var(--sand-100, #F3EAD8)',
                color: idx < selectedTraits.length ? '#fff' : isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}>
                {idx + 1}
              </Box>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', lineHeight: 1.5, color: isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)' }}>
                {item}
              </Typography>
            </Box>
          ))}
          <Box sx={{ mt: 1.6, pt: 1.5, borderTop: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)' }}>
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.85rem', color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 1 }}>
            Your control point
            </Typography>
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.78rem', lineHeight: 1.55, color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)' }}>
              You are choosing where to focus first. The campaign only moves forward after you confirm these three areas.
            </Typography>
          </Box>
        </Box>
        <Box
          component="img"
          src={persona.poses.think || persona.poses.idle}
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
        commentary="If you're drawn to all of them, start with the one that's been on your mind the longest."
        owlPose={persona.poses.think || persona.poses.idle}
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

    const NavSidebar = (
      <Box sx={{
        bgcolor: isDark ? 'var(--surface-2, #0f1c2e)' : 'white', borderRadius: '16px',
        border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
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
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2, color: active ? 'var(--amber-soft, #F4CEA1)' : isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' }}>
                  {fa.subTraitName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.35, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.71rem', lineHeight: 1.3, color: active ? 'rgba(244,206,161,0.72)' : isDark ? 'var(--ink-soft, #a89880)' : 'var(--ink-soft, #44566C)' }}>
                    {fa.traitName}
                  </Typography>
                  {idx < 3 && (
                    <Typography sx={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.55rem',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: active ? 'rgba(244,206,161,0.7)' : 'var(--orange-deep, #C0612A)',
                      bgcolor: active ? 'rgba(224,122,63,0.18)' : 'rgba(224,122,63,0.09)',
                      px: 0.75, py: '2px', borderRadius: '4px',
                    }}>
                      Suggested
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ borderTop: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)', mx: 2, mt: 0.5 }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', fontWeight: 600, color: selectedTraits.length === 3 ? 'var(--orange, #E07A3F)' : isDark ? 'var(--ink-soft, #a89880)' : 'var(--ink-soft, #44566C)' }}>
            {selectedTraits.length} of 3 selected
          </Typography>
        </Box>
      </Box>
    );

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={57} rightRail={GuideRail}>
          {loadError ? (
            <Alert severity="warning" sx={{ fontFamily: '"Manrope", sans-serif' }}>{loadError}</Alert>
          ) : activeFocus ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              <Box sx={{ width: '100%', textAlign: 'center', maxWidth: 800, mx: 'auto', pb: 0.55 }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange, #E07A3F)', mb: 0.85 }}>
                  Chapter IV
                </Typography>
                <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: { xs: '1.52rem', md: '2rem' }, lineHeight: 1.05, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' }}>
                  Leverage Points
                </Typography>
              </Box>

              <Box sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.045)' : 'white',
                borderRadius: '18px',
                border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
                boxShadow: isDark ? '0 8px 26px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,28,46,0.07)',
                p: { xs: 1.6, md: 2 },
              }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: { xs: 0.9, md: 1.35 } }}>
                  {focusAreas.map((area, idx) => {
                    const active = idx === activeIndex;
                    const selected = selectedTraits.includes(area.id);
                    return (
                      <Box
                        key={area.id}
                        component="button"
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        sx={{
                          all: 'unset',
                          cursor: 'pointer',
                          minWidth: 0,
                          borderRadius: '15px',
                          px: { xs: 0.65, md: 1 },
                          py: { xs: 1.25, md: 1.55 },
                          minHeight: { xs: 72, md: 84 },
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: selected
                            ? 'var(--green, #2F855A)'
                            : active ? isDark ? 'rgba(244,206,161,0.1)' : 'rgba(244,206,161,0.36)' : 'transparent',
                          border: selected
                            ? '1px solid rgba(47,133,90,0.72)'
                            : active ? '1px solid rgba(224,122,63,0.38)' : '1px solid transparent',
                          boxShadow: selected
                            ? '0 8px 22px rgba(47,133,90,0.24)'
                            : active ? '0 7px 18px rgba(224,122,63,0.12)' : 'none',
                          transition: '160ms ease',
                          '&:hover': {
                            bgcolor: selected ? 'var(--green, #2F855A)' : isDark ? 'rgba(244,206,161,0.055)' : 'rgba(251,247,240,0.85)',
                            transform: 'translateY(-1px)',
                          },
                          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
                        }}
                      >
                        <Typography sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          fontWeight: active ? 900 : 800,
                          fontSize: { xs: '0.76rem', md: '0.96rem' },
                          lineHeight: 1.16,
                          color: selected
                            ? '#fff'
                            : active ? isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' : isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {area.subTraitName}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.045)' : 'white',
                borderRadius: '18px',
                border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.34)' : '0 10px 30px rgba(15,28,46,0.08)',
                p: { xs: 2.25, md: 3 },
              }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.1, alignItems: 'center', justifyItems: 'center', mb: 2.25 }}>
                  <Box sx={{ minWidth: 0, maxWidth: 760, textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 0.8 }}>
                      {activeFocus.traitName}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: { xs: '1.48rem', md: '1.9rem' }, lineHeight: 1.08, color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 1.05 }}>
                      {activeFocus.subTraitName}
                    </Typography>
                    <Typography sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontSize: { xs: '0.93rem', md: '1rem' },
                      lineHeight: 1.6,
                      color: isDark ? 'rgba(240,233,222,0.7)' : 'var(--ink-soft, #44566C)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {activeDefinition}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 1.15, md: 1.6 } }}>
                  {[
                    { icon: Lightbulb, label: 'Context', bullets: contextBullets, accent: 'var(--orange, #E07A3F)' },
                    { icon: Warning, label: 'Risks', bullets: riskBullets, accent: '#C0612A' },
                    { icon: TrendingUp, label: 'Payoff', bullets: payoffBullets, accent: 'var(--navy-500, #3F647B)' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Box key={item.label} sx={{
                        borderRadius: '15px',
                        border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(251,247,240,0.68)',
                        p: { xs: 1.45, md: 1.8 },
                        minHeight: { xs: 150, md: 168 },
                        textAlign: 'center',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.85, mb: 1.1 }}>
                          <Icon sx={{ fontSize: 20, color: item.accent, flexShrink: 0 }} />
                          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 900, fontSize: { xs: '0.68rem', md: '0.78rem' }, letterSpacing: '0.08em', textTransform: 'uppercase', color: item.accent }}>
                            {item.label}
                          </Typography>
                        </Box>
                        <Box sx={{
                          m: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                        }}>
                          {item.bullets.map((bullet, bulletIdx) => (
                            <Box key={bullet} sx={{
                              pt: bulletIdx === 0 ? 0 : 0.9,
                              mt: bulletIdx === 0 ? 0 : 0.9,
                              borderTop: bulletIdx === 0 ? 'none' : isDark ? '1px solid rgba(244,206,161,0.1)' : '1px solid rgba(200,184,154,0.58)',
                            }}>
                              <Typography sx={{
                                fontFamily: '"Manrope", sans-serif',
                                fontSize: { xs: '0.76rem', md: '0.86rem' },
                                lineHeight: 1.46,
                                color: isDark ? 'rgba(240,233,222,0.8)' : 'var(--navy-900, #10223C)',
                                textAlign: 'center',
                              }}>
                                {bullet}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, mt: 2.2 }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={handleToggleActive}
                    disabled={!isActiveSelected && !canSelectMore}
                    sx={{
                      all: 'unset',
                      cursor: (!isActiveSelected && !canSelectMore) ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 220,
                      px: '28px',
                      py: '12px',
                      borderRadius: 999,
                      bgcolor: isActiveSelected ? 'var(--green, #2F855A)' : 'var(--orange, #E07A3F)',
                      color: '#fff',
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      opacity: (!isActiveSelected && !canSelectMore) ? 0.42 : 1,
                      boxShadow: isActiveSelected ? '0 8px 24px rgba(47,133,90,0.26)' : '0 8px 24px rgba(224,122,63,0.24)',
                      transition: '180ms ease',
                      '&:hover': (!isActiveSelected && !canSelectMore) ? {} : { transform: 'translateY(-1px)' },
                      '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.48)', outlineOffset: 3 },
                    }}
                  >
                    {isActiveSelected ? 'Trait Selected' : 'Choose This Trait'}
                  </Box>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.72rem', fontWeight: 900, color: selectedTraits.length === 3 ? 'var(--orange, #E07A3F)' : isDark ? 'rgba(240,233,222,0.58)' : 'var(--ink-soft, #44566C)', textAlign: 'center' }}>
                    {selectedTraits.length}/3 selected
                  </Typography>
                </Box>
              </Box>

              <CairnFlowButtons
                isDark={isDark}
                backLabel="Summary"
                nextLabel="Campaign Builder"
                onBack={() => navigate('/summary')}
                onNext={handleContinue}
                nextDisabled={selectedTraits.length !== 3}
              />
            </Box>
          ) : (
            <Box sx={{
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'white',
              border: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
              p: { xs: 3, md: 5 }, textAlign: 'center',
            }}>
              <Typography sx={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--orange-deep, #C0612A)', mb: 1.5,
              }}>
                Choose a Focus Area
              </Typography>
              <Typography sx={{
                fontFamily: '"Montserrat", sans-serif', fontWeight: 800,
                fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2,
                color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)', mb: 1.25,
              }}>
                Select an area from the left to begin
              </Typography>
              <Typography sx={{
                fontFamily: '"Manrope", sans-serif', fontSize: '0.9rem',
                color: 'var(--ink-soft, #44566C)', lineHeight: 1.65, maxWidth: 380, mx: 'auto',
              }}>
                Each area represents a pattern uncovered in your responses. Choose 3 that feel most relevant to where you lead right now.
              </Typography>
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

