import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';
import { CONTENT_MAX_WIDTH_DEFAULT, CONTENT_PX, STAGE_PT, STAGE_PB } from './layoutConstants';
import { GUTTER_H, GUTTER_W } from './guidePlacement';

// Layout wrapper for the Cairn (staging) theme.
// Same top inset on every chapter page. Content starts there — not optically
// centered in the leftover viewport. Production renders children with no wrapper.
function CompassLayout({
  children,
  sidebar = null,
  rightRail = null,
  contentMaxWidth = CONTENT_MAX_WIDTH_DEFAULT,
  viewportFit = false,
  fluid = false,
  flushTop = false,
  allowBleed = false,
}) {
  if (!useCairnTheme) {
    return children;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
        // `px` and `pr` both compile to padding-right, and px's lg media query
        // outranks a pr set only at md — so the sides are set separately and
        // the gutter is folded into the right one at each breakpoint.
        pl: CONTENT_PX,
        pr: {
          xs: CONTENT_PX.xs,
          // Below md the guide spans the width and the height reservation is
          // what keeps content clear; reserving 250px sideways would crush a phone.
          md: `calc(${CONTENT_PX.md * 8}px + var(${GUTTER_W}, 0px))`,
          lg: `calc(${CONTENT_PX.lg * 8}px + var(${GUTTER_W}, 0px))`,
        },
        pt: flushTop ? 0 : STAGE_PT,
        // Room for the guide, so it can never sit on top of a button. The
        // overlay measures itself and writes these; when it is absent they
        // resolve to 0 and nothing changes.
        pb: flushTop
          ? 0
          : {
              xs: `calc(${STAGE_PB.xs * 8}px + var(${GUTTER_H}, 0px))`,
              md: `calc(${STAGE_PB.md * 8}px + var(${GUTTER_H}, 0px))`,
            },
        overflowX: allowBleed ? 'visible' : 'hidden',
        overflowY: viewportFit ? 'hidden' : 'auto',
        minHeight: viewportFit ? 0 : 'calc(100svh - 138px)',
      }}
    >
      {sidebar}
      <Box
        sx={{
          width: '100%',
          maxWidth: fluid ? '100%' : contentMaxWidth,
          minWidth: 0,
          height: viewportFit ? '100%' : 'auto',
          minHeight: 0,
          display: viewportFit ? 'flex' : 'block',
          flexDirection: 'column',
          overflow: viewportFit ? 'hidden' : 'visible',
        }}
      >
        {children}
      </Box>
      {rightRail}
    </Box>
  );
}

export default CompassLayout;
