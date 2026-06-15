import React, { useMemo } from 'react';
import { colors, fonts } from '../../../styles/tokens';

const VIEW = 560;
const PAD = 48;
const INNER = VIEW - PAD * 2;
const MAP_BG = '#fbf8f2';
const FOCUS_INK = '#161616';

const MODE_BUTTON = {
  width: 34,
  height: 34,
  borderRadius: '999px',
  border: `1px solid ${colors.sand300}`,
  background: colors.surface1,
  color: colors.inkSoft,
  fontFamily: fonts.mono,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

function clamp01(v) {
  return Math.max(0, Math.min(100, Number(v) || 0));
}

function xForEffort(v) {
  return PAD + (clamp01(v) / 100) * INNER;
}

function yForEfficacy(v) {
  return PAD + INNER - (clamp01(v) / 100) * INNER;
}

function Node({ x, y, label, selected, dimmed, mode, onClick }) {
  const isFocusMode = mode !== 'map';
  const r = selected ? 16.5 : 13;
  const fill = selected ? (isFocusMode ? colors.surface1 : colors.navy900) : colors.navy300;
  const stroke = selected
    ? (isFocusMode ? FOCUS_INK : colors.navy900)
    : colors.surface1;

  return (
    <g
      onClick={onClick}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.34 : 1,
        transition: 'opacity 220ms ease',
      }}
    >
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={selected ? 2.8 : 1.6} />
      <text
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        fill={selected ? (isFocusMode ? FOCUS_INK : colors.surface1) : colors.surface1}
        style={{
          fontFamily: fonts.mono,
          fontSize: 11.5,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          pointerEvents: 'none',
        }}
      >
        {label}
      </text>
    </g>
  );
}

export default function EvidenceQuadrant({
  statements = [],
  selectedIdx = 0,
  onSelect,
  mode = 'map',
  onModeChange,
}) {
  const plotted = useMemo(() => statements.map((s, i) => {
    if (mode === 'efficacy') {
      const x = PAD + INNER * (0.28 + ((i % 3) * 0.2));
      return {
        idx: i,
        x,
        y: yForEfficacy(s.efficacy),
        label: Math.round(s.efficacy),
      };
    }
    if (mode === 'effort') {
      const y = PAD + INNER * (0.28 + ((i % 3) * 0.2));
      return {
        idx: i,
        x: xForEffort(s.effort),
        y,
        label: Math.round(s.effort),
      };
    }
    return {
      idx: i,
      x: xForEffort(s.effort),
      y: yForEfficacy(s.efficacy),
      label: Math.round(s.compass),
    };
  }), [mode, statements]);

  const selected = plotted[selectedIdx] || null;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="efficacyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.navy900} stopOpacity="0.2" />
            <stop offset="100%" stopColor={MAP_BG} stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="effortGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={colors.orange} stopOpacity="0.24" />
            <stop offset="100%" stopColor={MAP_BG} stopOpacity="0.06" />
          </linearGradient>
        </defs>

        <rect x={PAD} y={PAD} width={INNER} height={INNER} fill={MAP_BG} stroke={colors.sand200} />

        {mode === 'map' && (
          <>
            <rect x={PAD} y={PAD} width={INNER / 2} height={INNER / 2} fill={colors.navy300} opacity="0.11" />
            <rect x={PAD + INNER / 2} y={PAD} width={INNER / 2} height={INNER / 2} fill={colors.amberSoft} opacity="0.24" />
            <rect x={PAD} y={PAD + INNER / 2} width={INNER / 2} height={INNER / 2} fill={colors.navy500} opacity="0.07" />
            <rect x={PAD + INNER / 2} y={PAD + INNER / 2} width={INNER / 2} height={INNER / 2} fill={colors.orange} opacity="0.07" />
            <line x1={PAD + INNER / 2} y1={PAD} x2={PAD + INNER / 2} y2={PAD + INNER} stroke={colors.sand300} strokeDasharray="5 5" />
            <line x1={PAD} y1={PAD + INNER / 2} x2={PAD + INNER} y2={PAD + INNER / 2} stroke={colors.sand300} strokeDasharray="5 5" />
            <text x={PAD + 12} y={PAD + 16} fill={colors.inkMute} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.12em' }}>NATURAL GIFT</text>
            <text x={PAD + INNER - 12} y={PAD + 16} textAnchor="end" fill={colors.inkMute} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.12em' }}>FULL STRENGTH</text>
            <text x={PAD + 12} y={PAD + INNER - 10} fill={colors.inkMute} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.12em' }}>UNTAPPED</text>
            <text x={PAD + INNER - 12} y={PAD + INNER - 10} textAnchor="end" fill={colors.inkMute} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.12em' }}>OFF-TARGET</text>
            <text
              x={PAD - 18}
              y={PAD + INNER / 2}
              fill={colors.inkSoft}
              style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.08em' }}
              transform={`rotate(-90 ${PAD - 18} ${PAD + INNER / 2})`}
            >
              EFFICACY
            </text>
            <text x={PAD + INNER / 2} y={PAD + INNER + 20} textAnchor="middle" fill={colors.inkSoft} style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.08em' }}>EFFORT</text>
          </>
        )}

        {mode === 'efficacy' && (
          <>
            <rect x={PAD} y={PAD} width={INNER} height={INNER} fill="url(#efficacyGrad)" />
            {Array.from({ length: 5 }).map((_, i) => {
              const y = PAD + (INNER / 4) * i;
              return <line key={i} x1={PAD} y1={y} x2={PAD + INNER} y2={y} stroke={colors.sand300} strokeDasharray="2 6" />;
            })}
            <text x={PAD + 8} y={PAD + 14} fill={colors.inkSoft} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.1em' }}>HIGHLY EFFECTIVE</text>
            <text x={PAD + 8} y={PAD + INNER - 8} fill={colors.inkSoft} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.1em' }}>NOT EFFECTIVE</text>
          </>
        )}

        {mode === 'effort' && (
          <>
            <rect x={PAD} y={PAD} width={INNER} height={INNER} fill="url(#effortGrad)" />
            {Array.from({ length: 5 }).map((_, i) => {
              const x = PAD + (INNER / 4) * i;
              return <line key={i} x1={x} y1={PAD} x2={x} y2={PAD + INNER} stroke={colors.sand300} strokeDasharray="2 6" />;
            })}
            <text x={PAD + 10} y={PAD + INNER / 2} fill={colors.inkSoft} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.1em' }} transform={`rotate(-90 ${PAD + 10} ${PAD + INNER / 2})`}>LOW EFFORT</text>
            <text x={PAD + INNER - 10} y={PAD + INNER / 2} fill={colors.inkSoft} style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.1em' }} transform={`rotate(90 ${PAD + INNER - 10} ${PAD + INNER / 2})`}>HIGH EFFORT</text>
          </>
        )}

        {mode === 'map' && selected && (
          <>
            <line x1={selected.x} y1={selected.y} x2={selected.x} y2={PAD + INNER} stroke={colors.orange} strokeDasharray="4 5" strokeWidth="1.5" />
            <line x1={PAD} y1={selected.y} x2={selected.x} y2={selected.y} stroke={colors.navy500} strokeDasharray="4 5" strokeWidth="1.5" />
          </>
        )}

        {plotted.map((pt) => (
          <Node
            key={pt.idx}
            x={pt.x}
            y={pt.y}
            label={pt.label}
            mode={mode}
            selected={pt.idx === selectedIdx}
            dimmed={selectedIdx != null && pt.idx !== selectedIdx}
            onClick={() => onSelect?.(pt.idx)}
          />
        ))}
      </svg>

      <div style={{ position: 'absolute', left: 4, top: '49%', transform: 'translateY(-50%)' }}>
        <button
          type="button"
          aria-label="Focus efficacy"
          onClick={() => onModeChange?.('efficacy')}
          style={{ ...MODE_BUTTON, color: mode === 'efficacy' ? colors.navy900 : colors.inkSoft, borderColor: mode === 'efficacy' ? colors.navy500 : colors.sand300 }}
        >
          ↑
        </button>
      </div>

      <div style={{ position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%)' }}>
        <button
          type="button"
          aria-label="Focus effort"
          onClick={() => onModeChange?.('effort')}
          style={{ ...MODE_BUTTON, color: mode === 'effort' ? colors.navy900 : colors.inkSoft, borderColor: mode === 'effort' ? colors.navy500 : colors.sand300 }}
        >
          →
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          type="button"
          onClick={() => onModeChange?.('map')}
          disabled={mode === 'map'}
          style={{
            ...MODE_BUTTON,
            width: 'auto',
            padding: '0 12px',
            fontSize: 10,
            letterSpacing: '0.1em',
            opacity: mode === 'map' ? 0.45 : 1,
          }}
        >
          BACK TO MAP
        </button>
      </div>
    </div>
  );
}
