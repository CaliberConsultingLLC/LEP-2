import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessTopRail from '../../components/ProcessTopRail';
import CompassLayout from '../../components/CompassLayout';
import { colors, shadows } from '../../styles/tokens';
import JourneyTab from './JourneyTab';
import { JOURNEY_CHAPTER_COUNT, JOURNEY_ROMAN, JOURNEY_STATIONS } from './journey/journeyModel.js';
import SentimentView from './cc/SentimentView.jsx';
import NarrativeView from './cc/NarrativeView.jsx';
import EvidenceView from './cc/EvidenceView.jsx';
import FieldJournal, { planComplete } from './cc/FieldJournal.jsx';
import TodayView from './cc/TodayView.jsx';
import { useBenchmarkData } from './cc/dashboardData.js';
import { useResultsIntelligence } from './cc/useResultsIntelligence.js';
import { getDebriefScope, useDebriefPhases, PHASE_ORDER } from './cc/phaseState.js';
import { deriveTraitRoles } from './cc/debriefContent.js';
import GatePage from './cc/GatePage.jsx';
import { isDemoSession } from '../../utils/demoMode';
import MetricHint from '../../components/MetricHint';
import { SCORE_HINTS } from '../../data/scoreGlossary';
import { inviteProgress, readInviteTarget } from '../../utils/campaignInvites';
import {
  LOCK_CONFIRM_PHRASE,
  TEAM_WINDOW_CHANGED_EVENT,
  lockTeamCampaignWindow,
  parseExpectedTeamCount,
} from '../../utils/lockTeamCampaign';

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
  narrative: 'narrative',
  debrief: 'narrative',
  reading: 'narrative',
  // The tab is called Sentiment now. The id stays `signal` so saved progress,
  // the phase chain and the ?tab=signal links already sitting in sent email
  // all keep resolving.
  sentiment: 'signal',
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

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the auto-launch will simply offer itself again */
  }
};

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

  // The Narrative plays itself, once.
  //
  // The first time a leader opens the dashboard after their team's reading has
  // landed, they arrive in the Narrative rather than on Basecamp — it is the
  // thing they waited a week for, and leaving them to find it in a tab strip
  // makes it look optional. It happens exactly once: the flag is written the
  // moment it fires, so every visit after this one lands on Basecamp and the
  // Narrative is a room they choose.
  //
  // An explicit `?tab=` always wins. That keeps deep links, the demo catalog
  // and the back button honest.
  const autoLaunchNarrative = useMemo(() => {
    const raw = String(new URLSearchParams(location.search || '').get('tab') || '').trim();
    if (raw) return false;
    const scope = getDebriefScope();
    if (readJson(`${scope}_narrativeLaunched`, false)) return false;
    // Already walked it under their own steam — nothing left to introduce.
    if (readJson(`${scope}_narrative`, {})?.done) return false;
    const closed = String(readJson('campaignRecords', {})?.teamCampaignClosed || '')
      .toLowerCase() === 'true';
    return closed || isDemoSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve initial tab from ?tab=
  const initialTab = useMemo(() => {
    const raw = String(new URLSearchParams(location.search || '').get('tab') || '')
      .trim()
      .toLowerCase();
    if (!raw && autoLaunchNarrative) return 'narrative';
    return QUERY_TO_TAB[raw] || 'today';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab);

  // Write the flag and put the tab in the URL, so a refresh or a back press
  // shows what is actually on screen rather than bouncing to Basecamp.
  useEffect(() => {
    if (!autoLaunchNarrative) return;
    writeJson(`${getDebriefScope()}_narrativeLaunched`, true);
    const params = new URLSearchParams(location.search || '');
    params.set('tab', 'narrative');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLaunchNarrative]);

  // Keep state in sync if the URL changes (back/forward, dev panel deep-links)
  useEffect(() => {
    const raw = String(new URLSearchParams(location.search || '').get('tab') || '')
      .trim()
      .toLowerCase();
    // The first render belongs to the auto-launch; the effect above is about to
    // write the tab into the URL, and reading the empty one here would drag the
    // leader back to Basecamp before it lands.
    if (!raw && autoLaunchNarrative) return;
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
  const [teamWindowClosed, setTeamWindowClosed] = useState(
    () => String(readJson('campaignRecords', {})?.teamCampaignClosed || '').toLowerCase() === 'true'
  );
  useEffect(() => {
    const sync = () => {
      setTeamWindowClosed(String(readJson('campaignRecords', {})?.teamCampaignClosed || '').toLowerCase() === 'true');
    };
    window.addEventListener(TEAM_WINDOW_CHANGED_EVENT, sync);
    return () => window.removeEventListener(TEAM_WINDOW_CHANGED_EVENT, sync);
  }, []);
  const campaignClosed = teamWindowClosed;
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
  // The narrative gates only on the campaign window — it is its own experience,
  // not part of the signal/evidence phase chain.
  const narrativeDone = Boolean(readJson(`${getDebriefScope()}_narrative`, {})?.done);
  dockStatus.narrative = !campaignClosed && !demoSession ? 'locked' : narrativeDone ? 'done' : undefined;

  const {
    teamResponses,
    liveResponseCount,
    rows: benchmarkRows,
    loaded: benchmarkLoaded,
    hasTeamData,
    hasSelfData,
  } = useBenchmarkData();
  // The number the leader declared when they took the link. Falls back to the
  // old team-size guess only when they never said — and inviteProgress reports
  // that case as 'waiting' rather than inventing a denominator.
  const inviteTarget = useMemo(() => readInviteTarget(), []);
  const invited = inviteTarget?.declared ?? parseExpectedTeamCount(
    readJson('latestFormData', {})?.teamSize ?? readJson('userInfo', {})?.teamSize
  );
  const respondents = campaignClosed
    ? (teamResponses?.length || liveResponseCount || 0)
    : (liveResponseCount || 0);

  // Scores the intake predictions against real team data and re-voices the
  // dashboard screens off the result. Runs once per distinct result set and
  // caches; a plain revisit costs nothing.
  // The field journal surfaces the trait rollups and statement findings from
  // this analysis as the two insight cards on each entry, so the return value
  // is no longer discarded.
  const { resultsAnalysis } = useResultsIntelligence({
    rows: benchmarkRows,
    loaded: benchmarkLoaded,
    hasTeamData,
    hasSelfData,
    responseCount: respondents,
  });
  // Drill-down: inside Evidence the rail stops being the dashboard's tab strip
  // and becomes this page's trait switcher, with a way back up. Trait state
  // lives here so the rail and the page cannot disagree about which is open.
  const evidenceTraits = useMemo(
    () => deriveTraitRoles(benchmarkRows).ordered || [],
    [benchmarkRows]
  );
  const [evidenceTraitIdx, setEvidenceTraitIdx] = useState(0);
  useEffect(() => {
    if (evidenceTraitIdx > 0 && evidenceTraitIdx >= evidenceTraits.length) {
      setEvidenceTraitIdx(0);
    }
  }, [evidenceTraits.length, evidenceTraitIdx]);

  const practiceRows = useMemo(() => {
    const roles = deriveTraitRoles(benchmarkRows);
    if (!roles.ordered?.length) return [];
    if (!roles.edge) return roles.ordered;
    return [roles.edge, ...roles.ordered.filter((r) => r.trait !== roles.edge.trait)];
  }, [benchmarkRows]);

  const practiceUserInfo = useMemo(() => readJson('userInfo', {}), []);
  const practiceCampaignRecords = useMemo(() => readJson('campaignRecords', {}), []);
  const practiceUserKey = practiceUserInfo?.email || practiceUserInfo?.name || 'anonymous';
  const practiceCampaignKey =
    practiceCampaignRecords?.bundleId ||
    practiceCampaignRecords?.teamCampaignId ||
    practiceCampaignRecords?.selfCampaignId ||
    '123';

  // The journal stores one spread per page now (0-2 traits, 3 the closing
  // entry). Older saves counted half-pages up to 6; anything past the last
  // trait lands on the closing entry either way.
  const [practiceTraitIdx, setPracticeTraitIdx] = useState(() => {
    const saved = Number(phases.pages.practice);
    if (!Number.isFinite(saved)) return 0;
    return Math.max(0, Math.min(3, Math.round(saved)));
  });

  useEffect(() => {
    if (practiceTraitIdx > 0 && practiceTraitIdx < 3 && practiceTraitIdx >= practiceRows.length) {
      setPracticeTraitIdx(0);
    }
  }, [practiceRows.length, practiceTraitIdx]);

  // Only show trait drill-in when the real view is mounted — not while a gate page blocks it.
  const canRenderReviewTab = (tab) => {
    if (demoSession) return true;
    if (['narrative', 'signal', 'evidence', 'practice'].includes(tab) && !campaignClosed) return false;
    if (PHASE_ORDER.includes(tab) && phases.isGated(tab)) return false;
    return true;
  };

  // Sentiment is a trait room once the walkthrough has been read: the rail
  // stops being the dashboard's tab strip and becomes the trait switcher, the
  // same way Evidence does. Both share `evidenceTraitIdx`, so moving between
  // the two pages keeps you on the trait you were reading.
  const isSentimentDrilled =
    activeTab === 'signal'
    && phases.modeFor('signal') === 'snapshot'
    && evidenceTraits.length > 0
    && canRenderReviewTab('signal');
  const isEvidenceDrilled = activeTab === 'evidence' && evidenceTraits.length > 0 && canRenderReviewTab('evidence');
  const isPracticeDrilled = activeTab === 'practice' && practiceRows.length > 0 && canRenderReviewTab('practice');
  const isTraitDrilled = isSentimentDrilled || isEvidenceDrilled;
  const isDrilledIn = isTraitDrilled || isPracticeDrilled;

  const practiceStepStatus = useMemo(() => {
    if (!isPracticeDrilled) return {};
    const status = {};
    practiceRows.forEach((r, i) => {
      const plan = readJson(`practiceStudio_${practiceCampaignKey}_${practiceUserKey}_${r.trait}`, null);
      if (planComplete(plan)) status[`trait-${i}`] = 'done';
    });
    const allComplete = practiceRows.every((r) =>
      planComplete(readJson(`practiceStudio_${practiceCampaignKey}_${practiceUserKey}_${r.trait}`, null))
    );
    if (allComplete) status.commit = 'done';
    return status;
  }, [isPracticeDrilled, practiceRows, practiceCampaignKey, practiceUserKey]);

  const drillSteps = isTraitDrilled
    ? evidenceTraits.map((r, i) => ({
        id: `trait-${i}`,
        label: r.subTrait || r.trait || `Trait ${i + 1}`,
      }))
    : isPracticeDrilled
      ? [
          ...practiceRows.map((r, i) => ({
            id: `trait-${i}`,
            label: r.subTrait || r.trait || `Trait ${i + 1}`,
          })),
          { id: 'commit', label: 'The Commitment' },
        ]
      : null;

  const drillBack = isDrilledIn
    ? { label: 'Dashboard', onClick: () => goToTab('today') }
    : null;

  // Anything rendered above the dashboard (the demo banner) shifts it down;
  // measure that offset so the shell can size to what is actually left.
  const shellRef = useRef(null);
  const [shellTop, setShellTop] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = shellRef.current;
      if (!el) return;
      const top = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY));
      setShellTop((prev) => (prev === top ? prev : top));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const chapterId = activeTab === 'journey' ? 'action' : 'review';
  const activeStepId = chapterId === 'action'
    ? 'journey'
    : (['today', 'narrative', 'signal', 'evidence', 'practice'].includes(activeTab) ? activeTab : 'today');

  const drilledActiveStepId = isTraitDrilled
    ? `trait-${evidenceTraitIdx}`
    : isPracticeDrilled
      ? (practiceTraitIdx >= 3 ? 'commit' : `trait-${practiceTraitIdx}`)
      : activeStepId;

  const drilledStepStatus = isTraitDrilled ? {} : isPracticeDrilled ? practiceStepStatus : dockStatus;

  // Everyone answered, so there is nothing left to wait for. The leader keeps
  // the manual close for every other case; this fires only on a full house,
  // and only once.
  const autoClosedRef = useRef(false);
  useEffect(() => {
    if (campaignClosed || autoClosedRef.current || demoSession) return;
    if (inviteProgress(respondents, inviteTarget).state !== 'complete') return;
    autoClosedRef.current = true;
    lockTeamCampaignWindow().catch(() => { autoClosedRef.current = false; });
  }, [respondents, inviteTarget, campaignClosed, demoSession]);

  // Marks the phase complete and carries the user through the door to the
  // next phase's first chapter.
  const advancePhase = (phase) => {
    const nextPhase = phases.completePhase(phase);
    if (nextPhase) goToTab(nextPhase);
  };

  const renderActive = () => {
    if (['narrative', 'signal', 'evidence', 'practice'].includes(activeTab) && !campaignClosed && !demoSession) {
      return <GatePage phase="campaign" onGoTab={goToTab} />;
    }
    if (PHASE_ORDER.includes(activeTab) && phases.isGated(activeTab) && !demoSession) {
      return <GatePage phase={activeTab} onGoTab={goToTab} />;
    }
    switch (activeTab) {
      case 'narrative':
        return <NarrativeView onGoTab={goToTab} />;
      case 'signal':
        return (
          <SentimentView
            t={t}
            selectedAgent={selectedAgent}
            phases={phases}
            onAdvancePhase={() => advancePhase('signal')}
            traitIndex={evidenceTraitIdx}
            resultsAnalysis={resultsAnalysis}
          />
        );
      case 'evidence':
        return (
          <EvidenceView
            t={t}
            selectedAgent={selectedAgent}
            phases={phases}
            onAdvancePhase={() => advancePhase('evidence')}
            traitIndex={evidenceTraitIdx}
          />
        );
      case 'practice':
        return (
          <FieldJournal
            t={t}
            phases={phases}
            onAdvancePhase={() => advancePhase('practice')}
            traitIndex={practiceTraitIdx}
            onTraitIndexChange={setPracticeTraitIdx}
            resultsAnalysis={resultsAnalysis}
          />
        );
      case 'journey':
        return <JourneyTab t={t} />;
      case 'today':
      default:
        return (
          <TodayView
            onNavigate={goToTab}
            campaignClosed={campaignClosed}
            respondents={respondents}
            invited={invited}
            rows={benchmarkRows}
            phases={phases}
          />
        );
    }
  };

  return (
    <Box
      ref={shellRef}
      sx={{
        position: 'relative',
        // Fill exactly from wherever the shell starts to the bottom of the
        // viewport. A hard 100svh overflows whenever anything sits above it
        // (the demo banner), which is what made the rooms scroll by a sliver.
        height: `calc(100svh - ${shellTop}px)`,
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
        activeStepId={isDrilledIn ? drilledActiveStepId : activeStepId}
        stepStatus={isDrilledIn ? drilledStepStatus : dockStatus}
        steps={drillSteps}
        backAction={drillBack}
        // Basecamp, then a short rule, then the four rooms. Numbers rather
        // than ticks: these are places you come back to, and a tick says
        // closed. Inside a drill-down the rail is the trait switcher, where a
        // finished plan really is finished — so the ticks stay there.
        markers={isDrilledIn ? 'auto' : 'number'}
        dividerAfterId={isDrilledIn ? null : 'today'}
        onStepSelect={isTraitDrilled
          ? (step) => setEvidenceTraitIdx(Number(String(step.id).split('-')[1]) || 0)
          : isPracticeDrilled
            ? (step) => {
                if (step.id === 'commit') setPracticeTraitIdx(3);
                else setPracticeTraitIdx(Number(String(step.id).split('-')[1]) || 0);
              }
            : undefined}
        // The response count belongs where a leader acts on it — the team
        // assessment page and Today — not pinned in the corner of every room.
        chip={activeTab === 'today' ? {
          variant: 'dashboard',
          label: 'Responses',
          current: respondents,
          total: invited || 0,
          status: campaignClosed ? 'Sentiment ready' : 'Waiting on your team',
        } : null}
      />
      {/* Today is a room, not a column of reading: it wants the shell's full
          width so the porthole, the content and the owl keep their proportions.
          Every other tab keeps the reading measure. */}
      <CompassLayout viewportFit fluid={activeTab === 'today'}>
        {renderActive()}
      </CompassLayout>
    </Box>
  );
}
