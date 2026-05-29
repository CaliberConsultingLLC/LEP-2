import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography, TextField, Button, Slider } from '@mui/material';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';
import { useBenchmarkData } from './dashboardData.js';
import { getRootRecommendations } from './rootRecommendations.js';
import { useGuide } from '../../../context/GuideContext';

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
  } catch {}
};

// ----------------------------------------------------------------------------
// Step model
// ----------------------------------------------------------------------------

const STEPS = [
  {
    id: 'envision',
    label: 'Envision',
    eyebrow: 'In their shoes',
    headline: 'Step into the room they were in.',
    body: "Before you decide what to do, sit for a moment with what your team experienced. Don't fix it yet — describe it.",
    guide: 'Step One — Envision. Sit with what they experienced before you decide anything. The plan is sturdier when it begins with their room, not yours.',
    pose: 'lantern',
  },
  {
    id: 'root',
    label: 'Root',
    eyebrow: 'Train · Educate · Ground',
    headline: 'Where will you grow your understanding?',
    body: 'A practice without learning becomes a guess. Pick one source you will actually return to.',
    guide: 'Step Two — Root. Pick one source you’ll actually return to. A book you finish beats a stack you don’t.',
    pose: 'read',
  },
  {
    id: 'branch',
    label: 'Branch',
    eyebrow: 'The behavior shift',
    headline: 'What will your team see different this week?',
    body: 'Translate your understanding into one observable behavior — small, repeatable, visible.',
    guide: 'Step Three — Branch. One observable behavior. If your team can’t see it, it isn’t real yet.',
    pose: 'point',
  },
  {
    id: 'commit',
    label: 'Commit',
    eyebrow: 'Set the bearing',
    headline: 'What score will you reach for?',
    body: 'Name a target your team would feel by next cycle. Honest, not heroic.',
    guide: 'Step Four — Commit. A 6–10 point lift is meaningful. Beyond that becomes pressure, not practice.',
    pose: 'map',
  },
];

// ----------------------------------------------------------------------------
// Stepper rail
// ----------------------------------------------------------------------------

function StepperRail({ stepIndex, t, onJump, completedThrough }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0}
      sx={{ mb: 3, gap: { xs: 1, md: 2.4 } }}
    >
      {STEPS.map((step, idx) => {
        const isActive = idx === stepIndex;
        const isComplete = idx <= completedThrough && idx < stepIndex;
        const isReachable = idx <= completedThrough + 1;
        return (
          <Stack key={step.id} direction="row" alignItems="center" spacing={{ xs: 1, md: 1.6 }}>
            <Box
              component="button"
              type="button"
              disabled={!isReachable}
              onClick={() => isReachable && onJump(idx)}
              aria-current={isActive ? 'step' : undefined}
              sx={{
                all: 'unset',
                cursor: isReachable ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                opacity: isReachable ? 1 : 0.55,
                '&:focus-visible': { outline: `2px solid ${t.accent}`, outlineOffset: 4, borderRadius: 4 },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isActive ? t.accent : isComplete ? t.surface : 'transparent',
                  color: isActive ? '#FFF' : isComplete ? t.ink : t.inkFaint,
                  border: isActive ? 'none' : `1px solid ${isComplete ? t.hairline : t.hairlineSoft}`,
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 11,
                  boxShadow: isActive ? '0 4px 12px rgba(224,122,63,0.28)' : 'none',
                }}
              >
                {isComplete ? <Check sx={{ fontSize: 13 }} /> : idx + 1}
              </Box>
              <Typography
                sx={{
                  display: { xs: 'none', sm: 'inline' },
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: isActive ? t.ink : t.inkSoft,
                }}
              >
                {step.label}
              </Typography>
            </Box>
            {idx < STEPS.length - 1 && (
              <Box aria-hidden sx={{ width: { xs: 14, md: 28 }, height: 1, bgcolor: t.hairline }} />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

// ----------------------------------------------------------------------------
// Reusable card frame
// ----------------------------------------------------------------------------

function StudyCard({ t, eyebrow, headline, body, children }) {
  return (
    <Box
      sx={{
        bgcolor: t.surface,
        border: `1px solid ${t.hairline}`,
        borderRadius: 3,
        p: { xs: 2.4, md: 3.4 },
        boxShadow: '0 8px 28px rgba(15,28,46,0.06)',
        maxWidth: 960,
        mx: 'auto',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: t.accentDeep,
          mb: 1.1,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontSize: { xs: 22, md: 27 },
          letterSpacing: '-0.018em',
          color: t.ink,
          lineHeight: 1.18,
          fontWeight: 500,
          mb: 1,
        }}
      >
        {headline}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontSize: { xs: 15, md: 16 },
          lineHeight: 1.5,
          color: t.inkSoft,
          mb: 2.4,
        }}
      >
        {body}
      </Typography>
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Step bodies
// ----------------------------------------------------------------------------

const PROMPT_FIELD_SX = (t) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Fraunces", Georgia, serif',
    fontSize: 16,
    lineHeight: 1.55,
    color: t.ink,
    bgcolor: t.surface,
    borderRadius: 2,
    '& fieldset': { borderColor: t.hairline },
    '&:hover fieldset': { borderColor: t.inkSoft },
    '&.Mui-focused fieldset': { borderColor: t.accent },
  },
  '& textarea::placeholder, & input::placeholder': { color: t.inkFaint, opacity: 1 },
});

function EnvisionStep({ t, plan, onChange }) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber, mb: 0.7 }}>
          What were they experiencing?
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="What did the meeting / message / pace feel like for them — not for you?"
          value={plan.envisionExperience || ''}
          onChange={(e) => onChange({ envisionExperience: e.target.value })}
          sx={PROMPT_FIELD_SX(t)}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber, mb: 0.7 }}>
          What might they have wanted from you?
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="The simplest thing they were hoping you'd do or say."
          value={plan.envisionWant || ''}
          onChange={(e) => onChange({ envisionWant: e.target.value })}
          sx={PROMPT_FIELD_SX(t)}
        />
      </Box>
    </Stack>
  );
}

function RootStep({ t, plan, onChange, recommendations }) {
  return (
    <Stack spacing={1.8}>
      <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber }}>
        Suggested ground · pick one or write your own
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.2 }}>
        {recommendations.map((rec) => {
          const id = `${rec.type}::${rec.title}`;
          const isSelected = plan.rootSelection === id;
          return (
            <Box
              key={id}
              component="button"
              type="button"
              onClick={() => onChange({ rootSelection: id, rootCustom: '' })}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'block',
                p: 1.6,
                borderRadius: 2,
                border: `1px solid ${isSelected ? t.accent : t.hairline}`,
                bgcolor: isSelected ? t.surfaceMuted : 'transparent',
                transition: 'all 160ms ease',
                '&:hover': { borderColor: isSelected ? t.accent : t.inkSoft },
                '&:focus-visible': { outline: `2px solid ${t.accent}`, outlineOffset: 2 },
              }}
            >
              <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accentDeep, mb: 0.4 }}>
                {rec.type}
              </Typography>
              <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 15, color: t.ink, lineHeight: 1.3, fontWeight: 600, mb: 0.3 }}>
                {rec.title}
              </Typography>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: 12, color: t.inkSoft, mb: 0.6 }}>
                {rec.by}
              </Typography>
              <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 13, color: t.inkSoft, lineHeight: 1.4 }}>
                {rec.why}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box>
        <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber, mb: 0.7 }}>
          Or name your own ground
        </Typography>
        <TextField
          fullWidth
          placeholder="A book, a course, a person, a daily practice you'll commit to."
          value={plan.rootCustom || ''}
          onChange={(e) => onChange({ rootCustom: e.target.value, rootSelection: '' })}
          sx={PROMPT_FIELD_SX(t)}
        />
      </Box>
    </Stack>
  );
}

function BranchStep({ t, plan, onChange, focusLabel }) {
  return (
    <Stack spacing={1.6}>
      {focusLabel && (
        <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: 12.5, color: t.inkSoft }}>
          The behavior should serve <b style={{ color: t.ink }}>{focusLabel}</b>.
        </Typography>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber, mb: 0.7 }}>
            One observable behavior
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="In the next two weeks I will…"
            value={plan.branchBehavior || ''}
            onChange={(e) => onChange({ branchBehavior: e.target.value })}
            sx={PROMPT_FIELD_SX(t)}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber, mb: 0.7 }}>
            What makes it visible to them?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="A ritual, a forum, a phrase they'll notice without you pointing."
            value={plan.branchSignal || ''}
            onChange={(e) => onChange({ branchSignal: e.target.value })}
            sx={PROMPT_FIELD_SX(t)}
          />
        </Box>
      </Stack>
    </Stack>
  );
}

function CommitStep({ t, plan, onChange, currentSignal }) {
  const goal = Number.isFinite(plan.commitGoal) ? plan.commitGoal : Math.min(95, Math.round((currentSignal || 50) + 8));
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.4} alignItems="stretch">
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.6 }}>
          <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber }}>
            Score goal
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={0.8}>
            <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 32, fontWeight: 600, color: t.accent, lineHeight: 1 }}>
              {goal}
            </Typography>
            {Number.isFinite(currentSignal) && (
              <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 10.5, color: t.inkFaint, letterSpacing: '0.12em' }}>
                from {Math.round(currentSignal)}
              </Typography>
            )}
          </Stack>
        </Stack>
        <Slider
          value={goal}
          onChange={(_, val) => onChange({ commitGoal: Array.isArray(val) ? val[0] : val })}
          min={0}
          max={100}
          step={1}
          aria-label="Score goal"
          sx={{
            color: t.accent,
            '& .MuiSlider-rail': { color: t.barTrack || 'rgba(15,28,46,0.06)' },
            '& .MuiSlider-thumb': {
              boxShadow: '0 4px 14px rgba(224,122,63,0.32)',
              '&:hover, &.Mui-active': { boxShadow: '0 6px 18px rgba(224,122,63,0.42)' },
            },
          }}
        />
        <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: 12, color: t.inkSoft, mt: 0.4 }}>
          A 6–10 point lift in a cycle is meaningful and felt. Beyond that becomes pressure, not practice.
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.amber, mb: 0.7 }}>
          One sentence to your team
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="If I were to tell my team what to expect from me — in their language — I would say…"
          value={plan.commitMessage || ''}
          onChange={(e) => onChange({ commitMessage: e.target.value })}
          sx={PROMPT_FIELD_SX(t)}
        />
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------------
// Summary card (after Commit)
// ----------------------------------------------------------------------------

function SummaryCard({ t, plan, focusLabel, onEdit }) {
  const items = [
    { k: 'In their shoes', v: plan.envisionExperience || '—' },
    { k: 'What they wanted', v: plan.envisionWant || '—' },
    { k: 'Ground', v: plan.rootCustom || plan.rootSelection?.split('::').pop() || '—' },
    { k: 'Behavior', v: plan.branchBehavior || '—' },
    { k: 'Visible signal', v: plan.branchSignal || '—' },
    { k: 'Score goal', v: Number.isFinite(plan.commitGoal) ? `${plan.commitGoal}` : '—' },
    { k: 'Message to team', v: plan.commitMessage || '—' },
  ];

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.accentDeep, mb: 1.6 }}>
        Practice saved
      </Typography>
      <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: { xs: 26, md: 32 }, color: t.ink, lineHeight: 1.18, fontWeight: 500, mb: 1.4 }}>
        Your bearing is set.
      </Typography>
      {focusLabel && (
        <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: 13.5, color: t.inkSoft, mb: 4 }}>
          In service of <b style={{ color: t.ink }}>{focusLabel}</b>.
        </Typography>
      )}
      <Stack spacing={2.4} divider={<Box sx={{ height: 1, bgcolor: t.hairlineSoft }} />}>
        {items.map((it) => (
          <Box key={it.k}>
            <Typography sx={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.inkFaint, mb: 0.6 }}>
              {it.k}
            </Typography>
            <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 16, color: t.ink, lineHeight: 1.5 }}>
              {it.v}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={1.4} sx={{ mt: 5 }}>
        <Button
          onClick={onEdit}
          startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: t.inkSoft,
            '&:hover': { color: t.ink, bgcolor: 'transparent' },
          }}
        >
          Revisit
        </Button>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

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

export default function PracticeStudio({ t, onOpenJourney }) {
  const { rows } = useBenchmarkData();
  const focusAreas = useMemo(() => readJson('focusAreas', []), []);
  const selectedTraits = useMemo(() => readJson('selectedTraits', []), []);
  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const campaignRecords = useMemo(() => readJson('campaignRecords', {}), []);
  const { setPageMessage, clearPageMessage } = useGuide();

  // Pick the focus trait the leader chose (or fallback to first row)
  const focusRow = useMemo(() => {
    if (!rows.length) return null;
    const matchedFocus = focusAreas?.find?.((a) => selectedTraits?.includes?.(a.id));
    if (matchedFocus) {
      const match = rows.find(
        (r) =>
          r.subTrait === matchedFocus.subTraitName ||
          r.trait === matchedFocus.traitName
      );
      if (match) return match;
    }
    return rows[0];
  }, [rows, focusAreas, selectedTraits]);

  const focusLabel = focusRow?.subTrait || focusRow?.trait || '';
  const recommendations = useMemo(() => getRootRecommendations(focusLabel), [focusLabel]);

  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';
  const planKey = `practiceStudio_${campaignKey}_${userKey}_${focusRow?.trait || 'none'}`;

  const [plan, setPlan] = useState(() => {
    const stored = readJson(planKey, null);
    return { ...EMPTY_PLAN, ...(stored || {}) };
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Persist on change
  useEffect(() => {
    writeJson(planKey, plan);
  }, [plan, planKey]);

  // Feed step-aware talking points into the anchored guide overlay
  useEffect(() => {
    if (showSummary) {
      setPageMessage({
        text: focusLabel
          ? `Bearing set on ${focusLabel}. The promise is yours now — keep it small enough that you do it.`
          : 'Bearing set. The promise is yours now — keep it small enough that you do it.',
        pose: 'lantern',
        eyebrow: 'Practice saved',
      });
      return;
    }
    const step = STEPS[stepIndex];
    if (!step) return;
    const stepText = focusLabel
      ? `On ${focusLabel}. ${step.guide}`
      : step.guide;
    setPageMessage({ text: stepText, pose: step.pose, eyebrow: step.label });
  }, [stepIndex, showSummary, focusLabel, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  const updatePlan = (patch) => setPlan((prev) => ({ ...prev, ...patch }));

  const completedThrough = useMemo(() => {
    let last = -1;
    if (plan.envisionExperience?.trim() || plan.envisionWant?.trim()) last = 0;
    if (plan.rootSelection || plan.rootCustom?.trim()) last = Math.max(last, 1);
    if (plan.branchBehavior?.trim()) last = Math.max(last, 2);
    if (Number.isFinite(plan.commitGoal) || plan.commitMessage?.trim()) last = Math.max(last, 3);
    return last;
  }, [plan]);

  const canAdvance = useMemo(() => {
    switch (STEPS[stepIndex].id) {
      case 'envision':
        return Boolean(plan.envisionExperience?.trim() || plan.envisionWant?.trim());
      case 'root':
        return Boolean(plan.rootSelection || plan.rootCustom?.trim());
      case 'branch':
        return Boolean(plan.branchBehavior?.trim());
      case 'commit':
        return Number.isFinite(plan.commitGoal);
      default:
        return false;
    }
  }, [stepIndex, plan]);

  const onContinue = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Save and show summary
      const stamped = { ...plan, savedAt: new Date().toISOString() };
      setPlan(stamped);
      writeJson(planKey, stamped);
      setShowSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onJump = (idx) => {
    setShowSummary(false);
    setStepIndex(idx);
  };

  const onEditFromSummary = () => {
    setShowSummary(false);
    setStepIndex(STEPS.length - 1);
  };

  if (!rows.length) {
    return (
      <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 3, md: 6 }, py: { xs: 6, md: 8 } }}>
        <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 22, color: t.inkSoft }}>
          Practice will open once your campaign is set up.
        </Typography>
      </Box>
    );
  }

  if (showSummary) {
    return (
      <Box sx={{ maxWidth: 920, mx: 'auto', px: { xs: 3, md: 6 }, py: { xs: 6, md: 8 } }}>
        <SummaryCard t={t} plan={plan} focusLabel={focusLabel} onEdit={onEditFromSummary} />
        {onOpenJourney && (
          <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
            <Button
              onClick={onOpenJourney}
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              sx={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: t.accent,
                '&:hover': { color: t.accentDeep, bgcolor: 'transparent' },
              }}
            >
              Carry it into your journey
            </Button>
          </Stack>
        )}
      </Box>
    );
  }

  const step = STEPS[stepIndex];
  const currentSignal = focusRow?.team?.lepScore ?? null;

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', px: { xs: 2.4, md: 5 }, py: { xs: 3.4, md: 4.4 } }}>
      {/* Compact header — eyebrow + lead in a single tight cluster */}
      <Stack alignItems="center" spacing={0.8} sx={{ mb: 2.4 }}>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: t.accentDeep,
          }}
        >
          Practice · A guided commitment
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: { xs: 22, md: 26 },
            color: t.ink,
            lineHeight: 1.2,
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 720,
          }}
        >
          {focusLabel ? (
            <>
              Move on{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: t.accent }}>
                {focusLabel}
              </Box>
              , one card at a time.
            </>
          ) : (
            'Move on one behavior, one card at a time.'
          )}
        </Typography>
      </Stack>

      <StepperRail stepIndex={stepIndex} t={t} onJump={onJump} completedThrough={completedThrough} />

      <StudyCard t={t} eyebrow={step.eyebrow} headline={step.headline} body={step.body}>
        {step.id === 'envision' && <EnvisionStep t={t} plan={plan} onChange={updatePlan} />}
        {step.id === 'root' && <RootStep t={t} plan={plan} onChange={updatePlan} recommendations={recommendations} />}
        {step.id === 'branch' && <BranchStep t={t} plan={plan} onChange={updatePlan} focusLabel={focusLabel} />}
        {step.id === 'commit' && <CommitStep t={t} plan={plan} onChange={updatePlan} currentSignal={currentSignal} />}

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, pt: 2.2, borderTop: `1px solid ${t.hairlineSoft}` }}>
          <Button
            onClick={onBack}
            disabled={stepIndex === 0}
            startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
            sx={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: t.inkSoft,
              '&:hover': { color: t.ink, bgcolor: 'transparent' },
              '&.Mui-disabled': { color: t.inkFaint },
            }}
          >
            Back
          </Button>
          <Button
            onClick={onContinue}
            disabled={!canAdvance}
            endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            sx={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              px: 2.4,
              py: 1.1,
              borderRadius: 999,
              color: '#FFF',
              bgcolor: t.accent,
              '&:hover': { bgcolor: t.accentDeep },
              '&.Mui-disabled': { bgcolor: t.hairline, color: t.inkFaint },
            }}
          >
            {stepIndex === STEPS.length - 1 ? 'Set bearing' : 'Continue'}
          </Button>
        </Stack>
      </StudyCard>
    </Box>
  );
}
