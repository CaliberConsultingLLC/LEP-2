// The front door.
//
// Account creation used to open on a form with two checkboxes and two links at
// the bottom of it. Nobody reads a link at the bottom of a form, which makes
// the most consequential thing on the screen the thing least likely to be
// understood: what this product asks of a person's team, and what it keeps.
//
// So the guide says it first. Same interruption the rooms use — the page
// behind is dimmed and the owl speaks over it — and agreeing here is what
// opens the form.
//
// The one difference from every other interruption in the product: no guide
// has been chosen yet, because that happens after payment. This uses the house
// guide, and the copy is written to be true in any voice rather than in one.
//
// The ceremony is the delivery, not the record. Agreeing sets the same two
// flags the form has always carried, and they are still written with their
// timestamp on submit.

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { guideImage } from '../data/guideArt';
import { SUMMARY_GUIDE_OWL_SX } from './summaryGuideLayout';
import { colors, fonts, radii, shadows, type } from '../styles/tokens';

const HOUSE_GUIDE = 'mentor';

// Four beats, in the order someone would ask them. Deliberately concrete —
// the point of saying this out loud is that "we value your privacy" is not
// information.
const BEATS = [
  {
    label: 'What you do',
    text: 'You answer a long set of questions about how you lead. It takes a while, and the reflection you get back is written from your answers rather than assembled from a template.',
  },
  {
    label: 'What your team does',
    text: 'You invite them yourself, with a link we never see the recipients of. They rate the same statements you rated about yourself. We hold no address for any of them.',
  },
  {
    label: 'What comes back',
    text: 'Their answers reach you anonymously and in aggregate. Where there are too few responses to be anonymous, you see nothing at all.',
  },
  {
    label: 'What we keep',
    text: 'Your answers, your reflection, and your team’s ratings, held against your account so you can come back to them. Yours to delete on request.',
  },
];

export default function ConsentCeremony({ open, onAgree, onOpenTerms, onOpenPrivacy }) {
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => ctaRef.current?.focus?.(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="How the Compass works"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        overflowY: 'auto',
        bgcolor: colors.sand50,
      }}
    >
      {/* The house guide, standing as it does on the Summary. */}
      <Box
        component="img"
        src={guideImage(HOUSE_GUIDE, 'lantern')}
        alt=""
        aria-hidden
        draggable={false}
        sx={{ ...SUMMARY_GUIDE_OWL_SX, opacity: 0.92, zIndex: 0 }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, md: 4 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 640,
            ml: { xs: 0, md: '16%', lg: '20%' },
            bgcolor: colors.surface1,
            border: `1px solid ${colors.sand200}`,
            borderRadius: radii.lg,
            boxShadow: shadows.overlay,
            p: { xs: '26px 22px', md: '34px 38px' },
          }}
        >
          <Typography sx={{ ...type.eyebrow, color: colors.orangeDeep, mb: '12px' }}>
            Before you make an account
          </Typography>

          <Typography sx={{
            fontFamily: fonts.serif, fontSize: { xs: 24, md: 29 }, fontWeight: 500,
            lineHeight: 1.14, letterSpacing: '-0.02em', color: colors.navy900, mb: '12px',
          }}>
            Here is exactly how this works.
          </Typography>

          <Typography sx={{ ...type.body, color: colors.inkSoft, mb: '22px' }}>
            This asks something of your team, so you should know what before you
            start rather than after.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mb: '24px' }}>
            {BEATS.map((beat) => (
              <Box key={beat.label} sx={{ borderLeft: `2px solid ${colors.brass}`, pl: '15px' }}>
                <Typography sx={{
                  fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: colors.orangeDeep, mb: '4px',
                }}>
                  {beat.label}
                </Typography>
                <Typography sx={{ ...type.body, fontSize: { xs: 14, md: 14.5 } }}>
                  {beat.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{
            borderTop: `1px solid ${colors.sand200}`,
            pt: '18px',
          }}>
            <Typography sx={{ ...type.body, fontSize: 13.5, color: colors.inkSoft, mb: '16px' }}>
              Continuing means you agree to the{' '}
              <Box
                component="button"
                type="button"
                onClick={onOpenTerms}
                sx={{
                  all: 'unset', cursor: 'pointer', color: colors.orangeDeep, fontWeight: 700,
                  textDecoration: 'underline',
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                Terms of Use
              </Box>
              {' '}and acknowledge the{' '}
              <Box
                component="button"
                type="button"
                onClick={onOpenPrivacy}
                sx={{
                  all: 'unset', cursor: 'pointer', color: colors.orangeDeep, fontWeight: 700,
                  textDecoration: 'underline',
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                Privacy Policy
              </Box>
              . Both open here, and neither is longer than this page.
            </Typography>

            <Box
              ref={ctaRef}
              component="button"
              type="button"
              onClick={onAgree}
              sx={{
                all: 'unset',
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                px: '28px',
                minHeight: 46,
                borderRadius: radii.pill,
                bgcolor: colors.navy900,
                color: colors.amberSoft,
                fontFamily: fonts.sans,
                fontSize: 14,
                fontWeight: 700,
                boxShadow: shadows.buttonPrimary,
                transition: '180ms ease',
                '&:hover': { bgcolor: colors.navy800, boxShadow: shadows.buttonPrimaryHover },
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3 },
              }}
            >
              I understand — create my account
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>,
    document.body
  );
}
