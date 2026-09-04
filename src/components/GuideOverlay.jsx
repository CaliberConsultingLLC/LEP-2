import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { getGuideMessages, getPageFaq, resolveRouteKey } from '../data/guideContent';
import { GUIDE_COLUMN, GUIDE_TAB_BOTTOM, GUIDE_Z } from './guidePlacement';

// Pages where the guide has not yet been chosen — overlay is suppressed entirely.
const PRE_GUIDE_PATHS = ['/user-info', '/guide-select', '/sign-in', '/landing'];

function GuideFaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ borderTop: '1px solid var(--sand-200, #E8DBC3)' }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          py: '9px',
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
        }}
      >
        <Box sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900, #10223C)', lineHeight: 1.35 }}>
          {q}
        </Box>
        <Box aria-hidden sx={{ flexShrink: 0, fontSize: 16, lineHeight: 1, fontWeight: 700, color: 'var(--orange-deep, #C0612A)' }}>
          {open ? '−' : '+'}
        </Box>
      </Box>
      {open && (
        <Box sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--ink-soft, #44566C)', pb: '10px' }}>
          {a}
        </Box>
      )}
    </Box>
  );
}

function GuideOverlay() {
  const { persona, hidden, toggleHidden, setHidden, suppress, pageMessage, hasSelectedGuide, stepKey } = useGuide();
  const location = useLocation();

  // All hooks must run unconditionally before any early return.
  const routeKey = useMemo(
    () => resolveRouteKey(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const messages = useMemo(
    () => getGuideMessages(routeKey, persona.id, stepKey || 'default'),
    [routeKey, persona.id, stepKey],
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

  // A page-level pageMessage takes precedence over the rotating route bucket
  // so the overlay can carry trait/step-aware talking points.
  const fallbackMessage = messages[msgIdx] || messages[0];
  const message = pageMessage && pageMessage.text
    ? { text: pageMessage.text, pose: pageMessage.pose || fallbackMessage?.pose || 'idle', cta: pageMessage.cta || fallbackMessage?.cta, faq: pageMessage.faq || null, composer: pageMessage.composer || null }
    : fallbackMessage;
  const owlPose = persona.poses[message?.pose] || persona.poses.idle;
  const routeFaq = getPageFaq(routeKey);
  const rawFaq = Array.isArray(message?.faq) && message.faq.length ? message.faq : routeFaq;
  const faqItems = Array.isArray(rawFaq) ? rawFaq.filter((f) => f && f.q && f.a) : [];

  // Collapse the FAQ whenever the underlying message changes.
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    setFaqOpen(false);
  }, [message?.text]);

  // Composer draft. Cleared when the guide moves on to a different message so
  // a half-written note cannot reappear under an unrelated line.
  const [draft, setDraft] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    setDraft('');
    setSavedCount(0);
  }, [message?.text]);

  // Suppress before a guide is chosen, on pre-guide routes, or when explicitly suppressed.
  const stage = new URLSearchParams(location.search || '').get('stage');
  const isProfileDetails = location.pathname.startsWith('/form') && stage === 'profile';
  const isTeamSurvey = (() => {
    try {
      const m = location.pathname.match(/^\/campaign\/([^/]+)/);
      if (!m) return false;
      const data = JSON.parse(localStorage.getItem(`campaign_${m[1]}`) || '{}');
      return String(data?.campaignType || '').toLowerCase() === 'team';
    } catch {
      return false;
    }
  })();
  const isPreGuide = PRE_GUIDE_PATHS.some((p) => location.pathname.startsWith(p))
    || isProfileDetails
    || isTeamSurvey
    || !hasSelectedGuide;

  if (isPreGuide || suppress) return null;

  // ── Collapsed tab ────────────────────────────────────────────────────────
  if (hidden) {
    // The tab is small, but it still sits over the bottom-right corner, so it
    // reserves its own height rather than trusting nothing is under it.
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
          bottom: GUIDE_TAB_BOTTOM,
          zIndex: GUIDE_Z,
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
        zIndex: GUIDE_Z,
        width: GUIDE_COLUMN,
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

        {/* ── Composer ──
            The guide can be written to as well as read. A page hands over a
            composer and the bubble becomes the place the note is typed, so a
            note is given to the guide rather than filled into a form
            somewhere else on the page. It stays open after each save: one
            thought is rarely the only one. */}
        {message.composer && (
          <Box sx={{ mt: '14px' }}>
            <Box
              component="textarea"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  message.composer.onSubmit?.(draft.trim());
                  setDraft('');
                  setSavedCount((n) => n + 1);
                }
              }}
              placeholder={message.composer.placeholder || 'Type it here…'}
              aria-label={message.composer.placeholder || 'Note'}
              sx={{
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: 74,
                p: '10px 12px',
                borderRadius: 'var(--cairn-radius-sm, 10px)',
                border: '1px solid var(--sand-200, #E8DBC3)',
                background: 'var(--sand-50, #FBF7F0)',
                fontFamily: '"Manrope", sans-serif',
                fontSize: 13.5,
                lineHeight: 1.5,
                color: 'var(--ink, #0f1c2e)',
                '&:focus': { outline: 'none', borderColor: 'var(--orange, #E07A3F)' },
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', mt: '9px' }}>
              <Box
                component="span"
                sx={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: savedCount ? 'var(--green, #2F855A)' : 'var(--ink-soft, #44566C)',
                }}
              >
                {savedCount
                  ? `${savedCount} logged · add another`
                  : (message.composer.helper || 'Cmd/Ctrl + Enter saves')}
              </Box>
              <Box
                component="button"
                type="button"
                disabled={!draft.trim()}
                onClick={() => {
                  if (!draft.trim()) return;
                  message.composer.onSubmit?.(draft.trim());
                  setDraft('');
                  setSavedCount((n) => n + 1);
                }}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: '18px',
                  minHeight: 34,
                  borderRadius: 999,
                  background: 'var(--navy-900, #10223C)',
                  color: 'var(--amber-soft, #F4CEA1)',
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  opacity: draft.trim() ? 1 : 0.45,
                  '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
                }}
              >
                {message.composer.submitLabel || 'Save'}
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Expandable FAQ for the detailed read ── */}
        {faqItems.length > 0 && (
          <Box sx={{ mt: '14px' }}>
            <Box
              component="button"
              type="button"
              onClick={() => setFaqOpen((v) => !v)}
              aria-expanded={faqOpen}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--orange-deep, #C0612A)',
                '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
              }}
            >
              {faqOpen ? 'Hide details' : 'Learn more'}
              <Box component="span" aria-hidden sx={{ fontSize: 12 }}>{faqOpen ? '▴' : '▾'}</Box>
            </Box>
            {faqOpen && (
              <Box sx={{ mt: '8px' }}>
                {faqItems.map((f, i) => (
                  <GuideFaqItem key={i} q={f.q} a={f.a} />
                ))}
              </Box>
            )}
          </Box>
        )}
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
