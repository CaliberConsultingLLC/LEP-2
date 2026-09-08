import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { colors, fonts, radii } from '../../styles/tokens';
import { EDGE, readKeepClear, resolveAnchor, solveBubble } from './guideGeometry';

// The guide, saying something, anywhere in the product.
//
// One component replaces four sets of hand-placed offsets. It is handed the
// owl that is already on screen and works out the rest: it reads the anchor
// off the art, measures the bubble it just rendered, asks the solver where
// that bubble can sit without covering the bird's face or anything the page
// has marked as keep-clear, and draws the tail back to the head from wherever
// it landed.
//
// It re-solves whenever anything it measured changes — the window, the owl,
// the length of the line. That is the difference between this and what it
// replaces: the old placement was a decision taken once, at authoring time,
// about a window nobody was looking at.
//
// The bubble is always the opposite of its ground: navy on the sand pages
// that make up most of the product, sand on the two dark rooms. The Today
// room already worked this way and is the reason it was the only placement in
// the audit that read correctly.

const NAVY = {
  bg: '#10223C',
  ink: '#F4CEA1',
  body: '#EFE7D8',
  rule: 'rgba(244,206,161,0.20)',
  shadow: '0 18px 44px rgba(9,16,31,0.34)',
  btnBg: '#F4CEA1',
  btnInk: '#10223C',
};

const SAND = {
  bg: '#FBF7F0',
  ink: '#C0612A',
  body: '#0F1C2E',
  rule: 'rgba(15,28,46,0.12)',
  shadow: '0 18px 44px rgba(0,0,0,0.38)',
  btnBg: '#10223C',
  btnInk: '#F4CEA1',
};

// The guide standing in a room the leader is reading.
//
// Navy on cream is the right bubble when the guide is interrupting: an
// unmissable dark block is exactly the job. In the dashboard rooms it is not
// the job. The leader is reading their own results and the guide is a note in
// the margin of that — a dark block beside a page of findings competes with
// the thing it is there to help them read, and the eye goes to the block.
// Same ink, same shape, same everything else; it just stops shouting.
const QUIET = {
  bg: '#FFFDF9',
  ink: '#C0612A',
  body: '#22364E',
  rule: 'rgba(15,28,46,0.16)',
  shadow: '0 14px 34px rgba(15,28,46,0.14)',
  btnBg: '#10223C',
  btnInk: '#F4CEA1',
};

// Which of the three the bubble is.
//
// One rule: the guide speaks in the opposite of its ground. Most of the
// product is sand-coloured paper, so most of the time that is navy. Two
// grounds are dark, and both are knowable without guessing at them:
//
//   an interruption   always lays a near-black scrim over the page, so the
//                     bubble on one is always sand. The caller says so.
//   a themed-dark page  carries data-dark on the document.
//
// I tried deciding this by compositing the background colours under the
// bubble and reading the luminance. It is blind to images — the field journal
// is dark because of a photograph of a book, not because of a fill — so it
// confidently returned "light" over the darkest surface in the product. A
// rule the caller can state beats a measurement that cannot see.
function themeIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-dark') === 'true';
}

// The tail is a rotated square rather than a border triangle so it inherits
// the bubble's fill and its hairline in one go, and stays correct if the
// bubble's colour changes under it.
function tailSx(tail, tone) {
  if (!tail) return {};
  const { side, offset } = tail;
  const base = {
    content: '""',
    position: 'absolute',
    width: 14,
    height: 14,
    bgcolor: tone.bg,
    transform: 'rotate(45deg)',
    zIndex: 0,
  };
  if (side === 'bottom') return { ...base, left: offset - 7, bottom: -7, borderRight: `1px solid ${tone.rule}`, borderBottom: `1px solid ${tone.rule}` };
  if (side === 'top') return { ...base, left: offset - 7, top: -7, borderLeft: `1px solid ${tone.rule}`, borderTop: `1px solid ${tone.rule}` };
  if (side === 'right') return { ...base, top: offset - 7, right: -7, borderTop: `1px solid ${tone.rule}`, borderRight: `1px solid ${tone.rule}` };
  return { ...base, top: offset - 7, left: -7, borderBottom: `1px solid ${tone.rule}`, borderLeft: `1px solid ${tone.rule}` };
}

export default function GuideSpeech({
  owlRef,
  src,
  mirrored = false,
  eyebrow,
  text,
  action,
  onDismiss,
  tone: toneName = 'auto',
  // Bumped by a caller that moved the owl without resizing it — a change
  // of position fires neither resize nor ResizeObserver.
  resolveKey,
  zIndex = 1300,
  maxWidth = 320,
  children,
}) {
  const bubbleRef = useRef(null);
  const [solved, setSolved] = useState(null);
  const [acked, setAcked] = useState(false);
  const frame = useRef(0);

  useEffect(() => { setAcked(false); }, [text]);

  const tone = toneName === 'navy'
    ? NAVY
    : toneName === 'sand'
      ? SAND
      // A room already dark has nothing to quieten against — SAND is the quiet
      // bubble there, and it is the one with the right contrast.
      : toneName === 'quiet'
        ? (themeIsDark() ? SAND : QUIET)
        : (themeIsDark() ? SAND : NAVY);

  const solve = useCallback(() => {
    const owl = owlRef?.current;
    const bub = bubbleRef.current;
    if (!owl || !bub) return;
    const owlRect = owl.getBoundingClientRect();
    if (owlRect.width < 8) return;

    const anchor = resolveAnchor(owlRect, src, mirrored);
    const next = solveBubble({
      anchor,
      bubble: { width: bub.offsetWidth, height: bub.offsetHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      obstacles: readKeepClear(),
    });
    setSolved((prev) => (
      prev && prev.left === next.left && prev.top === next.top
        && prev.tail?.side === next.tail?.side && prev.tail?.offset === next.tail?.offset
        ? prev
        : next
    ));
  }, [owlRef, src, mirrored]);

  // Placement has to happen before paint, or the bubble is visibly seen in the
  // wrong place first. It measures itself, so the first pass renders it
  // hidden and the solve is what reveals it.
  useLayoutEffect(() => {
    solve();
  }, [solve, text, eyebrow, action?.label, resolveKey]);

  useEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(solve);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    // The owl scales with its container on several pages and the bubble grows
    // with its own text, so watching the window alone is not enough.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (owlRef?.current) ro.observe(owlRef.current);
      if (bubbleRef.current) ro.observe(bubbleRef.current);
      if (document.body) ro.observe(document.body);
    }
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      ro?.disconnect();
    };
  }, [solve, owlRef]);

  const blocked = Boolean(action?.acknowledge) && !acked;

  return (
    <Box
      ref={bubbleRef}
      role="status"
      sx={{
        position: 'fixed',
        left: solved ? solved.left : EDGE,
        top: solved ? solved.top : EDGE,
        zIndex,
        width: `min(${maxWidth}px, calc(100vw - ${EDGE * 2}px))`,
        boxSizing: 'border-box',
        visibility: solved ? 'visible' : 'hidden',
        pointerEvents: 'auto',
        bgcolor: tone.bg,
        color: tone.body,
        border: `1px solid ${tone.rule}`,
        borderRadius: radii.md,
        boxShadow: tone.shadow,
        px: '18px',
        pt: eyebrow ? '14px' : '16px',
        pb: '16px',
        // Grown from the beak rather than faded in over the page: the origin
        // is the speak point, so the bubble reads as something the owl said
        // before a word of it has been read.
        transformOrigin: solved ? `${solved.origin.x}px ${solved.origin.y}px` : 'center',
        animation: solved ? 'guideSpeechIn 190ms cubic-bezier(.2,.9,.25,1) both' : 'none',
        '@keyframes guideSpeechIn': {
          from: { opacity: 0, transform: 'scale(0.82)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        '&:before': tailSx(solved?.tail, tone),
      }}
    >
      {onDismiss && !action && (
        <Box
          component="button"
          type="button"
          onClick={onDismiss}
          aria-label="Hide guide"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            position: 'absolute',
            top: 6, right: 8,
            width: 22, height: 22,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tone.body,
            opacity: 0.55,
            fontFamily: fonts.sans,
            fontSize: 15, lineHeight: 1, fontWeight: 600,
            transition: 'opacity 140ms',
            '&:hover': { opacity: 1 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2, opacity: 1 },
          }}
        >
          ×
        </Box>
      )}

      {eyebrow && (
        <Box sx={{
          fontFamily: fonts.mono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: tone.ink,
          mb: '7px',
          pr: onDismiss && !action ? '20px' : 0,
        }}>
          {eyebrow}
        </Box>
      )}

      {/* Serif italic, because the guide is a person talking. The sans it used
          to be set in reads as interface copy, which is exactly how it was
          being filed by the eye. */}
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        fontFamily: fonts.serif,
        fontStyle: 'italic',
        fontSize: 14.5,
        lineHeight: 1.52,
        color: tone.body,
        pr: onDismiss && !action && !eyebrow ? '20px' : 0,
      }}>
        {text}
      </Box>

      {children ? <Box sx={{ position: 'relative', zIndex: 1, mt: '12px' }}>{children}</Box> : null}

      {action && (
        <Box sx={{ position: 'relative', zIndex: 1, mt: '14px' }}>
          {/* A checkbox, and it has to say so. It was a button reporting
              `aria-pressed`, which is a toggle — and the cairn theme paints
              every pressed toggle in the product navy, because that is what a
              pressed toggle looks like everywhere else. So ticking the box
              filled the whole row with a solid navy block and swallowed the
              sentence being agreed to. Nothing was wrong with the theme rule;
              the markup was describing the wrong control. */}
          {action.acknowledge && (
            <Box
              component="button"
              type="button"
              onClick={() => setAcked((v) => !v)}
              role="checkbox"
              aria-checked={acked}
              sx={{
                all: 'unset', cursor: 'pointer', display: 'flex',
                alignItems: 'flex-start', gap: '9px', mb: '11px',
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              <Box aria-hidden sx={{
                flexShrink: 0, mt: '1px', width: 17, height: 17, borderRadius: '5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1.5px solid ${acked ? tone.ink : tone.rule}`,
                background: acked ? tone.ink : 'transparent',
                color: tone.bg, fontSize: 11, lineHeight: 1, fontWeight: 700,
              }}>
                {acked ? '✓' : ''}
              </Box>
              <Box sx={{
                fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 1.45,
                fontWeight: 600, color: tone.body, opacity: 0.85, textAlign: 'left',
              }}>
                {action.acknowledgeLabel || 'I have read this.'}
              </Box>
            </Box>
          )}
          {/* A closing beat, ruled off from the line above it. The guide has
              said its piece; this is the sentence that hands over. */}
          {action.note && (
            <Box sx={{ mb: '12px' }}>
              <Box aria-hidden sx={{ height: '1px', background: tone.rule, opacity: 0.7, mb: '10px' }} />
              <Box sx={{
                fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 14.5,
                lineHeight: 1.5, color: tone.body,
              }}>
                {action.note}
              </Box>
            </Box>
          )}
          {/* One button, or two. Two when the guide is asking rather than
              telling — the way on, and the way out of being walked through it.
              The second is outlined, because a fork with two solid buttons
              reads as two demands. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
            <Box
              component="button"
              type="button"
              autoFocus={Boolean(action.autoFocus)}
              disabled={blocked}
              onClick={() => { if (!blocked) action.onClick?.(); }}
              sx={{
                all: 'unset', boxSizing: 'border-box',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                px: '20px', minHeight: 36, borderRadius: radii.pill,
                background: tone.btnBg, color: tone.btnInk,
                fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700,
                cursor: blocked ? 'not-allowed' : 'pointer',
                opacity: blocked ? 0.45 : 1,
                transition: 'opacity 140ms',
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              {action.label || 'Continue'}
            </Box>
            {action.secondary && (
              <Box
                component="button"
                type="button"
                disabled={blocked}
                onClick={() => { if (!blocked) action.secondary.onClick?.(); }}
                sx={{
                  all: 'unset', boxSizing: 'border-box',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  px: '18px', minHeight: 36, borderRadius: radii.pill,
                  border: `1px solid ${tone.rule}`, color: tone.body,
                  fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700,
                  cursor: blocked ? 'not-allowed' : 'pointer',
                  opacity: blocked ? 0.45 : 1,
                  transition: 'opacity 140ms, border-color 140ms',
                  '&:hover': { borderColor: tone.ink },
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                {action.secondary.label}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
