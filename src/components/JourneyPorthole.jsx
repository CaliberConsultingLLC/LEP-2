import React from 'react';
import { Box } from '@mui/material';
import { JOURNEY_BASE_SRC, JOURNEY_IMAGE, JOURNEY_STATIONS } from '../pages/Dashboard/journey/journeyModel.js';

const SIZE_BY_VARIANT = {
  header: 116,
  ceremony: 218,
  corner: 100,
};

const ZOOM_BY_VARIANT = {
  header: 0.38,
  ceremony: 0.46,
  corner: 0.38,
};

const PAD_BY_VARIANT = {
  header: 5,
  ceremony: 6,
  corner: 4,
};

/**
 * Circular map lens. The orange pulse stays fixed at center; the map pans
 * underneath so the focus point (station or animated walk) sits on the pulse.
 */
export default function JourneyPorthole({
  chapterIndex = 0,
  variant = 'header',
  size,
  focusX = null,
  focusY = null,
  instant = false,
}) {
  const station = JOURNEY_STATIONS[Math.max(0, Math.min(chapterIndex, JOURNEY_STATIONS.length - 1))] || JOURNEY_STATIONS[0];
  const diameter = size || SIZE_BY_VARIANT[variant] || SIZE_BY_VARIANT.header;
  const zoom = ZOOM_BY_VARIANT[variant] || ZOOM_BY_VARIANT.header;
  const pad = PAD_BY_VARIANT[variant] || PAD_BY_VARIANT.header;
  const isCorner = variant === 'corner';
  const contentSize = diameter - pad * 2;
  const bgWidth = JOURNEY_IMAGE.width * zoom;
  const bgHeight = JOURNEY_IMAGE.height * zoom;
  const fx = Number.isFinite(focusX) ? focusX : station.x;
  const fy = Number.isFinite(focusY) ? focusY : station.y;
  // Position relative to the painted map circle (content box), not the outer bezel.
  const bgX = contentSize / 2 - fx * bgWidth;
  const bgY = contentSize / 2 - fy * bgHeight;
  const dotSize = variant === 'ceremony' ? 12 : 10;
  const ringInset = variant === 'ceremony' ? '4px' : isCorner ? '3px' : '3.5px';
  const diamondSize = variant === 'ceremony' ? 9 : 8;
  const bezelShadow = isCorner
    ? '0 12px 28px rgba(15,28,46,0.3), inset 0 1px 0 rgba(244,206,161,0.3), 0 0 0 5px var(--dial-node-fill)'
    : '0 10px 24px rgba(15,28,46,0.28), inset 0 1px 0 rgba(244,206,161,0.3)';

  return (
    <Box
      aria-hidden
      sx={{
        '--ph-size': `${diameter}px`,
        width: 'var(--ph-size)',
        height: 'var(--ph-size)',
        flexShrink: 0,
        position: 'relative',
        borderRadius: '50%',
        padding: `${pad}px`,
        background: 'linear-gradient(155deg, var(--navy-700), var(--navy-950) 70%)',
        boxShadow: bezelShadow,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: ringInset,
          borderRadius: '50%',
          border: isCorner
            ? '2px solid var(--brass)'
            : '2px solid color-mix(in srgb, var(--amber) 75%, var(--orange-deep))',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: variant === 'ceremony' ? '1px' : '0',
          width: diamondSize,
          height: diamondSize,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          background: isCorner ? 'var(--brass)' : 'color-mix(in srgb, var(--amber) 75%, var(--orange-deep))',
          border: '1.5px solid var(--navy-950)',
          zIndex: 3,
        }}
      />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          backgroundImage: `url(${JOURNEY_BASE_SRC})`,
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          transition: instant ? 'none' : 'background-position 1300ms cubic-bezier(0.2,0.8,0.2,1)',
          boxShadow: 'inset 0 0 22px rgba(15,28,46,0.38)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.42) 0 38%, transparent 40%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: dotSize,
            height: dotSize,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'var(--orange)',
            border: variant === 'ceremony' ? '2.5px solid white' : '2px solid white',
            boxShadow: '0 3px 12px rgba(15,28,46,0.32)',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -7,
              borderRadius: '50%',
              border: '2px solid var(--orange)',
              opacity: 0.55,
              animation: 'journeyPortholePulse 2.4s ease-out infinite',
            },
            '@keyframes journeyPortholePulse': {
              '0%': { transform: 'scale(0.9)', opacity: 0.55 },
              '70%': { transform: 'scale(1.7)', opacity: 0 },
              '100%': { transform: 'scale(1.7)', opacity: 0 },
            },
            '@media (prefers-reduced-motion: reduce)': {
              '&::after': { animation: 'none', opacity: 0 },
            },
          }}
        />
      </Box>
    </Box>
  );
}
