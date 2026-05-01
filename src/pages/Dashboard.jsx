import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Campaign,
  Assessment,
  Insights,
  Lightbulb,
  Map,
  HelpOutline,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import ResultsTab from './Dashboard/ResultsTab';
import ActionTabStaging from './Dashboard/ActionTabStaging';
import JourneyTab from './Dashboard/JourneyTab';
import GrowthCampaignTab from './Dashboard/GrowthCampaignTab';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';

const readJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const JOURNEY_SEASONS = [
  { label: 'Uncovering', helper: 'Profile and leadership patterns' },
  { label: 'Embracing', helper: 'Strengths, tensions, and honest edges' },
  { label: 'Understanding', helper: 'Team signal and self-read' },
  { label: 'Embarking', helper: 'Practice, reflection, and next cycle' },
];

function CurrentBearing({ onNavigate }) {
  const userInfo = readJson('userInfo', {});
  const focusAreas = readJson('focusAreas', []);
  const selectedTraits = readJson('selectedTraits', []);
  const campaignRecords = readJson('campaignRecords', {});
  const actionPlansByCampaign = readJson('actionPlansByCampaign', {});
  const teamCampaignClosed = String(campaignRecords?.teamCampaignClosed || '').toLowerCase() === 'true';
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey = campaignRecords?.bundleId || campaignRecords?.teamCampaignId || campaignRecords?.selfCampaignId || '123';
  const plans = actionPlansByCampaign?.[campaignKey]?.[userKey]?.plans || {};
  const planEntries = Object.entries(plans || {}).flatMap(([trait, subtraits]) => (
    Object.entries(subtraits || {}).map(([subTrait, plan]) => ({ trait, subTrait, plan }))
  ));
  const firstPlan = planEntries.find(({ plan }) => String(plan?.commitment || plan?.guidedAnswers?.behaviorCommitment || '').trim()) || planEntries[0];
  const primaryFocus = focusAreas.find((area) => selectedTraits.includes(area.id)) || focusAreas[0] || {};
  const activeCommitment = String(firstPlan?.plan?.commitment || firstPlan?.plan?.guidedAnswers?.behaviorCommitment || '').trim();
  const responseStatus = teamCampaignClosed ? 'Signal ready' : 'Listening window open';
  const currentSeason = teamCampaignClosed ? 'Embarking' : 'Understanding';
  const currentChapter = teamCampaignClosed ? 'VII' : 'VI';

  const commandCards = [
    {
      label: 'Signal',
      title: primaryFocus?.subTraitName || primaryFocus?.traitName || 'Team feedback is forming',
      body: teamCampaignClosed
        ? 'Your team signal is ready to be interpreted with care. Start with meaning before you inspect the numbers.'
        : 'The campaign is still collecting responses. Stay attentive, but let the signal mature before drawing conclusions.',
      action: 'Open Signals',
      tab: 1,
    },
    {
      label: 'Growth Focus',
      title: activeCommitment ? 'One commitment is carrying the work' : 'Choose the behavior to practice next',
      body: activeCommitment || 'A calm command center should narrow the field. Pick one observable behavior your team can feel this week.',
      action: 'Open Practice',
      tab: 3,
    },
    {
      label: 'Next Step',
      title: teamCampaignClosed ? 'Practice, reflect, then verify' : 'Protect the response window',
      body: teamCampaignClosed
        ? 'Move from interpretation into a small, repeatable leadership practice. The journey advances through repetition.'
        : 'Invite the last voices in, then close the campaign when the signal is strong enough to act on.',
      action: teamCampaignClosed ? 'View Journey' : 'Review Campaign',
      tab: teamCampaignClosed ? 4 : 0,
    },
  ];

  return (
    <Stack spacing={2.4}>
      <Box
        sx={{
          p: { xs: 2.2, md: 3 },
          borderRadius: '22px',
          border: '1px solid var(--sand-200, #E8DBC3)',
          bgcolor: 'rgba(255,255,255,0.92)',
          boxShadow: '0 14px 34px rgba(15,28,46,0.08)',
        }}
      >
        <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 1 }}>
          Chapter {currentChapter} · {currentSeason}
        </Typography>
        <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: { xs: '2rem', md: '2.6rem' }, lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--navy-900, #10223C)', mb: 1.4 }}>
          Your current bearing.
        </Typography>
        <Typography sx={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: { xs: '1.05rem', md: '1.22rem' }, lineHeight: 1.6, color: 'var(--ink, #0F1C2E)', maxWidth: 820 }}>
          The Compass is not asking you to admire a dashboard. It is asking you to notice the signal, choose the next honest practice, and keep moving with steadiness.
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mt: 2.4 }}>
          {[
            { label: responseStatus, value: teamCampaignClosed ? 'Ready for practice' : 'Still gathering' },
            { label: 'Primary focus', value: primaryFocus?.subTraitName || 'Leadership clarity' },
            { label: 'Active commitments', value: `${planEntries.length || 0} saved` },
          ].map((item) => (
            <Box key={item.label} sx={{ flex: 1, p: 1.5, borderRadius: '14px', bgcolor: 'var(--sand-50, #FBF7F0)', border: '1px solid var(--sand-200, #E8DBC3)' }}>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-soft, #44566C)', mb: 0.6 }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy-900, #10223C)' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.6 }}>
        {commandCards.map((card) => (
          <Box key={card.label} sx={{ p: 2, borderRadius: '18px', bgcolor: '#fff', border: '1px solid var(--sand-200, #E8DBC3)', boxShadow: '0 8px 22px rgba(15,28,46,0.055)' }}>
            <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange, #E07A3F)', mb: 0.9 }}>
              {card.label}
            </Typography>
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: '1.35rem', lineHeight: 1.15, color: 'var(--navy-900, #10223C)', mb: 1 }}>
              {card.title}
            </Typography>
            <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-soft, #44566C)', mb: 1.4 }}>
              {card.body}
            </Typography>
            <Button onClick={() => onNavigate(card.tab)} sx={{ textTransform: 'none', fontWeight: 800, color: 'var(--navy-900, #10223C)', px: 0 }}>
              {card.action}
            </Button>
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2, borderRadius: '18px', bgcolor: 'rgba(255,255,255,0.82)', border: '1px solid var(--sand-200, #E8DBC3)' }}>
        <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 1.4 }}>
          The Leadership Arc
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
          {JOURNEY_SEASONS.map((season) => {
            const active = season.label === currentSeason;
            return (
              <Box key={season.label} sx={{ p: 1.45, borderRadius: '14px', border: active ? '1px solid var(--orange, #E07A3F)' : '1px solid var(--sand-200, #E8DBC3)', bgcolor: active ? 'rgba(224,122,63,0.07)' : 'rgba(251,247,240,0.75)' }}>
                <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900, #10223C)' }}>
                  {season.label}
                </Typography>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.75rem', lineHeight: 1.35, color: 'var(--ink-soft, #44566C)', mt: 0.5 }}>
                  {season.helper}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}

function DashboardGuideRail({ currentTab, onNavigate }) {
  const guideNotes = [
    {
      k: 'A note from your guide',
      t: 'Start here. Let the signal become a practice before it becomes another thing to manage.',
      cta: 'Choose one next step',
      tab: 3,
    },
    {
      k: 'Leadership Signals',
      t: 'The number is only the doorway. Look for what your team is trying to help you understand.',
      cta: 'Move to practice',
      tab: 3,
    },
    {
      k: 'Evidence',
      t: 'Inspect the details when you need clarity, then come back to the behavior you can actually change.',
      cta: 'Return to Signals',
      tab: 1,
    },
    {
      k: 'Practice',
      t: 'One behavior, held honestly for a week, will teach you more than five vague intentions.',
      cta: 'See the journey',
      tab: 4,
    },
    {
      k: 'Journey',
      t: 'This is not a finish line. It is a record of how your leadership keeps becoming more visible.',
      cta: 'Current bearing',
      tab: 0,
    },
  ];
  const note = guideNotes[currentTab] || guideNotes[0];

  return (
    <Box sx={{ position: 'sticky', top: 96, p: 2, borderRadius: '18px', bgcolor: '#fff', border: '1px solid var(--sand-200, #E8DBC3)', boxShadow: '0 8px 22px rgba(15,28,46,0.06)' }}>
      <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 1 }}>
        {note.k}
      </Typography>
      <Typography sx={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.55, color: 'var(--navy-900, #10223C)', mb: 1.5 }}>
        {note.t}
      </Typography>
      <Button onClick={() => onNavigate(note.tab)} sx={{ textTransform: 'none', fontWeight: 800, color: 'var(--orange-deep, #C0612A)', px: 0 }}>
        {note.cta}
      </Button>
    </Box>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(0);
  const [navExpanded, setNavExpanded] = useState(false);
  const DASH_FONT = '"Montserrat", "Inter", "Segoe UI", sans-serif';
  const [selectedAgent, setSelectedAgent] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('latestFormData') || '{}');
      return stored?.selectedAgent || 'balancedMentor';
    } catch {
      return 'balancedMentor';
    }
  });
  const CONTENT_MAX_WIDTH = 1180;
  const agentOptions = [
    { id: 'balancedMentor', name: 'Balanced Mentor' },
    { id: 'comedyRoaster', name: 'Comedy Roaster' },
    { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend' },
    { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach' },
    { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver' },
    { id: 'highSchoolCoach', name: 'High School Coach' },
  ];

  const handleAgentChange = (event) => {
    const nextAgent = event.target.value;
    setSelectedAgent(nextAgent);
    try {
      const stored = JSON.parse(localStorage.getItem('latestFormData') || '{}');
      localStorage.setItem(
        'latestFormData',
        JSON.stringify({ ...stored, selectedAgent: nextAgent })
      );
    } catch {
      localStorage.setItem(
        'latestFormData',
        JSON.stringify({ selectedAgent: nextAgent })
      );
    }
  };

  const legacyNavItems = [
    {
      label: 'Campaign Details',
      subtitle: 'Use this page to monitor your campaign rollout, track participation, and stay on pace with response goals. You can open each campaign round, confirm timing windows, and quickly see where follow-up is needed.',
      icon: Campaign,
    },
    {
      label: 'Campaign Results',
      subtitle: 'Interpret your campaign data through trait-level scoring, effort-versus-efficacy gaps, and overall performance trends. Use this page to spot where outcomes are improving, where friction persists, and which patterns require immediate attention.',
      icon: Assessment,
    },
    {
      label: 'Detailed Results',
      subtitle: 'Inspect statement-level scoring with five-ring breakdowns and question-specific efficacy and effort patterns. Use this page to drill into the precise items shaping each trait outcome.',
      icon: Insights,
    },
    {
      label: 'Growth Plan',
      subtitle: 'Translate your insight data into concrete leadership moves your team will actually feel. This page helps you define focused actions by trait, verify progress commitments, and keep your execution anchored to measurable behavior change.',
      icon: Lightbulb,
    },
    {
      label: 'My Journey',
      subtitle: 'Follow your leadership development path as campaign cycles and verified actions build over time. This view helps you visualize momentum, capture key milestones, and document how your decisions shape long-term growth.',
      icon: Map,
    },
  ];

  const commandNavItems = [
    {
      label: 'Current Bearing',
      subtitle: 'Orient to the leadership season you are in, the signal asking for attention, and the next honest step.',
      icon: Campaign,
    },
    {
      label: 'Signals',
      subtitle: 'Understand what your team is reflecting back before turning the numbers into conclusions.',
      icon: Assessment,
    },
    {
      label: 'Evidence',
      subtitle: 'Inspect the statement-level detail only when it helps clarify the signal and sharpen the practice.',
      icon: Insights,
    },
    {
      label: 'Practice',
      subtitle: 'Choose one growth commitment, track the behavior, and return to it through weekly reflection.',
      icon: Lightbulb,
    },
    {
      label: 'Journey',
      subtitle: 'See how uncovering, embracing, understanding, and embarking build into long-term growth.',
      icon: Map,
    },
  ];
  const navItems = useCairnTheme ? commandNavItems : legacyNavItems;

  useEffect(() => {
    const tab = String(new URLSearchParams(location.search || '').get('tab') || '').trim().toLowerCase();
    if (!tab) return;

    const tabIndexByKey = {
      'current-bearing': 0,
      bearing: 0,
      command: 0,
      'campaign-details': 0,
      campaign: 0,
      'campaign-results': 1,
      results: 1,
      signals: 1,
      'detailed-results': 2,
      detailed: 2,
      evidence: 2,
      'growth-plan': 3,
      plan: 3,
      practice: 3,
      'my-journey': 4,
      journey: 4,
    };

    if (Object.prototype.hasOwnProperty.call(tabIndexByKey, tab)) {
      setCurrentTab(tabIndexByKey[tab]);
    }
  }, [location.search]);

  const dashTabContent = (
    <Box sx={{ mt: 1.8 }}>
      {currentTab === 0 && (useCairnTheme ? <CurrentBearing onNavigate={setCurrentTab} /> : <GrowthCampaignTab />)}
      {currentTab === 1 && <ResultsTab view="compass" selectedAgent={selectedAgent} />}
      {currentTab === 2 && <ResultsTab view="detailed" selectedAgent={selectedAgent} />}
      {currentTab === 3 && (
        <ActionTabStaging selectedAgent={selectedAgent} onOpenJourney={() => setCurrentTab(4)} />
      )}
      {currentTab === 4 && <JourneyTab />}
    </Box>
  );

  const [isDark] = useDarkMode();
  if (useCairnTheme) {
    const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
    const NAV_SUBTITLES = [
      'Orient & choose next step',
      'Interpret team feedback',
      'Inspect what shaped it',
      'Practice one behavior',
      'Track growth over time',
    ];
    const DashNavSidebar = (
      <Box sx={{
        bgcolor: isDark ? 'var(--surface-2, #0f1c2e)' : 'white', borderRadius: '16px',
        border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'sticky', top: 96,
      }}>
        {/* Header */}
        <Box sx={{ px: 2, py: 1.75, borderBottom: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'var(--sand-50, #FBF7F0)' }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange-deep, #C0612A)', mb: 0.2 }}>
            Command Center
          </Typography>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.72rem', color: isDark ? 'var(--ink-soft, #a89880)' : 'var(--ink-soft, #44566C)', lineHeight: 1.4 }}>
            Return to the journey, then choose the next step
          </Typography>
        </Box>
        {navItems.map((item, idx) => {
          const isActive = currentTab === idx;
          return (
            <Box
              key={item.label}
              component="button"
              type="button"
              onClick={() => setCurrentTab(idx)}
              sx={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 1.5,
                width: '100%', px: 2, py: 1.4, boxSizing: 'border-box',
                bgcolor: isActive ? 'var(--navy-900, #10223C)' : 'transparent', transition: '140ms',
                '&:hover': { bgcolor: isActive ? 'var(--navy-800, #162A44)' : 'var(--sand-50, #FBF7F0)' },
                '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: -3 },
              }}
            >
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, mt: '2px',
                bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'var(--sand-100, #F3EAD8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: '0.62rem', color: isActive ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)', lineHeight: 1 }}>
                  {ROMAN[idx]}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2, color: isActive ? 'var(--amber-soft, #F4CEA1)' : isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.71rem', lineHeight: 1.3, mt: 0.3, color: isActive ? 'rgba(244,206,161,0.72)' : isDark ? 'var(--ink-soft, #a89880)' : 'var(--ink-soft, #44566C)' }}>
                  {NAV_SUBTITLES[idx]}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ borderTop: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)', mx: 2, mt: 0.5 }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--orange, #E07A3F)' }}>
            {currentTab + 1} of {navItems.length}
          </Typography>
        </Box>
      </Box>
    );

    return (
      <Box sx={{ position: 'relative', minHeight: '100vh', width: '100%', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={100} sidebar={DashNavSidebar} rightRail={<DashboardGuideRail currentTab={currentTab} onNavigate={setCurrentTab} />}>
          {dashTabContent}
        </CompassLayout>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        color: 'text.primary',
        overflowX: 'hidden',
        '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root, & .MuiInputBase-root, & .MuiTableCell-root, & .MuiMenuItem-root': {
          fontFamily: `${DASH_FONT} !important`,
          letterSpacing: '0 !important',
        },
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage:
            'linear-gradient(120deg, rgba(14,26,40,0.86), rgba(22,38,56,0.84)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
        },
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            'radial-gradient(860px 420px at 84% 18%, rgba(61,90,120,0.22), transparent 66%), radial-gradient(620px 360px at 8% 52%, rgba(63,92,121,0.2), transparent 74%)',
        },
      }}
    >
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left Ribbon Navigation */}
        <Box
          onMouseEnter={() => setNavExpanded(true)}
          onMouseLeave={() => setNavExpanded(false)}
          sx={{
            width: navExpanded ? 258 : 86,
            transition: 'width 180ms cubic-bezier(.2,.8,.2,1)',
            borderRight: '1px solid rgba(73,101,129,0.34)',
            bgcolor: 'rgba(58,82,108,0.72)',
            backdropFilter: 'blur(14px)',
            px: 1.1,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            zIndex: 5,
          }}
        >
          <Stack spacing={1.1} sx={{ mt: 9 }}>
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = currentTab === idx;
              return (
                <Button
                  key={item.label}
                  onClick={() => setCurrentTab(idx)}
                  sx={{
                    minHeight: 54,
                    justifyContent: navExpanded ? 'flex-start' : 'center',
                    gap: navExpanded ? 1.2 : 0,
                    px: navExpanded ? 1.25 : 0.8,
                    borderRadius: 2.1,
                    border: '1px solid',
                    borderColor: active ? 'rgba(224,122,63,0.78)' : 'rgba(230,240,250,0.26)',
                    bgcolor: active ? 'rgba(224,122,63,0.18)' : 'rgba(255,255,255,0.08)',
                    color: 'rgba(246,250,255,0.95)',
                    textTransform: 'none',
                    overflow: 'hidden',
                    '&:hover': {
                      bgcolor: active ? 'rgba(224,122,63,0.24)' : 'rgba(255,255,255,0.14)',
                      borderColor: active ? 'rgba(224,122,63,0.9)' : 'rgba(230,240,250,0.34)',
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 22, minWidth: 22 }} />
                  <Box
                    sx={{
                      opacity: navExpanded ? 1 : 0,
                      width: navExpanded ? 'auto' : 0,
                      transition: 'opacity 0.18s ease',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '1.03rem',
                        fontWeight: 700,
                        lineHeight: 1.05,
                        color: 'inherit',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Stack>
          <Divider
            sx={{
              mt: 1.5,
              mb: 1.2,
              borderColor: 'rgba(230,240,250,0.24)',
            }}
          />
          <Box sx={{ px: navExpanded ? 0.2 : 0 }}>
            {navExpanded ? (
              <FormControl size="small" fullWidth>
                <InputLabel
                  id="agent-persona-select-label"
                  sx={{ color: 'rgba(236,244,252,0.86)' }}
                >
                  Coach Persona
                </InputLabel>
                <Select
                  labelId="agent-persona-select-label"
                  label="Coach Persona"
                  value={selectedAgent}
                  onChange={handleAgentChange}
                  sx={{
                    color: 'rgba(248,252,255,0.96)',
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(230,240,250,0.28)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(230,240,250,0.45)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'secondary.main',
                    },
                    '.MuiSvgIcon-root': { color: 'rgba(235,245,253,0.82)' },
                  }}
                >
                  {agentOptions.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Button
                sx={{
                  minHeight: 40,
                  width: '100%',
                  minWidth: 0,
                  borderRadius: 2,
                  border: '1px solid rgba(230,240,250,0.24)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(248,252,255,0.92)',
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
                onClick={() => setNavExpanded(true)}
              >
                Coach
              </Button>
            )}
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, minWidth: 0, ml: navExpanded ? '258px' : '86px', transition: 'margin-left 180ms cubic-bezier(.2,.8,.2,1)', position: 'relative' }}>
          {/* Top Banner */}
          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              py: 2.5,
              borderBottom: '1px solid rgba(73,101,129,0.34)',
              bgcolor: 'rgba(58,82,108,0.72)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src="/CompassLogo.png"
                alt="Compass logo"
                sx={{
                  width: { xs: 56, md: 66 },
                  height: { xs: 56, md: 66 },
                  objectFit: 'contain',
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: { xs: '1.5rem', md: '1.72rem' },
                  fontWeight: 800,
                  color: 'rgba(248,252,255,0.96)',
                  lineHeight: 1.05,
                }}
              >
                Compass Dashboard
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.4} alignItems="center">
              <ProcessTopRail embedded showBrand={false} />
              <Button
                variant="outlined"
                startIcon={<HelpOutline />}
                onClick={() => navigate('/faq')}
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: 'rgba(248,252,255,0.94)',
                  borderColor: 'rgba(230,240,250,0.38)',
                  '&:hover': {
                    borderColor: 'rgba(230,240,250,0.7)',
                    bgcolor: 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                Help
              </Button>
            </Stack>
          </Box>

          {/* Content */}
          <Box sx={{ px: { xs: 2, md: 3.5 }, py: 2.4 }}>
            <Box sx={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>
              {currentTab !== 4 && currentTab !== 3 && currentTab !== 2 && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2.2,
                    borderRadius: 2.5,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.94), rgba(240,246,255,0.88))',
                    boxShadow: '0 8px 22px rgba(15,23,42,0.14)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: { xs: '1.28rem', md: '1.44rem' },
                      fontWeight: 800,
                      color: 'text.primary',
                    }}
                  >
                    {navItems[currentTab]?.label}
                  </Typography>
                  <Divider sx={{ my: 1.1, borderColor: 'rgba(69,112,137,0.25)' }} />
                  <Typography
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.95rem',
                      color: 'text.secondary',
                    }}
                  >
                    {navItems[currentTab]?.subtitle}
                  </Typography>
                </Box>
              )}

              {dashTabContent}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
