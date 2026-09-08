import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { getGuideMessages, getPageFaq, resolveRouteKey } from '../data/guideContent';
import { GUIDE_COLUMN, GUIDE_TAB_BOTTOM, GUIDE_Z } from './guidePlacement';
import GuideSpeech from './guide/GuideSpeech';
import { anchorPercents } from './guide/guideGeometry';
import useOwlClearance from './guide/useOwlClearance';

// The guide, standing in the corner of every room.
//
// The owl is drawn here and nothing else is: where the line it is saying goes
// is worked out by GuideSpeech against the owl's measured position, the shape
// of the art, and whatever the page has marked as keep-clear. This used to be
// a fixed column with the bubble stacked above the owl, which is why the line
// landed on the Next button on the reading and on two of the five scores on
// Evidence — a column knows where its own edge is and nothing else.

// Pages where the guide has not yet been chosen — overlay is suppressed entirely.
const PRE_GUIDE_PATHS = ['/user-info', '/guide-select', '/sign-in', '/landing'];

function GuideFaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ borderTop: '1px solid rgba(244,206,161,0.18)' }}>
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
        <Box sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.78rem', fontWeight: 700, color: 'inherit', lineHeight: 1.35, textAlign: 'left' }}>
          {q}
        </Box>
        <Box aria-hidden sx={{ flexShrink: 0, fontSize: 16, lineHeight: 1, fontWeight: 700, opacity: 0.7 }}>
          {open ? '−' : '+'}
        </Box>
      </Box>
      {open && (
        <Box sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.78rem', lineHeight: 1.55, opacity: 0.82, pb: '10px' }}>
          {a}
        </Box>
      )}
    </Box>
  );
}

function GuideOverlay() {
  const { persona, hidden, toggleHidden, setHidden, suppress, pageMessage, hasSelectedGuide, stepKey } = useGuide();
  const location = useLocation();
  const owlRef = useRef(null);
  // Sink the bird past anything the page marked keep-clear — on Review &
  // Lock that is the button out of the intake, which the owl used to stand
  // on and swallow the click for.
  const { sink, flipped } = useOwlClearance(owlRef, { enabled: !hidden });

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
    ? {
        text: pageMessage.text,
        pose: pageMessage.pose || fallbackMessage?.pose || 'idle',
        eyebrow: pageMessage.eyebrow || null,
        cta: pageMessage.cta || fallbackMessage?.cta,
        faq: pageMessage.faq || null,
        composer: pageMessage.composer || null,
        action: pageMessage.action || null,
      }
    : fallbackMessage;
  const owlPose = persona.poses[message?.pose] || persona.poses.idle;
  const routeFaq = getPageFaq(routeKey);
  const rawFaq = Array.isArray(message?.faq) && message.faq.length ? message.faq : routeFaq;
  const faqItems = Array.isArray(rawFaq) ? rawFaq.filter((f) => f && f.q && f.a) : [];

  // Collapse the FAQ whenever the underlying message changes.
  const [faqOpen, setFaqOpen] = useState(false);
  useEffect(() => { setFaqOpen(false); }, [message?.text]);

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

  const faceBox = anchorPercents(owlPose, flipped).face;
  const hasExtras = faqItems.length > 0 || Boolean(message.composer);

  // ── Expanded ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* The owl. A square PNG that is mostly transparent padding, so it is
          inert to the pointer and only the bird's face takes the click that
          collapses it — the whole square used to, which is how it came to be
          eating clicks on the button underneath it. */}
      <Box
        sx={{
          position: 'fixed',
          ...(flipped ? { left: 0 } : { right: 0 }),
          bottom: -sink,
          transition: 'bottom 220ms cubic-bezier(.2,.8,.2,1)',
          zIndex: GUIDE_Z,
          width: GUIDE_COLUMN,
          aspectRatio: '1 / 1',
          pointerEvents: 'none',
        }}
      >
        <Box
          component="img"
          ref={owlRef}
          src={owlPose}
          alt={`${persona.name} guide`}
          draggable={false}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: flipped ? 'bottom left' : 'bottom right',
            // Standing on the left, the bird turns to face into the page
            // rather than out of it.
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
            ...faceBox,
            borderRadius: '50%',
            cursor: 'pointer',
            pointerEvents: 'auto',
            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.45)', outlineOffset: 4 },
          }}
        />
      </Box>

      <GuideSpeech
        owlRef={owlRef}
        src={owlPose}
        mirrored={flipped}
        // Quiet in the dashboard rooms. Everywhere else the guide is the thing
        // on the page; there, the leader's own results are, and the guide is a
        // note in the margin of them.
        tone={location.pathname.startsWith('/dashboard') ? 'quiet' : 'auto'}
        eyebrow={message.eyebrow}
        text={message.text}
        action={message.action}
        onDismiss={toggleHidden}
        resolveKey={`${sink}:${flipped}`}
        zIndex={GUIDE_Z + 1}
        maxWidth={hasExtras ? 340 : 310}
      >
        {message.composer && (
          <Box>
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
                minHeight: 72,
                p: '10px 12px',
                borderRadius: 'var(--cairn-radius-sm, 10px)',
                border: '1px solid rgba(244,206,161,0.24)',
                background: 'rgba(255,255,255,0.06)',
                fontFamily: '"Manrope", sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'inherit',
                '&::placeholder': { color: 'inherit', opacity: 0.5 },
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
                  opacity: 0.72,
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
                  px: '16px',
                  minHeight: 32,
                  borderRadius: 999,
                  background: 'var(--amber-soft, #F4CEA1)',
                  color: 'var(--navy-900, #10223C)',
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: 12,
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

        {faqItems.length > 0 && (
          <Box>
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
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--amber-soft, #F4CEA1)',
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
      </GuideSpeech>
    </>
  );
}

export default GuideOverlay;
