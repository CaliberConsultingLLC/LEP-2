import React, { useMemo } from 'react';
import { Box, Stack, Tooltip, IconButton, Typography, Divider } from '@mui/material';
import {
  AccountCircle,
  Psychology,
  Insights,
  BuildCircle,
  SelfImprovement,
  Groups,
  FactCheck,
  HomeRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const PHASES = [
  { id: 'profile', title: 'Profile Creation', icon: AccountCircle, fallbackPath: '/user-info' },
  { id: 'behaviors', title: 'Behaviors & Instincts', icon: Psychology, fallbackPath: '/form' },
  { id: 'insights', title: 'Leadership Reflection', icon: Insights, fallbackPath: '/summary' },
  { id: 'campaign', title: 'Campaign Creation', icon: BuildCircle, fallbackPath: '/campaign-builder' },
  { id: 'self', title: 'Self-Assess', icon: SelfImprovement, fallbackPath: null },
  { id: 'team', title: 'Team Assess', icon: Groups, fallbackPath: null },
  { id: 'review', title: 'Review & Act', icon: FactCheck, fallbackPath: '/dashboard' },
];

const parseJson = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function ProcessTopRail({ sticky = true, embedded = false, showBrand = true, titleOverride = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname || '';

  const model = useMemo(() => {
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const latestFormData = parseJson(localStorage.getItem('latestFormData'), null);
    const campaignRecords = parseJson(localStorage.getItem('campaignRecords'), {});
    const actionPlansByCampaign = parseJson(localStorage.getItem('actionPlansByCampaign'), {});
    const aiSummary = String(localStorage.getItem('aiSummary') || '').trim();
    const currentCampaign = parseJson(localStorage.getItem('currentCampaign'), []);
    const selfCampaignId = String(campaignRecords?.selfCampaignId || '').trim();
    const selfComplete = selfCampaignId
      ? localStorage.getItem(`selfCampaignCompleted_${selfCampaignId}`) === 'true' || Boolean(campaignRecords?.selfCompleted)
      : localStorage.getItem('selfCampaignCompleted') === 'true';
    const teamComplete = localStorage.getItem('teamCampaignCompleted') === 'true';

    const selfPath = campaignRecords?.selfCampaignId
      ? `/campaign/${campaignRecords.selfCampaignId}`
      : null;
    const profileComplete = Boolean(String(userInfo?.name || '').trim() || String(userInfo?.email || '').trim());
    const behaviorsComplete = Boolean(latestFormData && typeof latestFormData === 'object');
    const insightsComplete = Boolean(aiSummary);
    const campaignComplete = Array.isArray(currentCampaign) && currentCampaign.length > 0
      || Boolean(campaignRecords?.bundleId || campaignRecords?.teamCampaignId || campaignRecords?.selfCampaignId);
    const userKey = String(userInfo?.email || userInfo?.name || userInfo?.uid || 'anonymous').trim() || 'anonymous';
    const currentCampaignId = String(
      campaignRecords?.teamCampaignId
      || campaignRecords?.selfCampaignId
      || campaignRecords?.bundleId
      || '123'
    ).trim();
    const savedPlans = actionPlansByCampaign?.[currentCampaignId]?.[userKey]?.plans;
    const savedPlanCount = Object.values(savedPlans || {}).reduce((count, subTraitsByTrait) => {
      const subTraitPlans = Object.values(subTraitsByTrait || {});
      const completedInTrait = subTraitPlans.filter((plan) => {
        const commitment = String(plan?.commitment || '').trim();
        const behaviorCommitment = String(plan?.guidedAnswers?.behaviorCommitment || '').trim();
        const checklistItems = Array.isArray(plan?.items) ? plan.items.length : 0;
        return Boolean(commitment || behaviorCommitment || checklistItems > 0);
      }).length;
      return count + completedInTrait;
    }, 0);
    const reviewComplete = savedPlanCount >= 3;
    const isSignedIn = Boolean(auth?.currentUser || userInfo?.uid || userInfo?.email);

    const completionMap = {
      profile: profileComplete,
      behaviors: behaviorsComplete,
      insights: insightsComplete,
      campaign: campaignComplete,
      self: selfComplete,
      team: teamComplete,
      review: reviewComplete,
    };

    const getRoutePhase = () => {
      if (pathname.startsWith('/user-info')) return 'profile';
      if (pathname.startsWith('/form')) return 'behaviors';
      if (pathname.startsWith('/summary')) return 'insights';
      if (pathname.startsWith('/trait-selection')) return 'campaign';
      if (pathname.startsWith('/campaign-builder') || pathname.startsWith('/campaign-intro')) return 'campaign';
      if (pathname.startsWith('/campaign-verify')) return 'self';
      if (pathname.startsWith('/campaign/')) {
        const match = pathname.match(/^\/campaign\/([^/]+)/);
        const campaignId = match?.[1];
        const campaignFromStorage = campaignId
          ? parseJson(localStorage.getItem(`campaign_${campaignId}`), {})
          : {};
        const isSelfType = campaignFromStorage?.campaignType === 'self';
        return isSelfType ? 'self' : 'team';
      }
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/sign-in')) return 'review';
      return null;
    };

    const routePhase = getRoutePhase();
    const firstIncompleteIndex = PHASES.findIndex((phase) => !completionMap[phase.id]);
    const fallbackCurrentIndex = firstIncompleteIndex === -1 ? PHASES.length - 1 : firstIncompleteIndex;
    const routeIndex = PHASES.findIndex((phase) => phase.id === routePhase);
    const currentIndex = routeIndex >= 0 ? routeIndex : fallbackCurrentIndex;

    const phaseLinks = {
      profile: '/user-info',
      behaviors: '/form',
      insights: '/summary',
      campaign: '/campaign-builder',
      self: selfPath,
      team: '/dashboard?tab=campaign-details',
      review: '/dashboard?tab=growth-plan',
    };

    return {
      currentIndex,
      completionMap,
      phaseLinks,
      currentPhaseTitle: PHASES[currentIndex]?.title || 'Growth Path',
      homeTarget: isSignedIn ? '/dashboard?tab=campaign-details' : '/sign-in',
    };
  }, [pathname, location.search]);

  const wrapperSx = embedded
    ? {}
    : {
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 7,
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.22)',
        bgcolor: 'rgba(8, 14, 26, 0.45)',
        backdropFilter: 'blur(8px)',
      };

  return (
    <Box sx={wrapperSx}>
      <Box
        sx={{
          px: embedded ? 0 : { xs: 2, md: 3.5 },
          py: embedded ? 0 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: embedded ? 'flex-end' : 'space-between',
          gap: 2,
        }}
      >
        {!embedded && showBrand ? (
          <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 210 }}>
            <Box
              component="img"
              src="/CompassLogo.png"
              alt="Compass logo"
              sx={{ width: { xs: 44, md: 52 }, height: { xs: 44, md: 52 }, objectFit: 'contain' }}
            />
          </Stack>
        ) : (
          !embedded && <Box />
        )}

        {!embedded && (
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: { xs: '1.16rem', md: '1.38rem' },
              fontWeight: 800,
              color: 'rgba(255,255,255,0.96)',
              lineHeight: 1.05,
              textAlign: 'center',
              flex: 1,
            }}
          >
            {titleOverride || model.currentPhaseTitle}
          </Typography>
        )}

        <Stack direction="row" spacing={0.9} alignItems="center">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isCurrent = idx === model.currentIndex;
            const isComplete = Boolean(model.completionMap[phase.id]) && !isCurrent;
            const canNavigate = Boolean(model.phaseLinks[phase.id]) && !isComplete && (isCurrent || idx <= model.currentIndex);
            const bg = isCurrent ? '#ECC94B' : isComplete ? '#2F855A' : 'rgba(142, 152, 166, 0.65)';
            const fg = isCurrent ? '#1E1E1E' : '#FFFFFF';

            return (
              <Tooltip key={phase.id} title={phase.title} arrow placement="bottom">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.3,
                    bgcolor: bg,
                    border: '1px solid rgba(255,255,255,0.34)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 0 2px rgba(236,201,75,0.22)' : 'none',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                      transform: canNavigate ? 'translateY(-1px)' : 'none',
                    },
                  }}
                >
                  <IconButton
                    onClick={() => canNavigate && navigate(model.phaseLinks[phase.id])}
                    disabled={!canNavigate}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      color: fg,
                      '&.Mui-disabled': { color: 'rgba(255,255,255,0.82)' },
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Tooltip>
            );
          })}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: 0.25,
              borderColor: 'rgba(255,255,255,0.42)',
              borderRightWidth: '1px',
              height: 24,
              alignSelf: 'center',
            }}
          />
          <Tooltip title="Dashboard Home" arrow placement="bottom">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.3,
                bgcolor: 'rgba(84, 108, 133, 0.72)',
                border: '1px solid rgba(255,255,255,0.34)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
            >
              <IconButton
                onClick={() => navigate(model.homeTarget)}
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  color: '#FFFFFF',
                }}
              >
                <HomeRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}

export default ProcessTopRail;
