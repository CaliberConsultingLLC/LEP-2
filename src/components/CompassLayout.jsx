import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';

/**
 * 20/60/20 page layout for the Compass redesign (staging only).
 * In production (useCairnTheme === false) this is a transparent passthrough.
 *
 * Props:
 *   sidebar  – content rendered in the left 20% column
 *   progress – 0–100, drives the orange progress bar below the topbar
 *   children – rendered in the center 60% column
 */
function CompassLayout({ children, sidebar, progress = 0 }) {
  if (!useCairnTheme) {
    return children;
  }

  return (
    <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* 3px orange progress bar */}
      <Box
        sx={{
          height: 3,
          bgcolor: 'var(--sand-200, #E8DBC3)',
          position: 'relative',
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            bgcolor: 'var(--orange, #E07A3F)',
            borderRadius: '0 2px 2px 0',
            width: `${Math.min(100, Math.max(0, progress))}%`,
            transition: 'width 400ms cubic-bezier(.2,.8,.2,1)',
          }}
        />
      </Box>

      {/* Compass logo watermark — top-left, very faint */}
      <Box
        component="img"
        src="/compasslogo2.png"
        alt=""
        aria-hidden
        sx={{
          position: 'fixed',
          left: '-14vw',
          top: '-10vw',
          width: '55vw',
          height: 'auto',
          opacity: 0.035,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}
      />

      {/* 20 / 60 / 20 grid */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '20% 60% 20%',
          pt: 3,
          pb: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left 20% — journey sidebar */}
        <Box sx={{ pl: '32px', pr: '14px' }}>
          {sidebar}
        </Box>

        {/* Center 60% — page content */}
        <Box sx={{ px: '14px', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>

        {/* Right 20% — intentionally empty; guide owl floats here via fixed overlay */}
        <Box sx={{ pl: '14px', pr: '32px' }} />
      </Box>
    </Box>
  );
}

export default CompassLayout;
