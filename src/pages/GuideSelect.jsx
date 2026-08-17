import React, { useMemo, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { SELECTABLE_GUIDE_PERSONAS } from '../data/guidePersonas';
import ProcessTopRail from '../components/ProcessTopRail';
import { useDarkMode } from '../hooks/useDarkMode';
import { colors, fonts, radii } from '../styles/tokens';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function GuideSelect() {
  const navigate = useNavigate();
  const { personaId, setPersona, hasSelectedGuide } = useGuide();
  const [isDark] = useDarkMode();
  const guides = SELECTABLE_GUIDE_PERSONAS;
  const initialIndex = Math.max(0, guides.findIndex((p) => p.id === personaId && hasSelectedGuide));
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const active = guides[activeIndex] || guides[0];
  const canBegin = hasSelectedGuide && guides.some((p) => p.id === personaId);

  const visible = useMemo(() => {
    const count = SELECTABLE_GUIDE_PERSONAS.length;
    const left = (activeIndex - 1 + count) % count;
    const right = (activeIndex + 1) % count;
    return [
      { persona: SELECTABLE_GUIDE_PERSONAS[left], slot: 'left', index: left },
      { persona: SELECTABLE_GUIDE_PERSONAS[activeIndex], slot: 'center', index: activeIndex },
      { persona: SELECTABLE_GUIDE_PERSONAS[right], slot: 'right', index: right },
    ];
  }, [activeIndex]);

  const handleSelectIndex = (index) => {
    const persona = guides[index];
    if (!persona) return;
    setActiveIndex(index);
    setPersona(persona.id);
  };

  const handleBegin = () => {
    if (!canBegin) return;
    navigate('/form?stage=intake');
  };

  const step = (delta) => {
    const next = (activeIndex + delta + guides.length) % guides.length;
    handleSelectIndex(next);
  };

  return (
    <Box sx={{ minHeight: '100svh', maxHeight: '100svh', bgcolor: colors.sand50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ProcessTopRail
        titleOverride="Guide Selection"
        subtitleOverride="Your guide shapes how your insights are delivered and the tone of your entire leadership journey. Choose the voice that fits you."
        metaOverride={null}
      />

      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        px: { xs: 2, md: 4 },
        pt: { xs: 0.5, md: 1 },
        pb: { xs: 2, md: 2.5 },
        minHeight: 0,
      }}>
        {/* Horizontal carousel — 3 visible, center selected */}
        <Box sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1180,
          height: { xs: 425, md: 475 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: { xs: 1.5, md: 2 },
        }}>
          <Box
            component="button"
            type="button"
            aria-label="Previous guide"
            onClick={() => step(-1)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              position: 'absolute',
              left: { xs: 0, md: 8 },
              zIndex: 4,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isDark ? '1.5px solid rgba(244,206,161,0.26)' : `1.5px solid ${colors.sand300}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
              color: isDark ? colors.amberSoft : colors.inkSoft,
              '&:hover': { borderColor: colors.orange, color: colors.navy900 },
            }}
          >
            <ChevronLeftIcon />
          </Box>

          <Box sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1200px',
          }}>
            {visible.map(({ persona, slot, index }) => {
              const isCenter = slot === 'center';
              const selected = personaId === persona.id;
              return (
                <Box
                  key={`${persona.id}-${slot}`}
                  component="button"
                  type="button"
                  onClick={() => handleSelectIndex(index)}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    position: 'absolute',
                    // ~25% larger than prior 240/280 center and 170/210 side tiles
                    width: isCenter ? { xs: 300, md: 350 } : { xs: 213, md: 263 },
                    transform: isCenter
                      ? 'translateX(0) scale(1)'
                      : slot === 'left'
                        ? 'translateX(-118%) scale(0.82)'
                        : 'translateX(118%) scale(0.82)',
                    opacity: isCenter ? 1 : 0.42,
                    filter: isCenter ? 'none' : 'saturate(0.7)',
                    zIndex: isCenter ? 3 : 1,
                    transition: 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease, filter 280ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: radii.lg,
                    border: `2px solid ${selected ? persona.accent : isDark ? 'rgba(244,206,161,0.14)' : colors.sand200}`,
                    bgcolor: isCenter
                      ? (isDark ? 'rgba(255,255,255,0.06)' : '#fff')
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'),
                    boxShadow: isCenter
                      ? `0 20px 56px ${persona.accent}38`
                      : '0 8px 24px rgba(15,28,46,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ height: 5, bgcolor: persona.accent, width: '100%', flexShrink: 0 }} />
                  <Box sx={{
                    height: { xs: isCenter ? 188 : 138, md: isCenter ? 210 : 150 },
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    bgcolor: `${persona.accent}12`,
                    position: 'relative',
                    px: 2,
                    pt: 1.5,
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      top: 12, left: 12,
                      width: 28, height: 28,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.85)',
                      border: `1.5px solid ${persona.accent}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Typography sx={{ fontFamily: fonts.serif, fontWeight: 700, fontSize: '0.72rem', color: persona.accent }}>
                        {ROMAN[index]}
                      </Typography>
                    </Box>
                    <Box
                      component="img"
                      src={persona.poses.greet || persona.poses.idle}
                      alt={persona.name}
                      sx={{
                        height: { xs: isCenter ? 173 : 125, md: isCenter ? 195 : 140 },
                        objectFit: 'contain',
                        objectPosition: 'bottom',
                        display: 'block',
                      }}
                    />
                  </Box>
                  <Box sx={{ p: isCenter ? '14px 16px 12px' : '10px 12px 10px', textAlign: 'center' }}>
                    <Typography sx={{
                      fontFamily: fonts.sans,
                      fontWeight: 800,
                      fontSize: isCenter ? { xs: '1.1rem', md: '1.25rem' } : '0.95rem',
                      color: isDark ? colors.ink : colors.navy900,
                      mb: 0.35,
                    }}>
                      {persona.name}
                    </Typography>
                    {isCenter && (
                      <>
                        <Typography sx={{
                          fontFamily: fonts.sans,
                          fontWeight: 600,
                          fontSize: '0.76rem',
                          color: persona.accent,
                          fontStyle: 'italic',
                          lineHeight: 1.35,
                          mb: 0.45,
                        }}>
                          {persona.tagline}
                        </Typography>
                        <Typography sx={{
                          fontFamily: fonts.sans,
                          fontSize: '0.74rem',
                          color: isDark ? 'rgba(240,233,222,0.58)' : colors.inkSoft,
                          lineHeight: 1.4,
                        }}>
                          {persona.voice}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box
            component="button"
            type="button"
            aria-label="Next guide"
            onClick={() => step(1)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              position: 'absolute',
              right: { xs: 0, md: 8 },
              zIndex: 4,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isDark ? '1.5px solid rgba(244,206,161,0.26)' : `1.5px solid ${colors.sand300}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
              color: isDark ? colors.amberSoft : colors.inkSoft,
              '&:hover': { borderColor: colors.orange, color: colors.navy900 },
            }}
          >
            <ChevronRightIcon />
          </Box>
        </Box>

        <Stack spacing={1.5} alignItems="center">
          <Box
            component="button"
            type="button"
            onClick={handleBegin}
            disabled={!canBegin}
            sx={{
              all: 'unset',
              cursor: !canBegin ? 'default' : 'pointer',
              opacity: !canBegin ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              px: '36px',
              py: '12px',
              borderRadius: 999,
              bgcolor: colors.navy900,
              color: colors.amberSoft,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: '0.94rem',
              letterSpacing: '0.02em',
              boxShadow: '0 10px 32px rgba(16,34,60,0.28)',
              transition: 'all 220ms ease',
              '&:hover': !canBegin ? {} : {
                bgcolor: colors.navy800,
                transform: 'translateY(-2px)',
                boxShadow: '0 16px 40px rgba(16,34,60,0.38)',
              },
            }}
          >
            Begin Your Journey
            <Box component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>→</Box>
          </Box>

          <Typography sx={{
            fontFamily: fonts.sans,
            fontSize: '0.74rem',
            color: isDark ? 'rgba(240,233,222,0.5)' : colors.inkSoft,
            opacity: 0.7,
          }}>
            {canBegin
              ? 'You can change your guide at any time after you begin.'
              : 'Select a guide to continue.'}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default GuideSelect;
