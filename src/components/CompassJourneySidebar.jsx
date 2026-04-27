import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const PHASES = [
  { id: 'profile',   chapterNum: 'I',   label: 'Profile Creation',       sub: 'Identity',             path: '/user-info' },
  { id: 'behaviors', chapterNum: 'II',  label: 'Behaviors & Instincts',  sub: 'Behaviors',            path: '/form' },
  { id: 'insights',  chapterNum: 'III', label: 'Leadership Reflection',  sub: 'Reflection',           path: '/summary' },
  { id: 'campaign',  chapterNum: 'IV',  label: 'Campaign Creation',      sub: 'Campaign',             path: '/campaign-builder' },
  { id: 'self',      chapterNum: 'V',   label: 'Self-Assess',            sub: 'Inner Bearing',        path: null },
  { id: 'team',      chapterNum: 'VI',  label: 'Team Assess',            sub: 'Outer Signal',         path: null },
  { id: 'review',    chapterNum: 'VII', label: 'Review & Act',           sub: 'Dashboard',            path: '/dashboard' },
];

const getPhaseFromPath = (pathname) => {
  if (pathname.startsWith('/user-info'))       return 'profile';
  if (pathname.startsWith('/form'))            return 'behaviors';
  if (pathname.startsWith('/summary'))         return 'insights';
  if (pathname.startsWith('/trait-selection')) return 'campaign';
  if (pathname.startsWith('/campaign-intro') || pathname.startsWith('/campaign-builder') || pathname.startsWith('/campaign-verify')) return 'campaign';
  if (pathname.startsWith('/campaign/'))       return 'self';
  if (pathname.startsWith('/dashboard'))       return 'review';
  return 'behaviors';
};

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

function CompassJourneySidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || '';

  const { currentPhaseId, completionMap } = useMemo(() => {
    const userInfo    = parseJson(localStorage.getItem('userInfo'), {});
    const latestForm  = parseJson(localStorage.getItem('latestFormData'), null);
    const campaigns   = parseJson(localStorage.getItem('campaignRecords'), {});
    const aiSummary   = String(localStorage.getItem('aiSummary') || '').trim();
    const currentCamp = parseJson(localStorage.getItem('currentCampaign'), []);

    const selfCampId     = String(campaigns?.selfCampaignId || '').trim();
    const selfComplete   = selfCampId
      ? localStorage.getItem(`selfCampaignCompleted_${selfCampId}`) === 'true' || Boolean(campaigns?.selfCompleted)
      : localStorage.getItem('selfCampaignCompleted') === 'true';

    return {
      currentPhaseId: getPhaseFromPath(pathname),
      completionMap: {
        profile:   Boolean(String(userInfo?.name || '').trim() || String(userInfo?.email || '').trim()),
        behaviors: Boolean(latestForm && typeof latestForm === 'object'),
        insights:  Boolean(aiSummary),
        campaign:  (Array.isArray(currentCamp) && currentCamp.length > 0) || Boolean(campaigns?.bundleId || campaigns?.teamCampaignId || campaigns?.selfCampaignId),
        self:      selfComplete,
        team:      localStorage.getItem('teamCampaignCompleted') === 'true',
        review:    Boolean(auth?.currentUser),
      },
    };
  }, [pathname]);

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid var(--sand-200, #E8DBC3)',
        borderRadius: '22px',
        p: '18px 12px 14px',
        position: 'sticky',
        top: 96, // below 72px topbar + 3px progress + gap
      }}
    >
      {PHASES.map((phase) => {
        const isCurrent  = phase.id === currentPhaseId;
        const isComplete = completionMap[phase.id] && !isCurrent;
        const canNav     = Boolean(phase.path) && (isComplete || isCurrent);

        return (
          <Box
            key={phase.id}
            component={canNav ? 'button' : 'div'}
            type={canNav ? 'button' : undefined}
            onClick={canNav ? () => navigate(phase.path) : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              p: '10px 12px',
              borderRadius: '12px',
              cursor: canNav ? 'pointer' : 'default',
              mb: 0.5,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              bgcolor: isCurrent ? 'var(--navy-900, #10223C)' : 'transparent',
              color: isCurrent ? 'var(--amber-soft, #F4CEA1)' : 'var(--ink-soft, #44566C)',
              transition: '140ms',
              '&:hover': canNav && !isCurrent
                ? { bgcolor: 'var(--sand-50, #FBF7F0)', color: 'var(--navy-900, #10223C)' }
                : {},
              '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
            }}
          >
            {/* Icon box */}
            <Box
              aria-hidden
              sx={{
                width: 28, height: 28,
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Fraunces", Georgia, serif',
                fontWeight: 700, fontSize: 12,
                flexShrink: 0,
                bgcolor: isComplete
                  ? 'var(--green, #2F855A)'
                  : isCurrent
                  ? 'var(--orange, #E07A3F)'
                  : 'var(--sand-50, #FBF7F0)',
                color: isComplete || isCurrent ? '#fff' : 'var(--navy-700, #1E3A5C)',
              }}
            >
              {isComplete ? '✓' : phase.chapterNum}
            </Box>

            {/* Label + status */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  fontFamily: '"Manrope", "Inter", sans-serif',
                  fontWeight: 600, fontSize: 13,
                  lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {phase.label}
              </Box>
              <Box
                sx={{
                  fontFamily: '"Manrope", "Inter", sans-serif',
                  fontSize: 10, opacity: 0.7, mt: '1px',
                }}
              >
                {isComplete ? 'Complete' : isCurrent ? 'In progress' : 'Upcoming'}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default CompassJourneySidebar;
