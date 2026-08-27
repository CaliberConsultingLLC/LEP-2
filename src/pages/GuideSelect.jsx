import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { SELECTABLE_GUIDE_PERSONAS } from '../data/guidePersonas';
import CompassLayout from '../components/CompassLayout';
import ProcessTopRail from '../components/ProcessTopRail';
import { buttons, colors, fonts, radii, shadows, surfaces, type } from '../styles/tokens';

function GuideSelect() {
  const navigate = useNavigate();
  const { personaId, setPersona, hasSelectedGuide } = useGuide();
  const guides = SELECTABLE_GUIDE_PERSONAS;
  const initialIndex = Math.max(0, guides.findIndex((p) => p.id === personaId && hasSelectedGuide));
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const active = guides[activeIndex] || guides[0];
  const canBegin = hasSelectedGuide && guides.some((p) => p.id === personaId);

  useEffect(() => {
    const centered = guides[activeIndex];
    if (centered) setPersona(centered.id);
  }, [activeIndex, guides, setPersona]);

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
    navigate('/form?stage=profile');
  };

  const step = (delta) => {
    const next = (activeIndex + delta + guides.length) % guides.length;
    handleSelectIndex(next);
  };

  const chevronSx = {
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    position: 'absolute',
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: radii.circle,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1.5px solid ${colors.sand300}`,
    bgcolor: colors.surface1,
    color: colors.inkSoft,
    '&:hover': { borderColor: colors.orange, color: colors.navy900 },
    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
  };

  return (
    <Box sx={{
      minHeight: '100svh',
      maxHeight: '100svh',
      bgcolor: colors.sand50,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ProcessTopRail
        chapterId="profile"
        activeStepId="guide"
        chip={{ variant: 'sequence', label: 'Step', current: 2, total: 3 }}
      />

      <CompassLayout viewportFit contentMaxWidth={1180}>
        <Box sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 0,
        }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 1.5, md: 2 }, flexShrink: 0, px: 1 }}>
            <Typography sx={{ ...type.eyebrow, mb: 1 }}>Leader profile</Typography>
            <Typography sx={{ ...type.question, mb: 0.75 }}>Choose your guide</Typography>
            <Typography sx={{ ...type.subtitle, mx: 'auto' }}>
              This is the voice that walks the rest of Compass with you. Pick the one that already sounds like how you think.
            </Typography>
          </Box>

          <Box sx={{
            position: 'relative',
            width: '100%',
            flexShrink: 0,
            height: { xs: 360, md: 400 },
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
              sx={{ ...chevronSx, left: { xs: 0, md: 8 } }}
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
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      position: 'absolute',
                      width: isCenter ? { xs: 280, md: 320 } : { xs: 180, md: 220 },
                      transform: isCenter
                        ? 'translateX(0) scale(1)'
                        : slot === 'left'
                          ? 'translateX(-112%) scale(0.78)'
                          : 'translateX(112%) scale(0.78)',
                      opacity: isCenter ? 1 : 0.42,
                      filter: isCenter ? 'none' : 'saturate(0.7)',
                      zIndex: isCenter ? 3 : 1,
                      transition: 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease, filter 280ms ease',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'inherit',
                      color: 'inherit',
                      p: 0,
                      ...(isCenter ? surfaces.card : surfaces.cardFlat),
                      borderRadius: radii.lg,
                      border: `2px solid ${selected ? persona.accent : colors.sand200}`,
                      boxShadow: isCenter ? shadows.card : shadows.none,
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ height: 5, bgcolor: persona.accent, width: '100%', flexShrink: 0 }} />
                    <Box sx={{
                      height: { xs: isCenter ? 176 : 116, md: isCenter ? 208 : 136 },
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      bgcolor: colors.surface2,
                      position: 'relative',
                      px: 2,
                      pt: 1.5,
                    }}>
                      <Box
                        component="img"
                        src={persona.poses.greet || persona.poses.idle}
                        alt={persona.name}
                        sx={{
                          height: { xs: isCenter ? 164 : 104, md: isCenter ? 196 : 124 },
                          objectFit: 'contain',
                          objectPosition: 'bottom',
                          display: 'block',
                        }}
                      />
                    </Box>
                    <Box sx={{ p: isCenter ? '14px 16px 12px' : '10px 12px 10px', textAlign: 'center' }}>
                      <Typography sx={{
                        fontFamily: fonts.serif,
                        fontWeight: 500,
                        fontSize: isCenter ? { xs: 20, md: 22 } : 15,
                        letterSpacing: '-0.02em',
                        color: colors.ink,
                        mb: isCenter ? 0.5 : 0,
                      }}>
                        {persona.name}
                      </Typography>
                      {isCenter && (
                        <>
                          <Typography sx={{
                            ...type.body,
                            fontStyle: 'italic',
                            color: colors.inkSoft,
                            mb: 0.5,
                          }}>
                            {persona.tagline}
                          </Typography>
                          <Typography sx={type.bodyMuted}>
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
              sx={{ ...chevronSx, right: { xs: 0, md: 8 } }}
            >
              <ChevronRightIcon />
            </Box>
          </Box>

          <Stack spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button
              onClick={handleBegin}
              disabled={!canBegin}
              sx={{
                ...buttons.primary,
                opacity: canBegin ? 1 : 0.5,
              }}
            >
              Continue with {active.name}
            </Button>
            <Typography sx={{ ...type.bodyMuted, textAlign: 'center' }}>
              You can change your guide at any time after you begin.
            </Typography>
          </Stack>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default GuideSelect;
