import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { colors, fonts, radii, shadows, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { deriveTraitRoles } from './debriefContent.js';
import { getQuadrant } from './quadrants.js';
import { mapRowStatements } from './EvidenceView.jsx';
import { ChapterEyebrow, ProgressDots, WalkthroughStage } from './debriefUi.jsx';
import { getDebriefScope } from './phaseState.js';

// ----------------------------------------------------------------------------
// NarrativeView — the ten-page results debrief narrative (v2 design).
//
// Played once when the first team reading lands, replayable any time. Pages:
//   01 Threshold · 02 Two Measurements (traits) · 03 Two Measurements
//   (statements) · 04 The Map (video) · 05 The Map (statements) · 06 The Gap
//   (traits) · 07 The Gap (statements) · 08–10 one Insight per trait.
//
// Pages 02–06 keep exactly one thing selected; the navy card is the selection.
// Guide pop-ups (intro/closing check-in, insights skip offer) come later.
// ----------------------------------------------------------------------------

const readJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — narrative still plays, position just isn't kept */
  }
};

const fmtGap = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const gapInk = (n) => (n > 0 ? colors.orangeDeep : n < 0 ? colors.navy500 : colors.textSecondary);
const gapLight = (n) => (n > 0 ? colors.amberSoft : n < 0 ? colors.navy300 : 'rgba(255,255,255,0.6)');

// ---------------------------------------------------------------------------
// Copy builders — the mock voice, generalized by zone / gap direction
// ---------------------------------------------------------------------------
function measurementCopy(row) {
  const e = Math.round(row.team.effort);
  const f = Math.round(row.team.efficacy);
  const zone = getQuadrant(row.team.effort, row.team.efficacy);
  switch (zone.id) {
    case 'naturalGift':
      return {
        effortCap: 'They don’t see you straining for this one.',
        efficacyCap: 'And yet it lands — clearly, consistently.',
        read: `Efficacy of ${f} on effort of just ${e}. When landing outruns trying, you’re looking at something that comes naturally — a strength that costs you little.`,
      };
    case 'fullStrength':
      return {
        effortCap: 'They see you genuinely working at this.',
        efficacyCap: 'And they feel it landing in kind.',
        read: `Effort ${e}, efficacy ${f} — the two measurements moving together. The work goes in and the results come back. Strong because you make it strong.`,
      };
    case 'offTarget':
      return {
        effortCap: 'They see you genuinely working at this.',
        efficacyCap: 'But the results aren’t yet landing the way you intend.',
        read: `Effort ${e}, efficacy ${f} — ${e - f} points apart. That split is the whole story of this trait: the work is real, the aim needs adjusting. Not a character flaw — a targeting problem.`,
      };
    default:
      return {
        effortCap: 'They don’t see much effort going in here yet.',
        efficacyCap: 'And not much is landing yet either.',
        read: `Effort ${e}, efficacy ${f} — quiet on both measurements. Not a failure: unclaimed ground. If this trait matters for where you’re headed, a small deliberate investment moves it fastest.`,
      };
  }
}

function statementSplitRead(effort, efficacy) {
  const diff = effort - efficacy;
  if (diff >= 15) {
    return `A ${diff}-point split on a single behavior. Your team watches you work at this — and doesn’t yet feel it landing. This is where “trying hard” and “landing” part ways most sharply.`;
  }
  if (diff <= -15) {
    return 'Here it runs the other way: this lands better than the effort your team can see. Some behaviors simply fit you — the score is carried by results, not push.';
  }
  return 'The two measurements stay close on this one — what your team sees you put in is about what they feel coming back.';
}

function mirrorTraitRead(gap) {
  if (gap <= -8) {
    return 'You undersell this one. Your team feels more landing than you claim — the strength is more visible to them than it is to you. Let their read count.';
  }
  if (gap < 8) {
    return 'You and your team see this one the same way. When a leader and a team agree this closely, the trait is being practiced in the open — a shared picture to trust.';
  }
  return 'You feel more landing here than your team is reflecting back. That’s not a contradiction; it’s the space between what you intend and what arrives, and the most useful conversations live exactly there.';
}

function mirrorStatementRead(gap) {
  if (gap >= 15) {
    return 'One of the widest gaps in your reading. You feel this landing; your team doesn’t yet. Worth asking them what it looks like from where they sit.';
  }
  if (gap >= 5) {
    return 'You give yourself a little more credit here than they do — a modest gap worth noticing, not worrying about.';
  }
  if (gap <= -5) {
    return 'You undersell this one. They feel more than you claim — it’s landing harder than you think. Let that count for something.';
  }
  return 'Your read and theirs sit nearly on top of each other here — a shared picture to trust.';
}


function insightCopy(row, role) {
  const name = row.subTrait || row.trait;
  const e = Math.round(row.team.effort);
  const f = Math.round(row.team.efficacy);
  const gap = row.self ? Math.round(row.self.lepScore - row.team.lepScore) : 0;
  const zone = getQuadrant(row.team.effort, row.team.efficacy);
  switch (zone.id) {
    case 'naturalGift':
      return {
        headline: `${name} — your natural gift.`,
        serif: `Your team feels this landing. Efficacy of ${f} on effort of just ${e} — it works almost without you pushing${gap < 0 ? ', and they rated it higher than you rated yourself' : ''}. While your attention has been on the harder traits, this one has been quietly doing the lifting underneath everything else. That consistency is the signal: when a trait costs this little and lands this clearly, it is already doing work you may not be counting.`,
        sans: 'The read is consistent: it lands clearly enough that your team doesn’t watch you strain for it — they just orient by it. The only caution with a gift this natural is drift. Name it out loud, lean on it when the harder work gets heavy, and give it just enough deliberate attention that it keeps growing instead of coasting. Protect the ease without taking it for granted.',
      };
    case 'fullStrength':
      return {
        headline: `${name} — strong because you keep it strong.`,
        serif: `Real effort, real results. Your team rates the work at ${e} and the payoff at ${f} — they see you working at this, and they feel it landing in kind.${Math.abs(gap) < 8 ? ' And your read matches theirs almost exactly: a rare, shared picture of the same strength.' : ''} That alignment is what makes this trait dependable — not luck, but a pattern your team can name.`,
        sans: 'This is the strongest place a trait can be — and the most expensive to hold. Protect it: notice what’s working so you can repeat it on purpose, and keep an eye on the cost, because a peak held by force erodes quietly. Nothing here needs fixing; it needs guarding. The work is visible, the payoff is felt, and that loop is worth preserving deliberately.',
      };
    case 'offTarget':
      return {
        headline: `${name} — asking the loudest.`,
        serif: `${role === 'edge' ? 'The heaviest signal in the reading' : 'A hard signal in the reading'}${gap >= 8 ? ' — and a wide gap between your read and theirs' : ''}. Your team sees real effort here (${e}), they aren’t yet feeling the results (${f})${gap >= 8 ? ', and you feel more landing than they do' : ''}. The split between trying and landing is the whole story — and it shows up statement by statement, not just in the headline score.`,
        sans: 'This is a targeting problem, not a character flaw. Don’t add more force — change the aim. Ask your team what would actually help, and redirect energy you’re already spending. When you’re ready to work, this trait is first in line, and its room holds every statement behind this read. Small aim corrections here will be felt faster than pushing harder on what is already maxed out.',
      };
    default:
      return {
        headline: `${name} — quiet ground, not yet claimed.`,
        serif: `Neither much effort (${e}) nor much result (${f}) is showing up here yet. It’s not a failure — it’s unclaimed ground, and unclaimed ground moves fastest when you decide it matters. Until you choose it, your team reads quiet on both measurements.`,
        sans: 'Decide whether this trait belongs in the next stretch. If it does, a small, deliberate investment — one visible behavior, held for a season — can move it more quickly than any of the crowded traits. If it doesn’t, let it rest without guilt. Unclaimed is not broken; it is simply waiting for a decision about whether it earns your attention.',
      };
  }
}

// ---------------------------------------------------------------------------
// Shared slide scaffolding
// ---------------------------------------------------------------------------
function NarrativeFrame({ children }) {
  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: colors.surface1,
        border: `1.5px solid ${colors.borderSoft}`,
        borderRadius: radii.lg,
        boxShadow: shadows.dialCase,
        overflow: 'hidden',
        p: { xs: 1.8, md: 2.4 },
      }}
    >
      {children}
    </Box>
  );
}

function SlideHeader({ eyebrow, title, lead, legend }) {
  return (
    <Stack
      direction="row"
      alignItems="flex-end"
      justifyContent="space-between"
      spacing={3}
      sx={{ mb: 2.2, flexWrap: 'wrap', rowGap: 1.4 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <ChapterEyebrow index={eyebrow.index} label={eyebrow.label} sx={{ mb: 1 }} />
        <Typography
          component="h1"
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            fontSize: { xs: 24, md: 30 },
            color: colors.textPrimary,
            mb: 1,
            textWrap: 'pretty',
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 1.5, color: colors.textSecondary, maxWidth: 700 }}>
          {lead}
        </Typography>
      </Box>
      {legend && (
        <Stack spacing={1} sx={{ flexShrink: 0, pb: 0.5 }}>
          {legend.map((item) => (
            <Stack key={item.strong} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 10, height: 10, borderRadius: radii.circle, bgcolor: item.color, flexShrink: 0 }} />
              <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary }}>
                <strong>{item.strong}</strong> {item.rest}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

const EFFORT_LEGEND = [
  { strong: 'Effort', rest: '— how hard they see you trying', color: colors.orange },
  { strong: 'Efficacy', rest: '— how well it lands for them', color: colors.navy500 },
];
const GAP_LEGEND = [
  { strong: 'You see more', rest: 'than they feel', color: colors.orange },
  { strong: 'They see more', rest: 'than you feel', color: colors.navy500 },
];

// The showcase pages hold one height for both columns: the three pick cards
// split it evenly, the detail card matches it. Selecting anything longer can
// never resize the layout.
const SHOWCASE_H = 'clamp(248px, 36vh, 336px)';

const pickCardSx = (on) => ({
  boxSizing: 'border-box',
  borderRadius: '16px',
  px: 2.6,
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  cursor: 'pointer',
  transition: 'all 180ms ease',
  textAlign: 'left',
  width: '100%',
  font: 'inherit',
  color: 'inherit',
  appearance: 'none',
  WebkitAppearance: 'none',
  m: 0,
  bgcolor: on ? colors.navy900 : colors.surface1,
  border: `1.5px solid ${on ? colors.navy900 : colors.borderSoft}`,
  boxShadow: on ? '0 18px 40px rgba(15,28,46,0.18)' : 'none',
  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
});

function DetailCard({ children }) {
  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        bgcolor: colors.surface1,
        border: `1.5px solid ${colors.orange}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        p: { xs: 2.4, md: '22px 28px 20px' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1.6,
        height: SHOWCASE_H,
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
}

const SCORE_COL_W = 52;

function MeasureBar({ label, value, ink, fill, caption }) {
  const score = Math.round(value);
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `96px 1fr ${SCORE_COL_W}px`,
          columnGap: 1.5,
          alignItems: 'center',
          mb: caption ? 0.8 : 0,
        }}
      >
        <Typography sx={{ ...type.monoLabel, color: ink }}>{label}</Typography>
        <Box sx={{ height: 11, borderRadius: radii.pill, bgcolor: colors.sand100, overflow: 'hidden' }}>
          <Box sx={{ width: `${score}%`, height: '100%', borderRadius: radii.pill, bgcolor: fill, transition: 'width 280ms ease' }} />
        </Box>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 600,
            fontSize: 24,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: ink,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
          }}
        >
          {score}
        </Typography>
      </Box>
      {caption && (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, mt: 0, pl: '110px', pr: `${SCORE_COL_W + 12}px` }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function ReadFootnote({ children }) {
  return (
    <Typography
      sx={{
        fontFamily: fonts.serif,
        fontStyle: 'italic',
        fontSize: 15,
        lineHeight: 1.55,
        color: colors.textSecondary,
        borderTop: `1px solid ${colors.borderSoft}`,
        pt: 1.8,
      }}
    >
      {children}
    </Typography>
  );
}

function PickGrid({ left, right }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(270px, 350px) minmax(0, 1fr)' },
        gap: 2.6,
        alignItems: 'start',
      }}
    >
      <Stack spacing={2} sx={{ height: SHOWCASE_H }}>{left}</Stack>
      <Box>{right}</Box>
    </Box>
  );
}

function GapCells({ label, labelColor, you, team, gap }) {
  const cell = {
    fontFamily: fonts.mono,
    fontSize: 27,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    minWidth: SCORE_COL_W,
    lineHeight: 1.1,
  };
  const cap = { fontSize: '9px', letterSpacing: '0.14em', color: '#8a94a3', display: 'block', mt: 0.5 };
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `104px repeat(3, ${SCORE_COL_W + 32}px)`,
        columnGap: 1.5,
        alignItems: 'baseline',
        borderTop: `1px solid ${colors.borderSoft}`,
        py: 2.4,
      }}
    >
      <Typography sx={{ ...type.monoLabel, fontSize: 10.5, color: labelColor }}>{label}</Typography>
      <Typography sx={{ ...cell, color: colors.textSecondary }}>
        {you}
        <Box component="span" sx={cap}>YOU</Box>
      </Typography>
      <Typography sx={{ ...cell, color: colors.textPrimary }}>
        {team}
        <Box component="span" sx={cap}>TEAM</Box>
      </Typography>
      <Typography sx={{ ...cell, color: gapInk(gap) }}>
        {fmtGap(gap)}
        <Box component="span" sx={cap}>GAP</Box>
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The mini compass dial (page 04) — one statement at a time, selected zone lit
// ---------------------------------------------------------------------------
const rad = (d) => (d * Math.PI) / 180;

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

// The two diagonal axes of the dial: effort runs to the upper right, efficacy
// to the upper left — same geometry the Evidence dial uses.
const DIAG = 1 / Math.SQRT2;
const EFFORT_DIR = { x: DIAG, y: -DIAG };
const EFFICACY_DIR = { x: -DIAG, y: -DIAG };
const AXIS_LEN = 46.65;
const axPt = (dir, t) => ({ x: 50 + dir.x * t, y: 50 + dir.y * t });
const axT = (v) => ((Number(v) - 50) / 50) * AXIS_LEN;

function wedgePath(a0) {
  const PAD = 1.35;
  const R_FACE = 48;
  const e0 = { x: Math.sin(rad(a0)), y: -Math.cos(rad(a0)) };
  const e1 = { x: Math.sin(rad(a0 + 90)), y: -Math.cos(rad(a0 + 90)) };
  const Ro = R_FACE - PAD / 2;
  const t = Math.sqrt(Math.max(0, Ro * Ro - PAD * PAD));
  const P = (ta, tb) => `${(50 + e0.x * ta + e1.x * tb).toFixed(2)} ${(50 + e0.y * ta + e1.y * tb).toFixed(2)}`;
  return `M${P(PAD, PAD)}L${P(t, PAD)}A${Ro} ${Ro} 0 0 1 ${P(PAD, t)}L${P(PAD, PAD)}Z`;
}

// Dial-zone framing for the map page (position → move), keyed like quadrants
// but with the narrative labels and a light-on-navy ink for the row chip.
function dialZoneOf(effort, efficacy) {
  const he = Number(effort) >= 50;
  const hf = Number(efficacy) >= 50;
  if (hf && he) return { id: 'fullStrength', label: 'Honed, keep perfecting', navyInk: colors.amber, faceInk: '#8a6a13' };
  if (hf && !he) return { id: 'naturalGift', label: 'Natural, needs tending', navyInk: colors.navy300, faceInk: colors.navy600 };
  if (!hf && he) return { id: 'offTarget', label: 'Off-target, but intentional', navyInk: colors.orange, faceInk: colors.orangeDeep };
  return { id: 'untapped', label: 'Missing the mark', navyInk: '#9fb0c3', faceInk: colors.inkSoft };
}

const DIAL_WEDGES = [
  { id: 'fullStrength', d: wedgePath(-45), vibrant: 'rgba(236,201,75,0.55)' },
  { id: 'offTarget', d: wedgePath(45), vibrant: 'rgba(224,122,63,0.48)' },
  { id: 'untapped', d: wedgePath(135), vibrant: 'rgba(15,28,46,0.16)' },
  { id: 'naturalGift', d: wedgePath(225), vibrant: 'rgba(143,179,205,0.55)' },
];
const DIAL_VEIL = 'rgba(10,20,36,0.38)';
const DIAL_ZONE_LABELS = [
  { id: 'fullStrength', label: 'Honed, keep perfecting', sx: { left: '50%', top: '6%', transform: 'translate(-50%, 0)', textAlign: 'center' } },
  { id: 'offTarget', label: 'Off-target, but intentional', sx: { left: '94%', top: '50%', transform: 'translate(-100%, -50%)', textAlign: 'right' } },
  { id: 'untapped', label: 'Missing the mark', sx: { left: '50%', top: '94%', transform: 'translate(-50%, -100%)', textAlign: 'center' } },
  { id: 'naturalGift', label: 'Natural, needs tending', sx: { left: '6%', top: '50%', transform: 'translate(0, -50%)', textAlign: 'left' } },
];

function statementZoneBlurb(effort, efficacy) {
  const zone = dialZoneOf(effort, efficacy);
  return `${zone.label}. ${statementSplitRead(effort, efficacy)}`;
}

function MiniDial({ statement, showAxisNodes = false }) {
  const zone = statement ? dialZoneOf(statement.effort, statement.efficacy) : null;
  const pos = statement ? circPos(statement.effort, statement.efficacy) : null;
  const axisNodes = showAxisNodes && statement
    ? [
        { key: 'effort', label: 'Effort', value: Math.round(statement.effort), color: colors.orange, at: axPt(EFFORT_DIR, axT(statement.effort)) },
        { key: 'efficacy', label: 'Efficacy', value: Math.round(statement.efficacy), color: colors.efficacyBlue, at: axPt(EFFICACY_DIR, axT(statement.efficacy)) },
      ]
    : [];
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 'min(100%, 38vh)', aspectRatio: '1 / 1', mx: 'auto' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: '6px',
          borderRadius: radii.circle,
          background: 'radial-gradient(circle at 50% -10%, #223d66, #0a1424 72%)',
          boxShadow: shadows.dialCase,
        }}
      >
        {[45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const cardinal = deg % 90 === 0;
          return (
            <Box key={deg} sx={{ position: 'absolute', inset: 0, transform: `rotate(${deg}deg)`, pointerEvents: 'none', zIndex: 9 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '4px',
                  width: cardinal ? '3px' : '2px',
                  height: cardinal ? '9px' : '6px',
                  ml: '-1.5px',
                  borderRadius: '1px',
                  bgcolor: `rgba(225, 175, 67, ${cardinal ? 0.95 : 0.55})`,
                }}
              />
            </Box>
          );
        })}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 48,
            height: 37,
            transform: 'translate(-50%, -52%)',
            background: `linear-gradient(180deg, ${colors.dialArrowStart}, ${colors.brass} 55%, ${colors.dialArrowEnd})`,
            clipPath: 'polygon(50% 0, 100% 100%, 50% 72%, 0 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'absolute', inset: '10px', borderRadius: radii.circle, border: `2px solid ${colors.brass}`, pointerEvents: 'none', zIndex: 9 }} />
        <Box sx={{ position: 'absolute', inset: '13px', borderRadius: radii.circle, bgcolor: colors.dialFace }}>
          <Box
            component="svg"
            viewBox="0 0 100 100"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          >
            <line x1="17.01" y1="17.01" x2="82.99" y2="82.99" stroke={colors.dialAxis} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="82.99" y1="17.01" x2="17.01" y2="82.99" stroke={colors.dialAxis} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {DIAL_WEDGES.map((w) => (
              <path key={w.id} d={w.d} fill={zone && w.id === zone.id ? w.vibrant : DIAL_VEIL} style={{ transition: 'fill 280ms ease' }} />
            ))}
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 6,
              height: 6,
              transform: 'translate(-50%, -50%)',
              borderRadius: radii.circle,
              bgcolor: colors.dialHub,
              pointerEvents: 'none',
            }}
          />
          {DIAL_ZONE_LABELS.map((z) => (
            <Typography
              key={z.id}
              sx={{
                position: 'absolute',
                ...z.sx,
                fontFamily: fonts.sans,
                fontSize: 11,
                fontWeight: zone && z.id === zone.id ? 700 : 600,
                lineHeight: 1.3,
                maxWidth: 104,
                color: zone && z.id === zone.id ? zone.faceInk : 'rgba(244, 236, 221, 0.6)',
                pointerEvents: 'none',
                transition: 'color 280ms ease',
              }}
            >
              {z.label}
            </Typography>
          ))}
          {axisNodes.map((n) => (
            <Box
              key={n.key}
              sx={{
                position: 'absolute',
                left: `${n.at.x.toFixed(1)}%`,
                top: `${n.at.y.toFixed(1)}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: radii.circle,
                  bgcolor: n.color,
                  border: '2px solid #fff',
                  boxShadow: shadows.dialNode,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.mono,
                  fontSize: 11.5,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: '#fff',
                }}
              >
                {n.value}
              </Box>
              <Typography
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translate(-50%, 3px)',
                  fontFamily: fonts.mono,
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  color: n.color,
                }}
              >
                {n.label}
              </Typography>
            </Box>
          ))}
          {statement && pos && (
          <Box
            sx={{
              position: 'absolute',
              left: `${pos.x.toFixed(1)}%`,
              top: `${pos.y.toFixed(1)}%`,
              width: 36,
              height: 36,
              transform: 'translate(-50%, -50%)',
              borderRadius: radii.pill,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: colors.navy900,
              border: `2px solid ${colors.navy900}`,
              color: colors.amber,
              boxShadow: `0 0 0 7px ${colors.compassNodeGlow}`,
              fontFamily: fonts.mono,
              fontSize: 12.5,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              zIndex: 4,
              transition: 'left 280ms cubic-bezier(.2,.8,.2,1), top 280ms cubic-bezier(.2,.8,.2,1)',
            }}
          >
            {Math.round(statement.compass)}
          </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------
function SlideThreshold({ firstName, respondents, invited, traits }) {
  const answered =
    Number.isFinite(invited) && invited >= respondents && respondents > 0
      ? `${respondents} of ${invited} teammates answered.`
      : respondents > 0
      ? `${respondents} ${respondents === 1 ? 'teammate' : 'teammates'} answered.`
      : 'Your team has answered.';
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 980, mx: 'auto' }}>
      <ChapterEyebrow index={1} label="The Threshold" />
      <Typography
        component="h1"
        sx={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
          fontSize: 'clamp(28px, 4.6vh, 46px)',
          color: colors.textPrimary,
          mb: 2,
          textWrap: 'pretty',
        }}
      >
        {firstName ? `${firstName}, your` : 'Your'} team has reflected back.
      </Typography>
      <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.55, color: colors.textSecondary, maxWidth: 560, mx: 'auto', mb: 'clamp(24px, 5vh, 52px)' }}>
        {answered} What follows is their experience of your leadership — read it slowly, and hold it lightly. Patterns matter more than any one number.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: { xs: 3, sm: 7 }, flexWrap: 'wrap' }}>
        {traits.map((row) => (
          <Stack key={row.trait} alignItems="center" sx={{ width: { xs: '100%', sm: 170 } }}>
            {/* Fixed label zone, bottom-aligned: a wrapped name stacks upward so
                every score sits on the same horizontal line. */}
            <Box sx={{ height: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 1.4 }}>
              <Typography sx={{ ...type.monoLabel, textAlign: 'center', lineHeight: 1.45 }}>{row.subTrait || row.trait}</Typography>
            </Box>
            <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 'clamp(46px, 8vh, 74px)', lineHeight: 0.95, letterSpacing: '-0.04em', color: colors.orange }}>
              {Math.round(row.team.lepScore)}
            </Typography>
          </Stack>
        ))}
      </Box>
      <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, mt: 'clamp(16px, 3vh, 28px)' }}>
        Compass scores &#183; 0&#8211;100 &#183; readings, not grades
      </Typography>
    </Box>
  );
}

function SlideMeasurements({ traits, sel, onSel }) {
  const d = traits[sel];
  const copy = measurementCopy(d);
  return (
    <Box>
      <SlideHeader
        eyebrow={{ index: 2, label: 'Two Measurements' }}
        title="Every score here is made of two questions."
        lead="Your team answered every statement twice — how hard you try, and how well it lands. The Compass number blends the two. Select a trait to see its two measurements."
        legend={EFFORT_LEGEND}
      />
      <PickGrid
        left={traits.map((row, i) => {
          const on = sel === i;
          return (
            <Box
              key={row.trait}
              component="button"
              type="button"
              onClick={() => onSel(i)}
              sx={{ ...pickCardSx(on), alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
            >
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 17, fontWeight: 600, lineHeight: 1.2, color: on ? '#fff' : colors.textPrimary }}>
                {row.subTrait || row.trait}
              </Typography>
              <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 28, letterSpacing: '-0.04em', color: on ? colors.amberSoft : colors.orange, flexShrink: 0 }}>
                {Math.round(row.team.lepScore)}
              </Typography>
            </Box>
          );
        })}
        right={
          <DetailCard>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 21, fontWeight: 600, lineHeight: 1.2, color: colors.textPrimary, minWidth: 0 }}>
                {d.subTrait || d.trait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
                <Typography sx={{ ...type.monoLabel }}>Compass</Typography>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em', color: colors.orange }}>
                  {Math.round(d.team.lepScore)}
                </Typography>
              </Stack>
            </Stack>
            <MeasureBar label="Effort" value={d.team.effort} ink={colors.orangeDeep} fill={colors.orange} />
            <MeasureBar label="Efficacy" value={d.team.efficacy} ink={colors.navy500} fill={colors.navy500} />
            <ReadFootnote>{copy.read}</ReadFootnote>
          </DetailCard>
        }
      />
    </Box>
  );
}

function StatementPickCard({ on, trait, text, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{ ...pickCardSx(on), flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 0.8 }}
    >
      <Typography sx={{ fontFamily: fonts.mono, fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: on ? 'rgba(244,206,161,0.75)' : '#8a94a3' }}>
        {trait}
      </Typography>
      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontSize: 15,
          lineHeight: 1.35,
          color: on ? '#fff' : colors.textPrimary,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

function SlideStatements({ stmts, sel, onSel }) {
  const d = stmts[sel];
  return (
    <Box>
      <SlideHeader
        eyebrow={{ index: 3, label: 'Two Measurements · Statements' }}
        title="The two questions go all the way down."
        lead="Not just traits — every single statement your team rated carries both measurements. This is where the reading gets specific. Here are a few of yours; select one."
        legend={EFFORT_LEGEND}
      />
      <PickGrid
        left={stmts.map((s, i) => (
          <StatementPickCard key={`${s.trait}-${i}`} on={sel === i} trait={s.trait} text={s.text} onClick={() => onSel(i)} />
        ))}
        right={
          <DetailCard>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontSize: 21,
                fontWeight: 500,
                lineHeight: 1.35,
                letterSpacing: '-0.015em',
                color: colors.textPrimary,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              &#8220;{d.text}&#8221;
            </Typography>
            <MeasureBar label="Effort" value={d.effort} ink={colors.orangeDeep} fill={colors.orange} />
            <MeasureBar label="Efficacy" value={d.efficacy} ink={colors.navy500} fill={colors.navy500} />
            <ReadFootnote>{statementSplitRead(d.effort, d.efficacy)}</ReadFootnote>
          </DetailCard>
        }
      />
    </Box>
  );
}

function ExplainerVideo({ src, label, standalone = false }) {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);

  const overlayVisible = ended || (reducedMotion && !playing);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setEnded(false);
    setPlaying(true);
    video.play().catch(() => {});
  };

  const handleEnded = () => {
    setEnded(true);
    setPlaying(false);
  };

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius: radii.lg,
        overflow: 'hidden',
        mb: standalone ? 0 : 4.5,
        bgcolor: colors.navy900,
        boxShadow: shadows.dialCase,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        aria-label={label}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          aspectRatio: '16 / 9',
        }}
      />
      <Box
        aria-hidden={!overlayVisible}
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(10, 20, 36, 0.55)',
          opacity: overlayVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: overlayVisible ? 'auto' : 'none',
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={handleReplay}
          aria-label="Replay explainer video"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.2,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: radii.circle,
              bgcolor: colors.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="svg"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M12 5V2L7 7l5 5V9c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.959 7.959 0 0019 15c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 10.74A7.959 7.959 0 005 15c0 4.42 3.58 8 8 8v3l5-5-5-5v3z"
                fill={colors.navy900}
              />
            </Box>
          </Box>
          <Typography
            sx={{
              fontFamily: fonts.mono,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#fff',
            }}
          >
            Replay
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function VideoSlide({ src, label }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 'min(860px, 108vh)',
        mx: 'auto',
        bgcolor: colors.surface1,
        borderRadius: radii.xl,
        p: { xs: 1, md: 1.4 },
        boxShadow: shadows.card,
      }}
    >
      <ExplainerVideo src={src} label={label} standalone />
    </Box>
  );
}

// Sourced straight from the named files in /public so dropping in a new cut of
// either explainer needs no code change.
const MAP_VIDEO = {
  src: '/Compass%20Explainer.mp4',
  label: 'Animated explainer: how effort and efficacy place a statement on the compass',
};
const GAP_VIDEO = {
  src: '/Perception%20Gap%20Explainer.mp4',
  label: 'Animated explainer: how your own read sits beside your team’s, and what the gap means',
};

function SlideMap({ stmts, sel, onSel }) {
  const d = sel == null ? null : stmts[sel];
  return (
    <Box>
      <SlideHeader
        eyebrow={{ index: 5, label: 'The Map · Statements' }}
        title="Where a statement lands tells you what to do with it."
        lead="Select a statement to see where it sits on the compass — effort and efficacy together, one of four zones."
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'min(400px, 38vh) minmax(0, 1fr)' }, gap: 4, alignItems: 'start' }}>
        <MiniDial statement={d} />
        <Box>
          <Typography sx={{ ...type.monoLabel, mb: 1.2 }}>Three statements &#183; select one</Typography>
          <Box sx={{ bgcolor: colors.surface1, border: `1.5px solid ${colors.borderSoft}`, borderRadius: radii.lg, overflow: 'hidden' }}>
            {stmts.map((s, i) => {
              const zone = dialZoneOf(s.effort, s.efficacy);
              if (sel === i) {
                return (
                  <Box key={s.text} sx={{ bgcolor: colors.navy900, p: '20px 24px 16px' }}>
                    <Box
                      sx={{
                        mb: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      <Box component="span" sx={{ fontFamily: fonts.serif, fontSize: 19, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.015em', color: '#fff' }}>
                        &#8220;{s.text}&#8221;
                      </Box>
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.4, py: 0.4, borderRadius: radii.pill, border: `1px solid ${zone.navyInk}`, ml: 1.4, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: radii.circle, bgcolor: zone.navyInk }} />
                        <Box component="span" sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: zone.navyInk }}>
                          {zone.label}
                        </Box>
                      </Box>
                    </Box>
                    <Stack direction="row" alignItems="baseline" sx={{ borderTop: '1px solid rgba(244,206,161,0.18)', pt: 1.4 }}>
                      {[
                        { v: Math.round(s.compass), cap: 'COMPASS', color: colors.amber, first: true },
                        { v: Math.round(s.effort), cap: 'EFFORT', color: '#fff' },
                        { v: Math.round(s.efficacy), cap: 'EFFICACY', color: '#fff' },
                      ].map((c) => (
                        <Typography
                          key={c.cap}
                          sx={{
                            fontFamily: fonts.mono,
                            fontSize: 17,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            px: 2.4,
                            pl: c.first ? 0 : 2.4,
                            borderLeft: c.first ? 'none' : '1px solid rgba(244,206,161,0.22)',
                            color: c.color,
                          }}
                        >
                          {c.v}{' '}
                          <Box component="span" sx={{ fontSize: '8.5px', letterSpacing: '0.14em', color: 'rgba(244,206,161,0.55)' }}>{c.cap}</Box>
                        </Typography>
                      ))}
                    </Stack>
                    <Box sx={{ borderTop: '1px solid rgba(244,206,161,0.18)', pt: 1.4, mt: 1.2 }}>
                      <Typography
                        sx={{
                          fontFamily: fonts.sans,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: 'rgba(244,206,161,0.88)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {statementZoneBlurb(s.effort, s.efficacy)}
                      </Typography>
                    </Box>
                  </Box>
                );
              }
              return (
                <Box
                  key={s.text}
                  component="button"
                  type="button"
                  onClick={() => onSel(i)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '22px 1fr 56px',
                    gap: 1.7,
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    p: '16px 24px',
                    cursor: 'pointer',
                    bgcolor: colors.surface1,
                    border: 'none',
                    borderTop: i > 0 ? `1px solid ${colors.borderSoft}` : 'none',
                    font: 'inherit',
                    color: 'inherit',
                    appearance: 'none',
                    m: 0,
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: -3 },
                  }}
                >
                  <Typography sx={{ fontFamily: fonts.mono, fontSize: 13, color: colors.navy300 }}>&#8964;</Typography>
                  <Typography sx={{ fontFamily: fonts.serif, fontSize: 15, lineHeight: 1.35, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.text}</Typography>
                  <Typography sx={{ fontFamily: fonts.mono, fontSize: 16, fontWeight: 700, textAlign: 'right', color: colors.textSecondary }}>
                    {Math.round(s.compass)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function SlideMirror({ traits, sel, onSel }) {
  const d = traits[sel];
  const gap = Math.round(d.self.lepScore - d.team.lepScore);
  const eg = Math.round(d.self.effort - d.team.effort);
  const fg = Math.round(d.self.efficacy - d.team.efficacy);
  return (
    <Box>
      <SlideHeader
        eyebrow={{ index: 7, label: 'The Perception Gap' }}
        title="You rated yourself first — on everything."
        lead="Before your team answered, you scored the same statements. So every measurement you’ve seen has a twin: your own read. The distance between the two is the perception gap — neither number is wrong, the distance itself is the finding. Select a trait."
        legend={GAP_LEGEND}
      />
      <PickGrid
        left={traits.map((row, i) => {
          const on = sel === i;
          const g = Math.round(row.self.lepScore - row.team.lepScore);
          return (
            <Box
              key={row.trait}
              component="button"
              type="button"
              onClick={() => onSel(i)}
              sx={{ ...pickCardSx(on), alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
            >
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 17, fontWeight: 600, lineHeight: 1.2, color: on ? '#fff' : colors.textPrimary }}>
                {row.subTrait || row.trait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 26, letterSpacing: '-0.03em', color: on ? gapLight(g) : gapInk(g) }}>
                  {fmtGap(g)}
                </Typography>
                <Typography sx={{ fontFamily: fonts.mono, fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: on ? 'rgba(244,206,161,0.6)' : '#8a94a3' }}>
                  Gap
                </Typography>
              </Stack>
            </Box>
          );
        })}
        right={
          <DetailCard>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: colors.textPrimary, minWidth: 0 }}>
                {d.subTrait || d.trait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
                <Typography sx={{ ...type.monoLabel }}>Compass gap</Typography>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em', color: gapInk(gap) }}>
                  {fmtGap(gap)}
                </Typography>
              </Stack>
            </Stack>
            <Box>
              <GapCells label="Effort" labelColor={colors.orangeDeep} you={Math.round(d.self.effort)} team={Math.round(d.team.effort)} gap={eg} />
              <GapCells label="Efficacy" labelColor={colors.navy500} you={Math.round(d.self.efficacy)} team={Math.round(d.team.efficacy)} gap={fg} />
            </Box>
            <ReadFootnote>{mirrorTraitRead(gap)}</ReadFootnote>
          </DetailCard>
        }
      />
    </Box>
  );
}

function SlideGapStatements({ stmts, sel, onSel }) {
  const d = stmts[sel];
  const gap = Math.round(d.compassSelf - d.compass);
  const eg = Math.round(d.effortSelf - d.effort);
  const fg = Math.round(d.efficacySelf - d.efficacy);
  return (
    <Box>
      <SlideHeader
        eyebrow={{ index: 8, label: 'The Perception Gap · Statements' }}
        title="The gap, statement by statement."
        lead="The same statements you’ve been following — now with your read beside your team’s. This is as specific as the reading gets, and it’s where the gap turns into something you can actually ask about. One at a time."
        legend={GAP_LEGEND}
      />
      <PickGrid
        left={stmts.map((s, i) => (
          <StatementPickCard key={`${s.trait}-${i}`} on={sel === i} trait={s.trait} text={s.text} onClick={() => onSel(i)} />
        ))}
        right={
          <DetailCard>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2.4}>
              <Typography
                sx={{
                  fontFamily: fonts.serif,
                  fontSize: 22,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  letterSpacing: '-0.015em',
                  color: colors.textPrimary,
                  minWidth: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                &#8220;{d.text}&#8221;
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
                <Typography sx={{ ...type.monoLabel }}>Gap</Typography>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em', color: gapInk(gap) }}>
                  {fmtGap(gap)}
                </Typography>
              </Stack>
            </Stack>
            <Box>
              <GapCells label="Effort" labelColor={colors.orangeDeep} you={Math.round(d.effortSelf)} team={Math.round(d.effort)} gap={eg} />
              <GapCells label="Efficacy" labelColor={colors.navy500} you={Math.round(d.efficacySelf)} team={Math.round(d.efficacy)} gap={fg} />
            </Box>
            <ReadFootnote>{mirrorStatementRead(gap)}</ReadFootnote>
          </DetailCard>
        }
      />
    </Box>
  );
}

function SlideInsight({ traits, index, roles }) {
  const row = traits[index];
  const role =
    row.trait === roles.edge?.trait ? 'edge' : row.trait === roles.lifting?.trait ? 'lifting' : 'strength';
  const copy = insightCopy(row, role);
  const traitDial = {
    effort: row.team.effort,
    efficacy: row.team.efficacy,
    compass: row.team.lepScore,
  };
  const name = row.subTrait || row.trait;

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={3} sx={{ mb: 2.4, flexWrap: 'wrap', rowGap: 1.6 }}>
        <Box sx={{ minWidth: 0 }}>
          <ChapterEyebrow index={9 + index} label={`The Insights · ${name}`} sx={{ mb: 1 }} />
          <Typography
            component="h1"
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              fontSize: { xs: 26, md: 34 },
              color: colors.textPrimary,
              textWrap: 'pretty',
            }}
          >
            {copy.headline}
          </Typography>
        </Box>
        <Stack direction="row" spacing={3} sx={{ flexShrink: 0, pt: 0.4 }}>
          {[
            { v: Math.round(row.team.lepScore), cap: 'Compass', color: colors.orange },
            { v: Math.round(row.team.effort), cap: 'Effort', color: colors.orangeDeep },
            { v: Math.round(row.team.efficacy), cap: 'Efficacy', color: colors.navy500 },
          ].map((c) => (
            <Stack key={c.cap} alignItems="center" spacing={0.4}>
              <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 26, lineHeight: 1, letterSpacing: '-0.03em', color: c.color, fontVariantNumeric: 'tabular-nums' }}>
                {c.v}
              </Typography>
              <Typography sx={{ ...type.monoLabel, color: colors.textSecondary }}>{c.cap}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'min(340px, 36vh) minmax(0, 1fr)' }, gap: 4, alignItems: 'center' }}>
        <MiniDial statement={traitDial} showAxisNodes />
        <Box>
          <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 19.5, lineHeight: 1.6, color: colors.textPrimary, mb: 2.2, textWrap: 'pretty' }}>
            {copy.serif}
          </Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 1.65, color: colors.textSecondary, textWrap: 'pretty' }}>
            {copy.sans}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Statement selection for pages 03/04/06 — the most vivid splits, spanning
// at least two traits when the data allows it.
// ---------------------------------------------------------------------------
function pickNarrativeStatements(orderedRows) {
  const mapped = orderedRows.flatMap((row) =>
    mapRowStatements(row).map((s) => ({ ...s, trait: row.subTrait || row.trait, traitKey: row.trait }))
  );
  // Prefer statements with real values, but an all-zero seed still walks the
  // full deck rather than skipping pages.
  const withValues = mapped.filter((s) => s.effort || s.efficacy);
  const all = withValues.length ? withValues : mapped;
  if (!all.length) return [];
  const bySplit = [...all].sort(
    (a, b) => Math.abs(b.effort - b.efficacy) - Math.abs(a.effort - a.efficacy)
  );
  const picked = [];
  const usedTraits = new Set();
  // First: the single most vivid split anywhere.
  picked.push(bySplit[0]);
  usedTraits.add(bySplit[0].traitKey);
  // Second: the most vivid split in the opposite direction, any trait.
  const firstDir = Math.sign(bySplit[0].effort - bySplit[0].efficacy) || 1;
  const opposite = bySplit.find((s) => !picked.includes(s) && Math.sign(s.effort - s.efficacy) === -firstDir);
  if (opposite) {
    picked.push(opposite);
    usedTraits.add(opposite.traitKey);
  }
  // Third: the most vivid remaining statement from a trait not yet shown.
  const fresh = bySplit.find((s) => !picked.includes(s) && !usedTraits.has(s.traitKey));
  const filler = fresh || bySplit.find((s) => !picked.includes(s));
  if (filler) picked.push(filler);
  return picked.slice(0, 3);
}

// ---------------------------------------------------------------------------
// The view
// ---------------------------------------------------------------------------
const SLIDE_COUNT = 11;

export default function NarrativeView() {
  const { rows, loaded, teamResponses, hasSelfData } = useBenchmarkData();
  const scope = useMemo(() => getDebriefScope(), []);
  const storeKey = `${scope}_narrative`;

  const [idx, setIdxState] = useState(() => {
    const saved = Number(readJson(storeKey, {})?.page);
    return Number.isFinite(saved) ? Math.min(Math.max(saved, 0), SLIDE_COUNT - 1) : 0;
  });
  const [doneEver, setDoneEver] = useState(() => Boolean(readJson(storeKey, {})?.done));

  const setIdx = (next) => {
    const clamped = Math.min(Math.max(next, 0), SLIDE_COUNT - 1);
    setIdxState(clamped);
    const done = doneEver || clamped === SLIDE_COUNT - 1;
    if (done !== doneEver) setDoneEver(done);
    writeJson(storeKey, { page: clamped, done });
  };

  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  const traits = roles.ordered || [];
  const stmts = useMemo(() => pickNarrativeStatements(traits), [traits]);

  // Per-page selections. Defaults follow the mocks: measurement + mirror pages
  // open on the edge trait; statement pages open on the most vivid statement.
  const edgeIdx = Math.max(traits.findIndex((r) => r.trait === roles.edge?.trait), 0);
  const [selMeasure, setSelMeasure] = useState(null);
  const [selStmt, setSelStmt] = useState(0);
  const [selMap, setSelMap] = useState(null);
  const [selMirror, setSelMirror] = useState(null);
  const [selGapStmt, setSelGapStmt] = useState(0);

  const userInfo = readJson('userInfo', {});
  const firstName = String(userInfo?.name || '').trim().split(/\s+/)[0] || '';
  const respondents = teamResponses?.length || 0;
  const invited = Number(readJson('latestFormData', {})?.teamSize);

  const chapters = useMemo(
    () => [
      { id: 'threshold', label: 'The Threshold' },
      { id: 'measurements', label: 'Two Measurements' },
      { id: 'statements', label: 'Statements' },
      { id: 'map-video', label: 'The Map · Video' },
      { id: 'map', label: 'The Map · Statements' },
      { id: 'gap-video', label: 'The Perception Gap · Video' },
      { id: 'mirror', label: 'The Perception Gap' },
      { id: 'gap-statements', label: 'The Gap · Statements' },
      { id: 'insight-1', label: 'Insight 1' },
      { id: 'insight-2', label: 'Insight 2' },
      { id: 'insight-3', label: 'Insight 3' },
    ],
    []
  );

  if (!loaded && !rows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.sectionTitle, fontSize: 22, color: colors.textSecondary }}>Loading the reading&#8230;</Typography>
      </Box>
    );
  }

  if (!traits.length || !traits.some((r) => r.team)) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.eyebrow, mb: 1.6 }}>The Narrative</Typography>
        <Typography sx={{ ...type.lead, fontSize: { xs: 24, md: 28 }, lineHeight: 1.25, mb: 1.4 }}>
          The campaign is still listening.
        </Typography>
        <Typography sx={{ ...type.italicBody, fontSize: 16, color: colors.textSecondary, maxWidth: 600 }}>
          When the listening window closes, this is where the first reading gets told &#8212; ten short pages, at your pace.
        </Typography>
      </Box>
    );
  }

  const measureSel = selMeasure == null ? edgeIdx : selMeasure;
  const mirrorSel = selMirror == null ? edgeIdx : selMirror;
  const mirrorTraits = traits.filter((r) => r.self);
  const mirrorSelSafe = Math.min(mirrorSel, Math.max(mirrorTraits.length - 1, 0));
  const stmtSel = Math.min(selStmt, Math.max(stmts.length - 1, 0));
  const mapSel = selMap == null ? null : Math.min(selMap, Math.max(stmts.length - 1, 0));
  const gapStmtSel = Math.min(selGapStmt, Math.max(stmts.length - 1, 0));

  // Pages that need self data fall back gracefully when it's absent.
  const showMirror = hasSelfData && mirrorTraits.length > 0;

  // A video page drops the frame — but only when it actually renders a video;
  // when its data is missing it falls back to a normal slide, which keeps one.
  const activeId = chapters[idx].id;
  const isVideoSlide =
    (activeId === 'map-video' && stmts.length > 0) || (activeId === 'gap-video' && showMirror);

  const renderSlide = () => {
    switch (chapters[idx].id) {
      case 'measurements':
        return <SlideMeasurements traits={traits} sel={Math.min(measureSel, traits.length - 1)} onSel={setSelMeasure} />;
      case 'statements':
        return stmts.length
          ? <SlideStatements stmts={stmts} sel={stmtSel} onSel={setSelStmt} />
          : <SlideInsight traits={traits} index={0} roles={roles} />;
      case 'map-video':
        return stmts.length
          ? <VideoSlide src={MAP_VIDEO.src} label={MAP_VIDEO.label} />
          : <SlideInsight traits={traits} index={0} roles={roles} />;
      case 'map':
        return stmts.length
          ? <SlideMap stmts={stmts} sel={mapSel} onSel={setSelMap} />
          : <SlideInsight traits={traits} index={0} roles={roles} />;
      case 'gap-video':
        return showMirror
          ? <VideoSlide src={GAP_VIDEO.src} label={GAP_VIDEO.label} />
          : <SlideMeasurements traits={traits} sel={Math.min(measureSel, traits.length - 1)} onSel={setSelMeasure} />;
      case 'mirror':
        return showMirror
          ? <SlideMirror traits={mirrorTraits} sel={mirrorSelSafe} onSel={setSelMirror} />
          : <SlideMeasurements traits={traits} sel={Math.min(measureSel, traits.length - 1)} onSel={setSelMeasure} />;
      case 'gap-statements':
        return showMirror && stmts.length
          ? <SlideGapStatements stmts={stmts} sel={gapStmtSel} onSel={setSelGapStmt} />
          : <SlideMap stmts={stmts} sel={mapSel} onSel={setSelMap} />;
      case 'insight-1':
        return <SlideInsight traits={traits} index={0} roles={roles} />;
      case 'insight-2':
        return <SlideInsight traits={traits} index={Math.min(1, traits.length - 1)} roles={roles} />;
      case 'insight-3':
        return <SlideInsight traits={traits} index={Math.min(2, traits.length - 1)} roles={roles} />;
      case 'threshold':
      default:
        return <SlideThreshold firstName={firstName} respondents={respondents} invited={invited} traits={traits} />;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 1, md: 2 },
        py: 0.5,
        overflow: 'hidden',
      }}
    >
      {/* The deck is a fixed stage: every slide is sized to fit the viewport,
          so the narrative never scrolls. */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
          {isVideoSlide ? renderSlide() : <NarrativeFrame>{renderSlide()}</NarrativeFrame>}
        </WalkthroughStage>
      </Box>
      <Stack alignItems="center" sx={{ pt: 1.2, pb: 0, flexShrink: 0 }}>
        <ProgressDots chapters={chapters} current={idx} onJump={setIdx} />
      </Stack>
    </Box>
  );
}
