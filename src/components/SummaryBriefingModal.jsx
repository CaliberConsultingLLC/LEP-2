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
          display: 'flex',
          alignItems: 'flex-end',
          maxWidth: '100%',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: 'min(280px, calc(100vw - 168px))', sm: 320, md: 340 },
            flexShrink: 0,
            bgcolor: bubbleBg,
            border: bubbleBorder,
            borderRadius: radii.lg,
            boxShadow: shadows.overlay,
            px: { xs: '20px', md: '24px' },
            pt: { xs: '24px', md: '26px' },
            pb: '20px',
            mb: '12px',
            '&:after': {
              content: '""',
              position: 'absolute',
              right: -8,
              bottom: 36,
              width: 16,
              height: 16,
              bgcolor: bubbleBg,
              borderRight: bubbleBorder,
              borderTop: bubbleBorder,
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

        <Box
          component="img"
          src={pose}
          alt=""
          aria-hidden
          sx={{
            width: { xs: 180, sm: 220, md: 248 },
            height: 'auto',
            ml: { xs: '-12px', md: '-16px' },
            mb: '-6px',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 2,
          }}
        />
      </Box>
    </Box>,
    document.body
  );
}
