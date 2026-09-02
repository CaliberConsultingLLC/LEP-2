// Where the guide stands, in one place.
//
// There were three placement systems: the global overlay fixed bottom-right,
// the in-layout rail panel, and the Summary's large mirrored owl fixed
// bottom-LEFT. Three sets of geometry meant the guide appeared on a different
// side depending on which page you were on, and the fixed overlay sat on top
// of whatever was underneath it — on Review & Lock that was the Lock it in
// button.
//
// Two ideas fix both:
//
//   1. One set of numbers, here.
//   2. The overlay reports the box it occupies as CSS variables, and the page
//      layout reserves that much room. A guide that reserves space cannot
//      cover a button, and it stops being a z-index argument.

export const GUIDE_Z = 1200;

// The right-hand column the expanded overlay occupies. Narrow enough to leave
// the 1180px content column intact on a laptop.
export const GUIDE_COLUMN = 'clamp(250px, 25vw, 350px)';

// The collapsed tab: small, and the only thing on screen when hidden.
export const GUIDE_TAB_HEIGHT = 48;
export const GUIDE_TAB_BOTTOM = 32;

// Names read by CompassLayout. The overlay owns writing them; nothing else
// should set them, or the reservation stops matching what is on screen.
export const GUTTER_W = '--guide-gutter-w';
export const GUTTER_H = '--guide-gutter-h';

/**
 * Publishes the space the guide is currently taking.
 *
 * `width` keeps content clear of the column on wide screens. `height` matters
 * below the breakpoint where the overlay spans the full width and would
 * otherwise sit on the last thing in the page.
 */
export function reserveGuideSpace({ width = 0, height = 0 } = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty(GUTTER_W, width ? `${Math.round(width)}px` : '0px');
  root.style.setProperty(GUTTER_H, height ? `${Math.round(height)}px` : '0px');
}

export function clearGuideSpace() {
  reserveGuideSpace({ width: 0, height: 0 });
}

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
