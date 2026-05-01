import React from 'react';
import { Box } from '@mui/material';

const cardinals = [
  { label: 'N', angle: 0, primary: true },
  { label: 'E', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'W', angle: 270 },
];

function CompassDial({ size = 420, tone = 'dark' }) {
  const isDark = tone === 'dark';

  const palette = isDark
    ? {
        faceCenter: '#213B5C',
        faceMid: '#10223C',
        faceEdge: '#0A1830',
        ring: 'rgba(244,206,161,0.42)',
        innerRing: 'rgba(244,206,161,0.14)',
        label: '#F4CEA1',
        labelMuted: 'rgba(244,206,161,0.55)',
        tick: 'rgba(244,206,161,0.50)',
        tickMinor: 'rgba(244,206,161,0.22)',
        needleNorth: '#F4CEA1',
        needleSouth: 'rgba(255,248,240,0.85)',
        hubRing: '#F4CEA1',
        hubFill: '#0A1830',
        haloFrom: 'rgba(244,206,161,0.26)',
        haloTo: 'rgba(244,206,161,0)',
      }
    : {
        faceCenter: '#FFF8F0',
        faceMid: '#F4ECDD',
        faceEdge: '#E8DBC3',
        ring: 'rgba(15,28,46,0.20)',
        innerRing: 'rgba(15,28,46,0.08)',
        label: '#10223C',
        labelMuted: 'rgba(15,28,46,0.45)',
        tick: 'rgba(15,28,46,0.30)',
        tickMinor: 'rgba(15,28,46,0.14)',
        needleNorth: '#E07A3F',
        needleSouth: 'rgba(15,28,46,0.85)',
        hubRing: '#C0612A',
        hubFill: '#FFF8F0',
        haloFrom: 'rgba(224,122,63,0.22)',
        haloTo: 'rgba(224,122,63,0)',
      };

  const r = size / 2;
  const rimRadius = r - 4;
  const innerRimRadius = r - 14;
  const tickInner = r - 22;
  const tickOuter = r - 8;
  const labelRadius = r - 42;
  const needleLength = r - 56;
  const needleTailLength = needleLength * 0.78;
  const hubRadiusOuter = Math.max(7, size * 0.022);
  const hubRadiusInner = hubRadiusOuter - 3;
  const labelFontSize = size * 0.062;

  const dialId = `compassDialFace-${tone}`;

  const points = (count) =>
    Array.from({ length: count }).map((_, i) => {
      const angle = (i * 360) / count;
      const isMajor = i % (count / 4) === 0;
      const isMinor = i % (count / 8) === 0 && !isMajor;
      const inner = isMajor ? tickInner - 6 : isMinor ? tickInner - 3 : tickInner;
      const outer = tickOuter;
      const rad = ((angle - 90) * Math.PI) / 180;
      return {
        key: i,
        x1: r + Math.cos(rad) * inner,
        y1: r + Math.sin(rad) * inner,
        x2: r + Math.cos(rad) * outer,
        y2: r + Math.sin(rad) * outer,
        major: isMajor,
        minor: isMinor,
      };
    });

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: size,
        aspectRatio: '1 / 1',
        mx: 'auto',
        '& [data-needle]': {
          transformBox: 'view-box',
          transformOrigin: '50% 50%',
          animation: 'compassNeedleSearch 14s ease-in-out infinite',
        },
        '& [data-face]': {
          transformBox: 'view-box',
          transformOrigin: '50% 50%',
          animation: 'compassFaceDrift 38s linear infinite',
        },
        '@keyframes compassNeedleSearch': {
          '0%, 100%': { transform: 'rotate(-22deg)' },
          '32%': { transform: 'rotate(16deg)' },
          '58%': { transform: 'rotate(-9deg)' },
          '82%': { transform: 'rotate(3deg)' },
        },
        '@keyframes compassFaceDrift': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& [data-needle], & [data-face]': { animation: 'none' },
        },
      }}
    >
      {/* Halo */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-14%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%, ${palette.haloFrom}, ${palette.haloTo} 62%)`,
          pointerEvents: 'none',
          filter: 'blur(2px)',
        }}
      />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        style={{ display: 'block', position: 'relative', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={dialId} cx="38%" cy="32%" r="78%">
            <stop offset="0%" stopColor={palette.faceCenter} />
            <stop offset="55%" stopColor={palette.faceMid} />
            <stop offset="100%" stopColor={palette.faceEdge} />
          </radialGradient>
        </defs>

        {/* Outer rim */}
        <circle
          cx={r}
          cy={r}
          r={rimRadius}
          fill={`url(#${dialId})`}
          stroke={palette.ring}
          strokeWidth={1.4}
        />
        {/* Inner rim */}
        <circle
          cx={r}
          cy={r}
          r={innerRimRadius}
          fill="none"
          stroke={palette.innerRing}
          strokeWidth={1}
        />

        {/* Slowly drifting tick + cardinal marks */}
        <g data-face>
          {points(48).map((p) => (
            <line
              key={p.key}
              x1={p.x1}
              y1={p.y1}
              x2={p.x2}
              y2={p.y2}
              stroke={p.major || p.minor ? palette.tick : palette.tickMinor}
              strokeWidth={p.major ? 1.6 : p.minor ? 1.1 : 0.7}
              strokeLinecap="round"
            />
          ))}
          {cardinals.map(({ label, angle, primary }) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x = r + Math.cos(rad) * labelRadius;
            const y = r + Math.sin(rad) * labelRadius;
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={primary ? palette.label : palette.labelMuted}
                fontFamily={'"Cinzel", Georgia, serif'}
                fontSize={labelFontSize}
                fontWeight={primary ? 700 : 600}
                letterSpacing="0.08em"
                style={{ fontVariant: 'small-caps' }}
              >
                {label}
              </text>
            );
          })}
        </g>

        {/* Needle */}
        <g data-needle>
          <polygon
            points={`${r},${r - needleLength} ${r - 6.5},${r} ${r + 6.5},${r}`}
            fill={palette.needleNorth}
          />
          <polygon
            points={`${r},${r + needleTailLength} ${r - 5},${r} ${r + 5},${r}`}
            fill={palette.needleSouth}
            opacity="0.9"
          />
          <line
            x1={r}
            y1={r - needleLength}
            x2={r}
            y2={r - needleLength + 4}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1}
            strokeLinecap="round"
          />
        </g>

        {/* Center hub */}
        <circle cx={r} cy={r} r={hubRadiusOuter} fill={palette.hubRing} />
        <circle cx={r} cy={r} r={hubRadiusInner} fill={palette.hubFill} />
      </svg>
    </Box>
  );
}

export default CompassDial;
