import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { getGuideMessages, resolveRouteKey } from '../data/guideContent';

// Pages where the guide has not yet been chosen — overlay is suppressed entirely.
const PRE_GUIDE_PATHS = ['/user-info'];

function GuideOverlay() {
  const { persona, hidden, toggleHidden, setHidden, suppress } = useGuide();
  const location = useLocation();

  // All hooks must run unconditionally before any early return.
  const routeKey = useMemo(
    () => resolveRouteKey(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const messages = useMemo(
    () => getGuideMessages(routeKey, persona.id),
    [routeKey, persona.id],
  );

  const [msgIdx, setMsgIdx] = useState(0);
  const prevKeyRef = useRef(routeKey);
  useEffect(() => {
    if (routeKey !== prevKeyRef.current) {
      prevKeyRef.current = routeKey;
      if (messages.length > 1) {
        setMsgIdx((prev) => {
          let next = Math.floor(Math.random() * messages.length);
          if (next === prev) next = (prev + 1) % messages.length;
          return next;
        });
      } else {
        setMsgIdx(0);
      }
    }
  }, [routeKey, messages.length]);

  const message = messages[msgIdx] || messages[0];
  const owlPose = persona.poses[message?.pose] || persona.poses.idle;

  // Suppress on pages before guide selection (after all hooks), or when explicitly suppressed.
  const isPreGuide = PRE_GUIDE_PATHS.some((p) => location.pathname.startsWith(p));
  if (isPreGuide || suppress) return null;

  // ── Collapsed tab ────────────────────────────────────────────────────────
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
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
        }}
      >
        <Box
          component="img"
          src={persona.poses.idle}
          alt=""
          aria-hidden
          sx={{
            width: 28, height: 28,
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

  // ── Expanded overlay ─────────────────────────────────────────────────────
  // Width is constrained to the right 20% column so the guide never bleeds
  // into the main content area. Height can grow upward freely.
  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        zIndex: 1200,
        width: 'clamp(250px, 25vw, 350px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        pointerEvents: 'none',
      }}
    >
      {/* ── Speech bubble ── */}
      <Box
        sx={{
          position: 'relative',
          mx: '15px',
          mb: '13px',
          p: '20px 22px 20px 22px',
          background: 'var(--surface-1, #ffffff)',
          border: '1px solid var(--sand-200, #E8DBC3)',
          borderRadius: 'var(--cairn-radius-md, 14px)',
          boxShadow: '0 8px 24px rgba(15,28,46,0.10)',
          pointerEvents: 'auto',
        }}
      >
        {/* Close button */}
        <Box
          component="button"
          type="button"
          onClick={toggleHidden}
          aria-label="Hide guide"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            position: 'absolute',
            top: 8, right: 8,
            width: 20, height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-soft, #44566C)',
            fontFamily: '"Manrope", sans-serif',
            fontSize: 14, lineHeight: 1, fontWeight: 600,
            transition: 'background 140ms',
            '&:hover': { background: 'var(--sand-100, #F4ECDD)', color: 'var(--navy-900, #10223C)' },
            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
          }}
        >
          ×
        </Box>

        {/* Message text */}
        <Box
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontStyle: 'normal',
            fontSize: '0.875rem',
            lineHeight: 1.55,
            color: 'var(--ink, #0f1c2e)',
            pr: '22px',
          }}
        >
          {message.text}
        </Box>
      </Box>

      {/* ── Owl image ── scales to column width, flush to bottom-right */}
      <Box
        component="img"
        src={owlPose}
        alt={`${persona.name} guide`}
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'bottom right',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        onClick={toggleHidden}
        draggable={false}
      />
    </Box>
  );
}

export default GuideOverlay;
