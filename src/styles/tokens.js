/**
 * Compass design tokens — JavaScript mirror of `src/styles/cairn-theme.css`.
 *
 * The CSS file remains the SINGLE SOURCE OF TRUTH for the design system.
 * This file exists so React components written in MUI's `sx` prop can
 * reference named constants instead of typing `'var(--cairn-radius-lg)'`
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
  sm: 'var(--cairn-radius-sm)',
  md: 'var(--cairn-radius-md)',
  lg: 'var(--cairn-radius-lg)',
  xl: 'var(--cairn-radius-xl)',
  pill: 'var(--cairn-radius-pill)',
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
  navy950: 'var(--navy-950)',
  navy900: 'var(--navy-900)',
  navy800: 'var(--navy-800)',
  navy700: 'var(--navy-700)',
  navy600: 'var(--navy-600)',
  navy500: 'var(--navy-500)',
  navy400: 'var(--navy-400)',
  navy300: 'var(--navy-300)',

  amber: 'var(--amber)',
  amberSoft: 'var(--amber-soft)',
  orange: 'var(--orange)',
  orangeDeep: 'var(--orange-deep)',
  green: 'var(--green)',
  greenSoft: 'var(--green-soft)',

  sand50: 'var(--sand-50)',
  sand100: 'var(--sand-100)',
  sand200: 'var(--sand-200)',
  sand300: 'var(--sand-300)',

  ink: 'var(--ink)',
  inkSoft: 'var(--ink-soft)',

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
};

// ----------------------------------------------------------------------------
// Hairlines / borders
// ----------------------------------------------------------------------------
export const hairlines = {
  default: '1px solid var(--sand-200)',
  soft: '1px solid rgba(15, 28, 46, 0.06)',
  rule: '1px solid var(--sand-200)',
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
  standard: 'var(--cairn-motion)',
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
// ----------------------------------------------------------------------------
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
