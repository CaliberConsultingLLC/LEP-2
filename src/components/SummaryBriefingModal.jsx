import React from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { buttons, colors, fonts, radii, shadows, type } from '../styles/tokens';

export default function SummaryBriefingModal({
  open,
  persona,
  stageLabel,
  text,
  onDone,
}) {
  if (!open || typeof document === 'undefined') return null;

  const pose = persona?.poses?.read || persona?.poses?.idle;
  const cta = 'Okay';

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`${persona?.name || 'Guide'} briefing`}
      onClick={onDone}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10040,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(9,16,31,0.5)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'relative',
          width: 'min(520px, 100%)',
          bgcolor: colors.surface1,
          border: `1px solid ${colors.sand200}`,
          borderRadius: radii.lg,
          boxShadow: shadows.overlay,
          px: { xs: '22px', md: '28px' },
          pt: { xs: '28px', md: '32px' },
          pb: '22px',
        }}
      >
        <Box
          component="img"
          src={pose}
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            right: 8,
            top: -72,
            width: 120,
            height: 'auto',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep, mb: 1 }}>
          {persona?.name || 'Guide'}
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 500,
            fontSize: 26,
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
            fontSize: 16,
            lineHeight: 1.55,
            color: colors.ink,
            mb: 2.5,
            pr: { xs: 0, sm: '72px' },
          }}
        >
          {text}
        </Typography>
        <Box
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
    </Box>,
    document.body
  );
}
