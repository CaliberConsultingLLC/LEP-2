import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, type } from '../styles/tokens';

/** Shared campaign-stage type: Trait Selection, Campaign Builder, Review & Send. */
export const stageType = {
  eyebrow: {
    ...type.eyebrow,
    textAlign: 'center',
  },
  title: {
    ...type.pageTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...type.subtitle,
    textAlign: 'center',
    mx: 'auto',
  },
  meta: {
    ...type.eyebrow,
    textAlign: 'center',
    mt: 0.85,
    color: colors.navy500,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 1.7,
    color: colors.ink,
    textAlign: 'left',
  },
  cardLabel: {
    ...type.eyebrow,
    textAlign: 'left',
    mb: 0.85,
  },
  cardBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 1.55,
    color: colors.navy900,
    textAlign: 'left',
  },
  statement: {
    ...type.question,
    textAlign: 'left',
  },
};

export function StageDiamond({ compact = false }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.15,
        my: compact ? '8px' : '14px',
      }}
    >
      <Box sx={{ width: 56, borderTop: `1px solid ${colors.orange}`, opacity: 0.7 }} />
      <Box sx={{ color: colors.orange, fontSize: 8, lineHeight: 1, opacity: 0.9 }}>◆</Box>
      <Box sx={{ width: 56, borderTop: `1px solid ${colors.orange}`, opacity: 0.7 }} />
    </Box>
  );
}

export default function CampaignStageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
}) {
  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      {eyebrow ? (
        <Typography sx={{ ...stageType.eyebrow, mb: 1.1 }}>
          {eyebrow}
        </Typography>
      ) : null}
      <Typography sx={{ ...stageType.title, mb: subtitle ? 0.65 : 0 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={stageType.subtitle}>
          {subtitle}
        </Typography>
      ) : null}
      {meta ? (
        <Typography sx={stageType.meta}>
          {meta}
        </Typography>
      ) : null}
      <StageDiamond />
    </Box>
  );
}
