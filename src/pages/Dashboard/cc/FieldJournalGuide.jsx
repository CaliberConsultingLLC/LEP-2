import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../../../styles/tokens';
import { SUMMARY_GUIDE_OWL_SX } from '../../../components/summaryGuideLayout';

/**
 * Summary-style guide for Practice: large mirrored owl bottom-left,
 * speech bubble above the owl with a tail pointing down toward it.
 */
export default function FieldJournalGuide({ persona, eyebrow, text, pose = 'think' }) {
  const owlSrc = persona?.poses?.[pose] || persona?.poses?.idle;
  const bubbleBg = colors.surface1;
  const bubbleBorder = `1px solid ${colors.sand200}`;

  return (
    <>
      <Box
        component="img"
        src={owlSrc}
        alt={persona?.name ? `${persona.name} guide` : 'Guide'}
        draggable={false}
        sx={{
          ...SUMMARY_GUIDE_OWL_SX,
          zIndex: 0,
          filter: 'drop-shadow(0 16px 36px rgba(9,16,31,0.28))',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          left: { xs: 16, sm: 20, md: 40, lg: 52, xl: 60 },
          bottom: { xs: 248, sm: 300, md: 300, lg: 340, xl: 360 },
          width: { xs: 'min(320px, calc(100vw - 32px))', sm: 300, md: 320, lg: 340 },
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: bubbleBg,
            border: bubbleBorder,
            borderRadius: radii.lg,
            boxShadow: shadows.overlay,
            px: { xs: '18px', md: '22px' },
            pt: { xs: '18px', md: '20px' },
            pb: '16px',
            pointerEvents: 'auto',
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
          {eyebrow ? (
            <Typography
              sx={{
                fontFamily: fonts.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: colors.orangeDeep,
                mb: 1,
              }}
            >
              {eyebrow}
            </Typography>
          ) : null}
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: { xs: 14.5, md: 15.5 },
              lineHeight: 1.58,
              color: colors.navy700,
              textWrap: 'pretty',
            }}
          >
            {text}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
