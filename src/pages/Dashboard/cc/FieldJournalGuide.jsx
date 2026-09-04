import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../../../styles/tokens';
import { SUMMARY_GUIDE_OWL_SX } from '../../../components/summaryGuideLayout';
import { GUIDE_Z } from '../../../components/guidePlacement';

/**
 * The journal's guide: the large mirrored owl standing bottom-left, with the
 * bubble at one o'clock off its head rather than across its face.
 *
 * The owl is sized in the same breakpoint steps everywhere in the app (240 →
 * 640), so the bubble is placed in fractions of that width — roughly .62 out
 * and .72 up — instead of at fixed offsets that only cleared the small sizes.
 *
 * This owl also delivers the room's interruption. Everywhere else that is the
 * small owl in the bottom-right corner, but here there is already a guide on
 * screen, and having a second one appear in the opposite corner to say the
 * line reads as two guides rather than one. When `interrupting`, the whole
 * guide moves to a portal above the backdrop so it stays crisp over the blur.
 */

const OWL_FRACTION_OUT = { xs: 0.38, sm: 0.56, md: 0.61, lg: 0.62, xl: 0.62 };
const OWL_FRACTION_UP = { xs: 0.75, sm: 0.72, md: 0.72, lg: 0.72, xl: 0.72 };
const OWL_W = { xs: 240, sm: 300, md: 480, lg: 580, xl: 640 };

const byBreakpoint = (fractions) =>
  Object.fromEntries(
    Object.keys(OWL_W).map((bp) => [bp, Math.round(OWL_W[bp] * fractions[bp])])
  );

const BUBBLE_LEFT = byBreakpoint(OWL_FRACTION_OUT);
const BUBBLE_BOTTOM = byBreakpoint(OWL_FRACTION_UP);

export default function FieldJournalGuide({
  persona,
  eyebrow,
  text,
  pose = 'think',
  interrupting = false,
  cta = 'Okay',
  onDone,
}) {
  const owlSrc = persona?.poses?.[pose] || persona?.poses?.idle;
  const bubbleBg = colors.surface1;
  const bubbleBorder = `1px solid ${colors.sand200}`;

  useEffect(() => {
    if (!interrupting) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        onDone?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [interrupting, onDone]);

  const guide = (
    <>
      <Box
        component="img"
        src={owlSrc}
        alt={persona?.name ? `${persona.name} guide` : 'Guide'}
        draggable={false}
        sx={{
          ...SUMMARY_GUIDE_OWL_SX,
          // The journal's left leaf is blank paper, so the owl stands in front
          // of it rather than beside it — softened and pushed back a touch so
          // the page still reads as paper underneath.
          zIndex: interrupting ? GUIDE_Z + 1 : 3,
          opacity: interrupting ? 1 : 0.82,
          filter: interrupting
            ? 'drop-shadow(0 16px 36px rgba(9,16,31,0.44))'
            : 'drop-shadow(0 16px 36px rgba(9,16,31,0.28)) blur(0.4px) saturate(0.9)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          left: BUBBLE_LEFT,
          bottom: BUBBLE_BOTTOM,
          // Narrow enough that the bubble never reaches the gutter, including
          // when the notes pad pulls the book left on a laptop.
          width: { xs: 'min(320px, calc(100vw - 120px))', sm: 280, md: 300, lg: 320, xl: 340 },
          zIndex: interrupting ? GUIDE_Z + 2 : 4,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: bubbleBg,
            border: bubbleBorder,
            borderRadius: radii.lg,
            boxShadow: shadows.overlay,
            px: { xs: '18px', md: '22px' },
            pt: { xs: '18px', md: '20px' },
            pb: '16px',
            pointerEvents: 'auto',
            // The tail points back down-left at the owl's head.
            '&:after': {
              content: '""',
              position: 'absolute',
              left: 28,
              bottom: -8,
              width: 16,
              height: 16,
              bgcolor: bubbleBg,
              borderBottom: bubbleBorder,
              borderRight: bubbleBorder,
              transform: 'rotate(45deg)',
              zIndex: 1,
            },
          }}
        >
          {eyebrow ? (
            <Typography
              sx={{
                fontFamily: fonts.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: colors.orangeDeep,
                mb: 1,
              }}
            >
              {eyebrow}
            </Typography>
          ) : null}
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: { xs: 14.5, md: 15.5 },
              lineHeight: 1.58,
              color: colors.navy700,
              textWrap: 'pretty',
            }}
          >
            {text}
          </Typography>
        </Box>

        {/* Dismiss sits under the bubble so the eye finishes on the line and
            acts from there, the same order the corner guide uses. */}
        {interrupting && (
          <Box sx={{ display: 'flex', mt: '14px', pl: '10px' }}>
            <Box
              component="button"
              type="button"
              autoFocus
              onClick={onDone}
              sx={{
                all: 'unset',
                pointerEvents: 'auto',
                cursor: 'pointer',
                px: '24px',
                py: '12px',
                borderRadius: radii.pill,
                bgcolor: colors.amberSoft,
                color: colors.navy900,
                fontFamily: fonts.sans,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.04em',
                boxShadow: '0 10px 26px rgba(5, 12, 24, 0.4)',
                '&:hover': { bgcolor: colors.amber },
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3 },
              }}
            >
              {cta}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );

  if (!interrupting || typeof document === 'undefined') return guide;

  return createPortal(
    <Box role="dialog" aria-modal="true" aria-label={eyebrow || 'Guide'}>
      <Box
        onClick={onDone}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: GUIDE_Z,
          bgcolor: 'rgba(10, 20, 36, 0.42)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
        }}
      />
      {guide}
    </Box>,
    document.body
  );
}
