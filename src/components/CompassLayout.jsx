import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';

function CompassLayout({ children, progress = 0 }) {
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

      {/* Compass logo watermark */}
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

      {/* Centered content column */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          pt: 3,
          pb: 12,
          px: { xs: 2, md: 4 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 780 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default CompassLayout;
