import React, { useEffect, useState } from 'react';
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
  acknowledge = false,
  acknowledgeLabel = 'I have read this.',
  onDone,
}) {
  const [acked, setAcked] = useState(false);
  useEffect(() => { setAcked(false); }, [text]);
  const blocked = acknowledge && !acked;
  const owlSrc = persona?.poses?.[pose] || persona?.poses?.idle;
  const bubbleBg = colors.surface1;
  const bubbleBorder = `1px solid ${colors.sand200}`;

  useEffect(() => {
    // An acknowledgement is given, not escaped past, so the shortcuts are only
    // offered when the page did not ask for one.
    if (!interrupting || acknowledge) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        onDone?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [interrupting, acknowledge, onDone]);

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

          {/* The way on lives inside the bubble, under the line — the same
              place the corner guide keeps it, so the guide reads as one thing
              wherever it is standing. When the page asks to be acknowledged
              the button waits on the tick. */}
          {interrupting && (
            <Box sx={{ mt: '14px' }}>
              {acknowledge && (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setAcked((v) => !v)}
                  aria-pressed={acked}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '9px',
                    mb: '11px',
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      flexShrink: 0,
                      mt: '1px',
                      width: 17,
                      height: 17,
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1.5px solid ${acked ? colors.orangeDeep : colors.sand300}`,
                      bgcolor: acked ? colors.orangeDeep : 'transparent',
                      color: '#fff',
                      fontSize: 11,
                      lineHeight: 1,
                      fontWeight: 700,
                    }}
                  >
                    {acked ? '✓' : ''}
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: fonts.sans,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      fontWeight: 600,
                      color: colors.inkSoft,
                      textAlign: 'left',
                    }}
                  >
                    {acknowledgeLabel}
                  </Typography>
                </Box>
              )}
              <Box
                component="button"
                type="button"
                autoFocus
                disabled={blocked}
                onClick={() => { if (!blocked) onDone?.(); }}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  pointerEvents: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: blocked ? 'not-allowed' : 'pointer',
                  px: '20px',
                  minHeight: 36,
                  borderRadius: radii.pill,
                  bgcolor: colors.navy900,
                  color: colors.amberSoft,
                  fontFamily: fonts.sans,
                  fontWeight: 700,
                  fontSize: 12.5,
                  letterSpacing: '0.04em',
                  opacity: blocked ? 0.45 : 1,
                  transition: 'opacity 140ms, background 140ms',
                  '&:hover': { bgcolor: blocked ? colors.navy900 : colors.navy800 },
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3 },
                }}
              >
                {cta}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );

  if (!interrupting || typeof document === 'undefined') return guide;

  return createPortal(
    <Box role="dialog" aria-modal="true" aria-label={eyebrow || 'Guide'}>
      <Box
        onClick={acknowledge ? undefined : onDone}
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
