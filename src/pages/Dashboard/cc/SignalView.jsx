import React, { useEffect, useMemo, useState } from 'react';
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material';
import StatTable from '../../../components/StatTable';
import { buttons, chips, colors, fonts, motion, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { getQuadrant } from './quadrants.js';

const STAT_COLUMNS = [
  { key: 'efficacy', label: 'Efficacy' },
  { key: 'effort', label: 'Effort' },
  { key: 'compass', label: 'Compass', highlight: true },
];
import { useGuideInsight } from './guideInsight.js';
import { useGuide } from '../../../context/GuideContext';
import TraitQuadrant from './TraitQuadrant.jsx';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// ----------------------------------------------------------------------------
// Local interpretive helpers
// ----------------------------------------------------------------------------
function pickPrimaryTrait(rows) {
  const withTeam = rows.filter((r) => r.team);
  if (!withTeam.length) return null;
  return [...withTeam].sort((a, b) => {
    if (Math.abs(b.team.delta) !== Math.abs(a.team.delta)) {
      return Math.abs(b.team.delta) - Math.abs(a.team.delta);
    }
    return a.team.lepScore - b.team.lepScore;
  })[0];
}

function pickLifting(rows) {
  const withTeam = rows.filter((r) => r.team);
  if (!withTeam.length) return null;
  return [...withTeam].sort((a, b) => {
    const aLift = a.team.efficacy - a.team.effort;
    const bLift = b.team.efficacy - b.team.effort;
    if (bLift !== aLift) return bLift - aLift;
    return b.team.lepScore - a.team.lepScore;
  })[0];
}

function pickPulling(rows) {
  const withTeam = rows.filter((r) => r.team);
  if (!withTeam.length) return null;
  return [...withTeam].sort((a, b) => {
    const aPull = a.team.efficacy - a.team.effort;
    const bPull = b.team.efficacy - b.team.effort;
    if (aPull !== bPull) return aPull - bPull;
    return a.team.lepScore - b.team.lepScore;
  })[0];
}

function interpretLead(focus) {
  if (!focus?.team) return 'The campaign is still listening.';
  const { team, subTrait, trait } = focus;
  const e = Math.round(team.efficacy);
  const f = Math.round(team.effort);
  const label = subTrait || trait;
  if (Math.abs(team.delta) >= 18 && team.effort > team.efficacy) {
    return `Your team feels the effort in ${label}, but not yet the impact.`;
  }
  if (Math.abs(team.delta) >= 18 && team.efficacy > team.effort) {
    return `In ${label}, your team feels the result more than the labor — a quiet strength.`;
  }
  if (e >= 70 && f >= 70) return `${label} is landing — both the work and the outcome are felt.`;
  if (e < 50 && f < 50) return `${label} is asking for attention — neither effort nor impact is being felt.`;
  return `${label} is your closest edge — the signal is steady, not loud.`;
}

function interpretFocus(focus, hasSelfData) {
  if (!focus?.team) return '';
  const { team, self, subTrait, trait } = focus;
  const label = subTrait || trait;
  const tEff = Math.round(team.efficacy);
  const tEffort = Math.round(team.effort);
  const teamGap = team.efficacy - team.effort;

  let first;
  if (teamGap <= -15) {
    first = `Your team is carrying weight here that they aren't feeling rewarded for. ${label} is reading as cost without enough return.`;
  } else if (teamGap >= 15) {
    first = `Your team is feeling the result of ${label} more than the labor. The work isn't loud, but it's landing.`;
  } else if (tEff >= 70 && tEffort >= 70) {
    first = `Your team feels both the work and the outcome in ${label}. It's a heavy lift — and it's paying off.`;
  } else if (tEff < 50 && tEffort < 50) {
    first = `${label} is quiet. Neither the effort nor the impact is being felt — attention hasn't landed here yet.`;
  } else {
    first = `${label} is steady. The team feels the work and the result roughly in balance.`;
  }

  let second = '';
  if (hasSelfData && self) {
    const eGap = Math.round(self.efficacy - team.efficacy);
    const fGap = Math.round(self.effort - team.effort);
    const big = Math.max(Math.abs(eGap), Math.abs(fGap));
    if (big >= 15) {
      if (Math.abs(eGap) >= Math.abs(fGap)) {
        second =
          eGap > 0
            ? ` You see more impact than the team is reflecting back — worth listening for what they aren't yet feeling.`
            : ` The team is seeing more impact than you give yourself credit for.`;
      } else {
        second =
          fGap > 0
            ? ` You're feeling the strain more than the team sees — name the cost out loud.`
            : ` The team feels the strain more than you do; their effort is asking to be acknowledged.`;
      }
    } else {
      second = ` Your read and theirs are close — the picture is shared.`;
    }
  }
  return first + second;
}

function buildStatRows(focus) {
  if (!focus?.team) return [];
  const fmtGap = (n) => (n == null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`);
  const teamCompass = Math.round(focus.team.lepScore);
  return [
    {
      key: 'team',
      label: 'Team',
      efficacy: focus.team.efficacy,
      effort: focus.team.effort,
      compass: teamCompass,
      color: colors.navy900,
    },
    ...(focus.self
      ? [
          {
            key: 'self',
            label: 'Self',
            efficacy: focus.self.efficacy,
            effort: focus.self.effort,
            compass: Math.round(focus.self.lepScore),
            color: colors.orange,
          },
          {
            key: 'gap',
            label: 'Gap',
            efficacy: fmtGap(Math.round(focus.self.efficacy - focus.team.efficacy)),
            effort: fmtGap(Math.round(focus.self.effort - focus.team.effort)),
            compass: fmtGap(Math.round(focus.self.lepScore - focus.team.lepScore)),
            color: colors.textSecondary,
          },
        ]
      : []),
  ];
}

// Self-vs-team relationship in one sentence.
function gapSentence(focus) {
  if (!focus?.self || !focus?.team) return '';
  const eGap = Math.round(focus.self.efficacy - focus.team.efficacy);
  const fGap = Math.round(focus.self.effort - focus.team.effort);
  if (Math.max(Math.abs(eGap), Math.abs(fGap)) < 12) {
    return 'Your read and your team’s are close — that shared picture is something to trust.';
  }
  if (Math.abs(eGap) >= Math.abs(fGap)) {
    return eGap > 0
      ? 'You feel more is landing here than your team is reflecting back — worth getting curious about what they aren’t yet feeling.'
      : 'Your team feels more is landing than you give yourself credit for — let that land.';
  }
  return fGap > 0
    ? 'You’re carrying more effort than they can see — it’s okay to name that cost out loud.'
    : 'Your team feels the effort more than you do — their read is asking to be acknowledged.';
}

// A concise narrative for the guide, plus FAQ items that expand on demand.
function buildGuide(focus, hasSelfData, insight) {
  if (!focus?.team) {
    return { text: 'Take your time — we’ll read this together once the signal lands.', faq: [] };
  }
  const label = focus.subTrait || focus.trait;
  const zone = getQuadrant(focus.team.effort, focus.team.efficacy);
  const text = `${label} reads as “${zone.label}” — ${zone.short}`;

  const faq = [
    { q: `What does “${zone.label}” mean?`, a: zone.meaning },
    { q: 'What should I do about it?', a: zone.stance },
  ];
  if (hasSelfData && focus.self) {
    faq.push({ q: 'How do my read and my team’s compare?', a: gapSentence(focus) });
  }
  if (insight) faq.push({ q: 'Anything else worth noticing?', a: insight });
  return { text, faq };
}

const EFFICACY_EXPLAIN =
  'Efficacy is the vertical axis — how well your team feels you’re meeting their needs in a trait. The higher a dot sits, the more your results are landing for them. With this view on, compare how your traits stack from bottom to top.';
const EFFORT_EXPLAIN =
  'Effort is the horizontal axis — how intentional and attentive you are in a trait. The further right a dot sits, the more deliberate energy you’re putting in. With this view on, see how your traits spread from left to right.';

// ----------------------------------------------------------------------------
// Reading rail components
// ----------------------------------------------------------------------------
const eyebrow = (color) => ({
  fontFamily: fonts.mono,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color,
});

function QuadrantChip({ zone }) {
  return (
    <Tooltip
      arrow
      placement="top"
      title={
        <Box sx={{ p: 0.4 }}>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, mb: 0.5 }}>{zone.label}</Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.5, mb: 0.6 }}>{zone.meaning}</Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', opacity: 0.92 }}>{zone.stance}</Typography>
        </Box>
      }
      slotProps={{ tooltip: { sx: { maxWidth: 280, p: 1.2 } } }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px: 1,
          py: 0.4,
          borderRadius: 999,
          border: `1px solid ${zone.color}`,
          bgcolor: 'transparent',
          cursor: 'help',
        }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: zone.color, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: zone.color }}>
          {zone.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function AssessSnapshot({ dotColor, label, metric, t }) {
  const zone = metric ? getQuadrant(metric.effort, metric.efficacy) : null;
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ flexWrap: 'wrap', rowGap: 0.6 }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700, color: t.ink }}>{label}</Typography>
      </Stack>
      {zone ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <QuadrantChip zone={zone} />
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: t.inkSoft }}>
            Compass {Math.round(metric.lepScore)}
          </Typography>
        </Stack>
      ) : (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, fontStyle: 'italic', color: t.inkSoft }}>
          Not yet rated
        </Typography>
      )}
    </Stack>
  );
}

function FocusReadout({ focus, t }) {
  if (!focus?.team) return null;
  const label = focus.subTrait || focus.trait;

  return (
    <Box>
      <Typography sx={{ ...eyebrow(t.accentDeep), mb: 1.4 }}>Focus · {label}</Typography>
      <Stack spacing={1.4}>
        <AssessSnapshot dotColor={colors.orange} label="Self Assess" metric={focus.self} t={t} />
        <AssessSnapshot dotColor={colors.navy900} label="Team Assess" metric={focus.team} t={t} />
      </Stack>
    </Box>
  );
}

function ReadingRow({ eyebrow: eyebrowText, label, body, color, t }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.9} sx={{ mb: 0.5 }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography sx={eyebrow(color)}>{eyebrowText}</Typography>
      </Stack>
      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontSize: 16,
          fontStyle: 'italic',
          fontWeight: 600,
          color: t.ink,
          mb: 0.3,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, color: t.inkSoft, lineHeight: 1.45 }}>
        {body}
      </Typography>
    </Box>
  );
}

function liftingBlurb(row) {
  if (!row?.team) return '';
  const label = row.subTrait || row.trait;
  return `${label} is feeling like a strength. The work feels light here, and the result is landing.`;
}

function pullingBlurb(row) {
  if (!row?.team) return '';
  const label = row.subTrait || row.trait;
  const gap = row.team.efficacy - row.team.effort;
  if (gap <= -15) {
    return `${label} is asking more than it's giving back. Worth a closer look at what's costing the team here.`;
  }
  if (row.team.effort >= 70 && row.team.efficacy >= 70) {
    return `${label} is a heavy lift — high return, but at a real cost. Make sure the cost is being acknowledged.`;
  }
  return `${label} is the closest edge — small shifts could move the read.`;
}

// ----------------------------------------------------------------------------
// Trait chips
// ----------------------------------------------------------------------------
function TraitChipRow({ rows, focusKey, onFocus, t }) {
  const sorted = useMemo(() => {
    return [...rows]
      .filter((r) => r.team)
      .sort((a, b) => Math.abs(b.team.delta) - Math.abs(a.team.delta));
  }, [rows]);

  if (!sorted.length) return null;

  return (
    <Box>
      <Typography sx={{ ...eyebrow(t.inkFaint), textAlign: 'center', mb: 1 }}>Select a trait</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ rowGap: 1 }}>
        {sorted.map((row) => {
          const isActive = row.trait === focusKey;
          const label = row.subTrait || row.trait;
          return (
            <Box
              key={row.trait}
              component="button"
              type="button"
              onClick={() => onFocus(row.trait)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                ...chips.base,
                ...chips.hover,
                px: 1.9,
                py: 0.95,
                height: 'auto',
                fontFamily: fonts.sans,
                fontSize: 13.5,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '0.02em',
                textTransform: 'none',
                color: isActive ? colors.amberSoft : t.inkSoft,
                bgcolor: isActive ? colors.navy900 : 'transparent',
                borderColor: isActive ? colors.navy900 : colors.borderSoft,
                boxShadow: isActive ? shadows.card : 'none',
                transition: motion.standard,
                '&:hover': isActive ? {} : { color: t.ink, borderColor: t.inkSoft },
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              {label}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------------
export default function SignalView({ t, selectedAgent, onOpenPractice }) {
  const { loaded, rows, hasSelfData, selfDataSource } = useBenchmarkData();
  const intakeData = useMemo(() => readJson('latestFormData', null), []);
  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const { setPageMessage, clearPageMessage } = useGuide();

  const [focusKey, setFocusKey] = useState(null);
  const [axisMode, setAxisMode] = useState(null);
  useEffect(() => {
    if (!focusKey && rows.length) {
      const primary = pickPrimaryTrait(rows);
      if (primary) setFocusKey(primary.trait);
    }
  }, [rows, focusKey]);

  const focusRow = rows.find((r) => r.trait === focusKey) || pickPrimaryTrait(rows) || null;
  const liftingRow = pickLifting(rows);
  const pullingRow = pickPulling(rows);

  const { insight, loading } = useGuideInsight({
    view: 'compass',
    rows,
    focusRow,
    hasSelfData,
    selectedAgent,
    intakeData,
  });

  const firstName = String(userInfo?.name || '').split(/\s+/)[0] || '';

  // The guide carries the holistic narrative by default; when the user isolates
  // an axis, it explains that axis instead.
  useEffect(() => {
    if (axisMode === 'efficacy') {
      setPageMessage({ text: EFFICACY_EXPLAIN, pose: 'read', eyebrow: 'Efficacy' });
      return;
    }
    if (axisMode === 'effort') {
      setPageMessage({ text: EFFORT_EXPLAIN, pose: 'read', eyebrow: 'Effort' });
      return;
    }
    if (!focusRow?.team) return;
    const detail = insight && !loading ? insight : '';
    const guide = buildGuide(focusRow, hasSelfData, detail);
    setPageMessage({
      text: guide.text,
      faq: guide.faq,
      pose: 'map',
      eyebrow: focusRow.subTrait || focusRow.trait,
    });
  }, [focusRow?.trait, axisMode, insight, loading, hasSelfData, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  if (!loaded && !rows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.sectionTitle, fontSize: 22, color: t.inkSoft }}>
          Loading the signal…
        </Typography>
      </Box>
    );
  }

  if (!rows.some((r) => r.team)) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...eyebrow(t.accentDeep), mb: 1.6 }}>The Signal</Typography>
        <Typography sx={{ ...type.lead, fontSize: { xs: 24, md: 28 }, color: t.ink, lineHeight: 1.25, mb: 1.4 }}>
          The campaign is still listening.
        </Typography>
        <Typography sx={{ ...type.italicBody, fontSize: 16, color: t.inkSoft, maxWidth: 600 }}>
          When the listening window closes, this page will hold what your team is reflecting back.
        </Typography>
      </Box>
    );
  }

  const showLifting = liftingRow && liftingRow.trait !== focusRow?.trait;
  const showPulling = pullingRow && pullingRow.trait !== focusRow?.trait && pullingRow.trait !== liftingRow?.trait;

  const statRows = buildStatRows(focusRow);

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, pt: 2.2, pb: 4 }}>
      {/* Compact header */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ ...eyebrow(t.accentDeep), mb: 0.4 }}>
          The Signal{firstName ? ` · ${firstName}` : ''}
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontSize: { xs: 24, md: 30 },
            letterSpacing: '-0.02em',
            color: t.ink,
            lineHeight: 1.15,
            fontWeight: 500,
          }}
        >
          What your team is reflecting back
        </Typography>
      </Box>

      {/* Two-column composition */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 480px' },
          gap: { xs: 2.4, md: 4 },
          alignItems: 'start',
        }}
      >
        {/* Left column — the quadrant hero in one calm card */}
        <Box sx={{ ...surfaces.card, p: { xs: 2, md: 2.6 } }}>
          <TraitQuadrant
            rows={rows}
            t={t}
            hasSelfData={hasSelfData}
            selfDataSource={selfDataSource}
            highlightTraitKey={focusRow?.trait}
            onPointClick={(traitKey) => setFocusKey(traitKey)}
            axisMode={axisMode}
            onAxisModeChange={setAxisMode}
            size={640}
          />
        </Box>

        {/* Right column — controls + numbers + meaning, one cohesive panel */}
        <Box sx={{ ...surfaces.card, p: { xs: 2.2, md: 2.6 } }}>
          <TraitChipRow rows={rows} focusKey={focusRow?.trait} onFocus={setFocusKey} t={t} />

          <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />

          <StatTable columns={STAT_COLUMNS} rows={statRows} sx={{ mb: 2 }} />

          <FocusReadout focus={focusRow} t={t} />

          {(showLifting || showPulling) && (
            <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />
          )}
          <Stack spacing={1.8}>
            {showLifting && (
              <ReadingRow
                eyebrow="What's lifting"
                label={liftingRow.subTrait || liftingRow.trait}
                body={liftingBlurb(liftingRow)}
                color={colors.green}
                t={t}
              />
            )}
            {showPulling && (
              <ReadingRow
                eyebrow="What's pulling"
                label={pullingRow.subTrait || pullingRow.trait}
                body={pullingBlurb(pullingRow)}
                color={t.accentDeep}
                t={t}
              />
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
