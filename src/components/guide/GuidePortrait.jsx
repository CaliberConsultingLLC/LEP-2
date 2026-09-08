import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import GuideSpeech from './GuideSpeech';
import { SUMMARY_OWL } from '../guidePlacement';
import { anchorPercents } from './guideGeometry';

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
  // Bumped by a caller that moved the owl without resizing it — a scene that
  // recentres at constant scale changes the bird's left and nothing else, and
  // a change of position fires no ResizeObserver.
  resolveKey,
  children,
}) {
  const owlRef = useRef(null);

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
        resolveKey={resolveKey}
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
