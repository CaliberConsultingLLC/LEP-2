import React from 'react';
import { Box, Typography } from '@mui/material';
import { useCairnTheme } from '../config/runtimeFlags';
import { getPersona } from '../data/guidePersonas';

// Layout wrapper for the Cairn (staging) theme.
//
// Without sidebar:   content is centered in a 780px column (intake, verify, etc.)
// With sidebar:      true full-page 20% | 60% | 20% grid.
//                    Left  20% = navigation sidebar passed via `sidebar` prop.
//                    Center 60% = children (main page content).
//                    Right  20% = guide persona (owl + name + tagline).
//
// Production (useCairnTheme === false): renders children directly, no wrapper.
function CompassLayout({ children, progress = 0, sidebar = null }) {
  if (!useCairnTheme) {
    return children;
  }

  const guideName = (() => {
    try { return localStorage.getItem('cairnGuide') || 'mentor'; } catch { return 'mentor'; }
  })();
  const persona = getPersona(guideName);

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
        // Full-width 20 / 60 / 20 grid — no maxWidth, spans the entire page
        <Box sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '20% 60% 20%' },
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Left 20% — navigation sidebar */}
          <Box sx={{ pt: 4, pb: 12, px: 3 }}>
            {sidebar}
          </Box>

          {/* Center 60% — main content */}
          <Box sx={{ pt: 3, pb: 12, px: { xs: 2, md: 4 } }}>
            {children}
          </Box>

          {/* Right 20% — guide persona */}
          <Box sx={{
            pt: 4, pb: 6, px: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 1.5,
          }}>
            <Box
              component="img"
              src={persona.poses.idle}
              alt={persona.name}
              sx={{
                height: 200, width: 'auto', objectFit: 'contain',
                filter: 'drop-shadow(0 4px 16px rgba(16,34,60,0.10))',
              }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.82rem', fontWeight: 800,
                color: persona.accent || 'var(--navy-900, #10223C)',
                letterSpacing: '0.04em',
              }}>
                {persona.name}
              </Typography>
              <Typography sx={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '0.75rem', color: 'var(--ink-soft, #44566C)',
                lineHeight: 1.4, mt: 0.3,
              }}>
                {persona.tagline}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        // Centered single column — intake form, verify, and other non-nav pages
        <Box sx={{
          flex: 1, display: 'flex', justifyContent: 'center',
          pt: 3, pb: 12, px: { xs: 2, md: 4 },
          position: 'relative', zIndex: 1,
        }}>
          <Box sx={{ width: '100%', maxWidth: 780 }}>
            {children}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CompassLayout;
