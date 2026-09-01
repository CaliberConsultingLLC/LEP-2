/**
 * Compass design tokens — JavaScript mirror of `src/styles/cairn-theme.css`.
 *
 * The CSS file remains the SINGLE SOURCE OF TRUTH for the design system.
 * This file exists so React components written in MUI's `sx` prop can
 * reference named constants instead of typing `'var(--cairn-radius-lg, 20px)'`
 * inline everywhere. Values are CSS-var strings so light/dark switching
 * (handled by cairn-theme.css's `[data-dark="true"]` overrides) flows
 * through automatically — JS never has to know which mode is active.
 *
 * If you need to add a token: edit `cairn-theme.css` first, mirror the
 * value here, then add a sample to `/design`.
 *
 * Anchored on the locked-in pages (Summary, TraitSelection, IntakeForm,
 * UserInfo, GuideSelect, every Campaign page). The dashboard is being
 * brought back onto this system; nothing in the dashboard's prior
 * styling sourced these values directly.
 */

// ----------------------------------------------------------------------------
// Radii — matches --cairn-radius-* in cairn-theme.css
// ----------------------------------------------------------------------------
export const radii = {
  sm: 'var(--cairn-radius-sm, 10px)',
  md: 'var(--cairn-radius-md, 14px)',
  lg: 'var(--cairn-radius-lg, 20px)',
  xl: 'var(--cairn-radius-xl, 24px)',
  pill: 'var(--cairn-radius-pill, 999px)',
  circle: '50%',
};

// Raw numeric mirror of the same scale, for SVG attributes (e.g. <rect rx>).
// Keep these in lockstep with the CSS values above.
export const radiiPx = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
};

// ----------------------------------------------------------------------------
// Colors — matches the CSS custom properties on html[data-theme="cairn"]
// All values are CSS-var strings so dark mode (which remaps several of
// these vars under `data-dark="true"`) works without any JS conditional.
// ----------------------------------------------------------------------------
export const colors = {
  navy950: 'var(--navy-950, #09101f)',
  navy900: 'var(--navy-900, #10223c)',
  navy800: 'var(--navy-800, #162a44)',
  navy700: 'var(--navy-700, #1e3a5c)',
  navy600: 'var(--navy-600, #2b4a6f)',
  navy500: 'var(--navy-500, #3f647b)',
  navy400: 'var(--navy-400, #5e91b0)',
  navy300: 'var(--navy-300, #8fb3cd)',

  amber: 'var(--amber, #ecc94b)',
  amberSoft: 'var(--amber-soft, #f4cea1)',
  orange: 'var(--orange, #e07a3f)',
  orangeDeep: 'var(--orange-deep, #c0612a)',
  green: 'var(--green, #2f855a)',
  greenSoft: 'var(--green-soft, #6f9a83)',
  efficacyBlue: 'var(--efficacy-blue, #2b6ba8)',
  gapNegative: 'var(--gap-negative, #b4321f)',
  gapPositive: 'var(--gap-positive, #2f6b4f)',
  gapNegativeTint: 'var(--gap-negative-tint, rgba(180, 50, 31, 0.07))',
  gapPositiveTint: 'var(--gap-positive-tint, rgba(47, 107, 79, 0.07))',
  effortTrack: 'var(--effort-track, rgba(224, 122, 63, 0.20))',
  efficacyTrack: 'var(--efficacy-track, rgba(43, 107, 168, 0.20))',
  compassNodeGlow: 'var(--compass-node-glow, rgba(16, 34, 60, 0.10))',
  brass: 'var(--brass, color-mix(in srgb, #ecc94b 75%, #c0612a))',
  dialFace: 'var(--dial-face, #f4ecdd)',
  dialNodeFill: 'var(--dial-node-fill, #ffffff)',
  dialBezelHi: 'var(--dial-bezel-hi, #223d66)',
  dialBezelLo: 'var(--dial-bezel-lo, #0a1424)',
  dialArrowStart: 'var(--dial-arrow-start, #f0c396)',
  dialArrowEnd: 'var(--dial-arrow-end, #c0793f)',
  zoneHonedTint: 'var(--zone-honed-tint, rgba(236, 201, 75, 0.22))',
  zoneHonedInk: 'var(--zone-honed-ink, #8a6a13)',
  zoneOfftargetTint: 'var(--zone-offtarget-tint, rgba(224, 122, 63, 0.14))',
  zoneNaturalTint: 'var(--zone-natural-tint, rgba(143, 179, 205, 0.16))',
  zoneMissingTint: 'var(--zone-missing-tint, rgba(15, 28, 46, 0.05))',
  dialEffortFace: 'var(--dial-effort-face, linear-gradient(45deg, #ffffff 6%, rgba(224, 122, 63, 0.12) 42%, rgba(224, 122, 63, 0.52) 100%))',
  dialEfficacyFace: 'var(--dial-efficacy-face, linear-gradient(315deg, #ffffff 6%, rgba(43, 107, 168, 0.12) 42%, rgba(43, 107, 168, 0.58) 100%))',
  dialAxis: 'var(--dial-axis, rgba(15, 28, 46, 0.14))',
  dialHub: 'var(--dial-hub, rgba(15, 28, 46, 0.22))',

  sand50: 'var(--sand-50, #fbf7f0)',
  sand100: 'var(--sand-100, #f4ecdd)',
  sand200: 'var(--sand-200, #e8dbc3)',
  sand300: 'var(--sand-300, #d1bc93)',

  ink: 'var(--ink, #0f1c2e)',
  inkSoft: 'var(--ink-soft, #44566c)',

  surface1: 'var(--surface-1)',
  surface2: 'var(--surface-2)',
  surface3: 'var(--surface-3)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  borderSoft: 'var(--border-soft)',
  ringFocus: 'var(--ring-focus)',
};

// ----------------------------------------------------------------------------
// Shadows — derived from cairn-theme.css MuiPaper-root + MuiButton rules
// ----------------------------------------------------------------------------
export const shadows = {
  none: 'none',
  card: '0 18px 40px rgba(15, 28, 46, 0.06)',
  cardHover: '0 24px 56px rgba(15, 28, 46, 0.10)',
  inset: 'inset 0 1px 2px rgba(15, 28, 46, 0.05)',
  overlay: '0 18px 48px rgba(15, 28, 46, 0.18)',
  buttonPrimary: '0 8px 20px rgba(15, 28, 46, 0.18)',
  buttonPrimaryHover: '0 12px 28px rgba(15, 28, 46, 0.22)',
  buttonSecondary: '0 8px 20px rgba(224, 122, 63, 0.22)',
  appBar: '0 10px 32px rgba(9, 16, 31, 0.18)',
  dialCase: '0 14px 30px rgba(15, 28, 46, 0.30), inset 0 2px 0 rgba(244, 206, 161, 0.24)',
  dialNode: '0 2px 6px rgba(15, 28, 46, 0.10)',
  dialNext: '0 2px 10px rgba(15, 28, 46, 0.06)',
};

// ----------------------------------------------------------------------------
// Hairlines / borders
// ----------------------------------------------------------------------------
export const hairlines = {
  default: '1px solid var(--sand-200, #e8dbc3)',
  soft: '1px solid rgba(15, 28, 46, 0.06)',
  rule: '1px solid var(--sand-200, #e8dbc3)',
};

// ----------------------------------------------------------------------------
// Type — sx-friendly typography presets matching cairn-theme.css patterns
// observed on Summary / TraitSelection / IntakeForm / UserInfo / GuideSelect
// ----------------------------------------------------------------------------
const FONT_SERIF = '"Fraunces", Georgia, serif';
const FONT_SANS = '"Manrope", "Inter", "Segoe UI", sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';
const FONT_BRAND = '"Cinzel", "Times New Roman", Georgia, serif';

export const fonts = {
  brand: FONT_BRAND,
  serif: FONT_SERIF,
  sans: FONT_SANS,
  mono: FONT_MONO,
};

export const type = {
  // Eyebrow — JetBrains Mono caps, used above headings throughout the tool
  eyebrow: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: colors.orangeDeep,
  },

  brand: {
    fontFamily: FONT_BRAND,
    fontWeight: 600,
    fontVariant: 'small-caps',
    letterSpacing: '-0.045em',
    color: colors.navy900,
  },

  pageTitle: {
    fontFamily: FONT_SERIF,
    fontSize: { xs: 26, md: 30 },
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.12,
    color: colors.ink,
  },

  pageTitleCompact: {
    fontFamily: FONT_SERIF,
    fontSize: 26,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.12,
    color: colors.ink,
  },

  subtitle: {
    fontFamily: FONT_SERIF,
    fontStyle: 'italic',
    fontSize: 15.5,
    fontWeight: 500,
    lineHeight: 1.45,
    color: colors.inkSoft,
    maxWidth: '52ch',
  },

  question: {
    fontFamily: FONT_SERIF,
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.4,
    color: colors.ink,
  },

  // Page lead — Fraunces serif
  lead: {
    fontFamily: FONT_SERIF,
    fontSize: { xs: 22, md: 26 },
    fontWeight: 500,
    letterSpacing: '-0.018em',
    lineHeight: 1.18,
    color: colors.textPrimary,
  },

  // Smaller serif headline (card titles, section heads)
  sectionTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 18,
    fontWeight: 600,
    fontStyle: 'italic',
    color: colors.textPrimary,
  },

  body: {
    fontFamily: FONT_SANS,
    fontSize: 14,
    lineHeight: 1.55,
    color: colors.textPrimary,
  },

  bodyMuted: {
    fontFamily: FONT_SANS,
    fontSize: 13,
    lineHeight: 1.5,
    color: colors.textSecondary,
  },

  // Italic prose (interpretive paragraphs in cards)
  italicBody: {
    fontFamily: FONT_SERIF,
    fontStyle: 'italic',
    fontSize: 15.5,
    fontWeight: 500,
    lineHeight: 1.5,
    color: colors.textPrimary,
  },

  // Mono caps (row labels in stat tables, axis labels)
  monoLabel: {
    fontFamily: FONT_MONO,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },

  // Tabular-nums numeric values for data displays
  statNumber: {
    fontFamily: FONT_MONO,
    fontSize: 17,
    fontWeight: 600,
    fontFeatureSettings: '"tnum"',
    fontVariantNumeric: 'tabular-nums',
    color: colors.textPrimary,
  },
};

// ----------------------------------------------------------------------------
// Motion
// ----------------------------------------------------------------------------
export const motion = {
  standard: 'var(--cairn-motion, 180ms cubic-bezier(0.2, 0.8, 0.2, 1))',
};

// ----------------------------------------------------------------------------
// Surfaces — composable sx fragments for common card patterns
// ----------------------------------------------------------------------------
export const surfaces = {
  // Canonical card — matches the MuiPaper-root rule in cairn-theme.css
  card: {
    bgcolor: colors.surface1,
    border: hairlines.default,
    borderRadius: radii.lg,
    boxShadow: shadows.card,
  },
  // Same as card but no shadow — for cards nested inside another shadowed surface
  cardFlat: {
    bgcolor: colors.surface1,
    border: hairlines.default,
    borderRadius: radii.lg,
    boxShadow: shadows.none,
  },
  // Smaller / inner card for grouped content
  cardInner: {
    bgcolor: colors.surface1,
    border: hairlines.default,
    borderRadius: radii.md,
    boxShadow: shadows.none,
  },
};

// ----------------------------------------------------------------------------
// Buttons — composable sx fragments matching cairn-theme.css MuiButton rules
//
// On a plain `<Box component="button">` these apply as written. On a MUI
// `<Button>` they do not, and the reason is specificity: an sx prop compiles to
// a single emotion class (0,1,0), while cairn-theme.css targets buttons as
// `html[data-theme='cairn'] .MuiButton-textPrimary` (0,2,1). The stylesheet
// wins on any property both of them set.
//
// That is not theoretical. `<Button sx={buttons.primary}>` with no `variant`
// prop is a text-variant button, so the stylesheet forced `color: navy-900`
// while `bgcolor` — which no stylesheet rule sets — came through from sx. The
// result was navy text on a navy fill: a button with an invisible label, which
// is what shipped on /guide-select.
//
// `&&&` raises these to (0,3,0) so the token wins wherever it is used, on a
// bare button element or a MUI one, without every call site remembering to
// pass a matching `variant`.
// ----------------------------------------------------------------------------
const buttonInk = (color) => ({ '&&&': { color } });

export const buttons = {
  primary: {
    fontFamily: FONT_SANS,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    textTransform: 'none',
    px: '22px',
    py: '12px',
    minHeight: 42,
    whiteSpace: 'nowrap',
    borderRadius: radii.pill,
    bgcolor: colors.navy900,
    color: colors.amberSoft,
    ...buttonInk(colors.amberSoft),
    boxShadow: shadows.buttonPrimary,
    transition: motion.standard,
    '&:hover': {
      bgcolor: colors.navy800,
      boxShadow: shadows.buttonPrimaryHover,
      transform: 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: `3px solid ${colors.ringFocus}`,
      outlineOffset: 2,
    },
  },

  secondary: {
    fontFamily: FONT_SANS,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    textTransform: 'none',
    px: '22px',
    py: '12px',
    minHeight: 42,
    borderRadius: radii.pill,
    bgcolor: colors.orange,
    color: 'white',
    ...buttonInk('white'),
    boxShadow: shadows.buttonSecondary,
    transition: motion.standard,
    '&:hover': { bgcolor: colors.orangeDeep },
    '&:focus-visible': {
      outline: `3px solid ${colors.ringFocus}`,
      outlineOffset: 2,
    },
  },

  outlinedPrimary: {
    fontFamily: FONT_SANS,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    textTransform: 'none',
    px: '22px',
    py: '12px',
    minHeight: 42,
    borderRadius: radii.pill,
    bgcolor: 'transparent',
    color: colors.navy900,
    ...buttonInk(colors.navy900),
    border: `1px solid ${colors.navy500}`,
    boxShadow: shadows.none,
    transition: motion.standard,
    '&:hover': {
      bgcolor: colors.sand100,
      borderColor: colors.navy700,
    },
    '&:focus-visible': {
      outline: `3px solid ${colors.ringFocus}`,
      outlineOffset: 2,
    },
  },
};

// ----------------------------------------------------------------------------
// Chips — composable sx fragments matching cairn-theme.css MuiChip rules
// ----------------------------------------------------------------------------
export const chips = {
  base: {
    fontFamily: FONT_SANS,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.04em',
    height: 36,
    px: 1.6,
    borderRadius: radii.pill,
    border: hairlines.default,
    bgcolor: colors.surface1,
    color: colors.inkSoft,
    transition: motion.standard,
    cursor: 'pointer',
  },
  active: {
    bgcolor: colors.navy900,
    color: colors.amberSoft,
    borderColor: colors.navy900,
  },
  hover: {
    '&:hover': {
      borderColor: colors.navy500,
      color: colors.navy900,
    },
  },
};

// ----------------------------------------------------------------------------
// Default export — namespace for ergonomic imports
// ----------------------------------------------------------------------------
const tokens = {
  radii,
  radiiPx,
  colors,
  shadows,
  hairlines,
  fonts,
  type,
  motion,
  surfaces,
  buttons,
  chips,
};

export default tokens;
