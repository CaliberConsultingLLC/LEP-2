import React, { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CampaignStageHeader, { stageType } from '../components/CampaignStageCopy';
import { selfAssessmentComplete } from '../data/chapterMap';
import { readCampaignRecords } from '../utils/campaignBundle';
import { buttons, colors, fonts, radii, surfaces } from '../styles/tokens';

function CopyRow({ label, value, copied, onCopy }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        p: 1.5,
        ...surfaces.cardInner,
        bgcolor: colors.sand50,
        textAlign: 'left',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...stageType.cardLabel, mb: 0.3, color: colors.inkSoft }}>{label}</Typography>
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

function TeamAssessmentChapter() {
  const navigate = useNavigate();
  const complete = selfAssessmentComplete();
  const records = useMemo(() => readCampaignRecords(), []);
  const [copied, setCopied] = useState({ link: false, password: false });

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
      <ProcessTopRail chapterId="team" activeStepId="invite" />
      <CompassLayout afterTopbar>
        <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
          <CampaignStageHeader
            eyebrow="Team Invite"
            title="Send this to your team"
            subtitle="One link, one password, sent by you. That is how their answers stay anonymous."
          />

          {!complete ? (
            <Box sx={{ ...surfaces.card, p: { xs: 2.5, md: 3 }, textAlign: 'left' }}>
              <Typography sx={{ ...stageType.statement, fontSize: 18, mb: 1 }}>
                Finish your self-assessment first
              </Typography>
              <Typography sx={{ ...stageType.body, mb: 2.5 }}>
                The team link stays closed until your benchmark is in. That keeps the comparison honest — you answer before you see theirs.
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={() => navigate('/self-assessment')}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  ...buttons.primary,
                  borderRadius: radii.pill,
                }}
              >
                Back to Self-Assessment
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, textAlign: 'left' }}>
                  <Typography sx={{ ...stageType.cardLabel, mb: 1 }}>Reminder</Typography>
                  <Typography sx={stageType.body}>
                    This is not the link you just used. Do not send your self-assessment to anyone. Your team gets this invite only — a different URL and a different password.
                  </Typography>
                </Box>

                <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, textAlign: 'left' }}>
                  <Typography sx={{ ...stageType.cardLabel, mb: 1 }}>How to send it</Typography>
                  <Typography sx={{ ...stageType.body, mb: 2 }}>
                    Copy the link and password. Share them yourself — email, Slack, a printed card. Compass will not email your team, will not track who opened it, and cannot match an answer to a name. That is the anonymity promise.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.15 }}>
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
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
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
              </Box>
              <Typography sx={{ ...stageType.cardBody, textAlign: 'center', color: colors.inkSoft }}>
                Keep the window open until enough of your team has answered. Closing it opens Signal.
              </Typography>
            </>
          )}
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default TeamAssessmentChapter;
