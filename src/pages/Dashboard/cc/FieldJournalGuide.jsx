import React from 'react';
import GuidePortrait from '../../../components/guide/GuidePortrait';
import { GUIDE_Z } from '../../../components/guidePlacement';

/**
 * The journal's guide: the large mirrored owl standing bottom-left, saying the
 * room's line.
 *
 * It used to place its own bubble at fractions of the owl's width — "roughly
 * .62 out and .72 up" — plus a clamp that pulled it back off the book's
 * gutter. Those fractions were read off the art the right way round, but this
 * owl is mirrored, which puts the head at about .61 across: exactly where the
 * bubble's left edge was. The measured result was the bubble covering 40% of
 * the owl's face at 1440x900 and 47% at 1280x720.
 *
 * None of that arithmetic survives. GuidePortrait stands the owl, GuideSpeech
 * solves the bubble against the measured head and the page's keep-clear
 * regions, and the gutter clamp is unnecessary because the solver already
 * knows where the window ends.
 *
 * This owl also delivers the room's interruption. Everywhere else that is the
 * small owl in the bottom-right corner, but here there is already a guide on
 * screen, and a second one appearing in the opposite corner to say the line
 * reads as two guides rather than one.
 */
export default function FieldJournalGuide({
  persona,
  eyebrow,
  text,
  pose = 'think',
  interrupting = false,
  cta = 'Okay',
  acknowledge = false,
  acknowledgeLabel = 'I have read this.',
  onDone,
}) {
  const owlSrc = persona?.poses?.[pose] || persona?.poses?.idle;

  return (
    <GuidePortrait
      src={owlSrc}
      alt={persona?.name ? `${persona.name} guide` : 'Guide'}
      eyebrow={eyebrow}
      text={text}
      backdrop={interrupting}
      // An acknowledgement has to be given, not escaped past, so the click-away
      // is only offered when the page did not ask for one.
      dismissOnBackdrop={!acknowledge}
      action={interrupting
        ? { label: cta, onClick: onDone, acknowledge, acknowledgeLabel, autoFocus: true }
        : null}
      onDismiss={onDone}
      zIndex={interrupting ? GUIDE_Z + 40 : GUIDE_Z - 40}
      maxWidth={320}
    />
  );
}
