import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../../../styles/tokens';
import { DIAL_ZONES, perceptionGap } from './evidenceDial.js';

const DIAL_EASE = '180ms cubic-bezier(.2,.8,.2,1)';
const PAD = 1.35;
const R_FACE = 48;
const DG = 1 / Math.SQRT2;
const EFFORT_DIR = { x: DG, y: -DG };
const EFFICACY_DIR = { x: -DG, y: -DG };
const AX = 46.65;
const TICK_DEGS = [45, 90, 135, 180, 225, 270, 315];

const ZONE_LIST = [DIAL_ZONES.honed, DIAL_ZONES.offtarget, DIAL_ZONES.missing, DIAL_ZONES.natural];

function rad(d) {
  return (d * Math.PI) / 180;
}

function wedgePath(a0) {
  const e0 = { x: Math.sin(rad(a0)), y: -Math.cos(rad(a0)) };
  const e1 = { x: Math.sin(rad(a0 + 90)), y: -Math.cos(rad(a0 + 90)) };
  const Ro = R_FACE - PAD / 2;
  const t = Math.sqrt(Math.max(0, Ro * Ro - PAD * PAD));
  const P = (ta, tb) =>
    `${(50 + e0.x * ta + e1.x * tb).toFixed(2)} ${(50 + e0.y * ta + e1.y * tb).toFixed(2)}`;
  return `M${P(PAD, PAD)}L${P(t, PAD)}A${Ro} ${Ro} 0 0 1 ${P(PAD, t)}L${P(PAD, PAD)}Z`;
}

function circPos(effort, efficacy) {
  const c = Math.SQRT1_2;
  const k = 0.68;
  const max = 0.9;
  const u = (effort - 50) / 50;
  const v = (efficacy - 50) / 50;
  let ru = (u - v) * c * k;
  let rv = (u + v) * c * k;
  const r = Math.hypot(ru, rv);
  if (r > max) {
    ru *= max / r;
    rv *= max / r;
  }
  return { x: 50 + ru * 50, y: 50 - rv * 50 };
}

function axPt(dir, t) {
  return { x: 50 + dir.x * t, y: 50 + dir.y * t };
}

function axT(v) {
  return ((v - 50) / 50) * AX;
}

function modeInk(mode) {
  if (mode === 'effort') return colors.orange;
  if (mode === 'efficacy') return colors.efficacyBlue;
  return colors.navy900;
}

function modeTrack(mode) {
  if (mode === 'effort') return colors.effortTrack;
  if (mode === 'efficacy') return colors.efficacyTrack;
  return colors.compassNodeGlow;
}

function relaxNodes(positions) {
  const pts = positions.map((p) => ({ ...p }));
  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < pts.length; i += 1) {
      for (let j = i + 1; j < pts.length; j += 1) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d < 8.5) {
          const push = (8.5 - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          pts[i].x -= ux * push;
          pts[i].y -= uy * push;
          pts[j].x += ux * push;
          pts[j].y += uy * push;
        }
      }
    }
  }
  return pts;
}

function laneOffsets(values) {
  const order = values.map((item, idx) => ({ ...item, idx })).sort((a, b) => a.t - b.t);
  const assigned = new Array(values.length).fill(0);
  const laneSeq = [0];
  for (let k = 1; k < 12; k += 1) {
    laneSeq.push(k * 7.4, -k * 7.4);
  }
  order.forEach((item, i) => {
    const taken = new Set();
    for (let p = 0; p < i; p += 1) {
      const prev = order[p];
      if (Math.abs(item.t - prev.t) < 7.2) taken.add(assigned[prev.idx]);
    }
    assigned[item.idx] = laneSeq.find((lane) => !taken.has(lane)) ?? 0;
  });
  return assigned;
}

function useDialScale(ref, base = 520) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const apply = () => setScale(Math.max(0.55, el.clientWidth / base));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, base]);
  return scale;
}

const FOCUS_SX = {
  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
};

function ModeBar({ mode, onModeChange, embedded = false }) {
  const modes = [
    { id: 'map', label: 'Compass' },
    { id: 'effort', label: 'Effort' },
    { id: 'efficacy', label: 'Efficacy' },
  ];
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: embedded ? 'flex-end' : 'center',
        flexShrink: 0,
        mb: embedded ? 0 : '12px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: '4px',
          p: '4px',
          borderRadius: radii.pill,
          border: `1px solid ${colors.sand200}`,
          bgcolor: colors.sand100,
        }}
      >
        {modes.map((item) => {
          const active = mode === item.id;
          return (
            <Box
              key={item.id}
              component="button"
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => onModeChange?.(item.id)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                minWidth: 96,
                height: 34,
                px: '12px',
                boxSizing: 'border-box',
                borderRadius: radii.pill,
                border: `1px solid ${active ? colors.navy900 : 'transparent'}`,
                bgcolor: active ? colors.navy900 : 'transparent',
                color: active ? colors.amberSoft : colors.navy900,
                fontFamily: fonts.mono,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: '32px',
                ...FOCUS_SX,
              }}
            >
              {item.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function DialNode({
  x,
  y,
  label,
  selected,
  mode,
  scale,
  onClick,
  ariaLabel,
}) {
  const size = (selected ? 38 : 29) * scale;
  const ink = modeInk(mode);
  return (
    <Box
      component="button"
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={onClick}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        borderRadius: radii.pill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: selected ? 4 : 2,
        background: selected ? ink : colors.dialNodeFill,
        border: selected
          ? `2px solid ${ink}`
          : `1.5px solid ${colors.navy300}`,
        color: selected
          ? (mode === 'map' ? colors.amber : colors.dialNodeFill)
          : colors.inkSoft,
        boxShadow: selected
          ? `0 0 0 ${7 * scale}px ${modeTrack(mode)}`
          : shadows.dialNode,
        fontFamily: fonts.mono,
        fontSize: (selected ? 13 : 11.5) * scale,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        transition: DIAL_EASE,
        ...FOCUS_SX,
      }}
    >
      {label}
    </Box>
  );
}

export default function EvidenceQuadrant({
  statements = [],
  selectedIdx = 0,
  onSelect,
  mode = 'map',
  onModeChange,
  showModeBar = true,
}) {
  const squareRef = useRef(null);
  const scale = useDialScale(squareRef);
  const isAll = selectedIdx === 'all';
  const selectedNumeric = typeof selectedIdx === 'number' ? selectedIdx : null;
  const compass = mode === 'map';
  const axisDir = mode === 'efficacy' ? EFFICACY_DIR : EFFORT_DIR;

  const visible = useMemo(() => {
    if (isAll) return statements.map((s, idx) => ({ ...s, idx }));
    if (selectedNumeric == null) return [];
    const s = statements[selectedNumeric];
    return s ? [{ ...s, idx: selectedNumeric }] : [];
  }, [isAll, selectedNumeric, statements]);

  const plotted = useMemo(() => {
    if (compass) {
      const raw = visible.map((s) => ({
        idx: s.idx,
        label: Math.round(s.compass),
        ...circPos(s.effort, s.efficacy),
      }));
      return isAll ? relaxNodes(raw) : raw;
    }
    const values = visible.map((s) => ({
      t: axT(mode === 'effort' ? s.effort : s.efficacy),
    }));
    const lanes = isAll ? laneOffsets(values) : visible.map(() => 0);
    const n = { x: -axisDir.y, y: axisDir.x };
    return visible.map((s, i) => {
      const t = values[i].t;
      const base = axPt(axisDir, t);
      const off = lanes[i] || 0;
      return {
        idx: s.idx,
        label: Math.round(mode === 'effort' ? s.effort : s.efficacy),
        t,
        x: base.x + n.x * off,
        y: base.y + n.y * off,
      };
    });
  }, [axisDir, compass, isAll, mode, visible]);

  const teamPt = !isAll && plotted[0] ? plotted[0] : null;
  const selectedStatement =
    selectedNumeric != null ? statements[selectedNumeric] : null;

  const selfDrawn = useMemo(() => {
    if (!compass || isAll || !selectedStatement) return null;
    const pos = circPos(selectedStatement.effortSelf, selectedStatement.efficacySelf);
    if (teamPt && Math.hypot(pos.x - teamPt.x, pos.y - teamPt.y) < 9) {
      pos.y += 8;
    }
    return {
      ...pos,
      label: Math.round(selectedStatement.compassSelf),
    };
  }, [compass, isAll, selectedStatement, teamPt]);

  const gapValue = selectedStatement
    ? perceptionGap(selectedStatement.compass, selectedStatement.compassSelf)
    : 0;
  const showGapChip = Boolean(compass && teamPt && selfDrawn && Math.abs(gapValue) >= 10);
  const gapMid = teamPt && selfDrawn
    ? { x: (teamPt.x + selfDrawn.x) / 2, y: (teamPt.y + selfDrawn.y) / 2 }
    : null;

  const axisLine = useMemo(() => {
    if (compass || !teamPt) return null;
    const tN = teamPt.t;
    const tStart = -50;
    const tStop = Math.max(tStart + 0.8, tN - 8.2);
    const start = axPt(axisDir, tStart);
    const end = axPt(axisDir, tStop);
    const tArrow = Math.max(tN, tStart + 8.2);
    const n = { x: -axisDir.y, y: axisDir.x };
    const tip = axPt(axisDir, tArrow - 4.4);
    const base = axPt(axisDir, tArrow - 8.2);
    const arrow = `M${tip.x} ${tip.y}L${base.x + n.x * 2.4} ${base.y + n.y * 2.4}L${base.x - n.x * 2.4} ${base.y - n.y * 2.4}Z`;
    return { start, end, arrow };
  }, [axisDir, compass, teamPt]);

  const axisColor = (axis) => {
    if (compass) return colors.inkSoft;
    if (mode === axis) return modeInk(mode);
    return colors.inkSoft;
  };
  const axisOpacity = (axis) => {
    if (compass) return 1;
    return mode === axis ? 1 : 0.4;
  };

  const px = (n) => n * scale;
  const brassRing = `color-mix(in srgb, ${colors.amber} 75%, ${colors.orangeDeep})`;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {showModeBar && <ModeBar mode={mode} onModeChange={onModeChange} />}

      <Box
        ref={squareRef}
        sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'visible',
        }}
      >
        {[
          { key: 'hi-eff', text: 'HIGH EFFICACY', axis: 'efficacy', left: 0, top: 0, textAlign: 'left' },
          { key: 'hi-eft', text: 'HIGH EFFORT', axis: 'effort', right: 0, top: 0, textAlign: 'right' },
          { key: 'lo-eft', text: 'LOW EFFORT', axis: 'effort', left: 0, bottom: 0, textAlign: 'left' },
          { key: 'lo-eff', text: 'LOW EFFICACY', axis: 'efficacy', right: 0, bottom: 0, textAlign: 'right' },
        ].map((lab) => (
          <Typography
            key={lab.key}
            sx={{
              position: 'absolute',
              left: lab.left === 0 ? 0 : 'auto',
              right: lab.right === 0 ? 0 : 'auto',
              top: lab.top === 0 ? 0 : 'auto',
              bottom: lab.bottom === 0 ? 0 : 'auto',
              fontFamily: fonts.mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
              textAlign: lab.textAlign,
              color: axisColor(lab.axis),
              opacity: axisOpacity(lab.axis),
              transition: DIAL_EASE,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {lab.text}
          </Typography>
        ))}

        <Box
          sx={{
            position: 'absolute',
            inset: px(18),
            borderRadius: '50%',
            background: `radial-gradient(circle at 50% -10%, ${colors.dialBezelHi}, ${colors.dialBezelLo} 72%)`,
            boxShadow: shadows.dialCase,
            padding: `${px(17)}px`,
            overflow: 'visible',
          }}
        >
          {TICK_DEGS.map((deg) => {
            const cardinal = deg % 90 === 0;
            const w = cardinal ? 3.5 : 2.5;
            const h = cardinal ? 10 : 7;
            return (
              <Box
                key={deg}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  transform: `rotate(${deg}deg)`,
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: px(5),
                    width: px(w),
                    height: px(h),
                    ml: `${-px(w) / 2}px`,
                    borderRadius: '1px',
                    background: cardinal
                      ? `color-mix(in srgb, ${colors.brass} 95%, transparent)`
                      : `color-mix(in srgb, ${colors.brass} 55%, transparent)`,
                  }}
                />
              </Box>
            );
          })}

          <Box
            sx={{
              position: 'absolute',
              inset: px(13),
              borderRadius: '50%',
              border: `2px solid ${brassRing}`,
              pointerEvents: 'none',
              zIndex: 9,
            }}
          />

          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: px(61),
              height: px(48),
              transform: 'translate(-50%, -52%)',
              background: `linear-gradient(180deg, ${colors.dialArrowStart}, ${colors.brass} 55%, ${colors.dialArrowEnd})`,
              clipPath: 'polygon(50% 0, 100% 100%, 50% 72%, 0 100%)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: colors.dialFace,
              overflow: 'visible',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                bgcolor: colors.dialNodeFill,
                opacity: compass ? 0 : 1,
                transition: DIAL_EASE,
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: colors.dialEffortFace,
                opacity: mode === 'effort' ? 1 : 0,
                transition: DIAL_EASE,
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: colors.dialEfficacyFace,
                opacity: mode === 'efficacy' ? 1 : 0,
                transition: DIAL_EASE,
                pointerEvents: 'none',
              }}
            />

            <Box
              component="svg"
              viewBox="0 0 100 100"
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <g style={{ opacity: compass ? 1 : 0, transition: `opacity ${DIAL_EASE}` }}>
                {ZONE_LIST.map((z) => (
                  <path key={z.id} d={wedgePath(z.a0)} fill={z.tint} />
                ))}
                <line
                  x1={axPt(EFFORT_DIR, -AX).x}
                  y1={axPt(EFFORT_DIR, -AX).y}
                  x2={axPt(EFFORT_DIR, AX).x}
                  y2={axPt(EFFORT_DIR, AX).y}
                  stroke={colors.dialAxis}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={axPt(EFFICACY_DIR, -AX).x}
                  y1={axPt(EFFICACY_DIR, -AX).y}
                  x2={axPt(EFFICACY_DIR, AX).x}
                  y2={axPt(EFFICACY_DIR, AX).y}
                  stroke={colors.dialAxis}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
              {axisLine && (
                <g style={{ opacity: compass ? 0 : 1, transition: `opacity ${DIAL_EASE}` }}>
                  <line
                    x1={axisLine.start.x}
                    y1={axisLine.start.y}
                    x2={axisLine.end.x}
                    y2={axisLine.end.y}
                    stroke={modeInk(mode)}
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path d={axisLine.arrow} fill={modeInk(mode)} />
                </g>
              )}
              {teamPt && selfDrawn && (
                <line
                  x1={teamPt.x}
                  y1={teamPt.y}
                  x2={selfDrawn.x}
                  y2={selfDrawn.y}
                  stroke={colors.navy900}
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  opacity={compass && !isAll ? 0.55 : 0}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: `opacity ${DIAL_EASE}` }}
                />
              )}
            </Box>

            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: px(7),
                height: px(7),
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                bgcolor: colors.dialHub,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {ZONE_LIST.map((z) => (
              <Typography
                key={z.id}
                sx={{
                  position: 'absolute',
                  ...z.place,
                  maxWidth: 108,
                  fontFamily: fonts.sans,
                  fontSize: 11.5,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: z.ink,
                  opacity: compass ? 1 : 0,
                  transition: DIAL_EASE,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                {z.label}
              </Typography>
            ))}

            {plotted.map((pt) => (
              <DialNode
                key={pt.idx}
                x={pt.x}
                y={pt.y}
                label={pt.label}
                selected={!isAll}
                mode={mode}
                scale={scale}
                ariaLabel={`Statement ${pt.idx + 1}, ${pt.label}`}
                onClick={() => onSelect?.(pt.idx)}
              />
            ))}

            {selfDrawn && (
              <Box
                aria-hidden={!compass || isAll}
                sx={{
                  position: 'absolute',
                  left: `${selfDrawn.x}%`,
                  top: `${selfDrawn.y}%`,
                  width: px(30),
                  height: px(30),
                  transform: 'translate(-50%, -50%)',
                  borderRadius: radii.pill,
                  background: colors.dialNodeFill,
                  border: `2px dashed ${colors.navy900}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.mono,
                  fontSize: 11.5 * scale,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: colors.navy900,
                  zIndex: 3,
                  pointerEvents: 'none',
                  opacity: compass && !isAll ? 1 : 0,
                  transition: DIAL_EASE,
                }}
              >
                {selfDrawn.label}
              </Box>
            )}

            {gapMid && (
              <Box
                sx={{
                  position: 'absolute',
                  left: `${gapMid.x}%`,
                  top: `${gapMid.y}%`,
                  transform: 'translate(-50%, -50%)',
                  px: '8px',
                  py: '2px',
                  borderRadius: radii.pill,
                  bgcolor: colors.dialNodeFill,
                  border: `1px solid ${colors.sand200}`,
                  fontFamily: fonts.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  fontVariantNumeric: 'tabular-nums',
                  color: gapValue < 0 ? colors.gapNegative : colors.gapPositive,
                  boxShadow: shadows.dialNode,
                  zIndex: 5,
                  pointerEvents: 'none',
                  opacity: showGapChip ? 1 : 0,
                  transition: DIAL_EASE,
                }}
              >
                {gapValue > 0 ? `+${gapValue}` : gapValue}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export { ModeBar as EvidenceModeBar };
