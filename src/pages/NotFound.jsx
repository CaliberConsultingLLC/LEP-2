import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buttons, colors, fonts, type } from '../styles/tokens';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: colors.sand50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        textAlign: 'center',
        gap: 2,
      }}
    >
      <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep }}>The Compass</Typography>
      <Typography
        component="h1"
        sx={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          fontSize: { xs: 28, md: 36 },
          letterSpacing: '-0.03em',
          color: colors.navy900,
          maxWidth: 420,
          lineHeight: 1.2,
        }}
      >
        This page is not in Compass.
      </Typography>
      <Typography sx={{ ...type.body, color: colors.inkSoft, maxWidth: 380 }}>
        The link may be old or mistyped. Return to the start and continue from there.
      </Typography>
      <Box
        component="button"
        type="button"
        onClick={() => navigate('/')}
        sx={{ all: 'unset', cursor: 'pointer', ...buttons.primary, mt: 1 }}
      >
        Return to the start
      </Box>
    </Box>
  );
}
