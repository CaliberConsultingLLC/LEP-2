import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { buttons, colors, fonts, motion, radii, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { useGuide } from '../../../context/GuideContext';
import {
  ChapterEyebrow,
  GapScoresPanel,
  Headline,
  PageFade,
  Prose,
  SnapshotShell,
  TraitScoresPanel,
  TwoCol,
  WalkArrow,
  WalkthroughStage,
} from './debriefUi.jsx';
import {
  buildGapStories,
  buildTraitStories,
  closeCopyFor,
  deriveTraitRoles,
  REACTIONS,
  SIGNAL_GUIDE,
  reactionById,
} from './debriefContent.js';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// ---------------------------------------------------------------------------
// Quadrant-zone chip (tooltip carries the zone's meaning + stance)
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
// 01 · Threshold
// ---------------------------------------------------------------------------
function ThresholdPage({ firstName, respondents, invited, overallCompass }) {
  const answered =
    Number.isFinite(invited) && invited >= respondents && respondents > 0
      ? `${respondents} of ${invited} teammates answered.`
      : respondents > 0
      ? `${respondents} ${respondents === 1 ? 'teammate' : 'teammates'} answered.`
      : 'Your team has answered.';
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto' }}>
      <ChapterEyebrow index={1} label="The Threshold" />
      <Headline size="xl">{firstName ? `${firstName}, your` : 'Your'} team has reflected back.</Headline>
      <Prose serif sx={{ mx: 'auto', maxWidth: 560 }}>
        {answered} What follows is their experience of your leadership — read it slowly, and hold it
        lightly. Patterns matter more than any one number.
      </Prose>
      <Stack alignItems="center" spacing={0.8} sx={{ mt: 4.5, mb: 1.2 }}>
        <Typography sx={{ ...type.monoLabel }}>Compass · all traits</Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 600,
            fontSize: { xs: 84, md: 124 },
            lineHeight: 0.95,
            letterSpacing: '-0.05em',
            color: colors.orange,
          }}
        >
          {overallCompass}
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>
          One number can't hold a team's experience — the next pages tell you what it's made of.
        </Typography>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Shared walk page — trait walk (02) and gap walk (03) use the same mechanic
// ---------------------------------------------------------------------------
function WalkPage({ chapterIndex, stories, fadePrefix, unitLabel, renderPanel }) {
  const [idx, setIdx] = useState(0);
  const story = stories[Math.min(idx, stories.length - 1)];
  const isLast = idx >= stories.length - 1;

  return (
    <TwoCol
      left={
        <Box>
          <PageFade fadeKey={`${fadePrefix}-${idx}`}>
            <ChapterEyebrow index={chapterIndex} label={story.eyebrow} />
            <Headline>{story.headline}</Headline>
            {story.zone && (
              <Box sx={{ mb: 2 }}>
                <QuadrantChip zone={story.zone} />
              </Box>
            )}
            {(story.paras || [story.serif, story.sans]).map((p, i) => (
              <Prose key={i} serif={i === 0}>
                {p}
              </Prose>
            ))}
          </PageFade>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 3.2 }}>
            {idx > 0 && <WalkArrow dir="up" onClick={() => setIdx(idx - 1)} label={`Previous ${unitLabel}`} />}
            {!isLast && <WalkArrow dir="down" onClick={() => setIdx(idx + 1)} primary label={`Next ${unitLabel}`} />}
            <Typography sx={{ ...type.monoLabel }}>
              {isLast
                ? `All ${stories.length === 3 ? 'three' : stories.length} read · continue when ready`
                : `${unitLabel} ${idx + 1} of ${stories.length}`}
            </Typography>
          </Stack>
        </Box>
      }
      right={renderPanel(story, (traitKey) => {
        const next = stories.findIndex((s) => s.row.trait === traitKey);
        if (next >= 0) setIdx(next);
      })}
    />
  );
}

// ---------------------------------------------------------------------------
// 04 · The Check-in
// ---------------------------------------------------------------------------
function CheckinPage({ reaction, onReact }) {
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
      <ChapterEyebrow index={4} label="The Check-in" />
      <Headline>Before we go on — how is this landing?</Headline>
      <Prose serif sx={{ mx: 'auto' }}>
        There's no right answer. Your guide just wants to know where you are before we talk about what
        comes next.
      </Prose>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.5,
          mt: 3.2,
          mb: 2.2,
          textAlign: 'left',
        }}
      >
        {REACTIONS.map((r) => {
          const active = reaction === r.id;
          return (
            <Box
              key={r.id}
              component="button"
              type="button"
              onClick={() => onReact(r.id)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                boxSizing: 'border-box',
                px: 2.2,
                py: 2,
                borderRadius: radii.md,
                border: `1.5px solid ${active ? colors.orange : colors.sand200}`,
                bgcolor: active ? 'color-mix(in srgb, var(--orange) 7%, transparent)' : colors.surface1,
                boxShadow: active ? shadows.card : shadows.none,
                transition: motion.standard,
                minHeight: 44,
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 17, fontWeight: 600, color: colors.textPrimary, mb: 0.4 }}>
                {r.label}
              </Typography>
              <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}>{r.sub}</Typography>
            </Box>
          );
        })}
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: colors.textSecondary,
          }}
        >
          ◇ Private
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>
          This stays between you and your guide.
        </Typography>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// 05 · The Close — two doors: Evidence (live) and Practice (locked)
// ---------------------------------------------------------------------------
function ClosePage({ reaction, edgeRow, onAdvancePhase }) {
  const copy = closeCopyFor(reaction, edgeRow);
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
      <ChapterEyebrow index={5} label="The Close" />
      <Headline>{copy.headline}</Headline>
      <Prose serif sx={{ mx: 'auto', maxWidth: 580 }}>
        {copy.lead}
      </Prose>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
          mt: 3.5,
          textAlign: 'left',
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={onAdvancePhase}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            boxSizing: 'border-box',
            ...surfaces.card,
            px: 3,
            py: 2.75,
            border: `1.5px solid ${colors.orange}`,
            background: 'linear-gradient(150deg, color-mix(in srgb, var(--amber-soft) 25%, transparent), var(--surface-1))',
            transition: motion.standard,
            '&:hover': { boxShadow: shadows.cardHover, transform: 'translateY(-1px)' },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          <Typography sx={{ ...type.eyebrow, mb: 1 }}>Next · Go deeper</Typography>
          <Typography sx={{ fontFamily: fonts.serif, fontSize: 21, fontWeight: 600, color: colors.textPrimary, mb: 0.7 }}>
            Review the evidence →
          </Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.5, color: colors.textSecondary }}>
            Every statement, every number, every gap — the data behind everything this debrief just
            claimed.
          </Typography>
        </Box>
        <Box
          aria-disabled="true"
          sx={{
            boxSizing: 'border-box',
            ...surfaces.cardFlat,
            px: 3,
            py: 2.75,
            bgcolor: colors.sand50,
            opacity: 0.75,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1 }}>
            <LockOutlined sx={{ fontSize: 12, color: colors.textSecondary }} />
            <Typography sx={{ ...type.eyebrow, color: colors.textSecondary }}>Then · Move forward</Typography>
          </Stack>
          <Typography sx={{ fontFamily: fonts.serif, fontSize: 21, fontWeight: 600, color: colors.textSecondary, mb: 0.7 }}>
            Begin practice
          </Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.5, color: colors.textSecondary }}>
            Unlocks after you've read the evidence — practice built on a signal you've verified holds
            longer.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Signal snapshot — the whole debrief in one view
// ---------------------------------------------------------------------------
function SignalSnapshot({ traitStories, onReplay, onOpenEvidence }) {
  const [highlight, setHighlight] = useState(null);

  return (
    <SnapshotShell>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.2 }}>
        <Box component="button" type="button" onClick={onReplay} sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}>
          ↻ Walk through again
        </Box>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <TraitScoresPanel
          rows={traitStories.map((s) => s.row)}
          highlightKey={highlight}
          onSelect={(traitKey) => setHighlight(highlight === traitKey ? null : traitKey)}
          cardMinHeight={178}
        />
        <Stack spacing={1.75}>
          {traitStories.map((story) => (
            <Box key={story.row.trait} sx={{ ...surfaces.cardFlat, px: 2.5, py: 2, minHeight: 178, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography sx={{ ...type.eyebrow, mb: 0.7 }}>{story.eyebrow}</Typography>
              <Typography
                sx={{ fontFamily: fonts.serif, fontSize: 17, fontWeight: 600, color: colors.textPrimary, mb: 0.7, textWrap: 'pretty' }}
              >
                {story.headline}
              </Typography>
              <Typography
                sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.5, color: colors.textSecondary, textWrap: 'pretty' }}
              >
                {story.paras[0]}
              </Typography>
            </Box>
          ))}
          <Box
            component="button"
            type="button"
            onClick={onOpenEvidence}
            sx={{ all: 'unset', cursor: 'pointer', ...buttons.primary, alignSelf: 'flex-start' }}
          >
            Review the evidence →
          </Box>
        </Stack>
      </Box>
    </SnapshotShell>
  );
}

// ---------------------------------------------------------------------------
// Main view — walkthrough on first visit / replay, snapshot once complete
// ---------------------------------------------------------------------------
export default function SignalView({ t, phases, onAdvancePhase, onOpenEvidence }) {
  const { loaded, rows, hasSelfData, teamResponses } = useBenchmarkData();
  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const intakeData = useMemo(() => readJson('latestFormData', null), []);
  const { setPageMessage, clearPageMessage } = useGuide();

  const firstName = String(userInfo?.name || '').trim().split(/\s+/)[0] || '';
  const respondents = teamResponses?.length || 0;
  const invited = Number(intakeData?.teamSize);

  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  const traitStories = useMemo(() => buildTraitStories(roles), [roles]);
  const gapStories = useMemo(() => (hasSelfData ? buildGapStories(roles) : []), [roles, hasSelfData]);

  const overallCompass = useMemo(() => {
    const withTeam = rows.filter((r) => r.team);
    if (!withTeam.length) return 0;
    return Math.round(withTeam.reduce((s, r) => s + r.team.lepScore, 0) / withTeam.length);
  }, [rows]);

  const mode = phases.modeFor('signal');
  const reaction = phases.reaction;

  // Chapter registry — gap walk present only when self data exists
  const chapters = useMemo(() => {
    const list = [
      { id: 'threshold', label: 'Threshold', guide: () => SIGNAL_GUIDE.threshold, pose: 'read' },
      { id: 'traits', label: 'The Signal', guide: () => SIGNAL_GUIDE.traits, pose: 'map' },
    ];
    if (gapStories.length) {
      list.push({ id: 'gap', label: 'The Gap', guide: () => SIGNAL_GUIDE.gap, pose: 'map' });
    }
    list.push({
      id: 'checkin',
      label: 'Check-in',
      guide: () => reactionById(reaction)?.guideLine || SIGNAL_GUIDE.checkin,
      pose: 'lantern',
    });
    list.push({ id: 'close', label: 'The Close', guide: () => SIGNAL_GUIDE.close, pose: 'point' });
    return list;
  }, [gapStories.length, reaction]);

  const idx = Math.min(Math.max(phases.pages.signal || 0, 0), chapters.length - 1);
  const chapter = chapters[idx];
  const setIdx = (i) => phases.setPhasePage('signal', Math.min(Math.max(i, 0), chapters.length - 1));

  // Guide — chapter lines in walkthrough, resting line on the snapshot
  useEffect(() => {
    if (!rows.some((r) => r.team)) return undefined;
    if (mode === 'snapshot') {
      setPageMessage({ text: SIGNAL_GUIDE.snapshot, pose: 'map', eyebrow: 'The Signal' });
    } else {
      setPageMessage({ text: chapter.guide(), pose: chapter.pose, eyebrow: chapter.label });
    }
    return undefined;
  }, [mode, chapter, rows, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  if (!loaded && !rows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.sectionTitle, fontSize: 22, color: t.inkSoft }}>Loading the signal…</Typography>
      </Box>
    );
  }

  if (!rows.some((r) => r.team)) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.eyebrow, mb: 1.6 }}>The Signal</Typography>
        <Typography sx={{ ...type.lead, fontSize: { xs: 24, md: 28 }, lineHeight: 1.25, mb: 1.4 }}>
          The campaign is still listening.
        </Typography>
        <Typography sx={{ ...type.italicBody, fontSize: 16, color: t.inkSoft, maxWidth: 600 }}>
          When the listening window closes, this page will hold what your team is reflecting back.
        </Typography>
      </Box>
    );
  }

  if (mode === 'snapshot') {
    return (
      <SignalSnapshot
        traitStories={traitStories}
        onReplay={() => phases.startReplay('signal')}
        onOpenEvidence={onOpenEvidence}
      />
    );
  }

  return (
    <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
      {chapter.id === 'threshold' && (
        <ThresholdPage
          firstName={firstName}
          respondents={respondents}
          invited={invited}
          overallCompass={overallCompass}
        />
      )}
      {chapter.id === 'traits' && (
        <WalkPage
          chapterIndex={2}
          stories={traitStories}
          fadePrefix="story"
          unitLabel="Trait"
          renderPanel={(story, onSelect) => (
            <TraitScoresPanel
              rows={traitStories.map((s) => s.row)}
              highlightKey={story.row.trait}
              onSelect={onSelect}
            />
          )}
        />
      )}
      {chapter.id === 'gap' && (
        <WalkPage
          chapterIndex={3}
          stories={gapStories}
          fadePrefix="gap"
          unitLabel="Gap"
          renderPanel={(story, onSelect) => (
            <GapScoresPanel
              rows={gapStories.map((s) => s.row)}
              highlightKey={story.row.trait}
              onSelect={onSelect}
            />
          )}
        />
      )}
      {chapter.id === 'checkin' && <CheckinPage reaction={reaction} onReact={phases.setReaction} />}
      {chapter.id === 'close' && (
        <ClosePage reaction={reaction} edgeRow={roles.edge} onAdvancePhase={onAdvancePhase} />
      )}
    </WalkthroughStage>
  );
}
