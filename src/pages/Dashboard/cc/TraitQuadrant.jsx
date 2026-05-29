import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { colors, fonts, hairlines, motion, radii, radiiPx } from '../../../styles/tokens';
import { QUADRANT_LIST } from './quadrants.js';

/**
 * TraitQuadrant — effort × impact map, Cairn-themed.
 *
 * Two modes:
 *   mode="traits"      → one labeled point per trait (Signal page)
 *   mode="statements"  → 5 numbered points for one trait's statements (Evidence)
 *
 * Visual language:
 *   - Two-tone palette: TEAM = deep ink, SELF = ochre. Trait identity lives
 *     in the LABEL, not the dot color, so the comparison reads instantly.
 *   - Both layers visible by default (auto-flips on once data lands).
 *   - Two-line zone annotations explain the four corners at first glance.
 *   - Focus trait gets a dashed reticle, larger label, and FOCUS eyebrow.
 *   - When the gap between Team and Self is meaningful, a small midpoint
 *     pill names the gap directly on the connector.
 *   - Honest about preview data: shows a "simulated for preview" line when
 *     the self layer is synthesized.
 */

function clamp(v) {
  return Math.max(0, Math.min(100, Number(v) || 0));
}

// ----------------------------------------------------------------------------
// Layer toggle button — also reads as the legend
// ----------------------------------------------------------------------------
function LayerToggle({ active, onClick, disabled, label, swatch }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      sx={{
        all: 'unset',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.9,
        px: 1.6,
        py: 0.7,
        borderRadius: radii.pill,
        border: `1px solid ${active ? swatch : colors.borderSoft}`,
        bgcolor: active ? swatch : colors.surface1,
        color: active ? colors.amberSoft : colors.textSecondary,
        fontFamily: fonts.mono,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        opacity: disabled ? 0.4 : 1,
        transition: motion.standard,
        '&:hover': !disabled && !active ? { borderColor: swatch, color: swatch } : {},
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
      }}
    >
      <Box
        component="span"
        sx={{
          width: 11,
          height: 11,
          borderRadius: radii.circle,
          flexShrink: 0,
          bgcolor: active ? colors.amberSoft : swatch,
          boxSizing: 'border-box',
        }}
      />
      {label}
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Inline label placement — keep label close to dot, with simple nudges to
// avoid collisions and edge clipping.
// ----------------------------------------------------------------------------
function placeInlineLabel(dotX, dotY, label, sub, chart, prevLabels, options = {}) {
  const charW = 7.8;
  const labelW = Math.max(label.length * charW + 12, sub ? sub.length * 6.4 + 12 : 0);
  const eyebrowH = options.eyebrow ? 14 : 0;
  const labelH = (sub ? 32 : 20) + eyebrowH;
  const dotR = options.dotR ?? 14;
  const offset = dotR + 10;

  let anchor = 'start';
  let lx = dotX + offset;
  let ly = dotY - 2;

  if (lx + labelW > chart.x + chart.w - 6) {
    anchor = 'end';
    lx = dotX - offset;
  }
  if (ly - eyebrowH - 4 < chart.y + 6) {
    ly = dotY + offset + 4 + eyebrowH;
  }
  if (ly + labelH > chart.y + chart.h - 6) {
    ly = dotY - offset - (sub ? 18 : 6);
  }

  let attempts = 0;
  while (attempts < 8) {
    const collision = prevLabels.find((p) => {
      if (p.anchor !== anchor) return false;
      const dx = Math.abs(p.lx - lx);
      const dy = Math.abs(p.ly - ly);
      return dx < Math.max(p.w, labelW) * 0.7 && dy < Math.max(p.h, labelH) + 4;
    });
    if (!collision) break;
    ly = collision.ly + collision.h + 6;
    if (ly + labelH > chart.y + chart.h - 6) {
      anchor = anchor === 'start' ? 'end' : 'start';
      lx = anchor === 'end' ? dotX - offset : dotX + offset;
      ly = dotY - 2;
    }
    attempts++;
  }

  return { lx, ly, anchor, w: labelW, h: labelH };
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------
export default function TraitQuadrant({
  rows,
  t,
  hasSelfData,
  selfDataSource = 'none',
  size = 640,
  onPointClick,
  highlightTraitKey,
  mode = 'traits',
  statementTrait = null,
  statementIdx = 0,
  onStatementClick = null,
  axisMode = null,
  onAxisModeChange = null,
}) {
  const toggleAxis = (which) => {
    if (!onAxisModeChange) return;
    onAxisModeChange(axisMode === which ? null : which);
  };
  const [showTeam, setShowTeam] = useState(true);
  const [showSelf, setShowSelf] = useState(true);
  const [showNumbers, setShowNumbers] = useState(false);

  // Sync showSelf to hasSelfData the first time data lands; respect any
  // user toggling from that point forward.
  const userToggledSelfRef = useRef(false);
  useEffect(() => {
    if (userToggledSelfRef.current) return;
    setShowSelf(Boolean(hasSelfData));
  }, [hasSelfData]);

  const handleSelfToggle = () => {
    userToggledSelfRef.current = true;
    setShowSelf((v) => !v);
  };

  const TEAM_COLOR = colors.navy900;
  const SELF_COLOR = colors.orange;

  // Geometry
  const PAD_TOP = 40;
  const PAD_LEFT = 60;
  const PAD_RIGHT = 36;
  const PAD_BOTTOM = 50;
  const SVG_W = size;
  const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;
  const CHART_H = Math.round(CHART_W * 0.88); // closer to square for tighter columns
  const SVG_H = PAD_TOP + CHART_H + PAD_BOTTOM;

  const chart = { x: PAD_LEFT, y: PAD_TOP, w: CHART_W, h: CHART_H };

  // Build groups based on mode
  const groups = useMemo(() => {
    if (mode === 'statements' && statementTrait) {
      const teamS = statementTrait.team?.statements || [];
      const selfS = statementTrait.self?.statements || [];
      const len = Math.max(teamS.length, selfS.length);
      const items = [];
      for (let i = 0; i < len; i++) {
        const team = teamS[i];
        const self = selfS[i];
        if (!team && !self) continue;
        items.push({
          key: `s-${i}`,
          idx: i,
          label: `${i + 1}`,
          team: team ? { x: clamp(team.effort), y: clamp(team.efficacy) } : null,
          self: self ? { x: clamp(self.effort), y: clamp(self.efficacy) } : null,
        });
      }
      return items;
    }
    return rows
      .map((row, idx) => {
        const team = row.team
          ? { x: clamp(row.team.effort), y: clamp(row.team.efficacy) }
          : null;
        const self = row.self
          ? { x: clamp(row.self.effort), y: clamp(row.self.efficacy) }
          : null;
        if (!team && !self) return null;
        return {
          key: row.trait,
          idx,
          traitKey: row.trait,
          label: row.subTrait || row.trait,
          team,
          self,
        };
      })
      .filter(Boolean);
  }, [mode, rows, statementTrait]);

  // Compute pixel positions
  const placed = useMemo(() => {
    return groups.map((g) => {
      const teamPos = g.team
        ? {
            cx: chart.x + (g.team.x / 100) * chart.w,
            cy: chart.y + (1 - g.team.y / 100) * chart.h,
          }
        : null;
      const selfPos = g.self
        ? {
            cx: chart.x + (g.self.x / 100) * chart.w,
            cy: chart.y + (1 - g.self.y / 100) * chart.h,
          }
        : null;
      return { ...g, teamPos, selfPos };
    });
  }, [groups, chart.x, chart.y, chart.w, chart.h]);

  // Compute label positions for traits mode
  const labels = useMemo(() => {
    if (mode !== 'traits') return [];
    const placedLabels = [];
    return placed
      .map((g) => {
        const anchor =
          showTeam && g.teamPos
            ? g.teamPos
            : showSelf && g.selfPos
            ? g.selfPos
            : g.teamPos || g.selfPos;
        if (!anchor) return null;
        const data = showTeam && g.team ? g.team : g.self;
        const sub = showNumbers && data ? `EFFICACY ${Math.round(data.y)} · EFFORT ${Math.round(data.x)}` : '';
        const isFocus = g.traitKey === highlightTraitKey;
        const pos = placeInlineLabel(anchor.cx, anchor.cy, g.label, sub, chart, placedLabels, {
          eyebrow: isFocus,
          dotR: isFocus ? 17 : 14,
        });
        placedLabels.push(pos);
        return { key: g.key, ...pos, group: g, sub, isFocus };
      })
      .filter(Boolean);
  }, [placed, mode, showTeam, showSelf, showNumbers, highlightTraitKey, chart.x, chart.y, chart.w, chart.h]);

  // Compute connector midpoint gap badges (only when numbers are surfaced)
  const gapBadges = useMemo(() => {
    if (!showTeam || !showSelf || !showNumbers) return [];
    return placed
      .map((g) => {
        if (!g.team || !g.self) return null;
        const dImp = Math.round(g.self.y - g.team.y); // self minus team, impact
        const dEff = Math.round(g.self.x - g.team.x); // self minus team, effort
        const absImp = Math.abs(dImp);
        const absEff = Math.abs(dEff);
        if (Math.max(absImp, absEff) < 10) return null;
        const useImp = absImp >= absEff;
        const value = useImp ? dImp : dEff;
        const sign = value > 0 ? '+' : '−';
        const label = `SELF ${sign}${Math.abs(value)} ${useImp ? 'EFFICACY' : 'EFFORT'}`;
        const mx = (g.teamPos.cx + g.selfPos.cx) / 2;
        const my = (g.teamPos.cy + g.selfPos.cy) / 2;
        return { key: `gap-${g.key}`, x: mx, y: my, label, group: g };
      })
      .filter(Boolean);
  }, [placed, showTeam, showSelf, showNumbers]);

  const teamLayerActive = showTeam;
  const selfLayerActive = showSelf && hasSelfData;

  return (
    <Box>
      {/* Header — title + independent layer toggles (which double as the legend) */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.2}
        sx={{ mb: 1.4 }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: fonts.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: t.accentDeep,
              mb: 0.2,
            }}
          >
            Effort × Efficacy map
          </Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, color: t.inkSoft }}>
            {mode === 'statements'
              ? `Five statements${
                  statementTrait?.subTrait || statementTrait?.trait
                    ? ` from ${statementTrait.subTrait || statementTrait.trait}`
                    : ''
                } — team vs self.`
              : 'Where each trait is landing — team and self in one view.'}
          </Typography>
        </Box>
        <Stack direction="column" spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <LayerToggle
              active={teamLayerActive}
              onClick={() => setShowTeam((v) => !v)}
              label="Team"
              swatch={TEAM_COLOR}
            />
            <LayerToggle
              active={selfLayerActive}
              onClick={handleSelfToggle}
              disabled={!hasSelfData}
              label="Self"
              swatch={SELF_COLOR}
            />
            <LayerToggle
              active={showNumbers}
              onClick={() => setShowNumbers((v) => !v)}
              label="Numbers"
              swatch={colors.textSecondary}
            />
          </Stack>
        </Stack>
      </Stack>

      {/* Chart */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: SVG_W, mx: 'auto', aspectRatio: `${SVG_W} / ${SVG_H}` }}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            height="100%"
            role="img"
            aria-label="Effort by impact quadrant"
          >
            <defs>
              <linearGradient id="aim-tint" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={colors.greenSoft} stopOpacity={0.26} />
                <stop offset="100%" stopColor={colors.greenSoft} stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="strain-tint" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor={colors.amberSoft} stopOpacity={0.24} />
                <stop offset="100%" stopColor={colors.amberSoft} stopOpacity={0.05} />
              </linearGradient>
              <radialGradient id="team-glow">
                <stop offset="0%" stopColor={TEAM_COLOR} stopOpacity={0.32} />
                <stop offset="100%" stopColor={TEAM_COLOR} stopOpacity={0} />
              </radialGradient>
              <radialGradient id="self-glow">
                <stop offset="0%" stopColor={SELF_COLOR} stopOpacity={0.45} />
                <stop offset="100%" stopColor={SELF_COLOR} stopOpacity={0} />
              </radialGradient>
              {/* Efficacy: strong at top, fading down */}
              <linearGradient id="efficacy-scale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.green} stopOpacity={0.3} />
                <stop offset="50%" stopColor={colors.greenSoft} stopOpacity={0.12} />
                <stop offset="100%" stopColor={colors.greenSoft} stopOpacity={0.02} />
              </linearGradient>
              {/* Effort: faint at left, strong toward the right */}
              <linearGradient id="effort-scale" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={colors.amberSoft} stopOpacity={0.03} />
                <stop offset="50%" stopColor={colors.amberSoft} stopOpacity={0.14} />
                <stop offset="100%" stopColor={colors.orange} stopOpacity={0.28} />
              </linearGradient>
            </defs>

            {/* Chart frame */}
            <rect
              x={chart.x}
              y={chart.y}
              width={chart.w}
              height={chart.h}
              fill={colors.surface1}
              stroke={colors.borderSoft}
              strokeWidth={1}
              rx={radiiPx.md}
            />

            {/* Background: either the quadrant washes, or a single-axis scale
                gradient when the user is isolating Effort / Efficacy. */}
            {axisMode === 'efficacy' ? (
              <rect x={chart.x + 1} y={chart.y + 1} width={chart.w - 2} height={chart.h - 2} fill="url(#efficacy-scale)" rx={radiiPx.sm} />
            ) : axisMode === 'effort' ? (
              <rect x={chart.x + 1} y={chart.y + 1} width={chart.w - 2} height={chart.h - 2} fill="url(#effort-scale)" rx={radiiPx.sm} />
            ) : (
              <>
                <rect
                  x={chart.x + 1}
                  y={chart.y + 1}
                  width={chart.w / 2 - 1}
                  height={chart.h / 2 - 1}
                  fill="url(#aim-tint)"
                  rx={radiiPx.sm}
                />
                <rect
                  x={chart.x + chart.w / 2}
                  y={chart.y + chart.h / 2}
                  width={chart.w / 2 - 1}
                  height={chart.h / 2 - 1}
                  fill="url(#strain-tint)"
                />
              </>
            )}

            {/* Single-axis measuring bars: a solid bar running ALONG the active
                axis from its baseline to the dot, with an arrowhead showing how
                far the trait stands on that one dimension.
                  efficacy → vertical bar (up from the bottom)
                  effort   → horizontal bar (right from the left) */}
            {axisMode &&
              placed.map((g) => {
                const layers = [];
                if (teamLayerActive && g.teamPos) layers.push({ pos: g.teamPos, color: TEAM_COLOR });
                if (selfLayerActive && g.selfPos) layers.push({ pos: g.selfPos, color: SELF_COLOR });
                const off = 18; // clear the dot
                return layers.map((layer, i) => {
                  if (axisMode === 'efficacy') {
                    const x = layer.pos.cx;
                    const yBase = chart.y + chart.h;
                    const yEnd = layer.pos.cy + off;
                    if (yEnd >= yBase) return null;
                    return (
                      <g key={`proj-${g.key}-${i}`} opacity={0.85}>
                        <line x1={x} y1={yBase} x2={x} y2={yEnd} stroke={layer.color} strokeWidth={2} />
                        <polygon points={`${x},${yEnd} ${x - 4.5},${yEnd + 8} ${x + 4.5},${yEnd + 8}`} fill={layer.color} />
                      </g>
                    );
                  }
                  const y = layer.pos.cy;
                  const xBase = chart.x;
                  const xEnd = layer.pos.cx - off;
                  if (xEnd <= xBase) return null;
                  return (
                    <g key={`proj-${g.key}-${i}`} opacity={0.85}>
                      <line x1={xBase} y1={y} x2={xEnd} y2={y} stroke={layer.color} strokeWidth={2} />
                      <polygon points={`${xEnd},${y} ${xEnd - 8},${y - 4.5} ${xEnd - 8},${y + 4.5}`} fill={layer.color} />
                    </g>
                  );
                });
              })}

            {/* 50% cross lines */}
            <line
              x1={chart.x + chart.w / 2}
              y1={chart.y}
              x2={chart.x + chart.w / 2}
              y2={chart.y + chart.h}
              stroke={colors.borderSoft}
              strokeWidth={1}
              strokeDasharray="3 6"
            />
            <line
              x1={chart.x}
              y1={chart.y + chart.h / 2}
              x2={chart.x + chart.w}
              y2={chart.y + chart.h / 2}
              stroke={colors.borderSoft}
              strokeWidth={1}
              strokeDasharray="3 6"
            />

            {/* Two-line corner zone annotations — hover to learn what each means */}
            {QUADRANT_LIST.map((q) => {
              const left = q.corner.x === 'left';
              const top = q.corner.y === 'top';
              const xx = left ? chart.x + 14 : chart.x + chart.w - 14;
              const yyTop = top ? chart.y + 22 : chart.y + chart.h - 30;
              const yySub = yyTop + 14;
              const anchor = left ? 'start' : 'end';
              const hitW = 168;
              const hitX = left ? xx : xx - hitW;
              return (
                <Tooltip
                  key={q.id}
                  arrow
                  placement="top"
                  title={
                    <Box sx={{ p: 0.4 }}>
                      <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, mb: 0.5 }}>
                        {q.label}
                      </Typography>
                      <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.5, mb: 0.6 }}>
                        {q.meaning}
                      </Typography>
                      <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', opacity: 0.92 }}>
                        {q.stance}
                      </Typography>
                    </Box>
                  }
                  slotProps={{ tooltip: { sx: { maxWidth: 280, p: 1.2 } } }}
                >
                  <g style={{ cursor: 'help' }}>
                    <rect x={hitX} y={yyTop - 13} width={hitW} height={32} fill="transparent" />
                    <text
                      x={xx}
                      y={yyTop}
                      textAnchor={anchor}
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fill: q.color,
                      }}
                    >
                      {q.label}
                    </text>
                    <text
                      x={xx}
                      y={yySub}
                      textAnchor={anchor}
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 10.5,
                        fontStyle: 'italic',
                        fill: colors.textSecondary,
                      }}
                    >
                      {q.sub}
                    </text>
                  </g>
                </Tooltip>
              );
            })}

            {/* Axis labels */}
            <text
              x={chart.x - 18}
              y={chart.y + 8}
              textAnchor="start"
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fill: colors.textSecondary,
              }}
            >
              High
            </text>
            <text
              x={chart.x - 18}
              y={chart.y + chart.h - 1}
              textAnchor="start"
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fill: colors.textSecondary,
              }}
            >
              Low
            </text>
            {/* Efficacy axis — interactive button (vertical) */}
            <g
              transform={`translate(${chart.x - 40}, ${chart.y + chart.h / 2}) rotate(-90)`}
              style={{ cursor: onAxisModeChange ? 'pointer' : 'default' }}
              onClick={() => toggleAxis('efficacy')}
            >
              <rect
                x={-54}
                y={-14}
                width={108}
                height={28}
                rx={radiiPx.sm}
                fill={axisMode === 'efficacy' ? colors.green : colors.surface1}
                stroke={axisMode === 'efficacy' ? colors.green : colors.borderSoft}
                strokeWidth={1}
              />
              <text
                x={0}
                y={5}
                textAnchor="middle"
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fill: axisMode === 'efficacy' ? colors.amberSoft : colors.textSecondary,
                  pointerEvents: 'none',
                }}
              >
                ↑ Efficacy
              </text>
            </g>
            {/* Effort axis — interactive button (horizontal) */}
            <g
              style={{ cursor: onAxisModeChange ? 'pointer' : 'default' }}
              onClick={() => toggleAxis('effort')}
            >
              <rect
                x={chart.x + chart.w / 2 - 50}
                y={chart.y + chart.h + 12}
                width={100}
                height={28}
                rx={radiiPx.sm}
                fill={axisMode === 'effort' ? colors.orange : colors.surface1}
                stroke={axisMode === 'effort' ? colors.orange : colors.borderSoft}
                strokeWidth={1}
              />
              <text
                x={chart.x + chart.w / 2}
                y={chart.y + chart.h + 30}
                textAnchor="middle"
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fill: axisMode === 'effort' ? colors.amberSoft : colors.textSecondary,
                  pointerEvents: 'none',
                }}
              >
                Effort →
              </text>
            </g>

            {/* Connector lines: Team ↔ Self of the same group */}
            {placed.map((g) => {
              if (!g.teamPos || !g.selfPos) return null;
              if (!teamLayerActive || !selfLayerActive) return null;
              const isHighlight =
                (mode === 'statements' && g.idx === statementIdx) ||
                (mode !== 'statements' && g.traitKey === highlightTraitKey);
              const dim = mode === 'statements' && !isHighlight;
              return (
                <line
                  key={`conn-${g.key}`}
                  x1={g.teamPos.cx}
                  y1={g.teamPos.cy}
                  x2={g.selfPos.cx}
                  y2={g.selfPos.cy}
                  stroke={colors.textSecondary}
                  strokeWidth={1.4}
                  strokeDasharray="4 4"
                  opacity={dim ? 0.18 : 0.6}
                />
              );
            })}

            {/* Glow halos behind dots */}
            {placed.map((g) => {
              const isHighlight =
                (mode === 'statements' && g.idx === statementIdx) ||
                (mode !== 'statements' && g.traitKey === highlightTraitKey);
              const dim = mode === 'statements' && !isHighlight;
              return (
                <g key={`halos-${g.key}`} opacity={dim ? 0.35 : 1}>
                  {teamLayerActive && g.teamPos && (
                    <circle
                      cx={g.teamPos.cx}
                      cy={g.teamPos.cy}
                      r={isHighlight ? 30 : 22}
                      fill="url(#team-glow)"
                    />
                  )}
                  {selfLayerActive && g.selfPos && (
                    <circle
                      cx={g.selfPos.cx}
                      cy={g.selfPos.cy}
                      r={isHighlight ? 28 : 18}
                      fill="url(#self-glow)"
                    />
                  )}
                </g>
              );
            })}

            {/* Dots — Team (deep ink) and Self (ochre) */}
            {placed.map((g) => {
              const isHighlight =
                (mode === 'statements' && g.idx === statementIdx) ||
                (mode !== 'statements' && g.traitKey === highlightTraitKey);
              const dim = mode === 'statements' && !isHighlight;
              const baseR = mode === 'statements' ? 13 : 14;
              const r = isHighlight ? baseR + 3 : baseR;
              const handleClick = () => {
                if (mode === 'statements' && onStatementClick) onStatementClick(g.idx);
                else if (onPointClick) onPointClick(g.traitKey);
              };

              return (
                <g
                  key={`dot-${g.key}`}
                  style={{
                    cursor: onPointClick || onStatementClick ? 'pointer' : 'default',
                    opacity: dim ? 0.55 : 1,
                  }}
                  onClick={handleClick}
                >
                  {/* Focus reticle — dashed outer ring around the focus group */}
                  {isHighlight && (
                    <circle
                      cx={(g.teamPos || g.selfPos).cx}
                      cy={(g.teamPos || g.selfPos).cy}
                      r={r + 12}
                      fill="none"
                      stroke={colors.textSecondary}
                      strokeWidth={1.4}
                      strokeDasharray="4 5"
                    />
                  )}

                  {/* Team dot */}
                  {teamLayerActive && g.teamPos && (
                    <>
                      <circle
                        cx={g.teamPos.cx}
                        cy={g.teamPos.cy}
                        r={r}
                        fill={TEAM_COLOR}
                        stroke={colors.surface1}
                        strokeWidth={2}
                      />
                      {mode === 'statements' && (
                        <text
                          x={g.teamPos.cx}
                          y={g.teamPos.cy + 4.5}
                          textAnchor="middle"
                          style={{
                            fontFamily: fonts.serif,
                            fontStyle: 'italic',
                            fontSize: 13,
                            fontWeight: 700,
                            fill: colors.amberSoft,
                            pointerEvents: 'none',
                          }}
                        >
                          {g.label}
                        </text>
                      )}
                    </>
                  )}

                  {/* Self dot */}
                  {selfLayerActive && g.selfPos && (
                    <>
                      <circle
                        cx={g.selfPos.cx}
                        cy={g.selfPos.cy}
                        r={r}
                        fill={SELF_COLOR}
                        stroke={colors.surface1}
                        strokeWidth={2}
                      />
                      {mode === 'statements' && (
                        <text
                          x={g.selfPos.cx}
                          y={g.selfPos.cy + 4.5}
                          textAnchor="middle"
                          style={{
                            fontFamily: fonts.serif,
                            fontStyle: 'italic',
                            fontSize: 13,
                            fontWeight: 700,
                            fill: colors.surface1,
                            pointerEvents: 'none',
                          }}
                        >
                          {g.label}
                        </text>
                      )}
                    </>
                  )}
                </g>
              );
            })}

            {/* Connector midpoint gap badges */}
            {gapBadges.map((b) => {
              const padX = 6;
              const padY = 3;
              const charW = 5.6;
              const w = b.label.length * charW + padX * 2;
              const h = 16;
              return (
                <g key={b.key}>
                  <rect
                    x={b.x - w / 2}
                    y={b.y - h / 2}
                    width={w}
                    height={h}
                    rx={radiiPx.sm}
                    fill={colors.surface1}
                    stroke={colors.borderSoft}
                    strokeWidth={1}
                  />
                  <text
                    x={b.x}
                    y={b.y + 3.4}
                    textAnchor="middle"
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      fill: colors.textPrimary,
                    }}
                  >
                    {b.label}
                  </text>
                </g>
              );
            })}

            {/* Inline labels (traits mode only) */}
            {mode === 'traits' &&
              labels.map((lab) => {
                const g = lab.group;
                const isFocus = lab.isFocus;
                return (
                  <g key={`lab-${lab.key}`}>
                    {isFocus && (
                      <text
                        x={lab.lx}
                        y={lab.ly - 16}
                        textAnchor={lab.anchor}
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          fill: t.accentDeep,
                        }}
                      >
                        Focus
                      </text>
                    )}
                    <text
                      x={lab.lx}
                      y={lab.ly}
                      textAnchor={lab.anchor}
                      style={{
                        fontFamily: fonts.serif,
                        fontSize: isFocus ? 18 : 16,
                        fontStyle: 'italic',
                        fontWeight: isFocus ? 700 : 600,
                        fill: colors.textPrimary,
                      }}
                    >
                      {g.label}
                    </text>
                    {lab.sub && (
                      <text
                        x={lab.lx}
                        y={lab.ly + 14}
                        textAnchor={lab.anchor}
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          fill: colors.textSecondary,
                        }}
                      >
                        {lab.sub}
                      </text>
                    )}
                  </g>
                );
              }            )}
          </svg>
      </Box>

    </Box>
  );
}
