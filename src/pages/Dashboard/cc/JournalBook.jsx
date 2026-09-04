import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { fonts } from '../../../styles/tokens';
import JournalPage, { PAGE_KEYFRAMES } from './JournalPage.jsx';
import { STEP_KEYFRAMES, focusRing } from './JournalStep.jsx';
import { BOOKMARK_GRADIENTS, JOURNAL_ASSETS, PAPER } from './fieldJournalUtils.js';

// The book itself: a closed leather cover that opens, two leaves, a sheet that
// turns between spreads, three bookmarks, and the sticky pad of evidence notes
// tucked into the fore-edge.
//
// Everything is drawn at a fixed 1140 × 724 and scaled to whatever the column
// gives it, so a spread never reflows and never scrolls — the page a leader
// sees at 1440 is the same page at 1280, just smaller.

const DESIGN_W = 1140;
const DESIGN_H = 724;
const NOTES_W = 288;
const COVER_MS = 1250;
const LAND_MS = 1300;
const TURN_MS = 900;

export const BOOK_KEYFRAMES = {
  ...PAGE_KEYFRAMES,
  ...STEP_KEYFRAMES,
  '@keyframes fjFlipFwd': {
    from: { transform: 'rotateY(0deg)' },
    to: { transform: 'rotateY(-180deg)' },
  },
  '@keyframes fjFlipBack': {
    from: { transform: 'rotateY(-180deg)' },
    to: { transform: 'rotateY(0deg)' },
  },
  '@keyframes fjShade': {
    '0%': { opacity: 0 },
    '45%': { opacity: 1 },
    '100%': { opacity: 0 },
  },
  '@keyframes fjSettle': {
    '0%': { transform: 'translateY(-3px)' },
    '60%': { transform: 'translateY(1px)' },
    '100%': { transform: 'none' },
  },
  '@keyframes fjHint': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-3px)' },
  },
};

export { COVER_MS, LAND_MS, TURN_MS };

/** Honours the OS setting rather than guessing at it. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

const LEATHER = {
  backgroundImage: `url(${JOURNAL_ASSETS.leather})`,
  backgroundRepeat: 'repeat',
  backgroundSize: '256px 256px',
};

const BLOCK_H = 'repeating-linear-gradient(to right, #fbf5e6 0 1px, #d9c7a0 1px 2px)';
const BLOCK_V = 'repeating-linear-gradient(to bottom, #fbf5e6 0 1px, #d9c7a0 1px 2px)';

function NoteTab({ count, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        pointerEvents: 'auto',
        position: 'absolute',
        right: -36,
        top: 122,
        width: 64,
        height: 118,
        transform: 'rotate(-2.5deg)',
        background: 'linear-gradient(180deg, #fbe58a, #f1d569 70%, #e6c655)',
        boxShadow: '0 6px 14px rgba(15,28,46,0.22), inset 0 -1px 0 rgba(0,0,0,0.08)',
        borderRadius: '1px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        zIndex: 8,
        transition: 'transform 220ms ease',
        ...focusRing('#6b5a1e'),
        '&:hover': { transform: 'rotate(-2.5deg) translateX(6px)' },
      }}
    >
      <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, height: 14, bgcolor: 'rgba(255,255,255,0.28)' }} />
      <Typography
        sx={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: fonts.mono,
          fontSize: 8.5,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: '#6b5a1e',
          ml: '24px',
        }}
      >
        Notes · {count}
      </Typography>
      <Box sx={{ position: 'absolute', left: 5, bottom: 8, width: 7, height: 7, borderRadius: '50%', bgcolor: '#c0612a', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
    </Box>
  );
}

function NotesPad({ open, notes, traitLabel, onToggle, onUse }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: DESIGN_W,
        top: 72,
        width: NOTES_W,
        height: 'calc(100% - 150px)',
        zIndex: open ? 1 : 0,
        transform: `translateX(${open ? 0 : -300}px) rotate(1deg)`,
        transition: 'transform 520ms cubic-bezier(0.2,0.8,0.2,1), opacity 300ms ease',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          ml: '16px',
          height: '100%',
          background: 'linear-gradient(180deg, #fbeaa0, #f6dd7f 60%, #f0d26a)',
          boxShadow: '0 22px 44px rgba(15,28,46,0.28), 0 4px 10px rgba(15,28,46,0.16)',
          p: '18px 18px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden',
          borderRadius: '1px 1px 3px 1px',
        }}
      >
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, height: 18, bgcolor: 'rgba(255,255,255,0.3)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: '6px' }}>
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6b5a1e' }}>
            From the evidence · {traitLabel}
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={onToggle}
            sx={{ all: 'unset', cursor: 'pointer', fontFamily: fonts.sans, fontSize: 11, fontWeight: 700, color: '#6b5a1e', ...focusRing('#6b5a1e') }}
          >
            Tuck away
          </Box>
        </Box>
        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.5, color: '#5a4a15' }}>
          What you jotted while reading the evidence. Tap a note to write it into the field you&#39;re on.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto', minHeight: 0 }}>
          {notes.map((n, i) => (
            <Box
              key={`${n.ts}-${i}`}
              component="button"
              type="button"
              onClick={() => onUse(n)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'block',
                textAlign: 'left',
                bgcolor: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(107,90,30,0.18)',
                p: '10px 12px',
                borderRadius: '2px',
                ...focusRing('#6b5a1e'),
                '&:hover': { bgcolor: 'rgba(255,255,255,0.6)' },
              }}
            >
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a6a13' }}>
                {n.meta}
              </Typography>
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 14, lineHeight: 1.5, color: '#2a2410', mt: '5px' }}>{n.text}</Typography>
              <Typography sx={{ fontFamily: fonts.sans, fontSize: 10.5, fontWeight: 700, color: '#8a6a13', mt: '6px' }}>Write it in ↵</Typography>
            </Box>
          ))}
          {!notes.length && (
            <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13.5, color: '#7a6a2a', p: '8px 2px' }}>
              No notes saved for this trait. The evidence page has a pad at the bottom.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function Cover({ ownerName, open, landed, onOpen, reducedMotion }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 570,
        top: 0,
        width: 570,
        height: '100%',
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        transform: `rotateY(${open ? -180 : 0}deg)`,
        transition: reducedMotion ? 'none' : `transform ${COVER_MS}ms cubic-bezier(0.55,0,0.18,1)`,
        zIndex: landed ? 1 : 30,
        display: landed ? 'none' : 'block',
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onOpen}
        aria-label="Open the journal"
        sx={{
          all: 'unset',
          cursor: open ? 'default' : 'pointer',
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          borderRadius: '4px 12px 12px 4px',
          ...LEATHER,
          boxShadow:
            '0 36px 70px rgba(15,28,46,0.42), 0 10px 20px rgba(15,28,46,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
          transition: 'transform 300ms ease',
          '&:hover': { transform: open ? 'none' : 'translateY(-2px)' },
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.8)', outlineOffset: 3 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 38% 28%, rgba(255,225,180,0.16), transparent 55%), linear-gradient(90deg, rgba(0,0,0,0.45), rgba(0,0,0,0.18) 14px, rgba(255,255,255,0.05) 22px, transparent 40px), linear-gradient(180deg, rgba(0,0,0,0.08), transparent 20%, transparent 80%, rgba(0,0,0,0.22)), radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.35), transparent 55%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: '16px 16px 16px 26px',
            border: '1.5px dashed rgba(255,222,180,0.28)',
            borderRadius: '3px 8px 8px 3px',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.2)',
          }}
        />
        <Box
          component="img"
          src={JOURNAL_ASSETS.deboss}
          alt=""
          draggable={false}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            width: 230,
            height: 230,
            transform: 'translate(-50%,-50%)',
            opacity: 0.96,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: 26,
            right: 16,
            top: 'calc(38% + 136px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Typography
            sx={{
              fontFamily: fonts.brand,
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#120804',
              textAlign: 'center',
              textShadow: '0 1px 0 rgba(255,225,185,0.34), 0 -1px 1px rgba(0,0,0,0.75), 0 0 6px rgba(0,0,0,0.35)',
            }}
          >
            {ownerName}
          </Typography>
          <Box sx={{ width: 64, height: '1.5px', bgcolor: 'rgba(0,0,0,0.7)', boxShadow: '0 1px 0 rgba(255,225,185,0.4)' }} />
          <Typography
            sx={{
              fontFamily: fonts.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              color: '#120804',
              textShadow: '0 1px 0 rgba(255,225,185,0.45), 0 -1px 1px rgba(0,0,0,0.85)',
            }}
          >
            Field journal · Vol. I
          </Typography>
        </Box>
        {/* elastic band */}
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            bottom: -2,
            right: 44,
            width: 13,
            background: 'linear-gradient(90deg, #1a1410, #33271e 45%, #1a1410)',
            boxShadow: '2px 0 6px rgba(0,0,0,0.45), -1px 0 2px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 0 0 1px rgba(255,225,185,0.08), inset 0 0 26px rgba(0,0,0,0.5)' }} />
      </Box>

      {/* inside of the cover */}
      <Box
        sx={{
          display: open && !landed ? 'block' : 'none',
          position: 'absolute',
          inset: 0,
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
          borderRadius: '12px 4px 4px 12px',
          ...LEATHER,
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(15,28,46,0.35)',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(270deg, rgba(0,0,0,0.45), transparent 14%), rgba(0,0,0,0.18)' }} />
        <Box
          sx={{
            position: 'absolute',
            inset: '14px 0 14px 14px',
            backgroundImage: `url(${JOURNAL_ASSETS.paper})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
            backgroundColor: '#f4e8cf',
            boxShadow: 'inset 0 0 40px rgba(60,40,20,0.18), inset -12px 0 16px -10px rgba(60,40,20,0.3)',
          }}
        >
          <Typography
            sx={{
              position: 'absolute',
              left: 36,
              top: 38,
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.6,
              color: '#5a4a2e',
              maxWidth: 300,
            }}
          >
            If found, this belongs to
            <br />
            <Box component="span" sx={{ fontFamily: fonts.brand, fontStyle: 'normal', fontSize: 15, letterSpacing: '0.1em', color: '#2a2010' }}>
              {ownerName}
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function JournalBook({
  open,
  landed,
  onOpen,
  spread,
  flip,
  ownerName,
  traitLabels,
  left,
  right,
  sheetFront,
  sheetBack,
  leftKey,
  rightKey,
  notes,
  notesOpen,
  onToggleNotes,
  onUseNote,
  notesTraitLabel,
  onBookmark,
  reducedMotion,
}) {
  const colRef = useRef(null);
  const [{ scale, avail }, setFit] = useState({ scale: 1, avail: DESIGN_W });

  useLayoutEffect(() => {
    const el = colRef.current;
    if (!el) return undefined;
    const measure = () => {
      const cs = getComputedStyle(el);
      const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      // 24px of slack under the book so the closed-state hint has somewhere
      // to sit without the spread ever losing height to it.
      const h = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 24;
      if (w <= 0 || h <= 0) return;
      const next = Math.max(0.35, Math.min(1, w / DESIGN_W, h / DESIGN_H));
      setFit((prev) =>
        Math.abs(next - prev.scale) > 0.004 || Math.abs(w - prev.avail) > 1
          ? { scale: next, avail: w }
          : prev
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const forward = flip?.dir === 'fwd';
  const openDelay = open ? '620ms' : '0ms';
  const openOpacity = open ? 1 : 0;

  // The pad hangs off the fore-edge, past the right cover. Whatever of it does
  // not fit in the column, the book slides over to make room for — the left
  // leaf is blank and already sits behind the guide, so it is the half that
  // can afford to go.
  const notesShift = notesOpen
    ? Math.max(0, (NOTES_W + 16) * scale - Math.max(0, (avail - DESIGN_W * scale) / 2))
    : 0;

  return (
    <Box
      ref={colRef}
      sx={{
        position: 'absolute',
        inset: 0,
        p: '16px 24px 14px clamp(90px, 8vw, 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: 'none',
          transform: `translateX(${-notesShift}px)`,
          transition: reducedMotion ? 'none' : 'transform 520ms cubic-bezier(0.2,0.8,0.2,1)',
        }}
      >
      <Box
        sx={{
          position: 'relative',
          flex: 'none',
          width: DESIGN_W,
          height: DESIGN_H,
          perspective: '2600px',
          perspectiveOrigin: '50% 45%',
          transform: `translateX(${open ? 0 : -285 * scale}px) scale(${scale})`,
          transition: reducedMotion ? 'none' : 'transform 1200ms cubic-bezier(0.5,0,0.2,1)',
        }}
      >
        {/* ---------- right half: back cover, page block, right leaf ---------- */}
        <Box
          sx={{
            position: 'absolute',
            left: 570,
            top: 0,
            width: 570,
            height: '100%',
            borderRadius: '0 10px 10px 0',
            ...LEATHER,
            boxShadow: '0 34px 70px rgba(15,28,46,0.38), 0 8px 18px rgba(15,28,46,0.22)',
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.35), transparent 12%), radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.25), transparent 60%)',
            }}
          />
          <Box sx={{ position: 'absolute', right: 6, top: 11, bottom: 11, width: 6, background: BLOCK_H, borderRadius: '0 2px 2px 0', boxShadow: '1px 0 2px rgba(0,0,0,0.35)' }} />
          <Box sx={{ position: 'absolute', left: 0, right: 12, bottom: 6, height: 6, background: BLOCK_V, boxShadow: '0 1px 2px rgba(0,0,0,0.35)' }} />

          <Box
            key={rightKey}
            sx={{
              position: 'absolute',
              left: 0,
              top: 12,
              bottom: 12,
              width: 560,
              overflow: 'hidden',
              boxShadow: '-1px 0 0 rgba(0,0,0,0.18), 1px 0 0 rgba(255,255,255,0.4)',
              animation: reducedMotion ? 'none' : 'fjSettle 420ms cubic-bezier(0.2,0.8,0.2,1) both',
            }}
          >
            <JournalPage {...right} side="right" />
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(40,25,10,0.28), rgba(40,25,10,0.06) 14px, transparent 42px)' }} />
            {flip && forward && !reducedMotion && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(15,28,46,0.42), transparent 60%)', animation: `fjShade ${TURN_MS}ms ease both` }} />
            )}
          </Box>

          {/* bookmarks */}
          <Box sx={{ position: 'absolute', left: 0, top: 0, width: 560, height: 0, opacity: openOpacity, transition: `opacity 400ms ease ${openDelay}` }}>
            {traitLabels.map((label, i) => {
              const active = i === spread;
              return (
                <Box
                  key={label}
                  component="button"
                  type="button"
                  onClick={() => onBookmark(i)}
                  title={label}
                  aria-label={label}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    position: 'absolute',
                    top: 0,
                    right: [104, 74, 44][i],
                    width: active ? 19 : 17,
                    height: active ? 62 : 20,
                    background: BOOKMARK_GRADIENTS[i],
                    clipPath: active ? 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)' : 'none',
                    boxShadow: active ? '0 6px 12px rgba(15,28,46,0.32)' : 'inset 0 -3px 4px rgba(15,28,46,0.25)',
                    zIndex: active ? 9 : 7,
                    transition: reducedMotion ? 'none' : 'height 500ms cubic-bezier(0.2,0.8,0.2,1), width 300ms ease',
                    '&:focus-visible': { outline: '2px solid #e07a3f', outlineOffset: 2 },
                  }}
                />
              );
            })}
          </Box>

          {/* sticky-note tab */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 560,
              height: '100%',
              pointerEvents: 'none',
              opacity: open && spread < 3 ? 1 : 0,
              transition: `opacity 400ms ease ${open && spread < 3 ? '620ms' : '0ms'}`,
            }}
          >
            <NoteTab count={notes.length} onClick={onToggleNotes} />
          </Box>
        </Box>

        {/* ---------- notes pad ---------- */}
        <NotesPad open={notesOpen} notes={notes} traitLabel={notesTraitLabel} onToggle={onToggleNotes} onUse={onUseNote} />

        {/* ---------- left half ---------- */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 570,
            height: '100%',
            borderRadius: '10px 0 0 10px',
            ...LEATHER,
            boxShadow: '0 34px 70px rgba(15,28,46,0.38), 0 8px 18px rgba(15,28,46,0.22)',
            opacity: openOpacity,
            transition: reducedMotion ? 'none' : `opacity 420ms ease ${openDelay}`,
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: 'linear-gradient(270deg, rgba(0,0,0,0.35), transparent 12%), radial-gradient(ellipse at 0% 100%, rgba(0,0,0,0.25), transparent 60%)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: 6,
              top: 11,
              bottom: 11,
              width: 2 + spread * 2,
              background: BLOCK_H,
              borderRadius: '2px 0 0 2px',
              boxShadow: '-1px 0 2px rgba(0,0,0,0.35)',
              transition: reducedMotion ? 'none' : 'width 600ms ease',
            }}
          />
          <Box sx={{ position: 'absolute', left: 12, right: 0, bottom: 6, height: 6, background: BLOCK_V, boxShadow: '0 1px 2px rgba(0,0,0,0.35)' }} />
          <Box
            key={leftKey}
            sx={{
              position: 'absolute',
              right: 0,
              top: 12,
              bottom: 12,
              width: 560,
              overflow: 'hidden',
              boxShadow: '1px 0 0 rgba(0,0,0,0.18)',
              animation: reducedMotion ? 'none' : 'fjSettle 420ms cubic-bezier(0.2,0.8,0.2,1) both',
            }}
          >
            <JournalPage {...left} side="left" />
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(270deg, rgba(40,25,10,0.26), rgba(40,25,10,0.05) 14px, transparent 44px)' }} />
            {flip && !forward && !reducedMotion && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(270deg, rgba(15,28,46,0.38), transparent 62%)', animation: `fjShade ${TURN_MS}ms ease both` }} />
            )}
          </Box>
        </Box>

        {/* spine crease */}
        <Box
          sx={{
            position: 'absolute',
            left: 566,
            top: 0,
            width: 8,
            height: '100%',
            background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.45) 50%, rgba(0,0,0,0))',
            opacity: openOpacity,
            transition: `opacity 400ms ease ${openDelay}`,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />

        {/* turning sheet */}
        {flip && !reducedMotion && (
          <Box
            sx={{
              position: 'absolute',
              left: 570,
              top: 12,
              bottom: 12,
              width: 560,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              zIndex: 12,
              pointerEvents: 'none',
              animation: `${forward ? 'fjFlipFwd' : 'fjFlipBack'} ${TURN_MS}ms cubic-bezier(0.45,0.02,0.2,1) both`,
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden', boxShadow: '-24px 0 48px rgba(15,28,46,0.35)' }}>
              <JournalPage {...sheetFront} side="right" ghost />
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(40,25,10,0.28), rgba(40,25,10,0.06) 14px, transparent 42px)' }} />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                overflow: 'hidden',
                boxShadow: '24px 0 48px rgba(15,28,46,0.3)',
              }}
            >
              <JournalPage {...sheetBack} side="left" ghost />
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(270deg, rgba(40,25,10,0.26), rgba(40,25,10,0.05) 14px, transparent 44px)' }} />
            </Box>
          </Box>
        )}

        {/* front cover */}
        <Cover ownerName={ownerName} open={open} landed={landed} onOpen={onOpen} reducedMotion={reducedMotion} />

        {/* ribbon tails poking out of the closed book */}
        <Box
          sx={{
            position: 'absolute',
            left: 570,
            top: 0,
            width: 570,
            height: 0,
            pointerEvents: 'none',
            opacity: open ? 0 : 1,
            transition: 'opacity 500ms ease',
            zIndex: 31,
          }}
        >
          {[104, 74, 44].map((r, i) => (
            <Box
              key={r}
              sx={{
                position: 'absolute',
                right: r,
                top: -14,
                width: 17,
                height: 22,
                background: BOOKMARK_GRADIENTS[i],
                borderRadius: '2px 2px 0 0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
              }}
            />
          ))}
        </Box>

        {!open && (
          <Typography
            sx={{
              position: 'absolute',
              left: 570,
              width: 570,
              top: 'calc(100% + 10px)',
              textAlign: 'center',
              fontFamily: fonts.mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: PAPER.sepia,
              animation: reducedMotion ? 'none' : 'fjHint 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          >
            Tap the cover to open
          </Typography>
        )}
      </Box>
      </Box>
    </Box>
  );
}
