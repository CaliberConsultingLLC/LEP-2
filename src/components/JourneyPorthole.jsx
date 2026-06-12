import React from 'react';
import { Box } from '@mui/material';
import { JOURNEY_BASE_SRC, JOURNEY_IMAGE, JOURNEY_STATIONS } from '../pages/Dashboard/journey/journeyModel.js';

const SIZE_BY_VARIANT = {
  header: 116,
  ceremony: 218,
};

const ZOOM_BY_VARIANT = {
  header: 0.38,
  ceremony: 0.46,
};

export default function JourneyPorthole({ chapterIndex = 0, variant = 'header', size }) {
  const station = JOURNEY_STATIONS[Math.max(0, Math.min(chapterIndex, JOURNEY_STATIONS.length - 1))] || JOURNEY_STATIONS[0];
  const diameter = size || SIZE_BY_VARIANT[variant] || SIZE_BY_VARIANT.header;
  const zoom = ZOOM_BY_VARIANT[variant] || ZOOM_BY_VARIANT.header;
  const bgWidth = JOURNEY_IMAGE.width * zoom;
  const bgHeight = JOURNEY_IMAGE.height * zoom;
  const bgX = diameter / 2 - station.x * bgWidth;
  const bgY = diameter / 2 - station.y * bgHeight;
  const dotSize = variant === 'ceremony' ? 12 : 10;

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
        padding: variant === 'ceremony' ? '6px' : '5px',
        background: 'linear-gradient(155deg, var(--navy-700), var(--navy-950) 70%)',
        boxShadow: '0 10px 24px rgba(15,28,46,0.28), inset 0 1px 0 rgba(244,206,161,0.3)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: variant === 'ceremony' ? '4px' : '3.5px',
          borderRadius: '50%',
          border: '2px solid color-mix(in srgb, var(--amber) 75%, var(--orange-deep))',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: variant === 'ceremony' ? '1px' : '0',
          width: variant === 'ceremony' ? 9 : 8,
          height: variant === 'ceremony' ? 9 : 8,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          background: 'color-mix(in srgb, var(--amber) 75%, var(--orange-deep))',
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
          transition: 'background-position 1300ms cubic-bezier(0.2,0.8,0.2,1)',
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
