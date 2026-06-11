import React from 'react';
import { colors, fonts, radiiPx } from '../../../styles/tokens';
import { QUADRANTS } from './quadrants.js';

/**
 * EvidenceQuadrant — the layered Effort × Efficacy map for the Evidence room.
 * Replaces TraitQuadrant's statements mode per the Command Center redesign.
 *
 *   Layer 0  field        washes, midlines, quiet corner/axis labels
 *   Layer 1  relations    axis projections, self connectors (under everything)
 *   Layer 2  data points  rest r=8, focal r=12, ONE dashed halo per chart
 *   Layer 3  label chips  white backing, sans name + mono score, drawn last,
 *                         collision-nudged with leader lines
 *   Layer 4  callouts     animated EFFORT / EFFICACY axis callouts
 *
 * Shows one trait's five statements. Selecting a statement isolates its dot
 * and plays axis projections; deselecting shows all five. Self comparison
 * renders as an orange dot + dotted connector + "Self" chip.
 */

const CHIP_H = 22;

function chipW(name, score) {
  const nameW = name ? String(name).length * 6.7 : 0;
  const scoreW = score != null ? String(score).length * 7.2 : 0;
  const gap = name && score != null ? 7 : 0;
  return Math.round(nameW + scoreW + gap + 18);
}

function intersects(a, b, m = 4) {
  return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
}

// Animated reveal for projections/callouts. Base state is fully visible; the
// hidden start-state only exists inside a frame callback with a timer safety
// net — a frozen frame clock degrades to "no animation", never "no content".
function Reveal({ originX = 0, originY = 0, axis = null, fade = false, animKey, children }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    let raf2 = 0;
    let timer = 0;
    let safety = 0;
    const show = () => {
      el.style.transition = 'transform 550ms cubic-bezier(.2,.8,.2,1), opacity 420ms ease';
      el.style.transform = 'scale(1,1)';
      el.style.opacity = '1';
    };
    const raf1 = requestAnimationFrame(() => {
      el.style.transition = 'none';
      if (axis === 'y') el.style.transform = 'scale(1,0.001)';
      if (axis === 'x') el.style.transform = 'scale(0.001,1)';
      if (fade) el.style.opacity = '0';
      raf2 = requestAnimationFrame(() => {
        timer = setTimeout(show, fade ? 300 : 0);
      });
      safety = setTimeout(show, fade ? 520 : 200);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
      clearTimeout(safety);
      el.style.transition = 'none';
      el.style.transform = 'scale(1,1)';
      el.style.opacity = '1';
    };
  }, [animKey, axis, fade]);
  return (
    <g ref={ref} style={{ transformBox: 'view-box', transformOrigin: `${originX}px ${originY}px`, opacity: 1 }}>
      {children}
    </g>
  );
}

export default function EvidenceQuadrant({
  row,
  selectedIdx = null,
  onStatementClick = null,
  showSelf = true,
  size = 560,
}) {
  const uid = React.useRef(`eq${Math.random().toString(36).slice(2, 8)}`).current;
  const pad = 44;
  const inner = size - pad * 2;
  const x = (effort) => pad + (effort / 100) * inner;
  const y = (efficacy) => pad + inner - (efficacy / 100) * inner;
  const yBase = size - pad;

  const cornerStyle = {
    fontFamily: fonts.mono,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  };

  const corners = [
    { q: QUADRANTS.naturalGift, tx: pad + 8, ty: pad + 15, anchor: 'start' },
    { q: QUADRANTS.fullStrength, tx: size - pad - 8, ty: pad + 15, anchor: 'end' },
    { q: QUADRANTS.untapped, tx: pad + 8, ty: size - pad - 8, anchor: 'start' },
    { q: QUADRANTS.offTarget, tx: size - pad - 8, ty: size - pad - 8, anchor: 'end' },
  ];

  // Reserved boxes: data chips may not enter the corner-label zones.
  const cornerBoxes = [
    { x: pad + 2, y: pad + 2, w: 118, h: 18 },
    { x: size - pad - 120, y: pad + 2, w: 118, h: 18 },
    { x: pad + 2, y: size - pad - 20, w: 118, h: 18 },
    { x: size - pad - 120, y: size - pad - 20, w: 118, h: 18 },
  ];

  // ---- chip placement -------------------------------------------------------
  const placed = [];
  const chips = [];
  const callouts = [];
  const relations = [];
  const dots = [];
  const clampX = (v, w) => Math.max(pad + 3, Math.min(size - pad - 3 - w, v));
  const clampY = (v, h) => Math.max(pad + 3, Math.min(size - pad - 3 - h, v));

  function addChip({ name, score, cx, cy, dotR = 8 }) {
    const w = chipW(name, score);
    const h = CHIP_H;
    let box = null;
    const candidates = [
      { x: cx - w / 2, y: cy - dotR - 9 - h },
      { x: cx - w / 2, y: cy + dotR + 9 },
      { x: cx + dotR + 10, y: cy - h / 2 },
      { x: cx - dotR - 10 - w, y: cy - h / 2 },
    ];
    for (const c of candidates) {
      const cand = { x: clampX(c.x, w), y: c.y, w, h };
      if (cand.y < pad + 3 || cand.y + h > size - pad - 3) continue;
      if (placed.some((p) => intersects(cand, p))) continue;
      if (cornerBoxes.some((p) => intersects(cand, p, 2))) continue;
      box = cand;
      break;
    }
    if (!box) box = { x: clampX(cx - w / 2, w), y: clampY(cy - dotR - 9 - h, h), w, h };
    placed.push(box);
    chips.push({ box, name, score, cx, cy, dotR });
  }

  function renderChips() {
    return chips.map((c, i) => {
      const ccx = c.box.x + c.box.w / 2;
      const ccy = c.box.y + c.box.h / 2;
      const dist = Math.hypot(ccx - c.cx, ccy - c.cy);
      const showLeader = c.cx != null && dist > c.dotR + 36;
      const nameW = c.name ? String(c.name).length * 6.7 : 0;
      return (
        <g key={`chip-${i}`} style={{ pointerEvents: 'none' }}>
          {showLeader && (
            <line
              x1={ccx}
              y1={c.cy > ccy ? c.box.y + c.box.h : c.box.y}
              x2={c.cx}
              y2={c.cy > ccy ? c.cy - c.dotR - 2 : c.cy + c.dotR + 2}
              stroke={colors.sand300}
              strokeWidth="1"
            />
          )}
          <rect
            x={c.box.x}
            y={c.box.y}
            width={c.box.w}
            height={c.box.h}
            rx="10"
            fill="color-mix(in srgb, var(--surface-1) 93%, transparent)"
            stroke={colors.sand200}
            strokeWidth="1"
          />
          {c.name && (
            <text
              x={c.box.x + 9}
              y={c.box.y + 15.5}
              fill={colors.ink}
              style={{ fontFamily: fonts.sans, fontSize: 11.5, fontWeight: 700 }}
            >
              {c.name}
            </text>
          )}
          {c.score != null && (
            <text
              x={c.box.x + 9 + nameW + (c.name ? 7 : 0)}
              y={c.box.y + 15.5}
              fill={colors.orangeDeep}
              style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            >
              {c.score}
            </text>
          )}
        </g>
      );
    });
  }

  const halo = (cx, cy, dotR) => (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy} r={dotR + 16} fill={colors.orange} opacity="0.08" />
      <circle cx={cx} cy={cy} r={dotR + 8} fill="none" stroke={colors.orange} strokeWidth="1.5" strokeDasharray="4 5" opacity="0.8" />
    </g>
  );

  // ---- build layers ----------------------------------------------------------
  const statements = row?.team?.statements || [];
  statements.forEach((s, i) => {
    const sel = selectedIdx === i;
    // Isolation: when a statement is selected, all other dots hide.
    if (selectedIdx != null && !sel) return;
    const dotX = x(s.effort);
    const dotY = y(s.efficacy);
    const selfS = sel && showSelf && row.self ? row.self.statements[i] : null;

    if (sel) {
      // Projections drop FROM the dot TO each axis — effort straight down to
      // the x-axis, efficacy straight left to the y-axis — with large labeled
      // callouts waiting where they land.
      relations.push(
        <Reveal key={`proj-effort-${i}`} axis="y" originX={dotX} originY={dotY} animKey={i}>
          <line x1={dotX} y1={dotY + 20} x2={dotX} y2={yBase - 4} stroke={colors.orange} strokeWidth="2.5" opacity="0.75" />
          <polygon points={`${dotX},${yBase - 2} ${dotX - 5},${yBase - 11} ${dotX + 5},${yBase - 11}`} fill={colors.orange} opacity="0.75" />
        </Reveal>
      );
      relations.push(
        <Reveal key={`proj-efficacy-${i}`} axis="x" originX={dotX} originY={dotY} animKey={i}>
          <line x1={dotX - 20} y1={dotY} x2={pad + 4} y2={dotY} stroke={colors.green} strokeWidth="2.5" opacity="0.75" />
          <polygon points={`${pad + 3},${dotY} ${pad + 12},${dotY - 5} ${pad + 12},${dotY + 5}`} fill={colors.green} opacity="0.75" />
        </Reveal>
      );

      const calloutRect = (box, label, value, color) => (
        <g>
          {/* pill: rx is half the callout height */}
          <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={box.h / 2} fill={colors.surface1} stroke={color} strokeWidth="1.5" />
          <text
            x={box.x + 12}
            y={box.y + 17.5}
            fill={color}
            style={{ fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em' }}
          >
            {label}
          </text>
          <text
            x={box.x + 12 + label.length * 6.6 + 9}
            y={box.y + 19}
            fill={color}
            style={{ fontFamily: fonts.mono, fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </text>
        </g>
      );

      const effVal = Math.round(s.effort);
      const effW = Math.round('EFFORT'.length * 6.6 + 9 + String(effVal).length * 10 + 24);
      const effBox = {
        x: Math.max(pad, Math.min(size - pad - effW, dotX - effW / 2)),
        y: yBase + 6,
        w: effW,
        h: 26,
      };
      const ficVal = Math.round(s.efficacy);
      const ficW = Math.round('EFFICACY'.length * 6.6 + 9 + String(ficVal).length * 10 + 24);
      const ficBox = {
        x: pad + 6,
        y: Math.max(pad + 3, Math.min(yBase - 29, dotY - 13)),
        w: ficW,
        h: 26,
      };
      placed.push(effBox, ficBox);
      callouts.push(
        <Reveal key={`co-${i}`} fade animKey={i}>
          {calloutRect(effBox, 'EFFORT', effVal, colors.orangeDeep)}
          {calloutRect(ficBox, 'EFFICACY', ficVal, colors.green)}
        </Reveal>
      );
    }

    if (selfS) {
      relations.push(
        <line
          key={`selfcon-${i}`}
          x1={dotX}
          y1={dotY}
          x2={x(selfS.effort)}
          y2={y(selfS.efficacy)}
          stroke={colors.orange}
          strokeWidth="1.5"
          strokeDasharray="3 5"
          opacity="0.8"
        />
      );
      dots.push(
        <circle
          key={`selfdot-${i}`}
          cx={x(selfS.effort)}
          cy={y(selfS.efficacy)}
          r={8}
          fill={colors.orange}
          stroke={colors.surface1}
          strokeWidth="2"
        />
      );
    }

    dots.push(
      <g
        key={`stmt-${i}`}
        onClick={onStatementClick ? () => onStatementClick(sel ? null : i) : undefined}
        style={{ cursor: onStatementClick ? 'pointer' : 'default' }}
      >
        {sel && halo(dotX, dotY, 12)}
        <circle
          cx={dotX}
          cy={dotY}
          r={sel ? 12 : 8}
          fill={sel ? colors.textPrimary : colors.navy600}
          opacity={sel ? 1 : 0.8}
          stroke={sel ? colors.orange : colors.surface1}
          strokeWidth={sel ? 2.5 : 2}
        />
      </g>
    );

    if (sel) {
      addChip({ name: 'Compass', score: Math.round(s.lepScore), cx: dotX, cy: dotY, dotR: 12 });
    }
    if (selfS) {
      // Suppress the Self chip when the dots nearly overlap.
      const d = Math.hypot(x(selfS.effort) - dotX, y(selfS.efficacy) - dotY);
      if (d > 44) {
        addChip({ name: 'Self', score: Math.round(selfS.lepScore), cx: x(selfS.effort), cy: y(selfS.efficacy), dotR: 8 });
      }
    }
  });

  // Generic axis captions hide while projections + callouts tell the story.
  const hideAxisCaptions = selectedIdx != null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block' }}
      role="img"
      aria-label="Effort by efficacy quadrant"
    >
      <defs>
        <linearGradient id={`${uid}-aim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--green-soft)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--green-soft)" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={`${uid}-strain`} x1="0" y1="1" x2="1" y2="0">
          {/* saturated amber keeps the wash warm on dark surfaces (amber-soft greys out) */}
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Layer 0 — the field */}
      <rect x={pad} y={pad} width={inner} height={inner} fill={colors.surface1} stroke={colors.sand200} rx={radiiPx.md} />
      <rect x={pad + 1} y={pad + 1} width={inner / 2 - 1} height={inner / 2 - 1} fill={`url(#${uid}-aim)`} rx={radiiPx.sm} />
      <rect x={pad + inner / 2} y={pad + inner / 2} width={inner / 2 - 1} height={inner / 2 - 1} fill={`url(#${uid}-strain)`} />
      <line x1={x(50)} y1={pad} x2={x(50)} y2={size - pad} stroke={colors.sand200} strokeDasharray="3 5" />
      <line x1={pad} y1={y(50)} x2={size - pad} y2={y(50)} stroke={colors.sand200} strokeDasharray="3 5" />

      {corners.map((c) => (
        <text key={c.q.id} x={c.tx} y={c.ty} textAnchor={c.anchor} fill={c.q.color} style={cornerStyle} opacity="0.55">
          {c.q.label}
        </text>
      ))}
      {!hideAxisCaptions && (
        <g>
          <text x={size / 2} y={size - 10} textAnchor="middle" fill={colors.inkSoft} style={cornerStyle} opacity="0.6">
            Effort →
          </text>
          <text
            x={14}
            y={size / 2}
            textAnchor="middle"
            fill={colors.inkSoft}
            style={cornerStyle}
            opacity="0.6"
            transform={`rotate(-90 14 ${size / 2})`}
          >
            Efficacy →
          </text>
        </g>
      )}

      {/* Layer 1 — relationships */}
      {relations}

      {/* Layer 2 — data points */}
      {dots}

      {/* Layer 3 — label chips, always on top */}
      {renderChips()}

      {/* Layer 4 — axis callouts (animated in with the projections) */}
      {callouts}
    </svg>
  );
}
