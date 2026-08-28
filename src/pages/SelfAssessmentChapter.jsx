import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import LoadingScreen from '../components/LoadingScreen';
import { StageDiamond, stageType } from '../components/CampaignStageCopy';
import {
  getSelfCampaignId,
  selfAssessmentComplete,
} from '../data/chapterMap';
import { readCampaignRecords } from '../utils/campaignBundle';
import { buttons, colors, fonts, radii, surfaces } from '../styles/tokens';

const INFO_POINTS = [
  {
    title: 'You first',
    body: 'Rate yourself on the same fifteen statements. This is your private benchmark — your team never sees it.',
  },
  {
    title: 'Then your team',
    body: 'You get a unique link and password. You send those yourself. Compass does not email your team.',
  },
  {
    title: 'Why you send it by hand',
    body: 'Manual send is how we promise anonymity. No roster, no named reminders, no way to connect an answer to a person.',
  },
  {
    title: 'This assessment locks',
    body: 'Once you finish, you cannot go back in. One honest pass, then you invite the people who actually see you lead.',
  },
];

function CopyRow({ label, value, copied, onCopy }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        p: 1.25,
        ...surfaces.cardInner,
        bgcolor: colors.sand50,
        textAlign: 'left',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...stageType.cardLabel, mb: 0.2, color: colors.inkSoft }}>{label}</Typography>
        <Typography
          sx={{
            ...stageType.cardBody,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: fonts.mono,
            fontSize: 13,
            letterSpacing: '0.02em',
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onCopy}
        disabled={!value}
        sx={{
          all: 'unset',
          cursor: value ? 'pointer' : 'not-allowed',
          display: 'inline-flex',
          alignItems: 'center',
          px: '14px',
          py: '8px',
          borderRadius: radii.pill,
          border: `1px solid ${colors.sand200}`,
          bgcolor: copied ? colors.navy900 : colors.surface1,
          color: copied ? colors.amberSoft : colors.inkSoft,
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: '0.8rem',
          flexShrink: 0,
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </Box>
    </Box>
  );
}

function CompactHeader({ eyebrow, title, subtitle }) {
  return (
    <Box sx={{ width: '100%', textAlign: 'center', mb: 1.1, pt: { xs: 1.5, md: 2 } }}>
      <Typography sx={{ ...stageType.eyebrow, mb: 0.5 }}>{eyebrow}</Typography>
      <Typography sx={{ ...stageType.title, fontSize: { xs: 22, md: 24 }, mb: subtitle ? 0.35 : 0 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ ...stageType.subtitle, fontSize: 14, maxWidth: '48ch' }}>
          {subtitle}
        </Typography>
      ) : null}
      <StageDiamond compact />
    </Box>
  );
}

function SelfAssessmentChapter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const step = String(params.get('step') || '').trim().toLowerCase();
  const isInvite = step === 'invite' || location.pathname.startsWith('/team-assessment');
  const complete = selfAssessmentComplete();
  const selfId = getSelfCampaignId();
  const records = useMemo(() => readCampaignRecords(), [complete, isInvite]);
  const [copied, setCopied] = useState({ link: false, password: false });

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

  useEffect(() => {
    if (isInvite && !complete) {
      navigate('/self-assessment', { replace: true });
    }
  }, [isInvite, complete, navigate]);

  const stepStatus = useMemo(() => ({
    self: complete ? 'done' : undefined,
    invite: complete ? undefined : 'locked',
  }), [complete]);

  const beginSelf = () => {
    if (!selfId) return;
    navigate(`/campaign/${selfId}/survey`);
  };

  const goInvite = () => navigate('/self-assessment?step=invite');

  const copy = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const link = records?.teamCampaignLink || (records?.teamCampaignId
    ? `${window.location.origin}/campaign/${records.teamCampaignId}`
    : '');
  const password = records?.teamCampaignPassword || '';

  const rail = (activeStepId, chip) => (
    <ProcessTopRail
      chapterId="self"
      activeStepId={activeStepId}
      stepStatus={stepStatus}
      chip={chip}
    />
  );

  if (step === 'self' && complete) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
        {rail('self', { variant: 'sequence', label: 'Statements', current: 15, total: 15 })}
        <CompassLayout afterTopbar>
          <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
            <CompactHeader
              eyebrow="Campaign Assessment"
              title="Your benchmark is locked"
              subtitle="You already answered the fifteen statements. That reading stays private and cannot be retaken."
            />
            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.5 }, textAlign: 'left' }}>
              <Typography sx={stageType.cardBody}>
                Next you send a different link to your team. Compass will never email them for you — that manual step is how their answers stay anonymous.
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={goInvite}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  mt: 2.25,
                  ...buttons.primary,
                  borderRadius: radii.pill,
                }}
              >
                Team Invite
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
        title="Opening your assessment..."
        subtitle="The same fifteen statements you just locked in."
      />
    );
  }

  if (isInvite) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
        {rail('invite')}
        <CompassLayout afterTopbar>
          <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
            <CompactHeader
              eyebrow="Team Invite"
              title="Send this to your team"
              subtitle="One link, one password, sent by you. That is how their answers stay anonymous."
            />
            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.5 }, textAlign: 'left' }}>
              <Typography sx={{ ...stageType.body, fontSize: 14.5, mb: 1.75 }}>
                This is not the link you just used. Copy both, then send them yourself — email, Slack, a printed card. Compass will not track who opened it and cannot match an answer to a name.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1, mb: 2 }}>
                <CopyRow
                  label="Team link"
                  value={link}
                  copied={copied.link}
                  onCopy={() => copy(link, 'link')}
                />
                <CopyRow
                  label="Team password"
                  value={password}
                  copied={copied.password}
                  onCopy={() => copy(password, 'password')}
                />
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => navigate('/dashboard')}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  ...buttons.outlinedPrimary,
                  borderRadius: radii.pill,
                }}
              >
                Continue to dashboard
              </Box>
              <Typography sx={{ ...stageType.cardBody, mt: 1.5, color: colors.inkSoft }}>
                Keep the window open until enough of your team has answered. Closing it opens Signal.
              </Typography>
            </Box>
          </Box>
        </CompassLayout>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
      {rail('info')}
      <CompassLayout afterTopbar>
        <Box sx={{ width: '100%', maxWidth: 680, mx: 'auto' }}>
          <CompactHeader
            eyebrow="Information"
            title="How this chapter works"
            subtitle="You go first. Then your team. You send the invite yourself so the answers stay anonymous."
          />
          <Box sx={{ ...surfaces.card, p: { xs: 1.75, md: 2 }, textAlign: 'left' }}>
            {INFO_POINTS.map((point, index) => (
              <Box
                key={point.title}
                sx={{
                  display: 'flex',
                  gap: 1.2,
                  alignItems: 'flex-start',
                  pt: index === 0 ? 0 : 1.05,
                  mt: index === 0 ? 0 : 1.05,
                  borderTop: index === 0 ? 'none' : `1px solid ${colors.sand200}`,
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: radii.circle,
                    flexShrink: 0,
                    mt: '1px',
                    bgcolor: colors.sand100,
                    border: `1px solid ${colors.sand200}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: colors.orangeDeep,
                  }}
                >
                  {index + 1}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...stageType.cardLabel, mb: 0.35 }}>{point.title}</Typography>
                  <Typography sx={{ ...stageType.cardBody, fontSize: 13.5, lineHeight: 1.5 }}>
                    {point.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.75 }}>
            <Box
              component="button"
              type="button"
              onClick={complete ? goInvite : beginSelf}
              disabled={!complete && !selfId}
              sx={{
                all: 'unset',
                cursor: (!complete && !selfId) ? 'not-allowed' : 'pointer',
                opacity: (!complete && !selfId) ? 0.65 : 1,
                ...buttons.primary,
                borderRadius: radii.pill,
              }}
            >
              {complete ? 'Team Invite' : 'Begin your assessment'}
            </Box>
          </Box>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default SelfAssessmentChapter;
