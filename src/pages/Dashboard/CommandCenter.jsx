import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ArrowForward, LockOutlined } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessTopRail from '../../components/ProcessTopRail';
import ProcessChapterHeader from '../../components/ProcessChapterHeader';
import { useFakeDashboardData } from '../../config/runtimeFlags';
import { buttons, colors, fonts, motion, radii, shadows, surfaces, type } from '../../styles/tokens';
import { useGuide } from '../../context/GuideContext';
import JourneyTab from './JourneyTab';
import { getCurrentJourneyIndexFromState } from './journey/journeyModel.js';
import SignalView from './cc/SignalView.jsx';
import EvidenceView from './cc/EvidenceView.jsx';
import PracticeStudio from './cc/PracticeStudio.jsx';
import { useBenchmarkData } from './cc/dashboardData.js';
import { useDebriefPhases, PHASE_ORDER } from './cc/phaseState.js';
import GatePage from './cc/GatePage.jsx';

// ============================================================================
// Tokens — thin page aliases over the canonical Cairn system.
// `cairn-theme.css` remains the source of truth; these are JS handles for sx.
// ============================================================================

const TOKENS = {
  bg: colors.surface2,
  surface: colors.surface1,
  surfaceMuted: colors.surface3,
  ink: colors.textPrimary,
  inkSoft: colors.textSecondary,
  inkFaint: 'color-mix(in srgb, var(--text-secondary) 72%, transparent)',
  accent: colors.orange,
  accentDeep: colors.orangeDeep,
  amber: colors.amberSoft,
  hairline: colors.borderSoft,
  hairlineSoft: 'color-mix(in srgb, var(--border-soft) 42%, transparent)',
  rule: 'color-mix(in srgb, var(--border-soft) 72%, transparent)',
  dockBg: colors.surface1,
  activeChipBg: colors.navy900,
  activeChipFg: colors.amberSoft,
  efficacy: colors.navy500,
  effort: colors.orange,
  barTrack: 'color-mix(in srgb, var(--border-soft) 42%, transparent)',
};

// ============================================================================
// Tabs
// ============================================================================

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'signal', label: 'Signal' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'practice', label: 'Practice' },
  { id: 'journey', label: 'Journey' },
];

// Map any incoming ?tab= value (current or legacy) onto one of our tab ids
const QUERY_TO_TAB = {
  today: 'today',
  'current-bearing': 'today',
  bearing: 'today',
  command: 'today',
  season: 'today',
  'campaign-details': 'today',
  campaign: 'today',
  signal: 'signal',
  signals: 'signal',
  'campaign-results': 'signal',
  results: 'signal',
  evidence: 'evidence',
  detailed: 'evidence',
  'detailed-results': 'evidence',
  practice: 'practice',
  plan: 'practice',
  'growth-plan': 'practice',
  journey: 'journey',
  'my-journey': 'journey',
};

// ============================================================================
// Helpers
// ============================================================================

const readJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const firstName = (full) => String(full || '').trim().split(/\s+/)[0] || '';

const seasonInterpretation = (season) =>
  season === 'Embarking'
    ? 'Your team has reflected the signal back. Now the work is to turn one insight into visible practice.'
    : 'The listening window is still forming the signal. Your work is to stay open, steady, and ready to understand what comes back.';

const seasonPrompts = {
  Embarking: [
    'What would make your next practice visible enough for your team to feel it?',
    'Where is one small behavior asking for more consistency from you?',
    'What is the difference between understanding the signal and living it?',
  ],
  Understanding: [
    'What might your team be trying to say before they have the perfect words for it?',
    'What would change if you listened first, before preparing your defense?',
    'Where are you being invited to understand instead of explain?',
  ],
};

const seasonPrompt = (season, seed = '') => {
  const bank = seasonPrompts[season] || seasonPrompts.Understanding;
  const sum = String(seed || season)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return bank[sum % bank.length];
};

const guideLine = (season, hasSignal) => {
  if (season === 'Embarking') {
    return hasSignal
      ? 'You are not starting over. You are carrying the signal into practice now - one visible behavior, held long enough for the team to recognize it.'
      : 'Begin with one behavior. The journey is built from small, kept commitments.';
  }
  return hasSignal
    ? 'Do not rush to fix the signal before you have understood it. Let the pattern become clear, then choose the practice.'
    : 'This is still a listening season. Stay close to the questions and let the signal gather shape.';
};

// ============================================================================
// Persistent Dock
// ============================================================================

function Dock({ activeTab, onSelect, t, status = {} }) {
  return (
    <Box
      role="navigation"
      aria-label="Command center"
      sx={{
        position: 'sticky',
        top: 80,
        zIndex: 12,
        width: '100%',
        bgcolor: t.dockBg,
        borderBottom: `1px solid ${t.hairline}`,
        boxShadow: shadows.none,
      }}
    >
      <Box
        sx={{
          maxWidth: 1180,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 1.2, md: 2.6 },
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const tabStatus = status[tab.id]; // 'done' | 'locked' | undefined
          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: { xs: 1.2, md: 1.6 },
                py: 1.1,
                opacity: tabStatus === 'locked' ? 0.45 : 1,
                color: isActive ? t.ink : t.inkSoft,
                transition: 'color 160ms ease',
                '&:hover': { color: t.ink },
                '&:focus-visible': {
                  outline: `2px solid ${t.accent}`,
                  outlineOffset: 3,
                  borderRadius: 4,
                },
                '&::after': isActive
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      bottom: -1,
                      height: 2,
                      borderRadius: 2,
                      bgcolor: t.accent,
                    }
                  : {},
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Manrope", "Inter", sans-serif',
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 600,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </Typography>
              {tabStatus === 'done' && (
                <Typography
                  component="span"
                  aria-label="Complete"
                  sx={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, color: colors.green, lineHeight: 1 }}
                >
                  ✓
                </Typography>
              )}
              {tabStatus === 'locked' && (
                <LockOutlined aria-label="Locked" sx={{ fontSize: 12, color: t.inkSoft }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ============================================================================
// Today Landing — the personal Season hero + actionable footer tiles
// ============================================================================

// The nine steps of the Compass journey, mirrored from the "Your Journey"
// chapter popover. A fresh dashboard arrival has the first four complete.
const JOURNEY_STEPS = [
  'Profile & Intake',
  'Behaviors & Instincts',
  'Campaign Creation',
  'Self & Team Assessment',
  'Review & Reflect',
  'Action Plan',
  'Check-In Assessment',
  'Revise Action Plan',
  'Final Assessment',
];

function JourneyChecklist({ completion, currentIndex, onOpenJourney }) {
  const doneCount = completion.filter(Boolean).length;
  return (
    <Box
      component="button"
      type="button"
      onClick={onOpenJourney}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        ...surfaces.cardFlat,
        p: { xs: 2.2, md: 2.5 },
        background: 'linear-gradient(150deg, var(--surface-1), var(--sand-50))',
        transition: motion.standard,
        '&:hover': {
          borderColor: colors.orange,
          boxShadow: shadows.card,
        },
        '&:focus-visible': {
          outline: `3px solid ${colors.ringFocus}`,
          outlineOffset: 3,
        },
      }}
    >
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.4 }}>
        <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep }}>Your Journey</Typography>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: colors.textSecondary }}>
          {doneCount} / {JOURNEY_STEPS.length}
        </Typography>
      </Stack>
      <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 20, mb: 1.6 }}>
        Where you are
      </Typography>

      <Stack spacing={0}>
        {JOURNEY_STEPS.map((label, idx) => {
          const isComplete = completion[idx];
          const isCurrent = idx === currentIndex;
          return (
            <Stack
              key={label}
              direction="row"
              alignItems="center"
              spacing={1.3}
              sx={{
                px: 1,
                py: 0.65,
                borderRadius: radii.md,
                bgcolor: isCurrent ? 'color-mix(in srgb, var(--orange) 8%, transparent)' : 'transparent',
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  borderRadius: radii.circle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isComplete ? colors.green : isCurrent ? colors.orange : colors.sand100,
                  border: isComplete || isCurrent ? 'none' : `1px solid ${colors.sand300}`,
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: isComplete || isCurrent ? 'white' : colors.textSecondary,
                }}
              >
                {isComplete ? '✓' : idx + 1}
              </Box>
              <Typography
                sx={{
                  flex: 1,
                  fontFamily: fonts.sans,
                  fontSize: 13.5,
                  fontWeight: isCurrent ? 700 : 500,
                  lineHeight: 1.15,
                  color: isCurrent ? colors.textPrimary : isComplete ? colors.green : colors.textSecondary,
                }}
              >
                {label}
              </Typography>
              {isCurrent && (
                <Typography
                  sx={{
                    fontFamily: fonts.mono,
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.orange,
                    bgcolor: 'color-mix(in srgb, var(--orange) 12%, transparent)',
                    px: 0.7,
                    py: 0.2,
                    borderRadius: radii.sm,
                  }}
                >
                  Now
                </Typography>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

// Shared shell for the three bottom focal cards.
const focalCardSx = (interactive) => ({
  ...(interactive ? { all: 'unset', cursor: 'pointer' } : {}),
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  width: '100%',
  ...surfaces.cardFlat,
  p: { xs: 2.2, md: 2.5 },
  minHeight: 210,
  transition: motion.standard,
  ...(interactive
    ? {
        '&:hover': {
          borderColor: colors.orange,
          boxShadow: shadows.card,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `3px solid ${colors.ringFocus}`,
          outlineOffset: 3,
        },
      }
    : {}),
});

function SignalFocalCard({ traitLabel, score, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        ...focalCardSx(true),
        background:
          'linear-gradient(150deg, color-mix(in srgb, var(--amber-soft) 22%, var(--surface-1)), var(--surface-1))',
        borderColor: colors.orange,
      }}
    >
      <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep, mb: 0.4 }}>Read the Signal</Typography>
      {traitLabel ? (
        <>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontWeight: 600,
                fontSize: { xs: 64, md: 76 },
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                color: colors.orange,
              }}
            >
              {score}
            </Typography>
          </Box>
          <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 19, lineHeight: 1.15 }}>
            {traitLabel}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.8 }}>
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.orange }}>
              Open Signal
            </Typography>
            <ArrowForward sx={{ fontSize: 14, color: colors.orange }} />
          </Stack>
        </>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 20 }}>Signal forming</Typography>
          <Typography sx={{ ...type.bodyMuted, mt: 0.6 }}>
            The campaign is still gathering enough feedback to read.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function EvidenceFocalCard({ statement, onClick }) {
  return (
    <Box component="button" type="button" onClick={onClick} sx={focalCardSx(true)}>
      <Typography sx={{ ...type.eyebrow, mb: 0.6 }}>Review Evidence</Typography>
      {statement ? (
        <>
          <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, fontSize: 8.5, mb: 0.6 }}>
            Lowest-scoring statement
          </Typography>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: { xs: 16, md: 17 },
              lineHeight: 1.3,
              color: colors.textPrimary,
              flex: 1,
            }}
          >
            “{statement.text}”
          </Typography>
          <Stack direction="row" spacing={2.4} sx={{ mt: 1.4 }}>
            <Box>
              <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, fontSize: 8.5 }}>Efficacy</Typography>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>
                {Math.round(statement.efficacy)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, fontSize: 8.5 }}>Effort</Typography>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>
                {Math.round(statement.effort)}
              </Typography>
            </Box>
          </Stack>
        </>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 20 }}>Evidence pending</Typography>
          <Typography sx={{ ...type.bodyMuted, mt: 0.6 }}>
            Statement-level detail appears once feedback lands.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function SitFocalCard({ prompt }) {
  return (
    <Box
      sx={{
        ...focalCardSx(false),
        background: 'linear-gradient(150deg, var(--sand-50), var(--surface-1))',
      }}
    >
      <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, mb: 1 }}>Sit with this</Typography>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ ...type.sectionTitle, fontStyle: 'italic', fontSize: { xs: 21, md: 23 }, lineHeight: 1.28 }}>
          {prompt}
        </Typography>
      </Box>
    </Box>
  );
}

function TodayLanding({ t, onNavigate }) {
  const userInfo = readJson('userInfo', {});
  const focusAreas = readJson('focusAreas', []);
  const selectedTraits = readJson('selectedTraits', []);
  const campaignRecords = readJson('campaignRecords', {});
  const actionPlansByCampaign = readJson('actionPlansByCampaign', {});
  const { setPageMessage, clearPageMessage } = useGuide();
  const { rows } = useBenchmarkData();

  const teamCampaignClosed =
    useFakeDashboardData ||
    String(campaignRecords?.teamCampaignClosed || '').toLowerCase() === 'true';
  const season = teamCampaignClosed ? 'Embarking' : 'Understanding';
  const chapter = teamCampaignClosed ? 'VII' : 'VI';
  const name = firstName(userInfo?.name);

  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';
  const plans = actionPlansByCampaign?.[campaignKey]?.[userKey]?.plans || {};
  const planEntries = Object.entries(plans || {}).flatMap(([trait, subtraits]) =>
    Object.entries(subtraits || {}).map(([subTrait, plan]) => ({ trait, subTrait, plan }))
  );
  const planCount = planEntries.filter(({ plan }) =>
    String(plan?.commitment || plan?.guidedAnswers?.behaviorCommitment || '').trim()
  ).length;
  const primaryFocus =
    focusAreas?.find?.((area) => selectedTraits?.includes(area.id)) || focusAreas?.[0] || null;
  const focusLabel = primaryFocus?.subTraitName || primaryFocus?.traitName || primaryFocus?.name || '';

  const promptSeed = `${campaignKey}:${season}:${focusLabel}:${planCount}`;
  const sitPrompt = seasonPrompt(season, promptSeed);
  const nextBestStep = teamCampaignClosed
    ? planCount > 0
      ? 'Return to the signal and choose what still needs practice.'
      : 'Choose the one behavior your team should be able to feel next.'
    : 'Let the listening window do its work, then come back to read the pattern.';

  useEffect(() => {
    setPageMessage({
      text: guideLine(season, teamCampaignClosed),
      pose: season === 'Embarking' ? 'map' : 'read',
      eyebrow: season,
    });
    return () => clearPageMessage();
  }, [season, teamCampaignClosed, setPageMessage, clearPageMessage]);

  // ---- Focal data points for the bottom cards -------------------------------
  const teamRows = rows.filter((r) => r.team);
  // Read the Signal → the trait carrying the strongest signal (biggest gap,
  // then highest score) shown as a single captivating Compass number.
  const primaryTrait = teamRows.length
    ? [...teamRows].sort((a, b) => {
        const ad = Math.abs(a.team.delta);
        const bd = Math.abs(b.team.delta);
        if (bd !== ad) return bd - ad;
        return b.team.lepScore - a.team.lepScore;
      })[0]
    : null;
  const signalTraitLabel = primaryTrait ? primaryTrait.subTrait || primaryTrait.trait : '';
  const signalScore = primaryTrait ? Math.round(primaryTrait.team.lepScore) : null;

  // Review Evidence → the single lowest-scoring statement across every trait.
  let lowestStatement = null;
  teamRows.forEach((r) => {
    (r.team.statements || []).forEach((s) => {
      if (!s || !String(s.text || '').trim()) return;
      if (!lowestStatement || s.lepScore < lowestStatement.lepScore) {
        lowestStatement = { ...s, trait: r.subTrait || r.trait };
      }
    });
  });

  // Journey checklist — a fresh dashboard arrival has the first four complete.
  const journeyCompletion = [
    true,
    true,
    true,
    teamCampaignClosed,
    planCount > 0,
    planCount > 0,
    false,
    false,
    false,
  ];
  const firstIncomplete = journeyCompletion.findIndex((c) => !c);
  const journeyCurrentIndex = firstIncomplete === -1 ? JOURNEY_STEPS.length - 1 : firstIncomplete;

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2.4, md: 4 }, py: { xs: 4, md: 5 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) 390px' },
          gap: { xs: 2.6, md: 4 },
          alignItems: 'stretch',
          mb: { xs: 2.6, md: 3.2 },
        }}
      >
        <Box
          sx={{
            ...surfaces.card,
            p: { xs: 2.6, md: 4 },
            overflow: 'hidden',
            position: 'relative',
            background:
              'radial-gradient(circle at 92% 10%, color-mix(in srgb, var(--amber-soft) 22%, transparent), transparent 34%), linear-gradient(150deg, var(--surface-1), var(--sand-50))',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.2, flexWrap: 'wrap', rowGap: 1 }}>
            <Box
              sx={{
                px: 1.4,
                py: 0.6,
                borderRadius: radii.pill,
                border: `1px solid ${colors.borderSoft}`,
                bgcolor: colors.surface1,
              }}
            >
              <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep }}>
                Chapter {chapter}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.4,
                py: 0.6,
                borderRadius: radii.pill,
                bgcolor: colors.navy900,
                color: colors.amberSoft,
              }}
            >
              <Typography sx={{ ...type.eyebrow, color: 'inherit' }}>{season}</Typography>
            </Box>
          </Stack>

          <Typography
            component="h1"
            sx={{
              fontFamily: fonts.serif,
              fontSize: { xs: 34, md: 50 },
              fontWeight: 500,
              letterSpacing: '-0.035em',
              lineHeight: 1,
              color: t.ink,
              maxWidth: 720,
              mb: 1.6,
            }}
          >
            {name || 'Leader'}, you are in the{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: colors.orange }}>
              {season}
            </Box>{' '}
            season.
          </Typography>

          <Typography sx={{ ...type.italicBody, fontSize: { xs: 17, md: 20 }, maxWidth: 720, color: t.inkSoft, mb: 3 }}>
            {seasonInterpretation(season)}
          </Typography>

          <Box
            sx={{
              borderLeft: `2px solid ${colors.orange}`,
              pl: 2.4,
              py: 0.8,
              mb: 3,
              maxWidth: 680,
            }}
          >
            <Typography sx={{ ...type.eyebrow, color: t.inkFaint, mb: 0.8 }}>Next best step</Typography>
            <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: { xs: 20, md: 24 }, lineHeight: 1.22 }}>
              {nextBestStep}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Box component="button" type="button" onClick={() => onNavigate(teamCampaignClosed ? 'signal' : 'journey')} sx={{ all: 'unset', cursor: 'pointer', ...buttons.primary }}>
              {teamCampaignClosed ? 'Read the Signal' : 'View the Journey'}
            </Box>
            <Box component="button" type="button" onClick={() => onNavigate('practice')} sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}>
              Continue Practice
            </Box>
          </Stack>
        </Box>

        <JourneyChecklist
          completion={journeyCompletion}
          currentIndex={journeyCurrentIndex}
          onOpenJourney={() => onNavigate('journey')}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 1.4, md: 1.8 },
          alignItems: 'stretch',
        }}
      >
        <SignalFocalCard
          traitLabel={signalTraitLabel}
          score={signalScore}
          onClick={() => onNavigate('signal')}
        />
        <EvidenceFocalCard statement={lowestStatement} onClick={() => onNavigate('evidence')} />
        <SitFocalCard prompt={sitPrompt} />
      </Box>
    </Box>
  );
}

// ============================================================================
// Section frame for shimmed pages — keeps existing components in a tidy column
// ============================================================================

function SectionFrame({ t, children }) {
  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          bgcolor: t.surface,
          border: `1px solid ${t.hairline}`,
          borderRadius: 2.5,
          p: { xs: 2, md: 3 },
          boxShadow: shadows.card,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// ============================================================================
// Main: CommandCenter
// ============================================================================

export default function CommandCenter() {
  const t = TOKENS;
  const location = useLocation();
  const navigate = useNavigate();

  // Read selectedAgent from localStorage (same pattern as legacy Dashboard)
  const selectedAgent = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('latestFormData') || '{}');
      return stored?.selectedAgent || 'balancedMentor';
    } catch {
      return 'balancedMentor';
    }
  }, []);

  // Resolve initial tab from ?tab=
  const initialTab = useMemo(() => {
    const raw = String(new URLSearchParams(location.search || '').get('tab') || '')
      .trim()
      .toLowerCase();
    return QUERY_TO_TAB[raw] || 'today';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab);

  // Keep state in sync if the URL changes (back/forward, dev panel deep-links)
  useEffect(() => {
    const raw = String(new URLSearchParams(location.search || '').get('tab') || '')
      .trim()
      .toLowerCase();
    const next = QUERY_TO_TAB[raw] || 'today';
    if (next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const goToTab = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search || '');
    params.set('tab', tabId);
    navigate(`${location.pathname}?${params.toString()}`, { replace: false });
    // Scroll back to top so the page change feels intentional
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  // Signal → Evidence → Practice journey state (gating, snapshots, dock badges)
  const phases = useDebriefPhases();

  // Marks the phase complete and carries the user through the door to the
  // next phase's first chapter.
  const advancePhase = (phase) => {
    const nextPhase = phases.completePhase(phase);
    if (nextPhase) goToTab(nextPhase);
  };

  const renderActive = () => {
    if (PHASE_ORDER.includes(activeTab) && phases.isGated(activeTab)) {
      return <GatePage phase={activeTab} onGoTab={goToTab} />;
    }
    switch (activeTab) {
      case 'signal':
        return (
          <SignalView
            t={t}
            selectedAgent={selectedAgent}
            onOpenEvidence={() => goToTab('evidence')}
            phases={phases}
            onAdvancePhase={() => advancePhase('signal')}
          />
        );
      case 'evidence':
        return (
          <EvidenceView
            t={t}
            selectedAgent={selectedAgent}
            phases={phases}
            onAdvancePhase={() => advancePhase('evidence')}
            onOpenPractice={() => goToTab('practice')}
          />
        );
      case 'practice':
        return (
          <PracticeStudio
            t={t}
            onOpenJourney={() => goToTab('journey')}
            phases={phases}
            onAdvancePhase={() => advancePhase('practice')}
          />
        );
      case 'journey':
        return <JourneyTab t={t} />;
      case 'today':
      default:
        return <TodayLanding t={t} onNavigate={goToTab} />;
    }
  };

  const chapterIndex = activeTab === 'practice'
    ? 5
    : activeTab === 'signal' || activeTab === 'evidence'
      ? 4
      : getCurrentJourneyIndexFromState();

  const showJourneyHeader = ['signal', 'evidence', 'practice'].includes(activeTab);
  const headerTitleOverride = activeTab === 'evidence' ? 'The Evidence' : '';
  const headerSubtitleOverride = activeTab === 'evidence'
    ? 'Read the statements behind the signal before deciding what to practice.'
    : '';

  const headerMeta = activeTab === 'practice'
    ? (
      <Box
        component="button"
        type="button"
        onClick={() => phases.startReplay('practice')}
        sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}
      >
        ↻ Revise the plans
      </Box>
    )
    : activeTab === 'evidence'
      ? (
        <Box
          component="button"
          type="button"
          onClick={() => phases.startReplay('evidence')}
          sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}
        >
          ↻ Walk through again
        </Box>
      )
      : (
        <Box
          component="button"
          type="button"
          onClick={() => phases.startReplay('signal')}
          sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}
        >
          ↻ Walk through again
        </Box>
      );

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        bgcolor: t.bg,
        color: t.ink,
        overflowX: 'hidden',
      }}
    >
      <ProcessTopRail hideChapterHeader />
      <Dock activeTab={activeTab} onSelect={goToTab} t={t} status={phases.dockStatus} />
      {showJourneyHeader && (
        <ProcessChapterHeader
          chapterIndex={chapterIndex}
          metaOverride={headerMeta}
          titleOverride={headerTitleOverride}
          subtitleOverride={headerSubtitleOverride}
          contentMaxWidth={1180}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>{renderActive()}</Box>
    </Box>
  );
}
