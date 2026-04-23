import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { getGuideMessage, resolveRouteKey } from '../data/guideContent';

// A persistent, Clippy-style guide overlay.
// Sits flush in the bottom-right corner of the viewport so the branch reads
// as coming in from off-canvas. The speech bubble carries route-specific
// placeholder copy in the active persona's voice. The user can tuck the
// guide away with the close button; a small "Guide" tab takes its place.
function GuideOverlay() {
  const { persona, hidden, toggleHidden, setHidden } = useGuide();
  const location = useLocation();

  const message = useMemo(() => {
    const key = resolveRouteKey(location.pathname, location.search);
    return getGuideMessage(key, persona.id);
  }, [location.pathname, location.search, persona.id]);

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
          borderRadius: '14px 0 0 14px',
          background: 'var(--navy-900, #10223C)',
          color: 'var(--amber-soft, #F4CEA1)',
          boxShadow: '0 12px 28px rgba(15,28,46,0.28)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)',
          '&:hover': { transform: 'translateX(-3px)' },
          '&:focus-visible': {
            outline: '3px solid rgba(224,122,63,0.32)',
            outlineOffset: 2,
          },
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
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'top center',
            border: '2px solid var(--amber-soft, #F4CEA1)',
            background: 'var(--navy-800, #162A44)',
          }}
        />
        Guide
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        zIndex: 1200,
        width: { xs: 'min(360px, 96vw)', sm: 440, md: 520 },
        pointerEvents: 'none',
        filter: 'drop-shadow(0 18px 40px rgba(15,28,46,0.18))',
      }}
    >
      {/* Speech bubble — white card with a tail on the LEFT side.
          Strips all chrome (name, page title, tagline) so the message is
          the only content; a small × in the corner lets the user tuck it. */}
      <Box
        sx={{
          position: 'relative',
          margin: { xs: '0 8px 12px 8px', md: '0 16px 14px 16px' },
          padding: '22px 26px',
          minHeight: { xs: 110, md: 130 },
          background: '#FFFFFF',
          border: '1px solid var(--sand-200, #E8DBC3)',
          borderRadius: 18,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {/* Tail — now on the LEFT side at the same inset we previously used
            on the right */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: { xs: 60, md: 90 },
            bottom: -9,
            width: 16,
            height: 16,
            background: '#FFFFFF',
            borderRight: '1px solid var(--sand-200, #E8DBC3)',
            borderBottom: '1px solid var(--sand-200, #E8DBC3)',
            transform: 'rotate(45deg)',
            borderBottomRightRadius: 4,
          }}
        />

        {/* Close button — small and unobtrusive in the corner so it doesn't
            visually compete with the single centered message */}
        <Box
          component="button"
          type="button"
          onClick={toggleHidden}
          aria-label="Hide guide"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-soft, #44566C)',
            fontFamily: '"Manrope", sans-serif',
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 600,
            transition: 'background 140ms',
            '&:hover': {
              background: 'var(--sand-50, #FBF7F0)',
              color: 'var(--navy-900, #10223C)',
            },
            '&:focus-visible': {
              outline: '3px solid rgba(224,122,63,0.32)',
              outlineOffset: 2,
            },
          }}
        >
          ×
        </Box>

        {/* The only content — the advice itself, centered both axes */}
        <Box
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontStyle: 'italic',
            fontSize: { xs: 15, md: 16 },
            lineHeight: 1.5,
            color: 'var(--navy-900, #10223C)',
            maxWidth: '100%',
          }}
        >
          {message.text}
        </Box>
      </Box>

      {/* Character image — flush to the bottom-right corner, static (no
          animation), ~25% larger than the previous size. */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 290, sm: 331, md: 381 },
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          paddingRight: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <Box
          component="img"
          src={persona.poses.idle}
          alt={`${persona.name} guide`}
          sx={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom right',
            display: 'block',
            marginRight: { xs: '-4px', md: '-8px' },
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          onClick={toggleHidden}
          draggable={false}
        />
      </Box>
    </Box>
  );
}

export default GuideOverlay;
