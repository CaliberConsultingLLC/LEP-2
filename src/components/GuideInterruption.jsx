import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import { GUIDE_Z } from './guidePlacement';
import { useGuide } from '../context/GuideContext';

// One interruption, used everywhere a room introduces itself.
//
// The page dims and blurs, and the guide already on screen — the small owl in
// the bottom-right — says the line over it. Nothing new is drawn for the owl:
// the text is handed to the existing overlay through setPageMessage, so this
// reads as the guide interrupting rather than as a dialog that happens to have
// an owl in it. That is the difference Dustin asked for on action planning.
//
// Two deliberate exceptions keep their own owl. The Summary stands the guide
// full-height on the left, and the field journal does the same, because there
// the owl is the page rather than a speaker in the corner.
//
// The backdrop sits below GUIDE_Z so the owl and its bubble stay crisp above
// the blur — blurring the speaker along with the page is what made earlier
// attempts read as a screenshot rather than an interruption.
const BACKDROP_Z = GUIDE_Z - 100;

export default function GuideInterruption({
  open,
  eyebrow,
  text,
  pose = 'think',
  cta = 'Okay',
  acknowledge = false,
  acknowledgeLabel,
  onDone,
  children,
}) {
  const { setHidden, setPageMessage, clearPageMessage } = useGuide();

  // Handing the guide a message is a context write, which re-renders the page
  // that is holding this open and hands down a fresh `onDone`. Read the current
  // one through a ref, or the message is rebuilt on every render — which is a
  // write, which is a render.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!open) return undefined;
    // A collapsed guide cannot deliver an interruption, so it opens for this
    // and is left open afterwards — the line stays readable after dismissal.
    setHidden(false);
    setPageMessage({
      text,
      pose,
      eyebrow,
      // The way on rides inside the bubble, under the line the guide just
      // said, rather than floating beside it.
      action: { label: cta, onClick: () => doneRef.current?.(), acknowledge, acknowledgeLabel, autoFocus: true },
    });
    return () => clearPageMessage();
  }, [open, text, pose, eyebrow, cta, acknowledge, acknowledgeLabel, setHidden, setPageMessage, clearPageMessage]);

  useEffect(() => {
    // An acknowledgement has to be given, not escaped past, so the shortcuts
    // and the click-away are only offered when none was asked for.
    if (!open || acknowledge) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        onDone?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, acknowledge, onDone]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={eyebrow || 'Guide'}
      onClick={acknowledge ? undefined : onDone}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: BACKDROP_Z,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, md: 6 },
        py: { xs: 2, md: 4 },
        bgcolor: 'rgba(10, 20, 36, 0.42)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
      }}
    >
      {children ? (
        <Box onClick={(event) => event.stopPropagation()} sx={{ width: '100%', maxWidth: 'min(900px, 74vw)' }}>
          {children}
        </Box>
      ) : null}

      {/* Nothing else is drawn here: the way on is the button inside the
          guide's own bubble, handed over with the line above. */}
    </Box>,
    document.body
  );
}
