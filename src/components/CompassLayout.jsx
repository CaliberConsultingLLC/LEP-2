import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';

// Layout wrapper for the Cairn (staging) theme.
//
// Without sidebar:   content is centered in a 780px column (intake, verify, etc.)
// With sidebar:      true full-page responsive grid with optional right rail.
//                    Left  20% = navigation sidebar passed via `sidebar` prop.
//                    Center 60% = children (main page content).
//                    Right  20% = optional context rail, or reserved breathing room.
//
// Production (useCairnTheme === false): renders children directly, no wrapper.
function CompassLayout({ children, progress = 0, sidebar = null, rightRail = null }) {
  if (!useCairnTheme) {
    return children;
  }

  return (
    <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* 3px orange progress bar */}
      <Box sx={{ height: 3, bgcolor: 'var(--sand-200, #E8DBC3)', position: 'relative', flexShrink: 0, zIndex: 2 }}>
        <Box sx={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          bgcolor: 'var(--orange, #E07A3F)',
          borderRadius: '0 2px 2px 0',
          width: `${Math.min(100, Math.max(0, progress))}%`,
          transition: 'width 400ms cubic-bezier(.2,.8,.2,1)',
        }} />
      </Box>

      {/* Compass logo watermark */}
      <Box
        component="img"
        src="/compasslogo2.png"
        alt=""
        aria-hidden
        sx={{
          position: 'fixed', left: '-14vw', top: '-10vw',
          width: '55vw', height: 'auto',
          opacity: 0.035, pointerEvents: 'none', zIndex: 0, userSelect: 'none',
        }}
      />

      {sidebar ? (
        // Full-width stage layout inspired by the Compass review screens:
        // compact chapter rail, generous reading column, optional context rail.
        <Box sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: rightRail ? '22% minmax(0, 56%) 22%' : '22% minmax(0, 66%) 12%',
          },
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Left 20% — navigation sidebar */}
          <Box sx={{ pt: 3, pb: 12, px: { xs: 2, md: 2.5, lg: 3 } }}>
            {sidebar}
          </Box>

          {/* Center — main content */}
          <Box sx={{ pt: 3, pb: 12, px: { xs: 2, md: 3, lg: 3.5 } }}>
            {children}
          </Box>

          {/* Right — context rail or reserved empty column */}
          <Box sx={{ display: 'block', pt: { xs: 0, md: 3 }, pb: { xs: 0, md: 12 }, pr: { md: 2.5, lg: 3 }, pl: 0 }}>
            {rightRail}
          </Box>
        </Box>
      ) : (
        // Centered single column — intake form, verify, and other non-nav pages
        <Box sx={{
          flex: 1, display: 'flex', justifyContent: 'center',
          pt: 3, pb: 12, px: { xs: 2, md: 4 },
          position: 'relative', zIndex: 1,
        }}>
          <Box sx={{ width: '100%', maxWidth: rightRail ? 920 : 780 }}>
            {children}
          </Box>
          {rightRail}
        </Box>
      )}
    </Box>
  );
}

export default CompassLayout;
