import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { getGuideMessage, resolveRouteKey } from '../data/guideContent';

// A persistent, Clippy-style guide overlay.
// Sits bottom-right, shows the selected persona's character with a speech
// bubble carrying placeholder copy for the current route. The user can
// collapse it (just the character + a "nudge me" handle remain) or hide it
// entirely — both states persist via GuideContext -> localStorage.
function GuideOverlay() {
  const { persona, hidden, toggleHidden, setHidden } = useGuide();
  const location = useLocation();

  const message = useMemo(() => {
    const key = resolveRouteKey(location.pathname, location.search);
    return getGuideMessage(key, persona.id);
  }, [location.pathname, location.search, persona.id]);

  if (hidden) {
    // Collapsed state — a small tab on the right edge that brings the guide back.
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
        width: { xs: 'min(340px, 94vw)', sm: 400, md: 460 },
        pointerEvents: 'none', // inner elements re-enable pointer events
        filter: 'drop-shadow(0 18px 40px rgba(15,28,46,0.18))',
      }}
    >
      {/* Speech bubble — white card with a tail pointing to the character.
          Flush to the right edge so the tail sits directly above the owl. */}
      <Box
        sx={{
          position: 'relative',
          margin: { xs: '0 8px 10px 8px', md: '0 16px 12px 16px' },
          padding: '14px 16px 14px 16px',
          background: '#FFFFFF',
          border: '1px solid var(--sand-200, #E8DBC3)',
          borderRadius: 18,
          pointerEvents: 'auto',
          animation: 'cairn-bubble-in 320ms cubic-bezier(.2,.8,.2,1) both',
          '@keyframes cairn-bubble-in': {
            from: { opacity: 0, transform: 'translate(6px, 4px) scale(0.98)' },
            to: { opacity: 1, transform: 'translate(0, 0) scale(1)' },
          },
        }}
      >
        {/* Tail — positioned over the character's upper body */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: { xs: 60, md: 90 },
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

        {/* Header: persona name + close */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            marginBottom: 0.75,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            <Box sx={{ color: 'var(--navy-900, #10223C)' }}>{persona.name}</Box>
            <Box sx={{ opacity: 0.4 }}>·</Box>
            <Box sx={{ color: 'var(--ink-soft, #44566C)' }}>{message.title}</Box>
          </Box>
          <Box
            component="button"
            type="button"
            onClick={toggleHidden}
            aria-label="Hide guide"
            sx={{
              all: 'unset',
              cursor: 'pointer',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--sand-200, #E8DBC3)',
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
        </Box>

        {/* Body message */}
        <Box
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 14.5,
            lineHeight: 1.45,
            color: 'var(--navy-900, #10223C)',
            margin: 0,
          }}
        >
          {message.text}
        </Box>

        {/* Footer: persona tagline (kept muted so it doesn't compete with message) */}
        <Box
          sx={{
            marginTop: 1,
            paddingTop: 0.75,
            borderTop: '1px dashed var(--sand-200, #E8DBC3)',
            fontFamily: '"Manrope", sans-serif',
            fontSize: 11,
            color: 'var(--ink-soft, #44566C)',
          }}
        >
          {persona.tagline}
        </Box>
      </Box>

      {/* Character image — flush to the bottom-right corner so the branch
          appears to emerge from outside the viewport. Bumped ~45% larger. */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 232, sm: 265, md: 305 },
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
            animation: 'cairn-owl-bob 4.2s ease-in-out infinite',
            transformOrigin: 'bottom right',
            '@keyframes cairn-owl-bob': {
              '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
              '50%': { transform: 'translateY(-3px) rotate(-0.3deg)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }}
          onClick={toggleHidden}
          draggable={false}
        />
      </Box>
    </Box>
  );
}

export default GuideOverlay;
