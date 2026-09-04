import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { buttons, colors, fonts, radii, shadows, type } from '../styles/tokens';
import { SUMMARY_BRIEFING_Z, SUMMARY_GUIDE_OWL_SX } from './summaryGuideLayout';

export default function SummaryBriefingModal({
  open,
  persona,
  stageLabel,
  text,
  onDone,
}) {
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => ctaRef.current?.focus?.(), 40);
    const onKey = (event) => {
      if (event.key === 'Escape') onDone?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onDone]);

  if (!open || typeof document === 'undefined') return null;

  const pose = persona?.poses?.read || persona?.poses?.idle;
  const cta = 'Okay';
  const bubbleBg = colors.surface1;
  const bubbleBorder = `1px solid ${colors.sand200}`;

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`${persona?.name || 'Guide'} briefing`}
      onClick={onDone}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: SUMMARY_BRIEFING_Z,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(9,16,31,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />
      <Box
        component="img"
        src={pose}
        alt=""
        aria-hidden
        draggable={false}
        sx={{
          ...SUMMARY_GUIDE_OWL_SX,
          zIndex: 1,
          filter: 'drop-shadow(0 16px 36px rgba(9,16,31,0.28))',
        }}
      />
      {/*
        The bubble reads off the owl like hours off a clock face: one to two
        o'clock, mostly above and a little to the right, overlapping the
        portrait's upper edge rather than standing clear of it.

        It used to sit level with the owl's middle and far to its right —
        centre-low on the screen, which is a strange place for the one thing
        interrupting you.

        The art is square (1254 x 1254), so the portrait box is as tall as it
        is wide and these offsets are read against the same numbers as
        SUMMARY_OWL's widths: 480 / 580 / 640. Roughly 60% across and 75% up
        puts the tail by the owl's head. Vertical offsets are clamped against
        viewport height so a short screen pulls the bubble down rather than
        pushing it off the top.
      */}
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'fixed',
          left: { xs: 16, sm: 24, md: 290, lg: 350, xl: 390 },
          bottom: {
            xs: 256,
            sm: 320,
            md: 'clamp(240px, 44vh, 380px)',
            lg: 'clamp(260px, 48vh, 450px)',
            xl: 'clamp(280px, 50vh, 500px)',
          },
          width: { xs: 'min(340px, calc(100vw - 32px))', sm: 340, md: 360 },
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: bubbleBg,
            border: bubbleBorder,
            borderRadius: radii.lg,
            boxShadow: shadows.overlay,
            px: { xs: '20px', md: '24px' },
            pt: { xs: '22px', md: '24px' },
            pb: '18px',
            // Tail off the bottom-left corner, pointing down at the owl now
            // standing below and to the left. A left-edge tail pointed
            // sideways at nothing once the bubble moved up.
            '&:after': {
              content: '""',
              position: 'absolute',
              left: 36,
              bottom: -8,
              width: 16,
              height: 16,
              bgcolor: bubbleBg,
              borderBottom: bubbleBorder,
              borderRight: bubbleBorder,
              transform: 'rotate(45deg)',
              zIndex: 1,
            },
          }}
        >
          <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep, mb: 1 }}>
            {persona?.name || 'Guide'}
          </Typography>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              fontSize: { xs: 22, md: 24 },
              letterSpacing: '-0.02em',
              color: colors.navy900,
              mb: 1,
            }}
          >
            Before {stageLabel}
          </Typography>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 15,
              lineHeight: 1.5,
              color: colors.ink,
              mb: 2.25,
            }}
          >
            {text}
          </Typography>
          <Box
            ref={ctaRef}
            component="button"
            type="button"
            onClick={onDone}
            sx={{
              ...buttons.primary,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cta}
          </Box>
        </Box>
      </Box>
    </Box>,
    document.body
  );
}
