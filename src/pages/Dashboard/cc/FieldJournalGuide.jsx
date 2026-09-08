import React from 'react';
import GuidePortrait from '../../../components/guide/GuidePortrait';
import { fitPortrait } from '../../../components/guide/guideGeometry';
import { GUIDE_Z } from '../../../components/guidePlacement';

// Where the guide stands, in the book's units.
//
// The book is drawn at 1140 x 724 and scaled as one piece, so these three
// numbers are the whole composition: how tall the bird is against the book,
// how far its leading edge reaches across the left page, and where its feet
// come down relative to the book's bottom edge. Because they are in the book's
// units they are multiplied by the book's own scale, which means the picture
// is the same picture at 1100 x 850 and at 1900 x 950 — the window changes how
// big the scene is drawn, never how it is arranged.
//
// That is the fix for the thing that made placement look arbitrary. The bird
// was sized by a breakpoint on the window's WIDTH (240/300/480/580/640, in
// steps) and pinned to the window's left edge, while the book is sized by the
// room's HEIGHT and centred in its width. Two systems keyed to two different
// dimensions only agree at one aspect ratio, and the window is free to be any
// other one.
const OWL_HEIGHT = 545;   // the bird's drawn height, in book units
const OWL_LEAD_X = 480;   // its leading edge, measured from the book's left edge
const OWL_FOOT = 24;      // how far below the book's bottom edge it stands

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
  const owlSrc = persona?.poses?.[pose] || persona?.poses?.idle;

  // Until the book has measured itself there is no scene to stand in, so the
  // guide keeps the corner it has always had rather than flashing somewhere
  // else for a frame on the way to the right answer.
  const fit = scene && owlSrc
    ? fitPortrait({
      src: owlSrc,
      mirrored: true,
      height: OWL_HEIGHT * scene.scale,
      leadX: scene.left + OWL_LEAD_X * scene.scale,
      footInset: scene.footInset + OWL_FOOT * scene.scale,
    })
    : null;

  return (
    <GuidePortrait
      src={owlSrc}
      owlSx={fit ? { width: fit.width, left: fit.left, right: 'auto', bottom: fit.bottom } : undefined}
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
