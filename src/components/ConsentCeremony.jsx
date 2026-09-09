// The last thing said before there is money in it.
//
// This used to be the front door: a full-bleed panel that opened the moment
// someone landed on /user-info, before they had typed a character. That put
// the terms of the thing in front of a stranger — no name, no email, nothing
// logged — and asked them to agree to it. Whoever walked away from that page
// walked away leaving us nothing at all.
//
// So it moved one step later. The form is now the first thing on the screen,
// and this is what happens when they press the button on it: the page behind
// dims, the guide steps in, and the account is created from in here. The
// account exists either way once they agree, and nobody has paid yet — the
// expectations land in the gap between the email being logged and the card
// coming out.
//
// It is the same interruption the rooms use, and it is drawn by the same two
// components: GuidePortrait stands the owl bottom-left and GuideSpeech works
// out where the bubble can sit without covering its face. Nothing here carries
// its own geometry.
//
// The one difference from every other interruption in the product: no guide
// has been chosen yet, because that happens after payment. This uses the house
// guide, and the copy is written to be true in any voice rather than in one.
//
// The ceremony is the delivery, not the record. Agreeing sets the same two
// flags the form has always carried, and they are still written with their
// timestamp on submit.

import React from 'react';
import { Box } from '@mui/material';
import GuidePortrait from './guide/GuidePortrait';
import { perchedImage } from '../data/guideArt';
import { colors, fonts } from '../styles/tokens';
import { SUMMARY_BRIEFING_Z } from './summaryGuideLayout';

const HOUSE_GUIDE = 'mentor';

// Four beats, in the order someone would ask them. Deliberately concrete —
// the point of saying this out loud is that "we value your privacy" is not
// information.
const BEATS = [
  {
    label: 'What you do',
    text: 'You answer a long set of questions about how you lead. It takes a while, and the reflection you get back is written from your answers rather than assembled from a template.',
  },
  {
    label: 'What your team does',
    text: 'You invite them yourself, with a link we never see the recipients of. They rate the same statements you rated about yourself. We hold no address for any of them.',
  },
  {
    label: 'What comes back',
    text: 'Their answers reach you anonymously and in aggregate. Where there are too few responses to be anonymous, you see nothing at all.',
  },
  {
    label: 'What we keep',
    text: 'Your answers, your reflection, and your team’s ratings, held against your account so you can come back to them. Yours to delete on request.',
  },
];

// Held out here rather than written inline, because the bubble resets its
// "I understand" tick whenever the line being said changes — and a line built
// fresh on every render is a new line every time the page behind re-renders.
// Opening the Terms was enough to quietly untick the box.
const SPEECH = (
  <>
    <Box
      component="span"
      sx={{
        display: 'block',
        fontFamily: fonts.serif,
        fontStyle: 'normal',
        fontWeight: 500,
        fontSize: { xs: 20, md: 22 },
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        color: colors.orangeDeep,
        mb: '9px',
      }}
    >
      Here is exactly how this works.
    </Box>
    This asks something of your team, so you should know what before you pay
    rather than after.
  </>
);

const linkSx = {
  all: 'unset',
  cursor: 'pointer',
  color: colors.orangeDeep,
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
};

export default function ConsentCeremony({ open, busy, onAgree, onCancel, onOpenTerms, onOpenPrivacy }) {
  if (!open) return null;

  return (
    <GuidePortrait
      src={perchedImage(HOUSE_GUIDE, 'lantern')}
      alt="Your guide"
      backdrop
      // The way out is the outlined button, not a click on the scrim. A form
      // full of typing sits behind this, and dismissing it by accident reads
      // as having lost the lot.
      dismissOnBackdrop={false}
      eyebrow="Before you pay"
      text={SPEECH}
      action={{
        label: busy ? 'Creating…' : 'Create my account',
        onClick: busy ? undefined : onAgree,
        autoFocus: true,
        acknowledge: true,
        acknowledgeLabel: 'I understand and agree.',
        secondary: { label: 'Not yet', onClick: busy ? undefined : onCancel },
      }}
      zIndex={SUMMARY_BRIEFING_Z}
      maxWidth={500}
    >
      {/* The beats scroll on a short window rather than growing the bubble
          past the bottom of it — the button underneath is the one thing that
          must never be the part that falls off. */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '13px',
          maxHeight: 'min(52vh, 430px)',
          overflowY: 'auto',
          pr: '4px',
        }}
      >
        {BEATS.map((beat) => (
          <Box key={beat.label} sx={{ borderLeft: `2px solid ${colors.brass}`, pl: '13px' }}>
            <Box sx={{
              fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: colors.orangeDeep, mb: '3px',
            }}>
              {beat.label}
            </Box>
            <Box sx={{
              fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.5, color: colors.ink,
            }}>
              {beat.text}
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          mt: '14px',
          pt: '12px',
          borderTop: `1px solid ${colors.sand200}`,
          fontFamily: fonts.sans,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: colors.inkSoft,
        }}
      >
        Creating an account means you agree to the{' '}
        <Box component="button" type="button" onClick={onOpenTerms} sx={linkSx}>
          Terms of Use
        </Box>
        {' '}and acknowledge the{' '}
        <Box component="button" type="button" onClick={onOpenPrivacy} sx={linkSx}>
          Privacy Policy
        </Box>
        . Both open here, and neither is longer than this bubble.
      </Box>
    </GuidePortrait>
  );
}
