import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';
import { CONTENT_MAX_WIDTH_DEFAULT, CONTENT_PX, STAGE_PT, STAGE_PB } from './layoutConstants';

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
        px: CONTENT_PX,
        pt: flushTop ? 0 : STAGE_PT,
        pb: flushTop ? 0 : STAGE_PB,
        overflowX: 'hidden',
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
