import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import { colors, fonts, radii } from '../styles/tokens';
import { GUIDE_COLUMN, GUIDE_Z } from './guidePlacement';
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
// full-height on the left, because there the owl is the page rather than a
// speaker in the corner. The narrative's video interstitial predates this and
// can adopt it whenever that file is next open.
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
  onDone,
  children,
}) {
  const { setHidden, setPageMessage, clearPageMessage } = useGuide();

  useEffect(() => {
    if (!open) return undefined;
    // A collapsed guide cannot deliver an interruption, so it opens for this
    // and is left open afterwards — the line stays readable after dismissal.
    setHidden(false);
    setPageMessage({ text, pose, eyebrow });
    return () => clearPageMessage();
  }, [open, text, pose, eyebrow, setHidden, setPageMessage, clearPageMessage]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        onDone?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onDone]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={eyebrow || 'Guide'}
      onClick={onDone}
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

      {/* Dismiss sits under the guide's bubble rather than in the middle of the
          screen, so the eye finishes on the owl's line and acts from there. */}
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 28 },
          top: 'calc(50% + 92px)',
          width: GUIDE_COLUMN,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Box
          component="button"
          type="button"
          autoFocus
          onClick={(event) => { event.stopPropagation(); onDone?.(); }}
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
    </Box>,
    document.body
  );
}
