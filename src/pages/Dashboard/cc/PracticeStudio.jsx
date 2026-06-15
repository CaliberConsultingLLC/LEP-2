import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Slider, Stack, TextField, Typography } from '@mui/material';
import { buttons, colors, fonts, motion, radii, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { getRootRecommendations } from './rootRecommendations.js';
import { useGuide } from '../../../context/GuideContext';
import {
  ChapterEyebrow,
  Headline,
  PageFade,
  Prose,
  SnapshotShell,
  WalkthroughStage,
} from './debriefUi.jsx';
import { deriveTraitRoles } from './debriefContent.js';

const readJson = (key, fallback) => {
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
    /* storage unavailable — state stays in memory for the session */
  }
};

// ----------------------------------------------------------------------------
// Step model — labels for the stepper rail
// ----------------------------------------------------------------------------
const PR_STEPS = [
  { id: 'envision', label: 'Envision', eyebrow: 'In their shoes' },
  { id: 'root', label: 'Root', eyebrow: 'Train · Educate · Ground' },
  { id: 'branch', label: 'Branch', eyebrow: 'The behavior shift' },
  { id: 'commit', label: 'Commit', eyebrow: 'Set the bearing' },
];

// The flow — one focused prompt per screen
const PR_FLOW = [
  {
    step: 0,
    type: 'textarea',
    field: 'envisionExperience',
    q: 'What were they experiencing?',
    hint: "Before you decide what to do, sit for a moment with what your team experienced. Don't fix it yet — describe it.",
    ph: 'What did the meeting / message / pace feel like for them — not for you?',
  },
  {
    step: 0,
    type: 'textarea',
    field: 'envisionWant',
    q: 'What might they have wanted from you?',
    hint: 'The simplest thing they were hoping you\u2019d do or say.',
    ph: 'They were hoping I would…',
  },
  {
    step: 1,
    type: 'root',
    q: 'Where will you grow your understanding?',
    hint: 'A practice without learning becomes a guess. Pick one source you will actually return to.',
  },
  {
    step: 2,
    type: 'textarea',
    field: 'branchBehavior',
    q: 'What will your team see different this week?',
    hint: 'Translate your understanding into one observable behavior — small, repeatable, visible.',
    ph: 'In the next two weeks I will…',
  },
  {
    step: 2,
    type: 'textarea',
    field: 'branchSignal',
    q: 'What makes it visible to them?',
    hint: 'A ritual, a forum, a phrase they\u2019ll notice without you pointing.',
    ph: 'They\u2019ll notice it when…',
  },
  {
    step: 3,
    type: 'goal',
    q: 'What score will you reach for?',
    hint: 'Name a target your team would feel by next cycle. Honest, not heroic.',
  },
  {
    step: 3,
    type: 'textarea',
    field: 'commitMessage',
    q: 'What will you tell your team to expect?',
    hint: 'One sentence, in their language.',
    ph: 'If I were to tell my team what to expect from me, I would say…',
  },
];

const EMPTY_PLAN = {
  envisionExperience: '',
  envisionWant: '',
  rootSelection: '',
  rootCustom: '',
  branchBehavior: '',
  branchSignal: '',
  commitGoal: null,
  commitMessage: '',
  savedAt: '',
};

const planComplete = (p) =>
  Boolean(
    p &&
      (String(p.envisionExperience || '').trim() || String(p.envisionWant || '').trim()) &&
      (p.rootSelection || String(p.rootCustom || '').trim()) &&
      String(p.branchBehavior || '').trim() &&
      Number.isFinite(p.commitGoal)
  );

const PROMPT_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    fontFamily: fonts.serif,
    fontSize: 17.5,
    lineHeight: 1.55,
    color: colors.textPrimary,
    bgcolor: colors.surface1,
    borderRadius: radii.md,
    '& fieldset': { borderColor: colors.sand200 },
    '&:hover fieldset': { borderColor: colors.textSecondary },
    '&.Mui-focused fieldset': { borderColor: colors.orange },
  },
  '& textarea::placeholder, & input::placeholder': { color: colors.textSecondary, opacity: 0.7 },
};

// ---------------------------------------------------------------------------
// Stepper rail — Envision / Root / Branch / Commit
// ---------------------------------------------------------------------------
function PrStepper({ stepIdx, onJump, plan }) {
  const stepDone = [
    Boolean(String(plan.envisionExperience || '').trim() || String(plan.envisionWant || '').trim()),
    Boolean(plan.rootSelection || String(plan.rootCustom || '').trim()),
    Boolean(String(plan.branchBehavior || '').trim()),
    Number.isFinite(plan.commitGoal),
  ];

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" sx={{ gap: 1.75, flexWrap: 'wrap', mb: 3 }}>
      {PR_STEPS.map((step, idx) => {
        const active = idx === stepIdx;
        const complete = stepDone[idx] && idx !== stepIdx;
        return (
          <React.Fragment key={step.id}>
            <Box
              component="button"
              type="button"
              onClick={() => onJump(idx)}
              aria-current={active ? 'step' : undefined}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.9,
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: radii.circle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: active ? colors.orange : complete ? colors.green : 'transparent',
                  color: active || complete ? colors.surface1 : colors.textSecondary,
                  border: active || complete ? 'none' : `1px solid ${colors.sand300}`,
                  fontFamily: fonts.serif,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 12,
                  boxShadow: active ? shadows.buttonSecondary : shadows.none,
                }}
              >
                {complete ? '✓' : idx + 1}
              </Box>
              <Typography
                component="span"
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: active ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {step.label}
              </Typography>
            </Box>
            {idx < PR_STEPS.length - 1 && <Box sx={{ width: 24, height: '1px', bgcolor: colors.sand200 }} />}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// 01 · From signal to practice
// ---------------------------------------------------------------------------
function PrIntroPage({ edgeRow, traitCount }) {
  const edgeLabel = edgeRow ? (edgeRow.subTrait || edgeRow.trait).toLowerCase() : 'your edge trait';
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
      <ChapterEyebrow index={1} label="Practice" />
      <Headline size="xl">Understanding isn't the finish line.</Headline>
      <Prose serif sx={{ mx: 'auto', maxWidth: 540 }}>
        You've read the signal and verified the evidence. Now you'll build an action plan for each
        of the {traitCount === 3 ? 'three' : traitCount} traits — envision their experience, root
        your learning, choose a visible behavior, and commit to a score.
      </Prose>
      <Prose sx={{ mx: 'auto', maxWidth: 500 }}>
        We'll start where the signal points — {edgeLabel} — but every plan needs your hand before
        the commitment is set.
      </Prose>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trait plan page — title, the four-step rail, ONE prompt at a time
// ---------------------------------------------------------------------------
function PrTraitPlanPage({ row, plan, onPatch }) {
  const [promptIdx, setPromptIdx] = useState(0);
  const label = row.subTrait || row.trait;

  const prompt = PR_FLOW[promptIdx];
  const step = PR_STEPS[prompt.step];
  const recs = useMemo(() => getRootRecommendations(label), [label]);
  const current = Math.round(row.team.lepScore);
  const goal = Number.isFinite(plan.commitGoal) ? plan.commitGoal : Math.min(95, current + 8);
  const isLastPrompt = promptIdx === PR_FLOW.length - 1;

  // Seeing the goal slider counts as choosing the default — persist it so the
  // plan doesn't read as incomplete when the user accepts the suggested target.
  useEffect(() => {
    if (prompt.type === 'goal' && !Number.isFinite(plan.commitGoal)) {
      onPatch({ commitGoal: goal });
    }
  }, [prompt.type, plan.commitGoal, goal, onPatch]);

  const jumpToStep = (stepIdx) => {
    const first = PR_FLOW.findIndex((p) => p.step === stepIdx);
    if (first !== -1) setPromptIdx(first);
  };

  return (
    <Box sx={{ maxWidth: 780, mx: 'auto' }}>
      {/* Title only — the plan is the focus */}
      <Box sx={{ textAlign: 'center', mb: 2.2 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            fontSize: { xs: 26, md: 36 },
            lineHeight: 1.05,
            color: colors.textPrimary,
            m: 0,
          }}
        >
          {label}
        </Typography>
      </Box>

      <PrStepper stepIdx={prompt.step} onJump={jumpToStep} plan={plan} />

      <Box sx={{ ...surfaces.card, px: { xs: 3, md: 4.5 }, py: 3.75 }}>
        <PageFade fadeKey={`prompt-${row.trait}-${promptIdx}`}>
          <Typography sx={{ ...type.eyebrow, mb: 1.2 }}>{step.eyebrow}</Typography>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontSize: { xs: 22, md: 28 },
              fontWeight: 500,
              letterSpacing: '-0.018em',
              lineHeight: 1.15,
              color: colors.textPrimary,
              mb: 1,
              textWrap: 'pretty',
            }}
          >
            {prompt.q}
          </Typography>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 15.5,
              lineHeight: 1.5,
              color: colors.textSecondary,
              mb: 2.75,
              textWrap: 'pretty',
            }}
          >
            {prompt.hint}
          </Typography>

          {prompt.type === 'textarea' && (
            <TextField
              fullWidth
              multiline
              minRows={4}
              placeholder={prompt.ph}
              value={plan[prompt.field] || ''}
              onChange={(e) => onPatch({ [prompt.field]: e.target.value })}
              sx={PROMPT_FIELD_SX}
            />
          )}

          {prompt.type === 'root' && (
            <Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.5,
                  mb: 2,
                }}
              >
                {recs.map((rec) => {
                  const id = `${rec.type}::${rec.title}`;
                  const sel = plan.rootSelection === id;
                  return (
                    <Box
                      key={id}
                      component="button"
                      type="button"
                      onClick={() => onPatch({ rootSelection: id, rootCustom: '' })}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        display: 'block',
                        px: 2,
                        py: 1.75,
                        borderRadius: radii.md,
                        border: `1.5px solid ${sel ? colors.orange : colors.sand200}`,
                        bgcolor: sel ? 'color-mix(in srgb, var(--amber-soft) 18%, transparent)' : 'transparent',
                        transition: motion.standard,
                        '&:hover': { borderColor: sel ? colors.orange : colors.navy500 },
                        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                      }}
                    >
                      <Typography sx={{ ...type.eyebrow, fontSize: 9, mb: 0.5 }}>{rec.type}</Typography>
                      <Typography sx={{ fontFamily: fonts.serif, fontSize: 15.5, fontWeight: 600, lineHeight: 1.3, color: colors.textPrimary, mb: 0.4 }}>
                        {rec.title}
                      </Typography>
                      <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary, mb: 0.7 }}>{rec.by}</Typography>
                      <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.4, color: colors.textSecondary }}>
                        {rec.why}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <TextField
                fullWidth
                placeholder="Or name your own ground — a book, a course, a person, a daily practice."
                value={plan.rootCustom || ''}
                onChange={(e) => onPatch({ rootCustom: e.target.value, rootSelection: '' })}
                sx={PROMPT_FIELD_SX}
              />
            </Box>
          )}

          {prompt.type === 'goal' && (
            <Box sx={{ maxWidth: 520, mx: 'auto' }}>
              <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={1.5} sx={{ mb: 1.75 }}>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontSize: 56,
                    fontWeight: 600,
                    color: colors.orange,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {goal}
                </Typography>
                <Typography sx={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.12em' }}>
                  from {current}
                </Typography>
              </Stack>
              <Slider
                value={goal}
                onChange={(_, val) => onPatch({ commitGoal: Array.isArray(val) ? val[0] : val })}
                min={Math.max(0, current - 5)}
                max={100}
                step={1}
                aria-label="Score goal"
                sx={{
                  color: colors.orange,
                  '& .MuiSlider-thumb': {
                    boxShadow: shadows.buttonSecondary,
                    '&:hover, &.Mui-active': { boxShadow: shadows.buttonSecondary },
                  },
                }}
              />
              <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, mt: 1.2, textAlign: 'center' }}>
                A 6–10 point lift in a cycle is meaningful and felt. Beyond that becomes pressure,
                not practice.
              </Typography>
            </Box>
          )}
        </PageFade>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3.2, pt: 2.2, borderTop: `1px solid ${colors.sand200}` }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setPromptIdx(Math.max(0, promptIdx - 1))}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              ...buttons.outlinedPrimary,
              minHeight: 36,
              px: 2.2,
              py: 1,
              visibility: promptIdx === 0 ? 'hidden' : 'visible',
            }}
          >
            ← Back
          </Box>
          <Typography sx={{ ...type.monoLabel }}>
            {promptIdx + 1} of {PR_FLOW.length}
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={() => setPromptIdx(Math.min(PR_FLOW.length - 1, promptIdx + 1))}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              ...buttons.primary,
              minHeight: 36,
              px: 2.2,
              py: 1,
              visibility: isLastPrompt ? 'hidden' : 'visible',
            }}
          >
            Continue →
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The Commitment — all plans, signed together
// ---------------------------------------------------------------------------
function PrCommitAllPage({ orderedRows, plans, chapterIndex, onAdvancePhase }) {
  const statuses = orderedRows.map((row) => {
    const plan = plans[row.trait] || {};
    return { row, plan, complete: planComplete(plan) };
  });
  const allComplete = statuses.every((s) => s.complete);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <ChapterEyebrow index={chapterIndex} label="The Commitment" />
        <Headline>
          {orderedRows.length === 3 ? 'Three plans, one bearing.' : 'Every plan, one bearing.'}
        </Headline>
        <Prose serif sx={{ mx: 'auto', maxWidth: 540 }}>
          {allComplete
            ? 'Every trait has a plan with your handwriting on it. Read them once more, then set the bearing.'
            : 'A plan is still missing its pieces. Step back through the unfinished trait — the commitment only counts when it covers them all.'}
        </Prose>
      </Box>

      <Stack spacing={1.5} sx={{ mb: 3.2 }}>
        {statuses.map(({ row, plan, complete }) => {
          const goal = Number.isFinite(plan.commitGoal) ? plan.commitGoal : null;
          return (
            <Box
              key={row.trait}
              sx={{
                ...surfaces.card,
                px: 2.75,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2.2,
                border: complete ? `1px solid ${colors.sand200}` : `1.5px dashed ${colors.sand300}`,
                opacity: complete ? 1 : 0.85,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: radii.circle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: complete ? colors.green : colors.sand100,
                  color: complete ? colors.surface1 : colors.textSecondary,
                  border: complete ? 'none' : `1px solid ${colors.sand300}`,
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {complete ? '✓' : '…'}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="baseline" spacing={1.2} sx={{ flexWrap: 'wrap' }}>
                  <Typography sx={{ fontFamily: fonts.serif, fontSize: 17, fontWeight: 600, color: colors.textPrimary }}>
                    {row.subTrait || row.trait}
                  </Typography>
                  {goal != null && (
                    <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, color: colors.orangeDeep }}>
                      {Math.round(row.team.lepScore)} → {goal}
                    </Typography>
                  )}
                </Stack>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontStyle: 'italic',
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    color: colors.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {String(plan.branchBehavior || '').trim() ? `“${plan.branchBehavior}”` : 'No behavior named yet.'}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>

      <Stack direction="row" justifyContent="center">
        <Box
          component="button"
          type="button"
          onClick={allComplete ? onAdvancePhase : undefined}
          aria-disabled={!allComplete}
          sx={{
            all: 'unset',
            ...buttons.primary,
            fontSize: 14,
            px: 3.75,
            py: 1.75,
            opacity: allComplete ? 1 : 0.5,
            cursor: allComplete ? 'pointer' : 'not-allowed',
            ...(allComplete ? {} : { '&:hover': {} }),
          }}
        >
          {allComplete ? 'Set the bearing' : 'Complete every plan to commit'}
        </Box>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Practice snapshot — standing commitments
// ---------------------------------------------------------------------------
function PracticeSnapshot({ orderedRows, plans }) {
  return (
    <SnapshotShell>
      <Stack spacing={1.75} sx={{ mb: 2.2 }}>
        {orderedRows.map((row) => {
          const plan = plans[row.trait] || {};
          const current = Math.round(row.team.lepScore);
          const goal = Number.isFinite(plan.commitGoal) ? plan.commitGoal : Math.min(95, current + 8);
          const ground =
            String(plan.rootCustom || '').trim() ||
            (plan.rootSelection ? String(plan.rootSelection).split('::').pop() : '');
          return (
            <Box key={row.trait} sx={{ ...surfaces.card, px: 3.5, py: 3 }}>
              {/* Header — identity left, the committed move right */}
              <Stack
                direction="row"
                alignItems="flex-end"
                justifyContent="space-between"
                spacing={2.2}
                sx={{ flexWrap: 'wrap', rowGap: 1.5, mb: 2 }}
              >
                <Box>
                  <Typography sx={{ fontFamily: fonts.serif, fontSize: 21, fontWeight: 600, color: colors.textPrimary, mb: 0.5 }}>
                    {row.subTrait || row.trait}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: colors.textSecondary }}>
                    Efficacy {Math.round(row.team.efficacy)} · Effort {Math.round(row.team.effort)}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="flex-end" spacing={1.75}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: fonts.serif,
                        fontWeight: 600,
                        fontSize: 36,
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        color: colors.orange,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {current}
                    </Typography>
                    <Typography sx={{ ...type.monoLabel, mt: 0.4 }}>Today</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: fonts.serif, fontSize: 22, color: colors.sand300, pb: 2 }}>→</Typography>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: fonts.serif,
                        fontWeight: 600,
                        fontSize: 36,
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        color: colors.textPrimary,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {goal}
                    </Typography>
                    <Typography sx={{ ...type.monoLabel, mt: 0.4 }}>Goal</Typography>
                  </Box>
                </Stack>
              </Stack>

              <Box sx={{ borderTop: `1px solid ${colors.sand200}`, mb: 2 }} />

              {/* The commitments — behavior and ground, side by side */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.25fr) minmax(0, 1fr)' },
                  gap: 3.5,
                  alignItems: 'start',
                }}
              >
                <Box sx={{ borderLeft: `2px solid ${colors.orange}`, pl: 2 }}>
                  <Typography sx={{ ...type.monoLabel, mb: 0.6 }}>The visible behavior</Typography>
                  <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: colors.textPrimary, textWrap: 'pretty' }}>
                    {String(plan.branchBehavior || '').trim() ? `“${plan.branchBehavior}”` : 'No behavior recorded.'}
                  </Typography>
                </Box>
                <Box sx={{ borderLeft: `2px solid ${colors.sand200}`, pl: 2 }}>
                  <Typography sx={{ ...type.monoLabel, mb: 0.6 }}>The ground</Typography>
                  <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: colors.textPrimary, textWrap: 'pretty' }}>
                    {ground || 'No ground chosen yet.'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>

    </SnapshotShell>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------
const PRACTICE_GUIDE = {
  intro:
    'You are not starting over. You are carrying the signal into practice now — a plan for every trait, one visible behavior at a time.',
  edge: (label) =>
    `Start where the signal points. ${label} is asking for a different approach, not more effort — let the plan reflect that.`,
  lifting: (label) =>
    `${label} is already a gift — this plan is about keeping it deliberate so it grows instead of coasting.`,
  strength: (label) =>
    `${label} is strong because you work at it. This plan protects the strength — and you — from quiet erosion.`,
  snapshot:
    'The bearing is set. These promises hold until the next check-in reads the signal again — keep them small enough to keep.',
};

export default function PracticeStudio({ t, phases, onAdvancePhase }) {
  const { loaded, rows } = useBenchmarkData();
  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const campaignRecords = useMemo(() => readJson('campaignRecords', {}), []);
  const { setPageMessage, clearPageMessage } = useGuide();

  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  // Practice order: edge first (where the signal points), then the rest
  const orderedRows = useMemo(() => {
    if (!roles.ordered.length) return [];
    if (!roles.edge) return roles.ordered;
    return [roles.edge, ...roles.ordered.filter((r) => r.trait !== roles.edge.trait)];
  }, [roles]);

  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';
  const planKeyFor = useCallback(
    (traitKey) => `practiceStudio_${campaignKey}_${userKey}_${traitKey}`,
    [campaignKey, userKey]
  );

  // All per-trait plans, persisted under the existing practiceStudio_* keys
  const [plans, setPlans] = useState({});
  useEffect(() => {
    if (!orderedRows.length) return;
    setPlans((prev) => {
      const next = { ...prev };
      orderedRows.forEach((row) => {
        if (!next[row.trait]) {
          next[row.trait] = { ...EMPTY_PLAN, ...(readJson(planKeyFor(row.trait), null) || {}) };
        }
      });
      return next;
    });
  }, [orderedRows, planKeyFor]);

  const patchPlan = useCallback(
    (traitKey, patch) => {
      setPlans((prev) => {
        const plan = { ...(prev[traitKey] || EMPTY_PLAN), ...patch };
        writeJson(planKeyFor(traitKey), plan);
        return { ...prev, [traitKey]: plan };
      });
    },
    [planKeyFor]
  );

  const mode = phases.modeFor('practice');

  const chapters = useMemo(() => {
    const list = [
      { id: 'pr-intro', label: 'Why Practice', guide: () => PRACTICE_GUIDE.intro, pose: 'lantern' },
    ];
    orderedRows.forEach((row) => {
      const label = row.subTrait || row.trait;
      const role =
        row.trait === roles.edge?.trait ? 'edge' : row.trait === roles.lifting?.trait ? 'lifting' : 'strength';
      list.push({
        id: `pr-plan-${row.trait}`,
        label,
        row,
        guide: () => PRACTICE_GUIDE[role](label),
        pose: role === 'edge' ? 'point' : 'map',
      });
    });
    list.push({
      id: 'pr-commit',
      label: 'Commitment',
      guide: () => {
        const missing = orderedRows.filter((r) => !planComplete(plans[r.trait]));
        if (!missing.length) {
          return 'Promises, said out loud. Keep them small enough that you actually do them.';
        }
        return `Almost there — ${missing.map((r) => r.subTrait || r.trait).join(' and ')} still need${
          missing.length === 1 ? 's' : ''
        } a finished plan.`;
      },
      pose: 'map',
    });
    return list;
  }, [orderedRows, roles, plans]);

  const idx = Math.min(Math.max(phases.pages.practice || 0, 0), chapters.length - 1);
  const chapter = chapters[idx];
  const setIdx = (i) => phases.setPhasePage('practice', Math.min(Math.max(i, 0), chapters.length - 1));

  useEffect(() => {
    if (!orderedRows.length) return undefined;
    if (mode === 'snapshot') {
      setPageMessage({ text: PRACTICE_GUIDE.snapshot, pose: 'lantern', eyebrow: 'Practice' });
    } else {
      setPageMessage({ text: chapter.guide(), pose: chapter.pose, eyebrow: chapter.label });
    }
    return undefined;
  }, [mode, chapter, orderedRows.length, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  // Stamp the plans when the commitment is set, then advance the phase.
  const onCommit = () => {
    const stamp = new Date().toISOString();
    orderedRows.forEach((row) => {
      const plan = { ...(plans[row.trait] || EMPTY_PLAN), savedAt: stamp };
      writeJson(planKeyFor(row.trait), plan);
    });
    onAdvancePhase();
  };

  if (!loaded && !orderedRows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.sectionTitle, fontSize: 22, color: t.inkSoft }}>Loading practice…</Typography>
      </Box>
    );
  }

  if (!orderedRows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.eyebrow, mb: 1.6 }}>Practice</Typography>
        <Typography sx={{ ...type.lead, fontSize: { xs: 24, md: 28 }, lineHeight: 1.25, mb: 1.4 }}>
          Practice will open once your campaign is set up.
        </Typography>
      </Box>
    );
  }

  if (mode === 'snapshot') {
    return (
      <PracticeSnapshot
        orderedRows={orderedRows}
        plans={plans}
      />
    );
  }

  return (
    <WalkthroughStage chapters={chapters} idx={idx} setIdx={setIdx}>
      {chapter.id === 'pr-intro' && <PrIntroPage edgeRow={roles.edge} traitCount={orderedRows.length} />}
      {chapter.row && (
        <PrTraitPlanPage
          key={chapter.row.trait}
          row={chapter.row}
          plan={plans[chapter.row.trait] || EMPTY_PLAN}
          onPatch={(patch) => patchPlan(chapter.row.trait, patch)}
        />
      )}
      {chapter.id === 'pr-commit' && (
        <PrCommitAllPage
          orderedRows={orderedRows}
          plans={plans}
          chapterIndex={idx + 1}
          onAdvancePhase={onCommit}
        />
      )}
    </WalkthroughStage>
  );
}
