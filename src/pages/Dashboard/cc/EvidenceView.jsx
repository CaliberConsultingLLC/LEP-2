import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { colors, fonts, motion, radii, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { useGuide } from '../../../context/GuideContext';
import { spokenGuide } from '../../../data/guideContent';
import EvidenceQuadrant, { EvidenceModeBar } from './EvidenceQuadrant.jsx';
import { metricLabel, perceptionGap, scoresFor, zoneFor } from './evidenceDial.js';
import MetricHint from '../../../components/MetricHint';
import { hintForMetricLabel, SCORE_HINTS } from '../../../data/scoreGlossary';
import {
  ChapterEyebrow,
  Headline,
  Prose,
  SnapshotShell,
  WalkthroughStage,
} from './debriefUi.jsx';
import { deriveTraitRoles } from './debriefContent.js';
import TraitRoom from './TraitRoom.jsx';
import traitSystem from '../../../data/traitSystem.js';

// ---------------------------------------------------------------------------
// 01 · Opening the room
// ---------------------------------------------------------------------------
function EvIntroPage({ rows, respondents }) {
  const totalStatements = rows.length * 5;
  const stats = [
    ...(respondents > 0 ? [{ n: respondents, label: 'Teammates heard', hint: SCORE_HINTS.teammatesHeard }] : []),
    { n: totalStatements, label: 'Statements rated', hint: SCORE_HINTS.statementsRated },
    { n: rows.length, label: 'Traits measured', hint: SCORE_HINTS.traitsMeasured },
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
              <MetricHint title={s.hint}>{s.n}</MetricHint>
            </Typography>
            <Typography sx={{ ...type.monoLabel, mt: 1 }}>
              <MetricHint title={s.hint} underline>{s.label}</MetricHint>
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function mapRowStatements(row) {
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
      compassSelf: Math.round(Number(self.lepScore) || Number(s.lepScore) || 0),
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

const FOCUS_SX = {
  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
};

function fmtSigned(n) {
  return n > 0 ? `+${n}` : String(n);
}

function traitAverages(statements, mode) {
  if (!statements.length) return { team: 0, self: 0 };
  const sum = statements.reduce(
    (acc, s) => {
      const sc = scoresFor(s, mode);
      return { team: acc.team + sc.team, self: acc.self + sc.self };
    },
    { team: 0, self: 0 }
  );
  return {
    team: Math.round(sum.team / statements.length),
    self: Math.round(sum.self / statements.length),
  };
}

function ScoreCell({ label, value, note, variant, gapSign }) {
  const isGap = variant === 'gap';
  const negative = isGap && gapSign < 0;
  const allSelf = variant === 'allSelf';
  const selectedTeam = variant === 'selectedTeam';
  const hint = hintForMetricLabel(label);
  let bgcolor = colors.surface1;
  let valueColor = colors.ink;
  let labelColor = colors.inkSoft;
  let noteColor = colors.inkSoft;
  if (selectedTeam) {
    bgcolor = colors.navy900;
    valueColor = colors.amberSoft;
    labelColor = 'color-mix(in srgb, var(--amber-soft) 72%, transparent)';
                noteColor = 'color-mix(in srgb, var(--dial-node-fill) 72%, transparent)';
  } else if (allSelf) {
    bgcolor = 'color-mix(in srgb, var(--orange) 6%, transparent)';
    valueColor = colors.orangeDeep;
    labelColor = colors.orangeDeep;
  } else if (isGap) {
    bgcolor = negative ? colors.gapNegativeTint : colors.gapPositiveTint;
    valueColor = negative ? colors.gapNegative : colors.gapPositive;
    labelColor = valueColor;
  }
  return (
    <Box sx={{ px: '22px', py: '18px', bgcolor }}>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: labelColor,
        }}
      >
        <MetricHint title={hint} underline>{label}</MetricHint>
      </Typography>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          mt: '9px',
          fontVariantNumeric: 'tabular-nums',
          color: valueColor,
        }}
      >
        <MetricHint title={hint}>{isGap ? fmtSigned(value) : value}</MetricHint>
      </Typography>
      <Typography
        sx={{
          fontFamily: fonts.sans,
          fontSize: 11,
          lineHeight: 1.3,
          mt: '7px',
          color: noteColor,
        }}
      >
        {note}
      </Typography>
    </Box>
  );
}

function ScoreCells({ team, self, all, mode }) {
  const gap = perceptionGap(team, self);
  const label = metricLabel(mode);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        bgcolor: colors.surface1,
        border: `1px solid ${colors.sand200}`,
        borderRadius: radii.md,
        overflow: 'hidden',
        mt: '26px',
      }}
    >
      <ScoreCell
        label={label}
        value={team}
        note="What the team reported"
        variant={all ? 'plain' : 'selectedTeam'}
      />
      <Box sx={{ bgcolor: colors.sand200 }} />
      <ScoreCell
        label="Self score"
        value={self}
        note="What you reported"
        variant={all ? 'allSelf' : 'plain'}
      />
      <Box sx={{ bgcolor: colors.sand200 }} />
      <ScoreCell
        label="Perception gap"
        value={gap}
        note={Math.abs(gap) >= 15 ? 'Worth a conversation' : 'Closely aligned'}
        variant="gap"
        gapSign={gap}
      />
    </Box>
  );
}

function StatementTabs({ selected, onSelect, count }) {
  const tabs = ['all', ...Array.from({ length: count }, (_, i) => i)];
  return (
    <Box sx={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const isAll = tab === 'all';
        const active = isAll ? selected === 'all' : selected === tab;
        return (
          <Box
            key={isAll ? 'all' : tab}
            component="button"
            type="button"
            aria-label={isAll ? 'All statements' : `Statement ${tab + 1}`}
            aria-pressed={active}
            onClick={() => onSelect(isAll ? 'all' : tab)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              boxSizing: 'border-box',
              height: 34,
              width: isAll ? 'auto' : 34,
              px: isAll ? '15px' : 0,
              borderRadius: radii.pill,
              border: `1px solid ${active ? colors.navy900 : colors.sand200}`,
              bgcolor: active ? colors.navy900 : 'transparent',
              color: active ? colors.amberSoft : colors.inkSoft,
              fontFamily: fonts.mono,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: isAll ? '0.14em' : '0.04em',
              textAlign: 'center',
              lineHeight: '32px',
              ...FOCUS_SX,
            }}
          >
            {isAll ? 'ALL' : tab + 1}
          </Box>
        );
      })}
    </Box>
  );
}

function StageHeader({ title, traitIndex, traitCount, onNextTrait, mode, onModeChange }) {
  const n = Number.isFinite(traitIndex) ? traitIndex + 1 : 1;
  const total = traitCount || 1;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 2,
        pb: '20px',
        mb: '28px',
        borderBottom: `1px solid ${colors.sand200}`,
        flexWrap: 'wrap',
        rowGap: 1.5,
      }}
    >
      <Box>
        <Typography sx={{ ...type.eyebrow, mb: '8px' }}>
          TRAIT {String(n).padStart(2, '0')} OF {String(total).padStart(2, '0')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: colors.ink,
            }}
          >
            {title}
          </Typography>
          {onNextTrait && (
            <Box
              component="button"
              type="button"
              aria-label="Next trait"
              onClick={onNextTrait}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: radii.circle,
                border: `1px solid ${colors.sand200}`,
                bgcolor: colors.surface1,
                color: colors.navy900,
                fontSize: 19,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.dialNext,
                ...FOCUS_SX,
              }}
            >
              →
            </Box>
          )}
        </Box>
      </Box>
      <EvidenceModeBar mode={mode} onModeChange={onModeChange} embedded />
    </Box>
  );
}

function AllStatementList({ statements, onSelect }) {
  return (
    <Box sx={{ mt: '22px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: '4px' }}>
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.inkSoft,
          }}
        >
          Trait statements
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.inkSoft,
            flexShrink: 0,
          }}
        >
          <MetricHint title={SCORE_HINTS.compass} underline>Compass score</MetricHint>
        </Typography>
      </Box>
      {statements.map((statement, idx) => {
        const zone = zoneFor(statement.effort, statement.efficacy);
        return (
          <Box
            key={idx}
            component="button"
            type="button"
            onClick={() => onSelect(idx)}
            aria-label={`Focus statement ${idx + 1}`}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              boxSizing: 'border-box',
              display: 'grid',
              gridTemplateColumns: '26px 1fr 30px',
              gap: '14px',
              alignItems: 'center',
              width: '100%',
              py: '13px',
              px: '4px',
              borderTop: idx === 0 ? 'none' : `1px solid ${colors.sand200}`,
              ...FOCUS_SX,
            }}
          >
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, color: colors.inkSoft }}>
              {idx + 1}
            </Typography>
            <Typography sx={{ fontFamily: fonts.serif, fontSize: 15.5, lineHeight: 1.35, color: colors.ink }}>
              {statement.text}
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.mono,
                fontSize: 19,
                fontWeight: 700,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: zone.ink,
              }}
            >
              <MetricHint title={SCORE_HINTS.compass}>{statement.compass}</MetricHint>
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function StagePanels({
  row,
  selected,
  onSelect,
  mode,
  onModeChange,
  traitIndex = 0,
  traitCount = 1,
  onNextTrait,
}) {
  const statements = useMemo(() => mapRowStatements(row), [row]);
  const isAll = selected === 'all';
  const active = !isAll && typeof selected === 'number' ? statements[selected] : null;
  const avgs = traitAverages(statements, mode);
  const activeScores = active ? scoresFor(active, mode) : avgs;
  const zone = active ? zoneFor(active.effort, active.efficacy) : null;

  return (
    <Box>
      <StageHeader
        title={row.subTrait || row.trait}
        traitIndex={traitIndex}
        traitCount={traitCount}
        onNextTrait={onNextTrait}
        mode={mode}
        onModeChange={onModeChange}
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 520px) minmax(0, 1fr)' },
          gap: '40px',
          alignItems: 'start',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 520, aspectRatio: '1 / 1', overflow: 'visible' }}>
          <EvidenceQuadrant
            statements={statements}
            selectedIdx={selected}
            onSelect={onSelect}
            mode={mode}
            onModeChange={onModeChange}
            showModeBar={false}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <StatementTabs selected={selected} onSelect={onSelect} count={statements.length} />
          {isAll ? (
            <>
              <ScoreCells team={avgs.team} self={avgs.self} all mode={mode} />
              <AllStatementList statements={statements} onSelect={onSelect} />
            </>
          ) : (
            active && (
              <>
                <Box
                  sx={{
                    display: 'inline-flex',
                    mt: '22px',
                    px: '14px',
                    py: '7px',
                    borderRadius: radii.pill,
                    bgcolor: zone.tint,
                    border: `1px solid ${zone.ink}`,
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: zone.ink,
                  }}
                >
                  {zone.label}
                </Box>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontSize: 26,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    letterSpacing: '-0.015em',
                    color: colors.ink,
                    mt: '16px',
                  }}
                >
                  “{active.text}”
                </Typography>
                <Typography
                  sx={{
                    ...type.italicBody,
                    color: colors.inkSoft,
                    maxWidth: '44ch',
                    mt: '10px',
                    mb: 0,
                  }}
                >
                  {zone.note}
                </Typography>
                <ScoreCells team={activeScores.team} self={activeScores.self} mode={mode} />
              </>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trait exhibit chapter — same explorer format as Evidence snapshot
// ---------------------------------------------------------------------------
function EvTraitPage({ row, traitIndex = 0, traitCount = 1, onNextTrait }) {
  const [selected, setSelected] = useState('all');
  const [mode, setMode] = useState('map');

  useEffect(() => {
    setSelected('all');
    setMode('map');
  }, [row]);

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <StagePanels
        row={row}
        selected={selected}
        onSelect={setSelected}
        mode={mode}
        onModeChange={setMode}
        traitIndex={traitIndex}
        traitCount={traitCount}
        onNextTrait={onNextTrait}
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
              { label: 'Effectiveness', value: s.efficacy, color: colors.green },
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
        gap: Math.round(s.lepScore - self.lepScore),
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
            numberColor={g.gap < 0 ? colors.gapNegative : colors.gapPositive}
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
function EvidenceSnapshot({ orderedRows, traitIndex }) {
  // The rail owns trait selection; 0 is the fallback when this renders alone.
  const traitIdx = Number.isFinite(traitIndex) ? traitIndex : 0;
  const row = orderedRows[Math.min(traitIdx, orderedRows.length - 1)];
  const statements = useMemo(() => mapRowStatements(row), [row]);

  return (
    <SnapshotShell>
      <TraitRoom row={row} statements={statements} />
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
      'Watch the two lines: long effort, short effectiveness. The pattern is specific, which means the fix can be too.',
  },
};

const EVIDENCE_GUIDE = {
  intro: 'Evidence is sourced, not stylized. Take your time in here — nothing is summarized on your behalf.',
  floor: 'Three statements, ranked by need. If you only change one thing this cycle, the top of this list is where it counts.',
  gaps: 'A gap isn\u2019t an accusation. It\u2019s a precise map of where a conversation would teach you the most.',
  close: 'Verified ground. Now we build on it — an action plan for every trait, starting where the signal points.',
  snapshot: 'The receipts keep. Come back any time a claim needs checking — or walk the room again.',
};

export default function EvidenceView({ t, phases, onAdvancePhase, traitIndex }) {
  const { loaded, rows, hasSelfData, teamResponses } = useBenchmarkData();
  const { personaId, setPageMessage, clearPageMessage } = useGuide();

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
      const spoken = spokenGuide(personaId, 'dashboardEvidence', 'snapshot', EVIDENCE_GUIDE.snapshot, 'map');
      setPageMessage({ text: spoken.text, pose: spoken.pose, eyebrow: 'The Evidence' });
    } else {
      const known = ['ev-intro', 'ev-floor', 'ev-gaps', 'ev-close'];
      const stepKey = known.includes(chapter.id) ? chapter.id : 'ev-trait';
      const spoken = spokenGuide(personaId, 'dashboardEvidence', stepKey, chapter.guide(), chapter.pose);
      setPageMessage({ text: spoken.text, pose: spoken.pose, eyebrow: chapter.label });
    }
    return undefined;
  }, [mode, chapter, orderedRows.length, setPageMessage, personaId]);

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
        traitIndex={traitIndex}
      />
    );
  }

  return (
    <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
      {chapter.id === 'ev-intro' && <EvIntroPage rows={orderedRows} respondents={respondents} />}
      {chapter.row && (
        <EvTraitPage
          key={chapter.row.trait}
          row={chapter.row}
          traitIndex={Math.max(0, orderedRows.findIndex((r) => r.trait === chapter.row.trait))}
          traitCount={orderedRows.length}
          onNextTrait={() => {
            const current = orderedRows.findIndex((r) => r.trait === chapter.row.trait);
            const nextRow = orderedRows[(current + 1) % orderedRows.length];
            const nextChapter = chapters.findIndex((c) => c.row && c.row.trait === nextRow.trait);
            if (nextChapter >= 0) setIdx(nextChapter);
          }}
        />
      )}
      {chapter.id === 'ev-floor' && <EvFloorPage rows={orderedRows} chapterIndex={idx + 1} />}
      {chapter.id === 'ev-gaps' && <EvGapsPage rows={orderedRows} chapterIndex={idx + 1} />}
      {chapter.id === 'ev-close' && <EvClosePage chapterIndex={idx + 1} onAdvancePhase={onAdvancePhase} />}
    </WalkthroughStage>
  );
}
