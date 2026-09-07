import React from 'react';
import { Typography } from '@mui/material';
import GuidePortrait from './guide/GuidePortrait';
import { colors, fonts } from '../styles/tokens';
import { SUMMARY_BRIEFING_Z } from './summaryGuideLayout';

// What the guide says before each part of the reflection.
//
// This used to carry its own geometry — `left: { md: 290, lg: 350, xl: 390 }`
// and a clamped `bottom` — which put the bubble across the owl's forehead at
// every window size I measured, with the tail pointing down into its skull.
// All of that is gone. GuidePortrait stands the owl and GuideSpeech works out
// where a bubble can sit without covering the face, the way on, or anything
// the page behind has marked as keep-clear.

export default function SummaryBriefingModal({
  open,
  persona,
  stageLabel,
  text,
  onDone,
}) {
  if (!open) return null;

  const pose = persona?.poses?.read || persona?.poses?.idle;

  return (
    <GuidePortrait
      src={pose}
      alt={`${persona?.name || 'Guide'} briefing`}
      backdrop
      eyebrow={persona?.name || 'Guide'}
      text={(
        <>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontFamily: fonts.serif,
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: 21,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: colors.amberSoft,
              mb: '9px',
            }}
          >
            Before {stageLabel}
          </Typography>
          {text}
        </>
      )}
      action={{ label: 'Okay', onClick: onDone, autoFocus: true }}
      onDismiss={onDone}
      zIndex={SUMMARY_BRIEFING_Z}
      maxWidth={360}
    />
  );
}
