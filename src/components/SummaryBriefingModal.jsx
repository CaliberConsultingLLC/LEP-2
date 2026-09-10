import React from 'react';
import { Typography } from '@mui/material';
import GuidePortrait from './guide/GuidePortrait';
import { perchedSrc } from '../data/guideArt';
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
//
// It stands in the corner rather than `centred`.
//
// Centring did not centre the bubble by moving the bubble — it moved the BIRD,
// to whatever x put its line across the middle of the window. That reads as a
// guide standing in the middle of the room: unanchored, and drawn small,
// because a bird placed by its speak point is sized to clear the bubble rather
// than to stand anywhere. The corner is where this guide stands on every other
// screen in the product, and SUMMARY_OWL already describes it — bottom left,
// mirrored, up to 640px.
//
// The line does not end up in a corner as a result: the bird faces right out
// of the left corner, and the solver puts its bubble on the side it is facing,
// which is into the middle of the page. What is lost is the bubble landing on
// dead centre exactly; what is gained is a guide that is somewhere.

export default function SummaryBriefingModal({
  open,
  persona,
  stageLabel,
  text,
  onDone,
}) {
  if (!open) return null;

  const pose = perchedSrc(persona?.poses, persona?.poses?.read || persona?.poses?.idle);

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
