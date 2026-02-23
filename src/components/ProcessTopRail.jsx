import React, { useMemo } from 'react';
import { Box, Stack, Tooltip, IconButton, Typography } from '@mui/material';
import {
  AccountCircle,
  Psychology,
  Insights,
  BuildCircle,
  SelfImprovement,
  Groups,
  FactCheck,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const PHASES = [
  { id: 'profile', title: 'Profile Creation', icon: AccountCircle, fallbackPath: '/user-info' },
  { id: 'behaviors', title: 'Behaviors & Instincts', icon: Psychology, fallbackPath: '/form' },
  { id: 'insights', title: 'Insights Review', icon: Insights, fallbackPath: '/summary' },
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

function ProcessTopRail({ sticky = true, embedded = false, showBrand = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname || '';
  const searchParams = new URLSearchParams(location.search || '');

  const model = useMemo(() => {
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const latestFormData = parseJson(localStorage.getItem('latestFormData'), null);
    const campaignRecords = parseJson(localStorage.getItem('campaignRecords'), {});
    const aiSummary = String(localStorage.getItem('aiSummary') || '').trim();
    const currentCampaign = parseJson(localStorage.getItem('currentCampaign'), []);
    const selfComplete = localStorage.getItem('selfCampaignCompleted') === 'true';
    const teamComplete = localStorage.getItem('teamCampaignCompleted') === 'true';

    const selfPath = campaignRecords?.selfCampaignId
      ? `/campaign/${campaignRecords.selfCampaignId}?mode=self`
      : null;
    const teamPath = campaignRecords?.teamCampaignId
      ? `/campaign/${campaignRecords.teamCampaignId}`
      : null;

    const profileComplete = Boolean(String(userInfo?.name || '').trim() || String(userInfo?.email || '').trim());
    const behaviorsComplete = Boolean(latestFormData && typeof latestFormData === 'object');
    const insightsComplete = Boolean(aiSummary);
    const campaignComplete = Array.isArray(currentCampaign) && currentCampaign.length > 0
      || Boolean(campaignRecords?.bundleId || campaignRecords?.teamCampaignId || campaignRecords?.selfCampaignId);

    const completionMap = {
      profile: profileComplete,
      behaviors: behaviorsComplete,
      insights: insightsComplete,
      campaign: campaignComplete,
      self: selfComplete,
      team: teamComplete,
      review: false,
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
        const isSelfMode = searchParams.get('mode') === 'self';
        const campaignFromStorage = campaignId
          ? parseJson(localStorage.getItem(`campaign_${campaignId}`), {})
          : {};
        const isSelfType = campaignFromStorage?.campaignType === 'self';
        return isSelfMode || isSelfType ? 'self' : 'team';
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
      team: teamPath,
      review: '/dashboard',
    };

    return {
      currentIndex,
      completionMap,
      phaseLinks,
      currentPhaseTitle: PHASES[currentIndex]?.title || 'Growth Path',
    };
  }, [pathname, location.search, searchParams]);

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
            {model.currentPhaseTitle}
          </Typography>
        )}

        <Stack direction="row" spacing={0.9} alignItems="center">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isCurrent = idx === model.currentIndex;
            const isComplete = Boolean(model.completionMap[phase.id]) && !isCurrent;
            const canNavigate = Boolean(model.phaseLinks[phase.id]) && (isCurrent || isComplete || idx <= model.currentIndex);
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
        </Stack>
      </Box>
    </Box>
  );
}

export default ProcessTopRail;
