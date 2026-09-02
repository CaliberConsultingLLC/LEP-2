// The demo's way past the assessment.
//
// A demo should walk the parts worth showing — the reflection, the traits, the
// campaign — and skip the part that is fifteen statements about yourself
// followed by waiting on a team that does not exist. This is that skip, shown
// only inside a demo session and only where the assessment would begin.
//
// Deliberately loud rather than tucked away: in a demo the person driving
// wants to find it immediately, and there is no cost to a wrong click.

import React from 'react';
import { Box, Typography } from '@mui/material';
import { isDemoSession, skipDemoToResults } from '../utils/demoMode';
import { colors, fonts, radii, shadows } from '../styles/tokens';

export default function DemoAutomateResults({ sx }) {
  if (!isDemoSession()) return null;

  const run = () => {
    skipDemoToResults();
    // Full load so the dashboard re-reads campaign records and debrief phases
    // from storage rather than the state it mounted with.
    window.location.assign('/dashboard?tab=today');
  };

  return (
    <Box
      sx={{
        mt: 2.5,
        p: { xs: '16px 18px', md: '18px 22px' },
        borderRadius: radii.lg,
        border: `1px dashed ${colors.orange}`,
        bgcolor: 'rgba(224,122,63,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        ...sx,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{
          fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: colors.orangeDeep, mb: '5px',
        }}>
          Demo only
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.5, color: colors.inkSoft }}>
          Skip your assessment and the wait for the team. Sample answers land on
          your statements and the dashboard opens with every room read.
        </Typography>
      </Box>
      <Box
        component="button"
        type="button"
        onClick={run}
        sx={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          px: '24px', minHeight: 44, borderRadius: radii.pill,
          bgcolor: colors.navy900, color: colors.amberSoft,
          fontFamily: fonts.sans, fontSize: 13, fontWeight: 700,
          boxShadow: shadows.buttonPrimary,
          transition: 'transform 140ms, background 140ms',
          '&:hover': { bgcolor: colors.navy800, transform: 'translateY(-1px)' },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        }}
      >
        Automate my results →
      </Box>
    </Box>
  );
}
