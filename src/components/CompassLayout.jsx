import React from 'react';
import { Box } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';
import { CONTENT_MAX_WIDTH_DEFAULT, CONTENT_PX } from './layoutConstants';

// Layout wrapper for the Cairn (staging) theme.
//
// Without sidebar:   content is centered in a 780px column (intake, verify, etc.)
// With sidebar:      true full-page responsive grid with optional right rail.
//                    Left  20% = navigation sidebar passed via `sidebar` prop.
//                    Center 60% = children (main page content).
//                    Right  20% = optional context rail, or reserved breathing room.
//
// Production (useCairnTheme === false): renders children directly, no wrapper.
function CompassLayout({
  children,
  sidebar = null,
  rightRail = null,
  contentMaxWidth = CONTENT_MAX_WIDTH_DEFAULT,
  viewportFit = false,
  fluid = false,
}) {
  if (!useCairnTheme) {
    return children;
  }

  return (
    <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: viewportFit ? 'hidden' : 'visible' }}>

      {sidebar ? (
        // Full-width stage layout inspired by the Compass review screens:
        // compact chapter rail, generous reading column, optional context rail.
        <Box sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: rightRail ? '22% minmax(0, 56%) 22%' : '22% minmax(0, 66%) 12%',
          },
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
          overflow: viewportFit ? 'hidden' : 'visible',
        }}>
          {/* Left 20% — navigation sidebar */}
          <Box sx={{ order: { xs: 1, md: 0 }, pt: 3, pb: { xs: 1.5, md: viewportFit ? 2 : 12 }, px: { xs: 2, md: 2.5, lg: 3 } }}>
            {sidebar}
          </Box>

          {/* Center — main content */}
          <Box sx={{ order: { xs: 2, md: 0 }, pt: { xs: 1.5, md: viewportFit ? 1.5 : 3 }, pb: viewportFit ? 2 : 12, px: CONTENT_PX, minHeight: 0, overflow: viewportFit ? 'hidden' : 'visible', height: viewportFit ? '100%' : 'auto' }}>
            {children}
          </Box>

          {/* Right — context rail or reserved empty column */}
          <Box sx={{ order: { xs: 3, md: 0 }, display: 'block', pt: { xs: 0, md: viewportFit ? 1.5 : 3 }, pb: { xs: 0, md: viewportFit ? 2 : 12 }, pr: { md: 2.5, lg: 3 }, pl: 0 }}>
            {rightRail}
          </Box>
        </Box>
      ) : (
        // Centered single column — intake form, verify, and other non-nav pages
        <Box sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          pt: viewportFit ? 1 : 0,
          pb: viewportFit ? 2 : 12,
          px: CONTENT_PX,
          overflowX: 'auto',
          overflowY: viewportFit ? 'hidden' : 'visible',
          position: 'relative',
          zIndex: 1,
        }}>
          <Box
            sx={{
              width: rightRail || fluid ? '100%' : contentMaxWidth,
              minWidth: rightRail || fluid ? 0 : contentMaxWidth,
              maxWidth: contentMaxWidth,
              height: viewportFit ? '100%' : 'auto',
              minHeight: 0,
              overflow: viewportFit ? 'hidden' : 'visible',
            }}
          >
            {children}
          </Box>
          {rightRail}
        </Box>
      )}
    </Box>
  );
}

export default CompassLayout;
