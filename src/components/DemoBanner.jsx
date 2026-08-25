import React from 'react';
import { Box, Typography } from '@mui/material';
import { buttons, colors, fonts, radii } from '../styles/tokens';
import { endDemoSession, isDemoSession } from '../utils/demoMode';

function DemoBanner() {
  if (!isDemoSession()) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        px: 2,
        py: 0.85,
        bgcolor: colors.navy900,
        color: colors.amberSoft,
      }}
    >
      <Typography
        sx={{
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
        }}
      >
        Demo — temporary session. Closing this tab wipes it.
      </Typography>
      <Box
        component="button"
        type="button"
        onClick={() => endDemoSession()}
        sx={{
          all: 'unset',
          boxSizing: 'border-box',
          cursor: 'pointer',
          ...buttons.primary,
          minHeight: 28,
          px: '14px',
          py: '4px',
          fontSize: 11,
          bgcolor: 'transparent',
          color: colors.amberSoft,
          border: `1px solid ${colors.amberSoft}`,
          boxShadow: 'none',
          borderRadius: radii.pill,
          '&:hover': {
            bgcolor: colors.navy800,
            boxShadow: 'none',
            transform: 'none',
          },
        }}
      >
        Exit
      </Box>
    </Box>
  );
}

export default DemoBanner;
