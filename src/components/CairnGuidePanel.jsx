import React, { useRef, useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../styles/tokens';
import GuideSpeech from './guide/GuideSpeech';
import { anchorPercents, perchTransform } from './guide/guideGeometry';
import { perchedSrc } from '../data/guideArt';
import useOwlClearance from './guide/useOwlClearance';
import { GUIDE_COLUMN, GUIDE_COLUMN_PRESENCE } from './guidePlacement';

// The growth-campaign guide.
//
// Same bird, same rules as everywhere else now: the owl is drawn here and
// GuideSpeech decides where the line can go. It used to hang its bubble off
// the owl's left at a fixed offset, which on the campaign builder put it over
// 100% of "Back to traits" and 22% of "Review campaign" — both of the page's
// navigation controls, at the one moment a leader is deciding what their team
// will be asked. Those two buttons now carry data-guide-keepclear and the
// solver walks around them.

function CairnGuidePanel({
  persona,
  hidden,
  setHidden,
  toggleHidden,
  isDark,
  commentary,
  children,
  owlPose,
  moreLabel = 'More Guidance',
  presenceOnly = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const owlRef = useRef(null);

  // The palette for whatever the page hands us as `children`.
  //
  // The bubble is the OPPOSITE of its ground — navy on the light pages, sand
  // on the dark ones — so a page that colours its own notes from `isDark` gets
  // it backwards in both themes at once: ink-soft (#44566C) on navy in light
  // mode, near-white on cream in dark. Both were shipped and both were
  // unreadable. Publishing the palette here, keyed off the same flag that
  // picks the tone, is the only way a caller cannot get it wrong.
  const notes = isDark
    ? {
      heading: '#0F1C2E',
      body: '#22364E',
      soft: 'rgba(15,28,46,0.68)',
      rule: 'rgba(15,28,46,0.14)',
      chipBg: 'rgba(15,28,46,0.06)',
      chipInk: '#0F1C2E',
    }
    : {
      heading: colors.amberSoft,
      body: '#EFE7D8',
      soft: 'rgba(239,231,216,0.74)',
      rule: 'rgba(244,206,161,0.20)',
      chipBg: 'rgba(244,206,161,0.10)',
      chipInk: colors.amberSoft,
    };
  // Art whose branch runs off to the left cannot stand in the corner the
  // panel puts the bird in; the nearest pose that can stands in for it.
  const src = perchedSrc(persona.poses, owlPose || persona.poses.idle);
  // The campaign builder puts its "Review campaign" button in the same
  // corner the guide stands in. The bubble is solved around it; the bird
  // sinks past it.
  const { sink, flipped } = useOwlClearance(owlRef, { enabled: !hidden });

  if (hidden) {
    return (
      <Box
        component="button"
        type="button"
        onClick={() => setHidden(false)}
        aria-label={`Show ${persona.name} guide`}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          position: 'fixed',
          right: 0,
          bottom: 32,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '10px 14px 10px 16px',
          borderRadius: `${radii.md} 0 0 ${radii.md}`,
          background: colors.navy900,
          color: colors.amberSoft,
          boxShadow: shadows.overlay,
          fontFamily: fonts.mono,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)',
          '&:hover': { transform: 'translateX(-3px)' },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        }}
      >
        <Box
          component="img"
          src={persona.poses.idle}
          alt=""
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            borderRadius: radii.circle,
            objectFit: 'cover',
            objectPosition: 'top center',
            border: `2px solid ${colors.amberSoft}`,
            background: colors.navy800,
          }}
        />
        Guide
      </Box>
    );
  }

  const face = anchorPercents(src, flipped).face;

  return (
    <>
      {/* The owl. Inert to the pointer across its transparent square; only the
          face takes the click that collapses it. */}
      <Box
        sx={{
          position: 'fixed',
          ...(flipped
            ? { left: { xs: 6, md: 10, lg: 16 } }
            : { right: { xs: 6, md: 10, lg: 16 } }),
          bottom: -sink,
          // Out by the art's own padding, so the end of the branch lands where
          // the frame's corner was rather than somewhere inside it.
          transform: perchTransform(src, flipped),
          transition: 'bottom 220ms cubic-bezier(.2,.8,.2,1)',
          zIndex: 1100,
          width: presenceOnly ? GUIDE_COLUMN_PRESENCE : GUIDE_COLUMN,
          aspectRatio: '1 / 1',
          pointerEvents: 'none',
        }}
      >
        <Box
          component="img"
          ref={owlRef}
          src={src}
          alt={`${persona.name} guide`}
          draggable={false}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: flipped ? 'bottom left' : 'bottom right',
            transform: flipped ? 'scaleX(-1)' : 'none',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        <Box
          component="button"
          type="button"
          onClick={toggleHidden}
          aria-label="Hide guide"
          sx={{
            all: 'unset',
            position: 'absolute',
            ...face,
            borderRadius: '50%',
            cursor: 'pointer',
            pointerEvents: 'auto',
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 4 },
          }}
        />
      </Box>

      {!presenceOnly && (
        <GuideSpeech
          owlRef={owlRef}
          src={src}
          mirrored={flipped}
          eyebrow="Guide Notes"
          text={commentary}
          onDismiss={toggleHidden}
          tone={isDark ? 'sand' : 'navy'}
          resolveKey={`${sink}:${flipped}:${src}`}
          zIndex={1101}
          maxWidth={300}
        >
          {children && (
            <Box>
              <Box sx={{ mb: 1.1, borderTop: `1px solid ${notes.rule}` }} />
              <Box
                component="button"
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontFamily: fonts.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isDark ? colors.orangeDeep : colors.amberSoft,
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3, borderRadius: radii.pill },
                }}
              >
                {moreLabel}
                <Box component="span" sx={{ fontSize: '0.8rem', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>⌄</Box>
              </Box>

              <Collapse in={expanded} timeout="auto">
                <Box
                  sx={{
                    pt: 1.2,
                    fontFamily: fonts.sans,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    // Read by the page's own notes so it never has to know
                    // which way round the bubble is. `color` is the default
                    // for anything that does not ask.
                    color: notes.body,
                    '--guide-note-heading': notes.heading,
                    '--guide-note-body': notes.body,
                    '--guide-note-soft': notes.soft,
                    '--guide-note-rule': notes.rule,
                    '--guide-note-chip-bg': notes.chipBg,
                    '--guide-note-chip-ink': notes.chipInk,
                  }}
                >
                  {children}
                </Box>
              </Collapse>
            </Box>
          )}
        </GuideSpeech>
      )}
    </>
  );
}

export default CairnGuidePanel;
