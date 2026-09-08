/* Journey map modal — design 5A, "Folio + Sky Page".

   A two-page folio: a narrow index of all nine chapters on the left, the
   illustrated map on the right with the walked stretch of trail inked over the
   printed dashes, and free-standing sky text in the empty upper-left of the art
   describing the selected chapter and what was actually done there.

   The nine points are CHAPTERS. Never "stops", never "steps".

   Deviation from the type scale in DESIGN.md is deliberate here: 5A is an
   approved pixel spec for a printed-looking artefact, and its sizes (38 / 15 /
   14.5 / 14 / 13.5 / 13 / 10.5 / 9 / 8.5px) are final. Colours still come from
   tokens — the `journey*` group is the fixed print palette that does not remap
   in dark mode, because the artwork underneath it never does either. */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Modal, Typography, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  JOURNEY_BASE_SRC,
  JOURNEY_CHAPTER_COUNT,
  JOURNEY_ROMAN,
  JOURNEY_STATIONS,
  JOURNEY_SUMMARY,
  clampToReachable,
  getJourneyCompletion,
} from '../pages/Dashboard/journey/journeyModel.js';
import {
  getJourneyBegunAt,
  getJourneyChapterItems,
  longDate,
} from '../pages/Dashboard/journey/journeyRecords.js';
import { TRAIL_D, TRAIL_FRAC, TRAIL_LEN } from '../pages/Dashboard/journey/trail-data.js';
import { colors, fonts, radii } from '../styles/tokens';

/* Folio geometry, in the design's own pixels. */
const CARD_PAD = 12;
const INDEX_W = 344;
const MAP_W = 990;
const PAGE_H = 660;
const CARD_W = INDEX_W + MAP_W + CARD_PAD * 2; // 1358
const CARD_H = PAGE_H + CARD_PAD * 2; // 684
const VIEWPORT_MARGIN = 48;
const MIN_FOLIO_SCALE = 0.2;

/** Alpha variants of the print palette, without reaching for a hex literal. */
const alpha = (token, pct) => `color-mix(in srgb, ${token} ${pct}%, transparent)`;

const TRAIL_ANIMATION = 'stroke-dashoffset 1500ms cubic-bezier(0.33,1,0.68,1)';
const FOCUS_RING = {
  outline: `3px solid ${alpha(colors.orange, 55)}`,
  outlineOffset: 3,
};

/* Native button chrome loses to `all: unset` everywhere except Windows. */
const bareButton = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  border: 0,
  margin: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  '&::-moz-focus-inner': { border: 0, padding: 0 },
};

const clampChapter = (n) => Math.min(JOURNEY_CHAPTER_COUNT, Math.max(1, n));

/**
 * The chapter the leader is standing in, 1..9 — the first one not yet finished,
 * held back to what the product can actually open. Finishing the action plan
 * does not walk them onto the check-in; there is nothing there to take yet, and
 * "You are here" over an empty chapter reads as an invitation to start it.
 */
function furthestChapter(completion, fallbackIndex) {
  const list = Array.isArray(completion) ? completion : null;
  if (!list || !list.length) return clampChapter(clampToReachable(fallbackIndex) + 1);
  const firstOpen = list.findIndex((done) => !done);
  return clampChapter(clampToReachable(firstOpen === -1 ? list.length - 1 : firstOpen) + 1);
}

/** Earliest thing recorded in a chapter — when the leader walked it. */
const chapterDate = (items) => items.map((item) => item.date).find(Boolean) || '';

/**
 * The folio is a fixed 1358×684 sheet. Rather than eyeball a height that
 * happens to fit, measure the window and scale the whole sheet down to it, so
 * it never scrolls at any viewport.
 */
function useFolioFit(open) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!open) return undefined;
    // The floor matters: a viewport shorter than the margin would otherwise
    // produce a negative scale, which mirrors the sheet instead of shrinking it.
    const fit = () => setScale(Math.max(MIN_FOLIO_SCALE, Math.min(
      1,
      (window.innerWidth - VIEWPORT_MARGIN) / CARD_W,
      (window.innerHeight - VIEWPORT_MARGIN) / CARD_H,
    )));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);
  return scale;
}

export default function JourneyMapModal({
  open,
  currentIndex = 0,
  firstName = '',
  onClose,
  completion: completionProp,
}) {
  const navigate = useNavigate();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const scale = useFolioFit(open);

  const completion = completionProp || getJourneyCompletion();
  const current = furthestChapter(completion, currentIndex);
  const [selected, setSelected] = useState(current);

  // Records are re-read each time the folio opens; they change while it is shut.
  const records = useMemo(() => (open ? getJourneyChapterItems() : []), [open]);
  const begunAt = useMemo(() => (open ? getJourneyBegunAt() : ''), [open]);

  /* The trail is drawn to the current chapter, and animates only when the
     leader actually advances one while the folio is open.

     Rather than toggle the transition off for the first paint — which lands the
     new offset a frame before the transition exists, and so jumps — the strokes
     are remounted on every open. A freshly mounted element has no previous
     value to transition from, so opening always renders the finished line at
     rest; a `current` that moves afterwards animates on the live element. */
  const [openToken, setOpenToken] = useState(0);
  useEffect(() => {
    if (open) setOpenToken((token) => token + 1);
  }, [open]);

  useEffect(() => {
    if (open) setSelected(current);
  }, [open, current]);

  const chapters = useMemo(() => JOURNEY_STATIONS.map((station, index) => {
    const n = index + 1;
    const done = n < current;
    const here = n === current;
    const items = (records[index] || []).map((item) => {
      // Past chapters read as finished, future ones as open; at the chapter the
      // leader is standing in, each line tells its own truth.
      const itemDone = done || (here && Boolean(item.done));
      return {
        ...item,
        done: itemDone,
        date: itemDone ? item.date : '',
        revisit: itemDone ? item.revisit : undefined,
        subs: Array.isArray(item.subs) ? item.subs : [],
      };
    });
    return {
      ...station,
      n,
      numeral: JOURNEY_ROMAN[index],
      done,
      here,
      ahead: !done && !here,
      items,
      date: chapterDate(items),
    };
  }), [records, current]);

  const chapter = chapters[selected - 1] || chapters[0];
  const displayName = String(firstName || '').trim();
  const trailOffset = TRAIL_LEN * (1 - TRAIL_FRAC[current - 1]);

  const goRevisit = useCallback((route) => {
    onClose?.();
    navigate(route);
  }, [navigate, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="journey-folio-title"
      slotProps={{
        backdrop: {
          sx: { backgroundColor: alpha(colors.navy950, 62), backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `${INDEX_W}px ${MAP_W}px`,
            width: CARD_W,
            height: CARD_H,
            flex: 'none',
            boxSizing: 'border-box',
            p: `${CARD_PAD}px`,
            borderRadius: radii.xl,
            backgroundColor: colors.journeyPaper,
            boxShadow: `0 40px 90px ${alpha(colors.navy950, 40)}`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <IndexPage
            chapters={chapters}
            selected={selected}
            onSelect={setSelected}
            displayName={displayName}
            begunAt={begunAt}
            summary={JOURNEY_SUMMARY[current - 1]}
          />
          <MapPage
            chapters={chapters}
            chapter={chapter}
            selected={selected}
            onSelect={setSelected}
            trailOffset={trailOffset}
            trailKey={openToken}
            reducedMotion={reducedMotion}
            onRevisit={goRevisit}
            onClose={onClose}
          />
        </Box>
      </Box>
    </Modal>
  );
}

/* ==========================================================================
   Left page — the index. A tight list at the top of the sheet. Rows only move
   the selection; nothing here expands.
   ========================================================================== */

function IndexPage({ chapters, selected, onSelect, displayName, begunAt, summary }) {
  const begun = longDate(begunAt);
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        p: '26px 26px 22px 26px',
        borderRadius: `${radii.lg} 0 0 ${radii.lg}`,
        border: `1px solid ${colors.journeyEdge}`,
        borderRight: 0,
        overflow: 'hidden',
        // The shading is the fold of the folio, not a border.
        background: `linear-gradient(90deg, ${colors.journeyPaper} 0%, ${colors.journeyPaper} 88%, ${colors.journeyGutter} 100%)`,
      }}
    >
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.2em',
          lineHeight: 'normal',
          textTransform: 'uppercase',
          color: colors.orangeDeep,
          mb: '9px',
        }}
      >
        {begun ? `Sheet one · Begun ${begun}` : 'Sheet one'}
      </Typography>

      <Typography
        id="journey-folio-title"
        sx={{
          fontFamily: fonts.brand,
          fontVariant: 'small-caps',
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: colors.journeyNavy,
        }}
      >
        {displayName ? `${displayName}'s Journey` : 'Your Journey'}
      </Typography>

      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 13.5,
          lineHeight: 1.45,
          color: colors.journeyInkSoft,
          textWrap: 'pretty',
          mt: '10px',
        }}
      >
        {summary}
      </Typography>

      <Box sx={{ height: '1px', backgroundColor: colors.journeyGold, opacity: 0.7, m: '16px 0 6px' }} />

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {chapters.map((chapter) => (
          <IndexRow
            key={chapter.key}
            chapter={chapter}
            selected={selected === chapter.n}
            onSelect={() => onSelect(chapter.n)}
          />
        ))}
      </Box>
    </Box>
  );
}

function IndexRow({ chapter, selected, onSelect }) {
  const { done, here, numeral, label, date } = chapter;
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      aria-label={`Chapter ${chapter.n}, ${label} — ${statusWord(chapter)}`}
      sx={{
        ...bareButton,
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'left',
        p: '7px 6px',
        m: '0 -6px',
        borderRadius: '6px',
        borderBottom: `1px solid ${alpha(colors.journeyEdge, 80)}`,
        backgroundColor: selected ? alpha(colors.journeyMap, 90) : 'transparent',
        '&:focus-visible': FOCUS_RING,
      }}
    >
      <StatusGlyph done={done} here={here} />
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
        <Box
          component="span"
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            lineHeight: 'normal',
            width: 24,
            color: done ? colors.green : here ? colors.orange : colors.journeyTan,
          }}
        >
          {numeral}
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: fonts.serif,
            fontSize: 14.5,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 'normal',
            whiteSpace: 'nowrap',
            color: done || here ? colors.journeyInk : colors.journeyInkSoft,
          }}
        >
          {label}
        </Box>
      </Box>
      <Box
        component="span"
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          lineHeight: 'normal',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: done ? colors.green : colors.orange,
        }}
      >
        {done ? date : here ? 'Here' : ''}
      </Box>
    </Box>
  );
}

/** Index glyph: filled check when walked, ringed dot here, dashed circle ahead. */
function StatusGlyph({ done, here }) {
  if (done) {
    return (
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: radii.circle,
          backgroundColor: colors.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckMark size={10} strokeWidth={3.2} />
      </Box>
    );
  }
  if (here) {
    return (
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: radii.circle,
          backgroundColor: colors.orange,
          boxShadow: `0 0 0 3px ${alpha(colors.orange, 22)}`,
        }}
      />
    );
  }
  return (
    <Box
      sx={{
        width: 16,
        height: 16,
        boxSizing: 'border-box',
        borderRadius: radii.circle,
        border: `1.5px dashed ${colors.journeyTan}`,
      }}
    />
  );
}

function CheckMark({ size, strokeWidth }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </Box>
  );
}

/* ==========================================================================
   Right page — the map, the inked trail, the pins and the sky text.
   ========================================================================== */

function MapPage({
  chapters,
  chapter,
  selected,
  onSelect,
  trailOffset,
  trailKey,
  reducedMotion,
  onRevisit,
  onClose,
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: MAP_W,
        height: PAGE_H,
        borderRadius: `0 ${radii.lg} ${radii.lg} 0`,
        overflow: 'hidden',
        backgroundColor: colors.journeyMap,
        // The gutter throws a shadow onto the map page, as a bound sheet would.
        boxShadow: `-14px 0 24px -16px ${alpha(colors.journeyInk, 35)}`,
      }}
    >
      <Box
        component="img"
        src={JOURNEY_BASE_SRC}
        alt="Your development journey"
        draggable={false}
        sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none' }}
      />

      {/* Lightens the clouds just enough for the sky text to read over them. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 560,
          height: 380,
          zIndex: 2,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 28% 28%, ${alpha(colors.journeyPaper, 94)} 0%, ${alpha(colors.journeyPaper, 72)} 45%, ${alpha(colors.journeyPaper, 0)} 78%)`,
        }}
      />

      <Trail key={trailKey} offset={trailOffset} reducedMotion={reducedMotion} />

      {chapters.map((entry) => (
        <Pin
          key={entry.key}
          chapter={entry}
          selected={selected === entry.n}
          onSelect={() => onSelect(entry.n)}
        />
      ))}

      <SkyText chapter={chapter} onRevisit={onRevisit} />

      <Box
        component="button"
        type="button"
        onClick={onClose}
        aria-label="Close the journey map"
        sx={{
          ...bareButton,
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 9,
          width: 36,
          height: 36,
          borderRadius: radii.circle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.88)',
          border: `1px solid ${colors.journeyEdge}`,
          color: colors.journeyNavy,
          '&:focus-visible': FOCUS_RING,
        }}
      >
        <Box
          component="svg"
          width={17}
          height={17}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </Box>
      </Box>
    </Box>
  );
}

/** Two strokes of one path: an orange road with a cream centre line. */
function Trail({ offset, reducedMotion }) {
  const dash = {
    strokeDasharray: TRAIL_LEN,
    strokeDashoffset: offset,
    transition: reducedMotion ? 'none' : TRAIL_ANIMATION,
  };
  return (
    <Box
      component="svg"
      viewBox="0 0 1536 1024"
      preserveAspectRatio="none"
      aria-hidden="true"
      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
    >
      <path
        d={TRAIL_D}
        fill="none"
        stroke={colors.orange}
        strokeWidth={11.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={dash}
      />
      <path
        d={TRAIL_D}
        fill="none"
        stroke={colors.journeyPaper}
        strokeWidth={5.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={dash}
      />
    </Box>
  );
}

function Pin({ chapter, selected, onSelect }) {
  const { done, here, numeral, label, x, y } = chapter;
  const walked = done || here;
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      title={label}
      aria-current={selected ? 'true' : undefined}
      aria-label={`Chapter ${chapter.n}, ${label} — ${statusWord(chapter)}`}
      sx={{
        ...bareButton,
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 6,
        width: 28,
        height: 28,
        borderRadius: radii.circle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.mono,
        fontSize: 10,
        fontWeight: 700,
        backgroundColor: done ? colors.green : here ? colors.orange : alpha(colors.journeyPaper, 94),
        color: walked ? '#ffffff' : colors.journeyInkSoft,
        boxShadow: selected
          ? `0 0 0 4px ${alpha(colors.journeyPaper, 95)}, 0 0 0 7px ${colors.orange}`
          : walked
            ? `0 2px 8px ${alpha(colors.journeyInk, 26)}`
            : `inset 0 0 0 1.5px ${colors.journeyTan}, 0 2px 8px ${alpha(colors.journeyInk, 20)}`,
        '&:focus-visible': FOCUS_RING,
      }}
    >
      {numeral}
    </Box>
  );
}

/** How a chapter is described in the kicker and to a screen reader. */
function statusWord(chapter) {
  if (chapter.here) return 'You are here';
  if (chapter.done) return chapter.date ? `Walked ${chapter.date}` : 'Complete';
  return 'Still ahead';
}

/* Free-standing text in the empty sky. No box, no border, no leader line. */
function SkyText({ chapter, onRevisit }) {
  return (
    <Box sx={{ position: 'absolute', top: 40, left: 40, width: 380, zIndex: 7 }}>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.2em',
          lineHeight: 'normal',
          textTransform: 'uppercase',
          color: colors.orangeDeep,
        }}
      >
        {`Chapter ${chapter.n} · ${statusWord(chapter)}`}
      </Typography>

      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: '-0.025em',
          lineHeight: 1.02,
          color: colors.journeyInk,
          textWrap: 'balance',
          mt: '10px',
        }}
      >
        {chapter.label}
      </Typography>

      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 15,
          fontWeight: 500,
          lineHeight: 1.4,
          color: colors.journeyInkSoft,
          textWrap: 'pretty',
          mt: '8px',
        }}
      >
        {chapter.recap}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '9px', mt: '18px' }}>
        {chapter.items.map((item) => (
          <SkyItem key={item.text} item={item} onRevisit={onRevisit} />
        ))}
      </Box>
    </Box>
  );
}

function SkyItem({ item, onRevisit }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '18px 1fr', alignItems: 'start', gap: '10px' }}>
      {item.done ? (
        <Box
          sx={{
            width: 16,
            height: 16,
            mt: '2px',
            borderRadius: radii.circle,
            backgroundColor: colors.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckMark size={9} strokeWidth={3.4} />
        </Box>
      ) : (
        <Box
          sx={{
            width: 16,
            height: 16,
            mt: '2px',
            boxSizing: 'border-box',
            borderRadius: radii.circle,
            border: `1.5px solid ${colors.journeyTanLight}`,
          }}
        />
      )}

      <Box sx={{ minWidth: 0 }}>
        <Box
          component="span"
          sx={{
            fontFamily: fonts.serif,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.4,
            color: colors.journeyInk,
            textWrap: 'pretty',
          }}
        >
          {/* The date is bound to the last word so it never wraps on its own. */}
          {item.text}
          {' '}
          {item.date && (
            <Box
              component="span"
              sx={{
                fontFamily: fonts.mono,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                color: colors.green,
                m: '0 6px 0 2px',
              }}
            >
              {item.date}
            </Box>
          )}
          {item.revisit && (
            <Box
              component="button"
              type="button"
              onClick={() => onRevisit(item.revisit)}
              sx={{
                ...bareButton,
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
                height: 20,
                p: '0 9px',
                borderRadius: radii.pill,
                border: `1px solid ${colors.journeyTan}`,
                backgroundColor: 'rgba(255,255,255,0.8)',
                color: colors.journeyNavy,
                fontFamily: fonts.sans,
                fontSize: 10.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                '&:focus-visible': FOCUS_RING,
              }}
            >
              Revisit
            </Box>
          )}
        </Box>

        {item.subs.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', m: '5px 0 2px 12px' }}>
            {item.subs.map((sub) => (
              <Box
                key={sub}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: fonts.serif,
                  fontStyle: 'italic',
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 'normal',
                  color: colors.journeyInkSoft,
                }}
              >
                <Box sx={{ width: 4, height: 4, borderRadius: radii.circle, backgroundColor: colors.green }} />
                {sub}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
