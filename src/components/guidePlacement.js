// Where the guide stands, in one place.
//
// There were three placement systems: the global overlay fixed bottom-right,
// the in-layout rail panel, and the Summary's large mirrored owl fixed
// bottom-LEFT. Three sets of geometry meant the guide appeared on a different
// side depending on which page you were on, and the fixed overlay sat on top
// of whatever was underneath it — on Review & Lock that was the Lock it in
// button.
//
// One set of numbers, here, so the guide sits in the same place everywhere.
//
// It stays a true overlay: it never reserves layout space and never moves
// content. Reserving a gutter did keep it off the buttons, but it shifted the
// question text sideways the moment the guide opened, which is worse than the
// problem it solved.

export const GUIDE_Z = 1200;

// The right-hand column the expanded overlay occupies. Narrow enough to leave
// the 1180px content column intact on a laptop.
export const GUIDE_COLUMN = 'clamp(250px, 25vw, 350px)';

// The collapsed tab: small, and the only thing on screen when hidden.
export const GUIDE_TAB_HEIGHT = 48;
export const GUIDE_TAB_BOTTOM = 32;

/**
 * The Summary's owl is the one deliberate exception: full-bleed, mirrored, and
 * anchored bottom-left so the reflection card can sit to its right. It is a
 * portrait rather than a speaker, so it reserves nothing — nothing is placed
 * where it stands.
 */
export const SUMMARY_OWL = {
  position: 'fixed',
  left: 0,
  bottom: 0,
  width: { xs: 240, sm: 300, md: 480, lg: 580, xl: 640 },
  height: 'auto',
  display: 'block',
  transform: 'scaleX(-1)',
  transformOrigin: 'center bottom',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0,
};
