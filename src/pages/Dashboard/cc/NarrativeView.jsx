import React, { useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { colors, fonts, radii, shadows, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { deriveTraitRoles } from './debriefContent.js';
import { getQuadrant } from './quadrants.js';
import { mapRowStatements } from './EvidenceView.jsx';
import { ChapterEyebrow, ProgressDots, WalkthroughStage } from './debriefUi.jsx';
import { getDebriefScope } from './phaseState.js';

// ----------------------------------------------------------------------------
// NarrativeView — the nine-page results debrief narrative (v2 design).
//
// Played once when the first team reading lands, replayable any time. Pages:
//   01 Threshold · 02 Two Measurements (traits) · 03 Two Measurements
//   (statements) · 04 The Map · 05 The Gap (traits) · 06 The Gap (statements)
//   · 07–09 one Insight per trait.
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

const ROLE_META = {
  lifting: { eyebrow: 'What’s Lifting', color: colors.green },
  strength: { eyebrow: 'The Held Strength', color: colors.navy500 },
  edge: { eyebrow: 'The Edge', color: colors.orangeDeep },
};

function insightCopy(row, role) {
  const name = row.subTrait || row.trait;
  const e = Math.round(row.team.effort);
  const f = Math.round(row.team.efficacy);
  const gap = row.self ? Math.round(row.self.lepScore - row.team.lepScore) : 0;
  const zone = getQuadrant(row.team.effort, row.team.efficacy);
  switch (zone.id) {
    case 'naturalGift':
      return {
        headline: gap < 0
          ? `${name} is carrying more than you give it credit for.`
          : `${name} is your natural gift.`,
        serif: `Your team feels this landing. Efficacy of ${f} on effort of just ${e} — it works almost without you pushing${gap < 0 ? ', and they rated it higher than you rated yourself' : ''}. While your attention has been on the harder traits, this one has been quietly doing the lifting underneath everything else.`,
        sans: 'The read is consistent: it lands clearly enough that your team doesn’t watch you strain for it — they just orient by it. The only caution with a gift this natural is drift. Name it out loud, lean on it when the harder work gets heavy, and give it just enough deliberate attention that it keeps growing instead of coasting.',
      };
    case 'fullStrength':
      return {
        headline: `${name} is strong because you keep it strong.`,
        serif: `Real effort, real results. Your team rates the work at ${e} and the payoff at ${f} — they see you working at this, and they feel it landing in kind.${Math.abs(gap) < 8 ? ' And your read matches theirs almost exactly: a rare, shared picture of the same strength.' : ''}`,
        sans: 'This is the strongest place a trait can be — and the most expensive to hold. Protect it: notice what’s working so you can repeat it on purpose, and keep an eye on the cost, because a peak held by force erodes quietly. Nothing here needs fixing; it needs guarding.',
      };
    case 'offTarget':
      return {
        headline: `${name} is asking the loudest.`,
        serif: `${role === 'edge' ? 'The heaviest signal in the reading' : 'A hard signal in the reading'}${gap >= 8 ? ' — and a wide gap between your read and theirs' : ''}. Your team sees real effort here (${e}), they aren’t yet feeling the results (${f})${gap >= 8 ? ', and you feel more landing than they do' : ''}.`,
        sans: 'This is a targeting problem, not a character flaw. Don’t add more force — change the aim. Ask your team what would actually help, and redirect energy you’re already spending. When you’re ready to work, this trait is first in line, and its room holds every statement behind this read.',
      };
    default:
      return {
        headline: `${name} is quiet ground, not yet claimed.`,
        serif: `Neither much effort (${e}) nor much result (${f}) is showing up here yet. It’s not a failure — it’s unclaimed ground, and unclaimed ground moves fastest when you decide it matters.`,
        sans: 'Decide whether this trait belongs in the next stretch. If it does, a small, deliberate investment — one visible behavior, held for a season — can move it more quickly than any of the crowded traits. If it doesn’t, let it rest without guilt.',
      };
  }
}

// ---------------------------------------------------------------------------
// Shared slide scaffolding
// ---------------------------------------------------------------------------
function SlideHeader({ eyebrow, title, lead, legend }) {
  return (
    <Stack
      direction="row"
      alignItems="flex-end"
      justifyContent="space-between"
      spacing={3}
      sx={{ mb: 2.6, flexWrap: 'wrap', rowGap: 1.6 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <ChapterEyebrow index={eyebrow.index} label={eyebrow.label} sx={{ mb: 1.2 }} />
        <Typography
          component="h1"
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            fontSize: { xs: 26, md: 34 },
            color: colors.textPrimary,
            mb: 1.2,
            textWrap: 'pretty',
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 1.55, color: colors.textSecondary, maxWidth: 700 }}>
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

const pickCardSx = (on) => ({
  boxSizing: 'border-box',
  borderRadius: '18px',
  px: 3.4,
  minHeight: { xs: 88, md: 106 },
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
        p: { xs: 3, md: '30px 34px 26px' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 2,
        minHeight: { md: 356 },
      }}
    >
      {children}
    </Box>
  );
}

function MeasureBar({ label, value, ink, fill, caption }) {
  return (
    <Box>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ ...type.monoLabel, color: ink }}>{label}</Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 28, lineHeight: 0.95, letterSpacing: '-0.04em', color: ink }}>
          {Math.round(value)}
        </Typography>
      </Stack>
      <Box sx={{ height: 14, borderRadius: radii.pill, bgcolor: colors.sand100, overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.round(value)}%`, height: '100%', borderRadius: radii.pill, bgcolor: fill, transition: 'width 280ms ease' }} />
      </Box>
      {caption && (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, mt: 1 }}>{caption}</Typography>
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
        fontSize: 16,
        lineHeight: 1.6,
        color: colors.textSecondary,
        borderTop: `1px solid ${colors.borderSoft}`,
        pt: 2.2,
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
        gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 400px) minmax(0, 1fr)' },
        gap: 3.4,
        alignItems: 'stretch',
      }}
    >
      <Stack spacing={2}>{left}</Stack>
      <Box>{right}</Box>
    </Box>
  );
}

function GapCells({ label, labelColor, you, team, gap }) {
  const cell = {
    fontFamily: fonts.mono,
    fontSize: 21,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    px: 3.4,
    py: 0.2,
  };
  const cap = { fontSize: '8.5px', letterSpacing: '0.14em', color: '#8a94a3' };
  return (
    <Stack direction="row" alignItems="baseline" sx={{ borderTop: `1px solid ${colors.borderSoft}`, py: 2 }}>
      <Typography sx={{ ...type.monoLabel, width: 110, flexShrink: 0, color: labelColor }}>{label}</Typography>
      <Typography sx={{ ...cell, pl: 0, color: colors.textSecondary }}>
        {you} <Box component="span" sx={cap}>YOU</Box>
      </Typography>
      <Typography sx={{ ...cell, borderLeft: `1px solid ${colors.borderSoft}`, color: colors.textPrimary }}>
        {team} <Box component="span" sx={cap}>TEAM</Box>
      </Typography>
      <Typography sx={{ ...cell, borderLeft: `1px solid ${colors.borderSoft}`, color: gapInk(gap) }}>
        {fmtGap(gap)} <Box component="span" sx={cap}>GAP</Box>
      </Typography>
    </Stack>
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

function MiniDial({ statement }) {
  const zone = dialZoneOf(statement.effort, statement.efficacy);
  const pos = circPos(statement.effort, statement.efficacy);
  const corners = [
    { text: 'HIGH EFFICACY', sx: { left: 0, top: 0 } },
    { text: 'HIGH EFFORT', sx: { right: 0, top: 0 } },
    { text: 'LOW EFFORT', sx: { left: 0, bottom: 0 } },
    { text: 'LOW EFFICACY', sx: { right: 0, bottom: 0 } },
  ];
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 420, aspectRatio: '1 / 1', mx: 'auto' }}>
      {corners.map((c) => (
        <Typography
          key={c.text}
          sx={{
            position: 'absolute',
            ...c.sx,
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.18em',
            whiteSpace: 'nowrap',
            color: '#8a94a3',
            pointerEvents: 'none',
          }}
        >
          {c.text}
        </Typography>
      ))}
      <Box
        sx={{
          position: 'absolute',
          inset: '18px',
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
              <path key={w.id} d={w.d} fill={w.id === zone.id ? w.vibrant : DIAL_VEIL} style={{ transition: 'fill 280ms ease' }} />
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
                fontWeight: z.id === zone.id ? 700 : 600,
                lineHeight: 1.3,
                maxWidth: 104,
                color: z.id === zone.id ? zone.faceInk : 'rgba(244, 236, 221, 0.6)',
                pointerEvents: 'none',
                transition: 'color 280ms ease',
              }}
            >
              {z.label}
            </Typography>
          ))}
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
          fontSize: { xs: 32, md: 48 },
          color: colors.textPrimary,
          mb: 2.4,
          textWrap: 'pretty',
        }}
      >
        {firstName ? `${firstName}, your` : 'Your'} team has reflected back.
      </Typography>
      <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.6, color: colors.textSecondary, maxWidth: 560, mx: 'auto', mb: { xs: 4, md: 7 } }}>
        {answered} What follows is their experience of your leadership — read it slowly, and hold it lightly. Patterns matter more than any one number.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${traits.length}, 1fr)` }, gap: { xs: 3, md: 0 }, justifyContent: 'center' }}>
        {traits.map((row) => (
          <Stack key={row.trait} alignItems="center" spacing={1.6}>
            <Typography sx={{ ...type.monoLabel, textAlign: 'center' }}>{row.subTrait || row.trait}</Typography>
            <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: { xs: 64, md: 88 }, lineHeight: 0.95, letterSpacing: '-0.04em', color: colors.orange }}>
              {Math.round(row.team.lepScore)}
            </Typography>
          </Stack>
        ))}
      </Box>
      <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, mt: 3.4 }}>
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
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 19, fontWeight: 600, lineHeight: 1.25, color: on ? '#fff' : colors.textPrimary }}>
                {row.subTrait || row.trait}
              </Typography>
              <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 32, letterSpacing: '-0.04em', color: on ? colors.amberSoft : colors.orange, flexShrink: 0 }}>
                {Math.round(row.team.lepScore)}
              </Typography>
            </Box>
          );
        })}
        right={
          <DetailCard>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 24, fontWeight: 600, color: colors.textPrimary }}>
                {d.subTrait || d.trait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em', color: colors.orange }}>
                  {Math.round(d.team.lepScore)}
                </Typography>
                <Typography sx={{ ...type.monoLabel }}>Compass &#183; the blend</Typography>
              </Stack>
            </Stack>
            <MeasureBar label="Effort" value={d.team.effort} ink={colors.orangeDeep} fill={colors.orange} caption={copy.effortCap} />
            <MeasureBar label="Efficacy" value={d.team.efficacy} ink={colors.navy500} fill={colors.navy500} caption={copy.efficacyCap} />
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
      sx={{ ...pickCardSx(on), flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 1 }}
    >
      <Typography sx={{ fontFamily: fonts.mono, fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: on ? 'rgba(244,206,161,0.75)' : '#8a94a3' }}>
        {trait}
      </Typography>
      <Typography sx={{ fontFamily: fonts.serif, fontSize: 16.5, lineHeight: 1.4, color: on ? '#fff' : colors.textPrimary }}>
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
            <Typography sx={{ fontFamily: fonts.serif, fontSize: 23, fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.015em', color: colors.textPrimary }}>
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

function SlideMap({ stmts, sel, onSel }) {
  const d = stmts[sel];
  return (
    <Box>
      <SlideHeader
        eyebrow={{ index: 4, label: 'The Map' }}
        title="Where a statement lands tells you what to do with it."
        lead="Effort and efficacy together give every statement a place on the compass — one of four zones, and the zone tells you the move. Select a statement to see where it sits."
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '420px minmax(0, 1fr)' }, gap: 4.5, alignItems: 'start' }}>
        <MiniDial statement={d} />
        <Box>
          <Typography sx={{ ...type.monoLabel, mb: 1.2 }}>Three statements &#183; one at a time</Typography>
          <Box sx={{ bgcolor: colors.surface1, border: `1.5px solid ${colors.borderSoft}`, borderRadius: radii.lg, overflow: 'hidden' }}>
            {stmts.map((s, i) => {
              const zone = dialZoneOf(s.effort, s.efficacy);
              if (sel === i) {
                return (
                  <Box key={s.text} sx={{ bgcolor: colors.navy900, p: '24px 28px 20px' }}>
                    <Box sx={{ mb: 1.8 }}>
                      <Box component="span" sx={{ fontFamily: fonts.serif, fontSize: 21, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.015em', color: '#fff' }}>
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
                  <Typography sx={{ fontFamily: fonts.serif, fontSize: 15, lineHeight: 1.35, color: colors.textPrimary }}>{s.text}</Typography>
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
        eyebrow={{ index: 5, label: 'The Perception Gap' }}
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
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 19, fontWeight: 600, lineHeight: 1.25, color: on ? '#fff' : colors.textPrimary }}>
                {row.subTrait || row.trait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 28, letterSpacing: '-0.03em', color: on ? gapLight(g) : gapInk(g) }}>
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
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 24, fontWeight: 600, color: colors.textPrimary }}>
                {d.subTrait || d.trait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em', color: gapInk(gap) }}>
                  {fmtGap(gap)}
                </Typography>
                <Typography sx={{ ...type.monoLabel }}>Compass gap</Typography>
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
        eyebrow={{ index: 6, label: 'The Perception Gap · Statements' }}
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
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 23, fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.015em', color: colors.textPrimary }}>
                &#8220;{d.text}&#8221;
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em', color: gapInk(gap) }}>
                  {fmtGap(gap)}
                </Typography>
                <Typography sx={{ ...type.monoLabel }}>Gap</Typography>
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
  const meta = ROLE_META[role];
  const copy = insightCopy(row, role);
  const zone = getQuadrant(row.team.effort, row.team.efficacy);
  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3} sx={{ mb: 3.4, flexWrap: 'wrap', rowGap: 1.4 }}>
        <ChapterEyebrow index={7 + index} label={`The Insights · ${index + 1} of ${traits.length}`} sx={{ mb: 0 }} />
        <Stack direction="row" alignItems="center" spacing={2.2}>
          {traits.map((t2, i) => {
            const here = i === index;
            const past = i < index;
            return (
              <Stack key={t2.trait} direction="row" alignItems="center" spacing={1} sx={{ opacity: here ? 1 : 0.45 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: radii.circle, bgcolor: here ? colors.orange : past ? colors.navy500 : colors.sand200 }} />
                <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: here ? colors.textPrimary : colors.textSecondary }}>
                  {t2.subTrait || t2.trait}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Stack>

      <Typography sx={{ ...type.monoLabel, color: meta.color, mb: 1.4 }}>{meta.eyebrow}</Typography>
      <Typography
        component="h1"
        sx={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          fontSize: { xs: 30, md: 42 },
          color: colors.textPrimary,
          mb: 2.8,
          textWrap: 'pretty',
        }}
      >
        {copy.headline}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={3.4} sx={{ mb: 3.4, flexWrap: 'wrap', rowGap: 1.6 }}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.04em', color: colors.orange }}>
            {Math.round(row.team.lepScore)}
          </Typography>
          <Typography sx={{ ...type.monoLabel }}>Compass</Typography>
        </Stack>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.3, py: 0.5, borderRadius: radii.pill, border: `1px solid ${zone.color}` }}>
          <Box sx={{ width: 7, height: 7, borderRadius: radii.circle, bgcolor: zone.color }} />
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: zone.color }}>
            {zone.label}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 26, lineHeight: 0.95, letterSpacing: '-0.03em', color: colors.orange }}>
            {Math.round(row.team.effort)}
          </Typography>
          <Typography sx={{ ...type.monoLabel }}>Effort</Typography>
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 26, lineHeight: 0.95, letterSpacing: '-0.03em', color: colors.navy500 }}>
            {Math.round(row.team.efficacy)}
          </Typography>
          <Typography sx={{ ...type.monoLabel }}>Efficacy</Typography>
        </Stack>
      </Stack>

      <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 19, lineHeight: 1.65, color: colors.textPrimary, mb: 2.2, maxWidth: 780, textWrap: 'pretty' }}>
        {copy.serif}
      </Typography>
      <Typography sx={{ fontFamily: fonts.sans, fontSize: 15.5, lineHeight: 1.65, color: colors.textSecondary, maxWidth: 780, textWrap: 'pretty' }}>
        {copy.sans}
      </Typography>
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
const SLIDE_COUNT = 9;

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
  const [selMap, setSelMap] = useState(0);
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
      { id: 'map', label: 'The Map' },
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
          When the listening window closes, this is where the first reading gets told &#8212; nine short pages, at your pace.
        </Typography>
      </Box>
    );
  }

  const measureSel = selMeasure == null ? edgeIdx : selMeasure;
  const mirrorSel = selMirror == null ? edgeIdx : selMirror;
  const mirrorTraits = traits.filter((r) => r.self);
  const mirrorSelSafe = Math.min(mirrorSel, Math.max(mirrorTraits.length - 1, 0));
  const stmtSel = Math.min(selStmt, Math.max(stmts.length - 1, 0));
  const mapSel = Math.min(selMap, Math.max(stmts.length - 1, 0));
  const gapStmtSel = Math.min(selGapStmt, Math.max(stmts.length - 1, 0));

  // Pages that need self data fall back gracefully when it's absent.
  const showMirror = hasSelfData && mirrorTraits.length > 0;

  const renderSlide = () => {
    switch (chapters[idx].id) {
      case 'measurements':
        return <SlideMeasurements traits={traits} sel={Math.min(measureSel, traits.length - 1)} onSel={setSelMeasure} />;
      case 'statements':
        return stmts.length
          ? <SlideStatements stmts={stmts} sel={stmtSel} onSel={setSelStmt} />
          : <SlideInsight traits={traits} index={0} roles={roles} />;
      case 'map':
        return stmts.length
          ? <SlideMap stmts={stmts} sel={mapSel} onSel={setSelMap} />
          : <SlideInsight traits={traits} index={0} roles={roles} />;
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
        py: { xs: 1.5, md: 2 },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', overflowY: 'auto' }}>
        <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
          {renderSlide()}
        </WalkthroughStage>
      </Box>
      <Stack alignItems="center" sx={{ pt: 1.6, pb: 0.6, flexShrink: 0 }}>
        <ProgressDots chapters={chapters} current={idx} onJump={setIdx} />
      </Stack>
    </Box>
  );
}
