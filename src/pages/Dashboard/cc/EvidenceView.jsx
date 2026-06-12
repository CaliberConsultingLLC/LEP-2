import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { buttons, chips as chipTokens, colors, fonts, motion, radii, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { getQuadrant } from './quadrants.js';
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

// ---------------------------------------------------------------------------
// Quadrant-zone chip (same treatment as the Signal walkthrough)
// ---------------------------------------------------------------------------
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
          px: 1.2,
          py: 0.5,
          borderRadius: radii.pill,
          border: `1px solid ${zone.color}`,
          cursor: 'help',
        }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: radii.circle, bgcolor: zone.color, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: zone.color }}>
          {zone.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// 01 · Opening the room
// ---------------------------------------------------------------------------
function EvIntroPage({ rows, respondents }) {
  const totalStatements = rows.reduce((s, r) => s + (r.team?.statements?.length || 0), 0);
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

// ---------------------------------------------------------------------------
// Trait explorer — the shared Evidence composition.
//   Left: spotlight card + slim statement table (lowest Compass first).
//   Right: the hero quadrant with axis projections + self comparison.
// Shared between the walkthrough exhibits and the snapshot.
// ---------------------------------------------------------------------------
export function EvTraitExplorer({ row, aboveList = null }) {
  const lowestIdx = useMemo(() => {
    const sts = row.team?.statements || [];
    let li = 0;
    sts.forEach((s, i) => {
      if (s.lepScore < sts[li].lepScore) li = i;
    });
    return li;
  }, [row]);

  const [selected, setSelected] = useState(lowestIdx);
  const [selfOn, setSelfOn] = useState(true);

  // Re-anchor on the lowest read whenever the trait changes.
  useEffect(() => {
    setSelected(lowestIdx);
  }, [row, lowestIdx]);

  const statements = useMemo(() => row.team?.statements || [], [row]);
  const spot = selected != null ? statements[selected] : null;
  const spotSelf = selected != null && row.self ? row.self.statements[selected] : null;
  const spotIsLowest = selected === lowestIdx;

  // Statements ordered lowest Compass first; flag the 1–2 lowest.
  const ordered = useMemo(() => {
    const items = statements.map((s, i) => ({ s, i }));
    return items.sort((a, b) => a.s.lepScore - b.s.lepScore);
  }, [statements]);
  const lowSet = new Set(ordered.length ? [ordered[0].i] : []);
  if (ordered[1] && ordered[1].s.lepScore < 50) lowSet.add(ordered[1].i);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.1fr)' },
        gap: 4,
        alignItems: 'start',
      }}
    >
      {/* Left — the words: spotlight + statement table */}
      <Stack spacing={1.75}>
        {aboveList}

        {spot && (
          <Box
            sx={{
              ...surfaces.card,
              px: 2.75,
              py: 2.25,
              border: `1.5px solid ${colors.orange}`,
              background: 'linear-gradient(150deg, color-mix(in srgb, var(--amber-soft) 22%, transparent), var(--surface-1))',
            }}
          >
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1.75} sx={{ mb: 1 }}>
              <Typography sx={{ ...type.eyebrow }}>
                {spotIsLowest ? 'Start here · the lowest read' : 'In their words'}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.9} sx={{ flexShrink: 0 }}>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontWeight: 600,
                    fontSize: 30,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    color: colors.orange,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(spot.lepScore)}
                </Typography>
                <Typography sx={{ ...type.monoLabel }}>Compass</Typography>
              </Stack>
            </Stack>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontSize: 17,
                lineHeight: 1.45,
                color: colors.textPrimary,
                mb: 1.2,
                textWrap: 'pretty',
              }}
            >
              “{spot.text}”
            </Typography>
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: colors.textSecondary }}>
              Efficacy {Math.round(spot.efficacy)} · Effort {Math.round(spot.effort)}
              {selfOn && spotSelf ? ` · You rated it ${Math.round(spotSelf.lepScore)}` : ''}
            </Typography>
          </Box>
        )}

        {/* Statement table — lowest Compass first */}
        <Box sx={{ ...surfaces.card, px: 2.75, pt: 0.5, pb: 0.75 }}>
          <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%' }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ ...type.monoLabel, textAlign: 'left', pt: 1.6, pb: 1.1, pr: 2 }}>
                  Statement
                </Box>
                <Box component="th" sx={{ ...type.monoLabel, textAlign: 'right', pt: 1.6, pb: 1.1, pl: 2, color: colors.orangeDeep }}>
                  Compass
                </Box>
              </Box>
            </Box>
            <Box component="tbody">
              {ordered.map(({ s, i }) => {
                const sel = selected === i;
                const low = lowSet.has(i);
                return (
                  <Box
                    component="tr"
                    key={i}
                    onClick={() => setSelected(sel ? null : i)}
                    sx={{
                      borderTop: `1px solid ${colors.sand200}`,
                      cursor: 'pointer',
                      bgcolor: sel
                        ? 'color-mix(in srgb, var(--orange) 8%, transparent)'
                        : low
                        ? 'color-mix(in srgb, var(--amber-soft) 22%, transparent)'
                        : 'transparent',
                      outline: sel ? `1.5px solid ${colors.orange}` : 'none',
                      outlineOffset: '-1.5px',
                      transition: motion.standard,
                    }}
                  >
                    <Box component="td" sx={{ py: 1.5, pr: 2, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.45, color: colors.textPrimary }}>
                      {s.text}
                      {low && (
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            ml: 1,
                            px: 1,
                            py: '1px',
                            borderRadius: radii.pill,
                            bgcolor: colors.orange,
                            color: colors.surface1,
                            fontFamily: fonts.mono,
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            verticalAlign: 'middle',
                          }}
                        >
                          Needs focus
                        </Box>
                      )}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        py: 1.5,
                        pl: 2,
                        textAlign: 'right',
                        fontFamily: fonts.mono,
                        fontSize: 14.5,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: colors.orangeDeep,
                        whiteSpace: 'nowrap',
                        verticalAlign: 'top',
                      }}
                    >
                      {Math.round(s.lepScore)}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Stack>

      {/* Right — the map */}
      <Box>
        <Box sx={{ maxWidth: 'min(560px, calc(100vh - 330px))', mx: 'auto' }}>
          <EvidenceQuadrant
            row={row}
            selectedIdx={selected}
            onStatementClick={setSelected}
            showSelf={selfOn && Boolean(row.self)}
            size={560}
          />
        </Box>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.75} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSecondary }}>
            {selected != null
              ? 'Click the dot — or a statement — to see all five.'
              : 'All five statements. Click any dot to isolate it.'}
          </Typography>
          {row.self && (
            <Box
              component="button"
              type="button"
              onClick={() => setSelfOn(!selfOn)}
              aria-pressed={selfOn}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                px: 1.5,
                py: 0.6,
                borderRadius: radii.pill,
                border: `1px solid ${selfOn ? colors.orange : colors.sand200}`,
                bgcolor: selfOn ? colors.orange : colors.surface1,
                color: selfOn ? colors.surface1 : colors.textSecondary,
                fontFamily: fonts.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                transition: motion.standard,
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              <Box
                component="span"
                sx={{ width: 8, height: 8, borderRadius: radii.circle, bgcolor: selfOn ? colors.surface1 : colors.orange, flexShrink: 0 }}
              />
              Self Assess
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trait exhibit chapter — header with description + the shared explorer
// ---------------------------------------------------------------------------
function EvTraitPage({ row, index, description }) {
  const zone = getQuadrant(row.team.effort, row.team.efficacy);
  return (
    <Box sx={{ maxWidth: 1140, mx: 'auto' }}>
      <Box sx={{ mb: 2 }}>
        <ChapterEyebrow index={index} label={`Exhibit ${index - 1} · ${row.trait}`} />
        <Stack direction="row" alignItems="center" spacing={1.75} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 0.75 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              letterSpacing: '-0.03em',
              fontSize: { xs: 24, md: 32 },
              lineHeight: 1.05,
              color: colors.textPrimary,
              m: 0,
            }}
          >
            {row.subTrait}
          </Typography>
          <QuadrantChip zone={zone} />
        </Stack>
        {description && (
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 15,
              lineHeight: 1.5,
              color: colors.textSecondary,
              maxWidth: 600,
              textWrap: 'pretty',
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <EvTraitExplorer row={row} />
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
function EvidenceSnapshot({ orderedRows, onReplay, onOpenPractice }) {
  const [traitIdx, setTraitIdx] = useState(0);
  const row = orderedRows[Math.min(traitIdx, orderedRows.length - 1)];
  const zone = getQuadrant(row.team.effort, row.team.efficacy);

  return (
    <SnapshotShell>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.2 }}>
        <Box component="button" type="button" onClick={onReplay} sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}>
          ↻ Walk through again
        </Box>
      </Stack>
      <EvTraitExplorer
        row={row}
        aboveList={
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {orderedRows.map((r, i) => {
              const active = i === traitIdx;
              return (
                <Box
                  key={r.trait}
                  component="button"
                  type="button"
                  onClick={() => setTraitIdx(i)}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    ...chipTokens.base,
                    display: 'inline-flex',
                    alignItems: 'center',
                    ...(active ? chipTokens.active : chipTokens.hover),
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                >
                  {r.subTrait || r.trait}
                </Box>
              );
            })}
            <QuadrantChip zone={zone} />
          </Stack>
        }
      />
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Box
          component="button"
          type="button"
          onClick={onOpenPractice}
          sx={{ all: 'unset', cursor: 'pointer', ...buttons.primary }}
        >
          Continue to practice →
        </Box>
      </Stack>
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

export default function EvidenceView({ t, phases, onAdvancePhase, onOpenPractice }) {
  const { loaded, rows, hasSelfData, teamResponses } = useBenchmarkData();
  const { setPageMessage, clearPageMessage } = useGuide();

  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  const orderedRows = roles.ordered;
  const respondents = teamResponses?.length || 0;

  const mode = phases.modeFor('evidence');

  const chapters = useMemo(() => {
    const list = [
      { id: 'ev-intro', label: 'The Room', guide: () => EVIDENCE_GUIDE.intro, pose: 'read' },
    ];
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
    list.push({ id: 'ev-floor', label: 'The Floor', guide: () => EVIDENCE_GUIDE.floor, pose: 'lantern' });
    if (hasSelfData) {
      list.push({ id: 'ev-gaps', label: 'The Gaps', guide: () => EVIDENCE_GUIDE.gaps, pose: 'lantern' });
    }
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
        onReplay={() => phases.startReplay('evidence')}
        onOpenPractice={onOpenPractice}
      />
    );
  }

  return (
    <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
      {chapter.id === 'ev-intro' && <EvIntroPage rows={orderedRows} respondents={respondents} />}
      {chapter.row && (
        <EvTraitPage
          row={chapter.row}
          index={idx + 1}
          description={EXHIBIT_COPY[chapter.role].description}
        />
      )}
      {chapter.id === 'ev-floor' && <EvFloorPage rows={orderedRows} chapterIndex={idx + 1} />}
      {chapter.id === 'ev-gaps' && <EvGapsPage rows={orderedRows} chapterIndex={idx + 1} />}
      {chapter.id === 'ev-close' && <EvClosePage chapterIndex={idx + 1} onAdvancePhase={onAdvancePhase} />}
    </WalkthroughStage>
  );
}
