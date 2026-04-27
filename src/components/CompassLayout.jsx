import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';

// When `sidebar` is provided the layout renders the 20/60/20 grid:
//   sidebar (220px) | children (1fr) | empty spacer (220px)
// When no sidebar is provided, children are centered in a 780px column.
function CompassLayout({ children, progress = 0, sidebar = null }) {
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

      {/* Content area */}
      <Box sx={{
        flex: 1, display: 'flex', justifyContent: 'center',
        pt: 3, pb: 12, px: { xs: 2, md: 4 },
        position: 'relative', zIndex: 1,
      }}>
        {sidebar ? (
          // 20/60/20 three-column grid
          <Box sx={{
            width: '100%', maxWidth: 1100,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px 1fr 220px' },
            gap: { xs: 2, md: 3 },
            alignItems: 'start',
          }}>
            <Box>{sidebar}</Box>
            <Box>{children}</Box>
            <Box />
          </Box>
        ) : (
          // Centered single column for intake and other non-nav pages
          <Box sx={{ width: '100%', maxWidth: 780 }}>
            {children}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default CompassLayout;
