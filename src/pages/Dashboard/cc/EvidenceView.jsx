import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { colors, fonts, motion, radii, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { useGuide } from '../../../context/GuideContext';
import EvidenceQuadrant from './EvidenceQuadrant.jsx';
import {
  ChapterEyebrow,
  Headline,
  PageFade,
  Prose,
  SnapshotShell,
  WalkthroughStage,
} from './debriefUi.jsx';
import { deriveTraitRoles } from './debriefContent.js';
import traitSystem from '../../../data/traitSystem.js';

// ---------------------------------------------------------------------------
// 01 · Opening the room
// ---------------------------------------------------------------------------
function EvIntroPage({ rows, respondents }) {
  const totalStatements = rows.length * 5;
  const stats = [
    ...(respondents > 0 ? [{ n: respondents, label: 'Teammates heard' }] : []),
    { n: totalStatements, label: 'Statements rated' },
    { n: rows.length, label: 'Traits measured' },
  ];
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 660, mx: 'auto' }}>
      <ChapterEyebrow index={1} label="The Evidence" />
      <Headline size="xl">Now, the receipts.</Headline>
      <Prose serif sx={{ mx: 'auto', maxWidth: 560 }}>
        The signal told you a story. This room holds what the story is made of — sourced, not
        stylized. Read each statement in your team's words before drawing a conclusion.
      </Prose>
      <Stack direction="row" justifyContent="center" spacing={4.5} sx={{ mt: 4.2, flexWrap: 'wrap', rowGap: 2 }}>
        {stats.map((s) => (
          <Box key={s.label} sx={{ minWidth: 120 }}>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontWeight: 600,
                fontSize: 54,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                color: colors.textPrimary,
              }}
            >
              {s.n}
            </Typography>
            <Typography sx={{ ...type.monoLabel, mt: 1 }}>{s.label}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function mapRowStatements(row) {
  const fallbackText = fallbackStatementsForRow(row);
  const teamStatements = row?.team?.statements || [];
  const selfStatements = row?.self?.statements || [];
  return Array.from({ length: 5 }, (_, i) => {
    const s = teamStatements[i] || {};
    const self = selfStatements[i] || {};
    return {
      text: String(s.text || '').trim() || fallbackText[i] || `Statement ${i + 1}`,
      effort: Math.round(Number(s.effort) || 0),
      efficacy: Math.round(Number(s.efficacy) || 0),
      effortSelf: Math.round(Number(self.effort) || Number(s.effort) || 0),
      efficacySelf: Math.round(Number(self.efficacy) || Number(s.efficacy) || 0),
      compass: Math.round(Number(s.lepScore) || 0),
    };
  });
}

function fallbackStatementsForRow(row) {
  const traits = traitSystem?.CORE_TRAITS || [];
  const norm = (v) => String(v || '').trim().toLowerCase();
  const trait = traits.find((t) => t.id === row?.traitId || norm(t.name) === norm(row?.trait));
  const subTrait = trait?.subTraits?.find((s) => s.id === row?.subTraitId || norm(s.name) === norm(row?.subTrait));
  if (!subTrait) return [];
  const risk = subTrait.riskSignals || {};
  return [
    ...(Array.isArray(subTrait.strengthSignals) ? subTrait.strengthSignals : []),
    ...(Array.isArray(risk.underuse) ? risk.underuse : []),
    ...(Array.isArray(risk.overuse) ? risk.overuse : []),
    ...(Array.isArray(risk.imbalance) ? risk.imbalance : []),
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

function MetricBlock({ label, team, self }) {
  const gap = Math.round(self - team);
  const gapAlert = Math.abs(gap) >= 15;
  return (
    <Box>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(244,206,161,0.7)',
          mb: '8px',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '34px 1fr 26px', alignItems: 'center', gap: '9px', mb: '9px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,206,161,0.6)' }}>
          TEAM
        </Typography>
        <Box sx={{ height: '7px', borderRadius: radii.pill, bgcolor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <Box sx={{ width: `${Math.max(0, Math.min(100, team))}%`, height: '100%', bgcolor: colors.navy300 }} />
        </Box>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: colors.amberSoft, textAlign: 'right' }}>
          {team}
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '34px 1fr 26px', alignItems: 'center', gap: '9px', mb: '9px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,206,161,0.6)' }}>
          SELF
        </Typography>
        <Box sx={{ height: '7px', borderRadius: radii.pill, bgcolor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <Box sx={{ width: `${Math.max(0, Math.min(100, self))}%`, height: '100%', bgcolor: colors.orange }} />
        </Box>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: colors.amberSoft, textAlign: 'right' }}>
          {self}
        </Typography>
      </Box>
      <Box
        sx={{
          mt: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          px: '9px',
          py: '3px',
          borderRadius: radii.pill,
          border: `1px solid ${gapAlert ? colors.orange : 'rgba(244,206,161,0.35)'}`,
          color: gapAlert ? colors.orange : 'rgba(244,206,161,0.75)',
          fontFamily: fonts.mono,
          fontSize: 8.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Gap {gap > 0 ? `+${gap}` : gap}
      </Box>
    </Box>
  );
}

function StageStatementRow({ statement, selected, isLowest, onSelect }) {
  return (
    <Box
      component="button"
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        boxSizing: 'border-box',
        width: '100%',
        // One expanded card (~2× the old equal share); collapsed cards hug the score row
        flex: selected ? '2.4 1 0' : '0.7 1 0',
        minHeight: selected ? 0 : 44,
        borderRadius: radii.md,
        border: 'none',
        bgcolor: selected ? colors.navy900 : colors.surface1,
        color: selected ? colors.amberSoft : colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: selected ? 'flex-start' : 'center',
        overflow: 'hidden',
        boxShadow: selected
          ? '0 10px 28px rgba(16,34,60,0.22)'
          : '0 4px 16px rgba(15,28,46,0.08)',
        transition: motion.standard,
        '&:hover': { transform: 'translateY(-1px)' },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '42px 1fr',
          gap: '12px',
          alignItems: 'center',
          px: '16px',
          py: selected ? '12px' : '8px',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: selected ? 18 : 16,
            fontWeight: 700,
            lineHeight: 1.1,
            color: selected ? colors.amber : colors.textPrimary,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center',
          }}
        >
          {statement.compass}
        </Typography>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: fonts.sans,
              fontSize: selected ? 13.75 : 12.5,
              lineHeight: selected ? 1.35 : 1.3,
              color: selected ? colors.amberSoft : colors.textPrimary,
              ...(selected
                ? {}
                : {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }),
            }}
          >
            {statement.text}
            {isLowest && (
              <Box
                component="span"
                sx={{
                  ml: '8px',
                  display: 'inline-flex',
                  px: '7px',
                  py: '1.5px',
                  borderRadius: radii.pill,
                  border: `1px solid ${selected ? colors.amber : colors.orangeDeep}`,
                  color: selected ? colors.amber : colors.orangeDeep,
                  fontFamily: fonts.mono,
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  verticalAlign: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                LOWEST
              </Box>
            )}
          </Typography>
        </Box>
      </Box>

      {selected && (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: '1px', flexShrink: 0, bgcolor: 'rgba(244,206,161,0.22)' }} />
          <Box sx={{ px: '14px', pt: '10px', pb: '12px', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', width: '100%' }}>
              <MetricBlock label="EFFORT" team={statement.effort} self={statement.effortSelf} />
              <MetricBlock label="EFFICACY" team={statement.efficacy} self={statement.efficacySelf} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function TraitSwitcher({ title }) {
  return (
    <Box sx={{ minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography
        sx={{
          textAlign: 'center',
          fontFamily: fonts.serif,
          fontSize: 25,
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: colors.textPrimary,
          maxWidth: '100%',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ mt: 1.05, width: '68%', mx: 'auto', height: '1px', bgcolor: colors.sand200 }} />
    </Box>
  );
}

function ModeBar({ mode, onModeChange }) {
  const modes = [
    { id: 'efficacy', label: 'Efficacy' },
    { id: 'map', label: 'Map' },
    { id: 'effort', label: 'Effort' },
  ];
  return (
    <Box
      sx={{
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
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
            onClick={() => onModeChange?.(item.id)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              minWidth: 96,
              height: 34,
              px: '12px',
              borderRadius: radii.pill,
              border: `1px solid ${active ? colors.navy900 : colors.sand300}`,
              bgcolor: active ? colors.navy900 : colors.surface1,
              color: active ? colors.amberSoft : colors.navy900,
              fontFamily: fonts.mono,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: '34px',
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            {item.label}
          </Box>
        );
      })}
    </Box>
  );
}

function StagePanels({ row, selected, onSelect, mode, onModeChange, headerSlot = null }) {
  const statements = useMemo(() => mapRowStatements(row), [row]);
  const lowestIdx = useMemo(() => {
    if (!statements.length) return 0;
    let minIdx = 0;
    statements.forEach((s, i) => {
      if (s.compass < statements[minIdx].compass) minIdx = i;
    });
    return minIdx;
  }, [statements]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto auto',
        columnGap: '16px',
        rowGap: { xs: '10px', md: '0px' },
        '@media (min-width:820px)': {
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
      }}
    >
      {/* Row 1: trait switcher | mode buttons — same band */}
      <Box sx={{ gridColumn: { md: 1 }, gridRow: { md: 1 }, mb: { md: 0.75 } }}>
        {headerSlot}
      </Box>
      <Box sx={{ gridColumn: { md: 2 }, gridRow: { md: 1 }, mb: { md: 0.75 } }}>
        <ModeBar mode={mode} onModeChange={onModeChange} />
      </Box>

      {/* Row 2: statements | map — sit a little above the inner map square so the page doesn't need a nudge-scroll */}
      <Box
        sx={{
          gridColumn: { md: 1 },
          gridRow: { md: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          '@media (min-width:820px)': {
            aspectRatio: '1 / 1',
            // Was PAD/VIEW (40/560). Pull the stack up ~24px while keeping the bottom aligned.
            pt: `${(16 / 560) * 100}%`,
            pb: `${(40 / 560) * 100}%`,
          },
        }}
      >
        {statements.map((statement, idx) => (
          <StageStatementRow
            key={`${row.trait}-${idx}`}
            statement={statement}
            selected={idx === selected}
            isLowest={idx === lowestIdx}
            onSelect={() => onSelect(idx)}
          />
        ))}
      </Box>

      <Box
        sx={{
          gridColumn: { md: 2 },
          gridRow: { md: 2 },
          '@media (min-width:820px)': { aspectRatio: '1 / 1' },
        }}
      >
        <EvidenceQuadrant
          statements={statements}
          selectedIdx={selected}
          onSelect={onSelect}
          mode={mode}
          onModeChange={onModeChange}
          showModeBar={false}
        />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trait exhibit chapter — same explorer format as Evidence snapshot
// ---------------------------------------------------------------------------
function EvTraitPage({ row }) {
  const lowestIdx = useMemo(() => {
    const statements = mapRowStatements(row);
    if (!statements.length) return 0;
    let minIdx = 0;
    statements.forEach((s, i) => {
      if (s.compass < statements[minIdx].compass) minIdx = i;
    });
    return minIdx;
  }, [row]);
  const [selected, setSelected] = useState(lowestIdx);
  const [mode, setMode] = useState('map');

  useEffect(() => {
    setSelected(lowestIdx);
    setMode('map');
  }, [lowestIdx, row]);

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <StagePanels
        row={row}
        selected={selected}
        onSelect={setSelected}
        mode={mode}
        onModeChange={setMode}
        headerSlot={(
          <TraitSwitcher title={row.subTrait || row.trait} />
        )}
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Recap card — shared by The Floor and The Gaps.
// [ big number ] [ stacked stats ] | [ trait name + statement, the focus ]
// ---------------------------------------------------------------------------
function EvRecapCard({ number, numberLabel, numberColor, stats, trait, quote }) {
  return (
    <Box sx={{ ...surfaces.card, px: 3, py: 2.25, display: 'flex', alignItems: 'center', gap: 2.75 }}>
      <Box sx={{ textAlign: 'center', minWidth: 82, flexShrink: 0 }}>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 600,
            fontSize: 46,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: numberColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {number}
        </Typography>
        <Typography sx={{ ...type.monoLabel, mt: 0.5 }}>{numberLabel}</Typography>
      </Box>
      <Stack spacing={1.1} sx={{ minWidth: 76, flexShrink: 0 }}>
        {stats.map((st) => (
          <Box key={st.label}>
            <Typography sx={{ ...type.monoLabel, mb: '1px' }}>{st.label}</Typography>
            <Typography
              sx={{
                fontFamily: fonts.mono,
                fontSize: 15,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: st.color || colors.textPrimary,
              }}
            >
              {st.value}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: colors.sand200, flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: fonts.serif, fontSize: 19, fontWeight: 600, color: colors.textPrimary, mb: 0.6 }}>
          {trait}
        </Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.45, color: colors.textPrimary, textWrap: 'pretty' }}>
          “{quote}”
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The Floor — the lowest statement Compass scores across all traits
// ---------------------------------------------------------------------------
function EvFloorPage({ rows, chapterIndex }) {
  const all = [];
  rows.forEach((r) => {
    (r.team?.statements || []).forEach((s) => {
      all.push({
        trait: r.subTrait || r.trait,
        text: s.text,
        efficacy: Math.round(s.efficacy),
        effort: Math.round(s.effort),
        compass: Math.round(s.lepScore),
      });
    });
  });
  const lowest = all.sort((a, b) => a.compass - b.compass).slice(0, 3);

  return (
    <Box sx={{ maxWidth: 780, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <ChapterEyebrow index={chapterIndex} label="The Floor" />
        <Headline>The three statements asking loudest.</Headline>
        <Prose serif sx={{ mx: 'auto', maxWidth: 560 }}>
          Of all {all.length} statements, these carry the lowest Compass scores. Not a list of
          failures — a ranked list of where one changed behavior would be felt first.
        </Prose>
      </Box>
      <Stack spacing={1.5}>
        {lowest.map((s, i) => (
          <EvRecapCard
            key={i}
            number={s.compass}
            numberLabel="Compass"
            numberColor={colors.orange}
            stats={[
              { label: 'Efficacy', value: s.efficacy, color: colors.green },
              { label: 'Effort', value: s.effort, color: colors.orangeDeep },
            ]}
            trait={s.trait}
            quote={s.text}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The Gaps — biggest self-vs-team distances across every statement
// ---------------------------------------------------------------------------
function EvGapsPage({ rows, chapterIndex }) {
  const gaps = [];
  rows.forEach((r) => {
    if (!r.self) return;
    (r.team?.statements || []).forEach((s, i) => {
      const self = r.self.statements[i];
      if (!self) return;
      gaps.push({
        trait: r.subTrait || r.trait,
        text: s.text,
        teamScore: Math.round(s.lepScore),
        selfScore: Math.round(self.lepScore),
        gap: Math.round(self.lepScore - s.lepScore),
      });
    });
  });
  const top = [...gaps].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 3);

  return (
    <Box sx={{ maxWidth: 780, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <ChapterEyebrow index={chapterIndex} label="The Gaps" />
        <Headline>Where your read and theirs part ways.</Headline>
        <Prose serif sx={{ mx: 'auto', maxWidth: 560 }}>
          Across all {gaps.length} statements, these three carry the widest distance between what
          you rated and what your team felt. Each is a conversation waiting to happen.
        </Prose>
      </Box>
      <Stack spacing={1.5}>
        {top.map((g, i) => (
          <EvRecapCard
            key={i}
            number={g.gap > 0 ? `+${g.gap}` : g.gap}
            numberLabel="Gap"
            numberColor={g.gap > 0 ? colors.orange : colors.green}
            stats={[
              { label: 'You felt', value: g.selfScore, color: colors.orangeDeep },
              { label: 'They felt', value: g.teamScore, color: colors.textPrimary },
            ]}
            trait={g.trait}
            quote={g.text}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Evidence close — the single door to Practice
// ---------------------------------------------------------------------------
function EvClosePage({ chapterIndex, onAdvancePhase }) {
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
      <ChapterEyebrow index={chapterIndex} label="Evidence, read" />
      <Headline>You've seen what the signal is made of.</Headline>
      <Prose serif sx={{ mx: 'auto', maxWidth: 540 }}>
        The story and the receipts now agree — or you know exactly where they don't. Either way,
        you're standing on verified ground. That's the only place practice should start from.
      </Prose>
      <Stack direction="row" justifyContent="center" sx={{ mt: 3.75 }}>
        <Box
          component="button"
          type="button"
          onClick={onAdvancePhase}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            boxSizing: 'border-box',
            ...surfaces.card,
            px: 3.75,
            py: 3,
            border: `1.5px solid ${colors.orange}`,
            background: 'linear-gradient(150deg, color-mix(in srgb, var(--amber-soft) 25%, transparent), var(--surface-1))',
            transition: motion.standard,
            textAlign: 'left',
            maxWidth: 420,
            '&:hover': { boxShadow: shadows.cardHover, transform: 'translateY(-1px)' },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          <Typography sx={{ ...type.eyebrow, mb: 1 }}>Now unlocked</Typography>
          <Typography sx={{ fontFamily: fonts.serif, fontSize: 23, fontWeight: 600, color: colors.textPrimary, mb: 0.7 }}>
            Begin practice →
          </Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.5, color: colors.textSecondary }}>
            Turn what you've verified into an action plan for each trait.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Evidence snapshot — trait switcher + the shared explorer
// ---------------------------------------------------------------------------
function EvidenceSnapshot({ orderedRows }) {
  const [traitIdx, setTraitIdx] = useState(0);
  const row = orderedRows[Math.min(traitIdx, orderedRows.length - 1)];
  const statements = useMemo(() => mapRowStatements(row), [row]);
  const lowestIdx = useMemo(() => {
    if (!statements.length) return 0;
    let minIdx = 0;
    statements.forEach((s, i) => {
      if (s.compass < statements[minIdx].compass) minIdx = i;
    });
    return minIdx;
  }, [statements]);
  const [selected, setSelected] = useState(lowestIdx);
  const [mode, setMode] = useState('map');

  useEffect(() => {
    setSelected(lowestIdx);
    setMode('map');
  }, [traitIdx, lowestIdx]);

  return (
    <SnapshotShell>
      <StagePanels
        row={row}
        selected={selected}
        onSelect={setSelected}
        mode={mode}
        onModeChange={setMode}
        headerSlot={(
          <TraitSwitcher
            title={row.subTrait || row.trait}
            onPrev={() => setTraitIdx((p) => (p - 1 + orderedRows.length) % orderedRows.length)}
            onNext={() => setTraitIdx((p) => (p + 1) % orderedRows.length)}
          />
        )}
      />
    </SnapshotShell>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------
const EXHIBIT_COPY = {
  lifting: {
    description:
      "The debrief called this what's lifting — here are the five statements that earned it, lowest read first.",
    guide: (label) =>
      `Five statements, five reads. Notice how consistently ${label.toLowerCase()} lands — that consistency is the gift.`,
  },
  strength: {
    description:
      'The held strength — effort and payoff, statement by statement. Watch how the work shows up in every read.',
    guide: () =>
      'The effort line runs long on every statement here. Strength like this is built, not found — and it costs something.',
  },
  edge: {
    description:
      'The edge. Read these five slowly — this is where the effort-without-result pattern lives, and where one change would be felt first.',
    guide: () =>
      'Watch the two lines: long effort, short efficacy. The pattern is specific, which means the fix can be too.',
  },
};

const EVIDENCE_GUIDE = {
  intro: 'Evidence is sourced, not stylized. Take your time in here — nothing is summarized on your behalf.',
  floor: 'Three statements, ranked by need. If you only change one thing this cycle, the top of this list is where it counts.',
  gaps: 'A gap isn\u2019t an accusation. It\u2019s a precise map of where a conversation would teach you the most.',
  close: 'Verified ground. Now we build on it — an action plan for every trait, starting where the signal points.',
  snapshot: 'The receipts keep. Come back any time a claim needs checking — or walk the room again.',
};

export default function EvidenceView({ t, phases, onAdvancePhase }) {
  const { loaded, rows, hasSelfData, teamResponses } = useBenchmarkData();
  const { setPageMessage, clearPageMessage } = useGuide();

  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  const orderedRows = roles.ordered;
  const respondents = teamResponses?.length || 0;

  const mode = phases.modeFor('evidence');

  const chapters = useMemo(() => {
    // Walkthrough order: Receipts (intro) → Floor & Gaps → Quadrants (per-trait)
    const list = [
      { id: 'ev-intro', label: 'The Receipts', guide: () => EVIDENCE_GUIDE.intro, pose: 'read' },
      { id: 'ev-floor', label: 'The Floor', guide: () => EVIDENCE_GUIDE.floor, pose: 'lantern' },
    ];
    if (hasSelfData) {
      list.push({ id: 'ev-gaps', label: 'The Gaps', guide: () => EVIDENCE_GUIDE.gaps, pose: 'lantern' });
    }
    orderedRows.forEach((row) => {
      const role =
        row.trait === roles.edge?.trait ? 'edge' : row.trait === roles.lifting?.trait ? 'lifting' : 'strength';
      list.push({
        id: `ev-${row.trait}`,
        label: row.subTrait || row.trait,
        row,
        role,
        guide: () => EXHIBIT_COPY[role].guide(row.subTrait || row.trait),
        pose: 'map',
      });
    });
    list.push({ id: 'ev-close', label: 'Close', guide: () => EVIDENCE_GUIDE.close, pose: 'point' });
    return list;
  }, [orderedRows, roles, hasSelfData]);

  const idx = Math.min(Math.max(phases.pages.evidence || 0, 0), chapters.length - 1);
  const chapter = chapters[idx];
  const setIdx = (i) => phases.setPhasePage('evidence', Math.min(Math.max(i, 0), chapters.length - 1));

  useEffect(() => {
    if (!orderedRows.length) return undefined;
    if (mode === 'snapshot') {
      setPageMessage({ text: EVIDENCE_GUIDE.snapshot, pose: 'map', eyebrow: 'The Evidence' });
    } else {
      setPageMessage({ text: chapter.guide(), pose: chapter.pose, eyebrow: chapter.label });
    }
    return undefined;
  }, [mode, chapter, orderedRows.length, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  if (!loaded && !orderedRows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.sectionTitle, fontSize: 22, color: t.inkSoft }}>Loading the evidence…</Typography>
      </Box>
    );
  }

  if (!orderedRows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.eyebrow, mb: 1.6 }}>The Evidence</Typography>
        <Typography sx={{ ...type.lead, fontSize: { xs: 24, md: 28 }, lineHeight: 1.25, mb: 1.4 }}>
          The room is still empty.
        </Typography>
        <Typography sx={{ ...type.italicBody, fontSize: 16, color: t.inkSoft, maxWidth: 600 }}>
          When your campaign closes, every statement your team rated will be held here.
        </Typography>
      </Box>
    );
  }

  if (mode === 'snapshot') {
    return (
      <EvidenceSnapshot
        orderedRows={orderedRows}
      />
    );
  }

  return (
    <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
      {chapter.id === 'ev-intro' && <EvIntroPage rows={orderedRows} respondents={respondents} />}
      {chapter.row && <EvTraitPage row={chapter.row} />}
      {chapter.id === 'ev-floor' && <EvFloorPage rows={orderedRows} chapterIndex={idx + 1} />}
      {chapter.id === 'ev-gaps' && <EvGapsPage rows={orderedRows} chapterIndex={idx + 1} />}
      {chapter.id === 'ev-close' && <EvClosePage chapterIndex={idx + 1} onAdvancePhase={onAdvancePhase} />}
    </WalkthroughStage>
  );
}
