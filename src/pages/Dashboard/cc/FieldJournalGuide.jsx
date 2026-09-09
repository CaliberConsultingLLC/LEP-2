import React from 'react';
import GuidePortrait from '../../../components/guide/GuidePortrait';
import { fitPortrait, journalStandingHeight } from '../../../components/guide/guideGeometry';
import { GUIDE_Z } from '../../../components/guidePlacement';
import { perchedSrc } from '../../../data/guideArt';

// Where the guide stands: the window's bottom-left corner.
//
// It briefly stood in the BOOK's corner instead — sized off the book's scale,
// its leading edge measured across the left page, its feet on the book's bottom
// edge. That held the two together as one picture at every window shape, which
// is a real property and the reason it was tried. But the book is centred in
// the room and floats above its floor, so standing the bird on the book's line
// lifted it 71px off the window's and pushed it 66px in from the left, and a
// guide that touches no edge of anything is not standing in the room — it is a
// cut-out laid on top of it. The corner is the anchor. The book is what the
// bird happens to be next to.
//
// So there are no numbers here at all now. The bird's own left edge goes on the
// window's left edge and its feet on the window's floor, both worked back
// through the measured art rather than through the transparent padding around
// it, and the height comes off the window like every other standing guide's.

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
  scene = null,
}) {
  const owlSrc = perchedSrc(persona?.poses, persona?.poses?.[pose] || persona?.poses?.idle);

  // The scene no longer says where the bird stands, only that the room has
  // measured itself — the window's height is read off it rather than through a
  // second resize listener saying the same thing one frame apart. Until it
  // arrives the guide holds its place but stays invisible, rather than
  // appearing at a guessed size and walking to the right one.
  const fit = scene && owlSrc
    ? fitPortrait({
      src: owlSrc,
      mirrored: true,
      height: journalStandingHeight(scene.vh),
      trailX: 0,
      footInset: 0,
    })
    : null;

  return (
    <GuidePortrait
      src={owlSrc}
      owlSx={fit
        ? { width: fit.width, left: fit.left, right: 'auto', bottom: fit.bottom }
        : { opacity: 0 }}
      resolveKey={fit ? `${Math.round(fit.left)}:${Math.round(fit.width)}:${Math.round(fit.bottom)}` : 'unfit'}
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
