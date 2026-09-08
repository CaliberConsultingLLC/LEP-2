import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import GuideSpeech from './GuideSpeech';
import { SUMMARY_OWL } from '../guidePlacement';
import { EDGE, NATURAL_TX, anchorPercents, fitPortrait, standingHeight } from './guideGeometry';

function useViewport(active) {
  const [vp, setVp] = useState(null);
  useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined;
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [active]);
  return vp;
}

// The guide standing full height, and saying something.
//
// This is the second of the two shapes the guide takes — the first being the
// small owl in the corner that GuideOverlay draws. Here the bird is the page
// rather than a speaker in it: the Summary, the field journal, the front door.
//
// It replaces two near-identical implementations that each carried their own
// table of offsets, both of which put the bubble across the owl's face. The
// reason was the same in both: the fractions were written against the art the
// right way round, and this owl is mirrored, which walks the head from about
// 39% across to about 61% — exactly where the bubble's left edge had been put.
// Nothing here knows those numbers. The anchor comes off the art and the
// mirror is handled once, in resolveAnchor.

export default function GuidePortrait({
  src,
  alt = '',
  eyebrow,
  text,
  action,
  onDismiss,
  backdrop = false,
  dismissOnBackdrop = true,
  mirrored = true,
  tone = 'auto',
  zIndex = 10040,
  maxWidth = 360,
  owlSx,
  // Stand the bird so that the line it says lands in the middle of the window.
  //
  // On an interruption the page behind is blurred to nothing, so the middle is
  // the only place the eye has to go, and that is where the words should be.
  // The bubble cannot simply be moved there — it is tethered to the head by a
  // 14px tail, and a centred bubble 200px from the beak trailing a stub that
  // points at empty scrim has stopped reading as something the guide said. So
  // the bird moves instead: it is placed by its speak point, at exactly the x
  // that puts the bubble beside its head across the centre of the window.
  //
  // Ignored when the caller passes `owlSx`, because a caller that positions
  // the owl itself has a scene in mind — the journal stands its guide against
  // the book, and the book is where that composition centres.
  centred = false,
  // Bumped by a caller that moved the owl without resizing it — a scene that
  // recentres at constant scale changes the bird's left and nothing else, and
  // a change of position fires no ResizeObserver.
  resolveKey,
  children,
}) {
  const owlRef = useRef(null);
  const placeCentred = centred && !owlSx;
  const vp = useViewport(placeCentred);

  const centredFit = placeCentred && vp && src
    ? fitPortrait({
      src,
      mirrored,
      height: standingHeight(vp.h),
      // Where the beak has to be for the bubble to straddle the middle. Not
      // half a bubble back from centre — the bubble does not sit centred on
      // the beak, it hangs off it at the one-to-two o'clock the guide reads
      // best at, so the offset is measured to that placement's own anchor.
      speakX: vp.w / 2 - (0.5 - NATURAL_TX) * Math.min(maxWidth, vp.w - EDGE * 2),
      footInset: 0,
    })
    : null;

  useEffect(() => {
    if (!backdrop || !dismissOnBackdrop) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [backdrop, dismissOnBackdrop, onDismiss]);

  const face = anchorPercents(src, mirrored).face;

  const body = (
    <>
      {backdrop && (
        <Box
          aria-hidden
          onClick={dismissOnBackdrop ? onDismiss : undefined}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex - 2,
            bgcolor: 'rgba(9,16,31,0.5)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
        />
      )}

      {/* The owl sits above the backdrop so it stays crisp over the blur —
          blurring the speaker along with the page is what made earlier
          attempts read as a screenshot rather than as an interruption. */}
      <Box
        sx={{
          // The frame, not the picture: SUMMARY_OWL's mirror and its display
          // rules belong to the <img> inside, or the flip is applied twice and
          // the owl faces back out of the page.
          position: SUMMARY_OWL.position,
          left: SUMMARY_OWL.left,
          bottom: SUMMARY_OWL.bottom,
          width: SUMMARY_OWL.width,
          userSelect: 'none',
          ...(centredFit
            ? { width: centredFit.width, left: centredFit.left, right: 'auto', bottom: centredFit.bottom }
            : null),
          ...owlSx,
          zIndex: zIndex - 1,
          pointerEvents: 'none',
        }}
      >
        <Box
          component="img"
          ref={owlRef}
          src={src}
          alt={alt}
          aria-hidden={alt ? undefined : true}
          draggable={false}
          sx={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: 'scaleX(-1)',
            transformOrigin: 'center bottom',
            filter: backdrop ? 'drop-shadow(0 16px 36px rgba(9,16,31,0.28))' : 'none',
            userSelect: 'none',
          }}
        />
        {onDismiss && !action && (
          <Box
            component="button"
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            sx={{
              all: 'unset',
              position: 'absolute',
              ...face,
              borderRadius: '50%',
              cursor: 'pointer',
              pointerEvents: 'auto',
              '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.45)', outlineOffset: 4 },
            }}
          />
        )}
      </Box>

      <GuideSpeech
        owlRef={owlRef}
        src={src}
        mirrored
        eyebrow={eyebrow}
        text={text}
        action={action}
        onDismiss={backdrop ? undefined : onDismiss}
        // The scrim behind an interruption is near-black whatever the page
        // under it was, so the bubble on one is always the light of the pair.
        tone={tone === 'auto' && backdrop ? 'sand' : tone}
        resolveKey={centredFit
          ? `${resolveKey ?? ''}:${Math.round(centredFit.left)}:${Math.round(centredFit.width)}`
          : resolveKey}
        zIndex={zIndex}
        maxWidth={maxWidth}
      >
        {children}
      </GuideSpeech>
    </>
  );

  if (typeof document === 'undefined') return null;
  return backdrop ? createPortal(body, document.body) : body;
}
