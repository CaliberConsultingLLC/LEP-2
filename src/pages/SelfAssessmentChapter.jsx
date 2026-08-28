import React, { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import LoadingScreen from '../components/LoadingScreen';
import CampaignStageHeader, { stageType } from '../components/CampaignStageCopy';
import {
  getSelfCampaignId,
  selfAssessmentComplete,
} from '../data/chapterMap';
import { buttons, colors, fonts, radii, surfaces } from '../styles/tokens';

function SelfAssessmentChapter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const step = String(params.get('step') || '').trim().toLowerCase();
  const complete = selfAssessmentComplete();
  const selfId = getSelfCampaignId();

  useEffect(() => {
    if (!selfId) {
      navigate('/campaign-verify', { replace: true });
    }
  }, [selfId, navigate]);

  useEffect(() => {
    if (step !== 'self' || !selfId) return;
    if (complete) return;
    navigate(`/campaign/${selfId}/survey`, { replace: true });
  }, [step, complete, selfId, navigate]);

  const stepStatus = useMemo(
    () => (complete ? { self: 'done' } : {}),
    [complete]
  );

  const beginSelf = () => {
    if (!selfId) return;
    navigate(`/campaign/${selfId}/survey`);
  };

  const goTeam = () => navigate('/team-assessment');

  if (step === 'self' && complete) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
        <ProcessTopRail
          chapterId="self"
          activeStepId="self"
          stepStatus={stepStatus}
          chip={{ variant: 'sequence', label: 'Statements', current: 15, total: 15 }}
        />
        <CompassLayout afterTopbar>
          <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
            <CampaignStageHeader
              eyebrow="Self-Assessment"
              title="Your benchmark is locked"
              subtitle="You already answered the fifteen statements. That reading stays private and cannot be retaken."
            />
            <Box sx={{ ...surfaces.card, p: { xs: 2.5, md: 3 }, textAlign: 'left' }}>
              <Typography sx={stageType.cardBody}>
                Next you send a different link to your team. Compass will never email them for you — that manual step is how their answers stay anonymous.
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={goTeam}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  mt: 2.5,
                  ...buttons.primary,
                  borderRadius: radii.pill,
                }}
              >
                Team Assessment
              </Box>
            </Box>
          </Box>
        </CompassLayout>
      </Box>
    );
  }

  if (step === 'self' && !complete) {
    return (
      <LoadingScreen
        title="Opening your self-assessment..."
        subtitle="The same fifteen statements you just locked in."
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
      <ProcessTopRail
        chapterId="self"
        activeStepId="info"
        stepStatus={stepStatus}
      />
      <CompassLayout afterTopbar>
        <Box sx={{ width: '100%', maxWidth: 680, mx: 'auto' }}>
          <CampaignStageHeader
            eyebrow="Information"
            title="How this chapter works"
            subtitle="You go first. Then your team. You send the invite yourself so the answers can stay anonymous."
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, textAlign: 'left' }}>
              <Typography sx={{ ...stageType.cardLabel, mb: 1 }}>You first</Typography>
              <Typography sx={stageType.body}>
                You will rate yourself on the same fifteen statements you just locked in — not a second personality test, and not a different campaign. This is your private benchmark. Your team never sees these answers.
              </Typography>
            </Box>

            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, textAlign: 'left' }}>
              <Typography sx={{ ...stageType.cardLabel, mb: 1 }}>Then your team</Typography>
              <Typography sx={stageType.body}>
                After you finish, Compass gives you a unique team link and a password. You distribute those yourself — email, chat, a printed note, whatever you already use. We do not send the invite, and we do not track who opened it.
              </Typography>
            </Box>

            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, textAlign: 'left' }}>
              <Typography sx={{ ...stageType.cardLabel, mb: 1 }}>Why you send it by hand</Typography>
              <Typography sx={stageType.body}>
                Manual distribution is how we can promise full anonymity. There is zero tracking liability: no roster of who clicked, no reminder that names a person, no way for Compass — or you — to connect an answer to a name. You will see counts and patterns. Never individuals.
              </Typography>
            </Box>

            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, textAlign: 'left' }}>
              <Typography sx={{ ...stageType.cardLabel, mb: 1 }}>This assessment locks</Typography>
              <Typography sx={stageType.body}>
                Once you complete the self-assessment, it is locked. You cannot go back in and revise it. That is the point of a benchmark: one honest pass, then you invite the people who actually see you lead.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
            <Box
              component="button"
              type="button"
              onClick={complete ? goTeam : beginSelf}
              disabled={!complete && !selfId}
              sx={{
                all: 'unset',
                cursor: (!complete && !selfId) ? 'not-allowed' : 'pointer',
                opacity: (!complete && !selfId) ? 0.65 : 1,
                ...buttons.primary,
                borderRadius: radii.pill,
              }}
            >
              {complete ? 'Team Assessment' : 'Begin self-assessment'}
            </Box>
          </Box>
          <Typography sx={{ ...stageType.cardBody, textAlign: 'center', color: colors.inkSoft, fontFamily: fonts.sans }}>
            About five minutes. Answer as you actually show up, not the version you wish they saw.
          </Typography>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default SelfAssessmentChapter;
