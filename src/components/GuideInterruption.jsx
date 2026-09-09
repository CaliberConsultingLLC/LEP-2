import React from 'react';
import GuidePortrait from './guide/GuidePortrait';
import { perchedImage, perchedSrc } from '../data/guideArt';
import { useGuide } from '../context/GuideContext';

// One interruption, used everywhere a room introduces itself.
//
// This file was written to be that and then never imported by anything, so
// four pages went on carrying their own version and their own offsets. It is
// the entry point again, and now it is thin: GuidePortrait stands the guide
// full height over the blurred page, GuideSpeech works out where the line can
// go, and the way on lives inside the bubble under what was said.
//
// Pages that already have a large owl on screen — the Summary, the field
// journal — reach for GuidePortrait directly rather than through this, because
// a second bird appearing to say the line reads as two guides rather than one.
// Everywhere else, this is the door.

export default function GuideInterruption({
  open,
  eyebrow,
  text,
  pose = 'think',
  cta = 'Okay',
  acknowledge = false,
  acknowledgeLabel,
  guideId,
  onDone,
  children,
}) {
  const guide = useGuide();
  if (!open) return null;

  const persona = guide?.persona;
  // The bird stands in the window's bottom-left corner here, so the same rule
  // as everywhere else applies: art whose branch runs the wrong way is swapped
  // for the nearest pose whose does.
  const src = guideId
    ? perchedImage(guideId, pose)
    : perchedSrc(persona?.poses, persona?.poses?.[pose] || persona?.poses?.idle);

  return (
    <GuidePortrait
      src={src}
      alt={persona?.name ? `${persona.name} guide` : 'Guide'}
      backdrop
      // An acknowledgement has to be given, not escaped past.
      dismissOnBackdrop={!acknowledge}
      eyebrow={eyebrow}
      text={text}
      action={{ label: cta, onClick: onDone, acknowledge, acknowledgeLabel, autoFocus: true }}
      onDismiss={acknowledge ? undefined : onDone}
      maxWidth={360}
    >
      {children}
    </GuidePortrait>
  );
}
