import React from 'react';
import { Box } from '@mui/material';
import { JOURNEY_BASE_SRC, JOURNEY_IMAGE, JOURNEY_STATIONS } from '../pages/Dashboard/journey/journeyModel.js';

const SIZE_BY_VARIANT = {
  header: 116,
  ceremony: 236,
  corner: 100,
  room: 300,
};

const ZOOM_BY_VARIANT = {
  header: 0.38,
  ceremony: 0.46,
  corner: 0.38,
  room: 0.7,
};

const PAD_BY_VARIANT = {
  header: 5,
  ceremony: 6,
  corner: 4,
  room: 7,
};

/**
 * Circular map lens. The orange pulse stays fixed at center; the map pans
 * underneath so the focus point (station or animated walk) sits on the pulse.
 *
 * `size` may be any CSS length — including a clamp() — because the pan is
 * expressed as `calc(50% + offset)` rather than a pixel offset measured from
 * the content box. Both forms resolve to the same place; only the calc one
 * survives a lens that is sized by its column instead of by a number.
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
  const isRoom = variant === 'room';
  const bgWidth = JOURNEY_IMAGE.width * zoom;
  const bgHeight = JOURNEY_IMAGE.height * zoom;
  const fx = Number.isFinite(focusX) ? focusX : station.x;
  const fy = Number.isFinite(focusY) ? focusY : station.y;
  // Pan relative to the painted circle's own centre. A background-position
  // percentage aligns the same point of image and box, so the correction that
  // lands the focus point on the pulse is a pure function of the image size.
  const bgX = `calc(50% + ${(0.5 - fx) * bgWidth}px)`;
  const bgY = `calc(50% + ${(0.5 - fy) * bgHeight}px)`;
  const cssSize = typeof diameter === 'number' ? `${diameter}px` : diameter;
  const dotSize = isRoom ? 14 : variant === 'ceremony' ? 12 : 10;
  const ringInset = isRoom ? '5px' : variant === 'ceremony' ? '4px' : isCorner ? '3px' : '3.5px';
  const diamondSize = isRoom ? 12 : variant === 'ceremony' ? 9 : 8;
  const bezelShadow = isCorner
    ? '0 12px 28px rgba(15,28,46,0.3), inset 0 1px 0 rgba(244,206,161,0.3), 0 0 0 5px var(--dial-node-fill)'
    : isRoom
      ? '0 24px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(244,206,161,0.35), 0 0 0 1px rgba(244,206,161,0.18)'
      : '0 10px 24px rgba(15,28,46,0.28), inset 0 1px 0 rgba(244,206,161,0.3)';

  return (
    <Box
      aria-hidden
      sx={{
        '--ph-size': cssSize,
        width: 'var(--ph-size)',
        height: 'var(--ph-size)',
        flexShrink: 0,
        position: 'relative',
        borderRadius: '50%',
        padding: `${pad}px`,
        boxSizing: 'border-box',
        background: isRoom
          ? 'linear-gradient(155deg, var(--navy-600), var(--navy-950) 70%)'
          : 'linear-gradient(155deg, var(--navy-700), var(--navy-950) 70%)',
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
            : isRoom
              ? '3px solid var(--brass)'
              : '2px solid color-mix(in srgb, var(--amber) 75%, var(--orange-deep))',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: variant === 'ceremony' || isRoom ? '1px' : '0',
          width: diamondSize,
          height: diamondSize,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          background: isCorner || isRoom ? 'var(--brass)' : 'color-mix(in srgb, var(--amber) 75%, var(--orange-deep))',
          border: isRoom ? '2px solid var(--navy-950)' : '1.5px solid var(--navy-950)',
          boxSizing: 'border-box',
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
          backgroundPosition: `${bgX} ${bgY}`,
          transition: instant ? 'none' : 'background-position 1300ms cubic-bezier(0.2,0.8,0.2,1)',
          boxShadow: isRoom ? 'inset 0 0 40px rgba(15,28,46,0.5)' : 'inset 0 0 22px rgba(15,28,46,0.38)',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: isRoom
              ? 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.32) 0 36%, transparent 40%)'
              : 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.42) 0 38%, transparent 40%)',
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
            border: variant === 'ceremony' || isRoom ? '2.5px solid white' : '2px solid white',
            boxSizing: 'border-box',
            boxShadow: '0 3px 12px rgba(15,28,46,0.32)',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: isRoom ? -9 : -7,
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
