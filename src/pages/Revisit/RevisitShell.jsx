// The shell every revisit page shares.
//
// A leader who has reached Base Camp can be sent back to two things they made
// on the way up: the intake they answered as a new user, and the reflection
// that was written from it. Both of those pages already exist and both of them
// are rungs in a ladder — the intake hands you to the summary, the summary
// hands you to trait selection — so opening either one from the map used to
// drop somebody back into the climb they had already finished, with no way out
// but the browser's back button.
//
// So the revisit routes render the same pages with the ladder taken off. What
// they add is this: a line saying plainly that nothing here is live, and one
// button back to Base Camp. Nothing else about the page changes, because the
// whole value of going back to look at something is that it looks the way it
// looked.

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radii, shadows } from '../../styles/tokens';

export const BASE_CAMP_PATH = '/dashboard?tab=today';

/** The one way out. Used by the banner here and by the pages' own end-of-page buttons. */
export function useBaseCampReturn() {
  const navigate = useNavigate();
  return React.useCallback(() => navigate(BASE_CAMP_PATH), [navigate]);
}

/**
 * The strip that sits above a revisited page.
 *
 * Deliberately quiet — a bar, not a banner. It is the frame around a record,
 * and a record that announces itself louder than its own contents is the wrong
 * way round.
 */
export function RevisitBar({ label, note }) {
  const goBase = useBaseCampReturn();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: '12px', sm: '20px' },
        width: '100%',
        maxWidth: 1180,
        mx: 'auto',
        mb: '22px',
        px: '18px',
        py: '13px',
        borderRadius: radii.md,
        border: `1px solid ${colors.sand200}`,
        bgcolor: colors.surface1,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.orangeDeep,
            mb: '5px',
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.55, color: colors.inkSoft }}>
          {note}
        </Typography>
      </Box>
      <BaseCampButton onClick={goBase} />
    </Box>
  );
}

/** The button itself, so the bottom of a long page can offer it again. */
export function BaseCampButton({ onClick, sx }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      // The guide stands in a corner of the window; this is the one control on
      // the page and it must not end up behind an owl.
      data-guide-keepclear=""
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: 42,
        px: '22px',
        borderRadius: radii.pill,
        bgcolor: colors.navy900,
        color: colors.amberSoft,
        fontFamily: fonts.sans,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        boxShadow: shadows.buttonPrimary,
        transition: '180ms ease',
        '&:hover': { transform: 'translateY(-1px)', boxShadow: shadows.buttonPrimaryHover },
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        ...sx,
      }}
    >
      ‹ Back to Base Camp
    </Box>
  );
}

export default RevisitBar;
