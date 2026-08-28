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
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'fixed',
          left: { xs: 16, sm: 24, md: 544, lg: 652, xl: 728 },
          bottom: { xs: 256, sm: 320, md: 190, lg: 220, xl: 240 },
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
            '&:after': {
              content: '""',
              position: 'absolute',
              left: -8,
              bottom: { xs: 28, md: 40 },
              width: 16,
              height: 16,
              bgcolor: bubbleBg,
              borderBottom: bubbleBorder,
              borderLeft: bubbleBorder,
              transform: 'rotate(45deg)',
              zIndex: 1,
              '@media (max-width: 899px)': {
                left: 36,
                bottom: -8,
                borderLeft: 'none',
                borderRight: bubbleBorder,
              },
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
