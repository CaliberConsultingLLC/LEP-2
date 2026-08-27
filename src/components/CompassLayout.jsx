import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';
import { CONTENT_MAX_WIDTH_DEFAULT, CONTENT_PX } from './layoutConstants';

// Layout wrapper for the Cairn (staging) theme.
// The chapter header is ~138px. This stage fills what is left, pads it, and
// centers the content column. Production renders children with no wrapper.
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
        alignItems: viewportFit ? 'stretch' : 'flex-start',
        boxSizing: 'border-box',
        px: CONTENT_PX,
        py: flushTop ? 0 : { xs: 3, md: 5 },
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
          my: viewportFit ? 0 : 'auto',
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
