import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessTopRail from '../../components/ProcessTopRail';
import CompassLayout from '../../components/CompassLayout';
import { buttons, colors, fonts, motion, radii, shadows, surfaces, type } from '../../styles/tokens';
import { useGuide } from '../../context/GuideContext';
import { spokenGuide } from '../../data/guideContent';
import JourneyTab from './JourneyTab';
import { getCurrentJourneyIndexFromState, getJourneyCompletion, JOURNEY_CHAPTER_COUNT, JOURNEY_ROMAN, JOURNEY_STATIONS } from './journey/journeyModel.js';
import SignalView from './cc/SignalView.jsx';
import EvidenceView from './cc/EvidenceView.jsx';
import PracticeStudio from './cc/PracticeStudio.jsx';
import { useBenchmarkData } from './cc/dashboardData.js';
import { useResultsIntelligence } from './cc/useResultsIntelligence.js';
import { getDebriefScope, useDebriefPhases, PHASE_ORDER } from './cc/phaseState.js';
import { deriveTraitRoles } from './cc/debriefContent.js';
import GatePage from './cc/GatePage.jsx';
import { isDemoSession } from '../../utils/demoMode';
import MetricHint from '../../components/MetricHint';
import { SCORE_HINTS } from '../../data/scoreGlossary';

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

const guideLine = (season, hasSignal) => {
  if (season === 'Embarking') {
    return hasSignal
      ? 'The signal, the evidence, and the plan belong in one view now. Hold one visible behavior long enough for the team to recognize it.'
      : 'Begin with one behavior. The journey is built from small, kept commitments.';
  }
  return hasSignal
    ? 'Do not rush to fix the signal before you have understood it. Let the pattern become clear, then choose the practice — it stays here with the reading.'
    : 'This is still a listening season. Stay close to the questions and let the signal gather shape.';
};

// ============================================================================
// Today Landing — the personal Season hero + actionable footer tiles
// ============================================================================

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
          {doneCount} / {JOURNEY_STATIONS.length}
        </Typography>
      </Stack>
      <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 20, mb: 1.6 }}>
        Where you are
      </Typography>

      <Stack spacing={0}>
        {JOURNEY_STATIONS.map((station, idx) => {
          const label = station.label;
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
              <MetricHint title={SCORE_HINTS.compass}>{score}</MetricHint>
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
  const interactive = typeof onClick === 'function';
  return (
    <Box
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      sx={focalCardSx(interactive)}
    >
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
              <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, fontSize: 8.5 }}>
                <MetricHint title={SCORE_HINTS.efficacy} underline>Efficacy</MetricHint>
              </Typography>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>
                <MetricHint title={SCORE_HINTS.efficacy}>{Math.round(statement.efficacy)}</MetricHint>
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, fontSize: 8.5 }}>
                <MetricHint title={SCORE_HINTS.effort} underline>Effort</MetricHint>
              </Typography>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>
                <MetricHint title={SCORE_HINTS.effort}>{Math.round(statement.effort)}</MetricHint>
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

function PlanFocalCard({ traitLabel, behavior, current, goal, onClick, ready }) {
  const interactive = typeof onClick === 'function';
  return (
    <Box
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      sx={{
        ...focalCardSx(interactive),
        ...(behavior
          ? {
              background:
                'linear-gradient(150deg, color-mix(in srgb, var(--amber-soft) 18%, var(--surface-1)), var(--surface-1))',
              borderColor: colors.orange,
            }
          : {}),
      }}
    >
      <Typography sx={{ ...type.eyebrow, color: behavior ? colors.orangeDeep : undefined, mb: 0.6, letterSpacing: '0.12em' }}>
        Your Action Plan
      </Typography>
      {behavior ? (
        <>
          {traitLabel ? (
            <Typography sx={{ ...type.eyebrow, color: colors.textSecondary, fontSize: 8.5, mb: 0.6, letterSpacing: '0.12em', whiteSpace: 'normal' }}>
              {traitLabel}
            </Typography>
          ) : null}
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
            “{behavior}”
          </Typography>
          {Number.isFinite(current) && Number.isFinite(goal) ? (
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.textSecondary, mt: 1.2 }}>
              {Math.round(current)} → {Math.round(goal)}
            </Typography>
          ) : null}
          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.8 }}>
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.orange }}>
              Open Practice
            </Typography>
            <ArrowForward sx={{ fontSize: 14, color: colors.orange }} />
          </Stack>
        </>
      ) : ready ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 20 }}>Set this week’s practice</Typography>
          <Typography sx={{ ...type.bodyMuted, mt: 0.6 }}>
            One visible behavior, held here with the signal.
          </Typography>
          {interactive && (
            <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 1.2 }}>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.orange }}>
                Open Practice
              </Typography>
              <ArrowForward sx={{ fontSize: 14, color: colors.orange }} />
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ ...type.sectionTitle, fontStyle: 'normal', fontSize: 20 }}>Plan pending</Typography>
          <Typography sx={{ ...type.bodyMuted, mt: 0.6 }}>
            The action plan opens here after you verify the evidence.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function TodayLanding({ t, onNavigate }) {
  const userInfo = readJson('userInfo', {});
  const campaignRecords = readJson('campaignRecords', {});
  const { personaId, setPageMessage, clearPageMessage } = useGuide();
  const { rows } = useBenchmarkData();

  const teamCampaignClosed = String(campaignRecords?.teamCampaignClosed || '').toLowerCase() === 'true';
  const season = teamCampaignClosed ? 'Embarking' : 'Understanding';
  const journeyIndex = getCurrentJourneyIndexFromState();
  const station = JOURNEY_STATIONS[journeyIndex] || JOURNEY_STATIONS[0];
  const chapter = JOURNEY_ROMAN[journeyIndex] || JOURNEY_ROMAN[0];
  const name = firstName(userInfo?.name);

  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';

  const debriefDone = readJson(`${getDebriefScope()}_done`, {});
  const evidenceOpen = Boolean(teamCampaignClosed && debriefDone?.signal);
  const practiceOpen = Boolean(debriefDone?.evidence);

  const roles = deriveTraitRoles(rows);
  const edgeRow = roles.edge;
  const edgePlan = edgeRow
    ? readJson(`practiceStudio_${campaignKey}_${userKey}_${edgeRow.trait}`, null)
    : null;
  const planBehavior = String(edgePlan?.branchBehavior || '').trim();
  const planCount = (roles.ordered || []).filter((row) => {
    const plan = readJson(`practiceStudio_${campaignKey}_${userKey}_${row.trait}`, null);
    return String(plan?.branchBehavior || '').trim();
  }).length;
  const planCurrent = edgeRow ? Math.round(edgeRow.team.lepScore) : null;
  const planGoal = Number.isFinite(edgePlan?.commitGoal)
    ? edgePlan.commitGoal
    : Number.isFinite(planCurrent)
      ? Math.min(95, planCurrent + 8)
      : null;

  const nextBestStep = teamCampaignClosed
    ? planCount > 0
      ? 'Hold today’s practice where you can see the signal that asked for it.'
      : practiceOpen
        ? 'Turn the reading into one visible behavior. The plan lives here with the signal.'
        : 'Read the signal and the evidence. Your action plan stays in this same chapter.'
    : 'Let the listening window do its work, then come back to read the pattern.';

  useEffect(() => {
    const spoken = spokenGuide(
      personaId,
      'dashboardToday',
      teamCampaignClosed ? 'season' : 'default',
      guideLine(season, teamCampaignClosed),
      season === 'Embarking' ? 'map' : 'read',
    );
    setPageMessage({
      text: spoken.text,
      pose: spoken.pose,
      eyebrow: season,
    });
    return () => clearPageMessage();
  }, [season, teamCampaignClosed, setPageMessage, clearPageMessage, personaId]);

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

  const journeyCompletion = getJourneyCompletion();
  const journeyCurrentIndex = journeyIndex;

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) 390px' },
          gap: { xs: 2.6, md: 4 },
          alignItems: 'stretch',
          mb: { xs: 1.8, md: 2.2 },
        }}
      >
        <Box
          sx={{
            ...surfaces.card,
            p: { xs: 2.4, md: 3.2 },
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
              mb: 1.2,
            }}
          >
            {name || 'Leader'}, you are in Chapter {chapter},{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: colors.orange }}>
              {station.label}
            </Box>
            .
          </Typography>

          <Typography sx={{ ...type.italicBody, fontSize: { xs: 17, md: 20 }, maxWidth: 720, color: t.inkSoft, mb: 2 }}>
            Season: {season} · {journeyIndex + 1} of {JOURNEY_CHAPTER_COUNT}. {seasonInterpretation(season)}
          </Typography>

          <Box
            sx={{
              borderLeft: `2px solid ${colors.orange}`,
              pl: 2.4,
              py: 0.8,
              mb: 2,
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
            {practiceOpen && (
              <Box component="button" type="button" onClick={() => onNavigate('practice')} sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary }}>
                Continue Practice
              </Box>
            )}
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
        <EvidenceFocalCard statement={lowestStatement} onClick={evidenceOpen ? () => onNavigate('evidence') : undefined} />
        <PlanFocalCard
          traitLabel={edgeRow ? (edgeRow.subTrait || edgeRow.trait) : ''}
          behavior={planBehavior}
          current={planCurrent}
          goal={planGoal}
          ready={practiceOpen}
          onClick={practiceOpen ? () => onNavigate('practice') : undefined}
        />
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
  const campaignClosed = String(readJson('campaignRecords', {})?.teamCampaignClosed || '').toLowerCase() === 'true';
  const demoSession = isDemoSession();
  const dockStatus = demoSession
    ? {
        signal: phases.dockStatus.signal === 'done' ? 'done' : undefined,
        evidence: phases.dockStatus.evidence === 'done' ? 'done' : undefined,
        practice: phases.dockStatus.practice === 'done' ? 'done' : undefined,
      }
    : {
        ...phases.dockStatus,
        signal: !campaignClosed ? 'locked' : phases.dockStatus.signal,
        evidence: !campaignClosed ? 'locked' : phases.dockStatus.evidence,
        practice: !campaignClosed ? 'locked' : phases.dockStatus.practice,
      };

  const {
    teamResponses,
    rows: benchmarkRows,
    loaded: benchmarkLoaded,
    hasTeamData,
    hasSelfData,
  } = useBenchmarkData();
  const invited = Number(readJson('latestFormData', {})?.teamSize) || Number(readJson('userInfo', {})?.teamSize) || 8;
  const respondents = teamResponses?.length || 0;

  // Scores the intake predictions against real team data and re-voices the
  // dashboard screens off the result. Runs once per distinct result set and
  // caches; a plain revisit costs nothing.
  useResultsIntelligence({
    rows: benchmarkRows,
    loaded: benchmarkLoaded,
    hasTeamData,
    hasSelfData,
    responseCount: respondents,
  });
  const chapterId = activeTab === 'journey' ? 'action' : 'review';
  const activeStepId = chapterId === 'action'
    ? 'journey'
    : (['today', 'signal', 'evidence', 'practice'].includes(activeTab) ? activeTab : 'today');

  // Marks the phase complete and carries the user through the door to the
  // next phase's first chapter.
  const advancePhase = (phase) => {
    const nextPhase = phases.completePhase(phase);
    if (nextPhase) goToTab(nextPhase);
  };

  const renderActive = () => {
    if (['signal', 'evidence', 'practice'].includes(activeTab) && !campaignClosed && !demoSession) {
      return <GatePage phase="campaign" onGoTab={goToTab} />;
    }
    if (PHASE_ORDER.includes(activeTab) && phases.isGated(activeTab) && !demoSession) {
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

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100svh',
        width: '100%',
        bgcolor: t.bg,
        color: t.ink,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ProcessTopRail
        chapterId={chapterId}
        activeStepId={activeStepId}
        stepStatus={dockStatus}
        chip={{
          variant: 'dashboard',
          label: 'Responses',
          current: respondents,
          total: invited,
          status: campaignClosed ? 'Signal ready' : 'Listening',
        }}
      />
      <CompassLayout viewportFit>
        {renderActive()}
      </CompassLayout>
    </Box>
  );
}
