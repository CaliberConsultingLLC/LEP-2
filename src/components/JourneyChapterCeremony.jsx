import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, Typography } from '@mui/material';
import JourneyPorthole from './JourneyPorthole';
import { useGuide } from '../context/GuideContext';
import {
  getGuideChapterLine,
  resolveCeremonyStationKey,
} from '../data/guideChapterLines';
import {
  DEFAULT_GUIDE_ID,
  SELECTABLE_GUIDE_PERSONAS,
  getPersona,
} from '../data/guidePersonas';
import { guideImage } from '../data/guideArt';
import { COMPASS_TRAIL } from '../pages/Dashboard/journey/trail-data.js';
import {
  JOURNEY_ROMAN,
  JOURNEY_STATIONS,
  chapterText,
} from '../pages/Dashboard/journey/journeyModel.js';
import { buttons, colors, fonts, radii, radiiPx } from '../styles/tokens';

const CARD_W = 620;
const CARD_H = 320;
const PANEL_W = 250;
const PORTHOLE = 236;
const MOBILE_PANEL_H = 180;
const MOBILE_MAX = 639;
const PANEL_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

function segmentPathD(points, k = 0.85) {
  if (!points.length) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    d += ` C ${(p1[0] + ((p2[0] - p0[0]) / 6) * k).toFixed(1)} ${(p1[1] + ((p2[1] - p0[1]) / 6) * k).toFixed(1)}, ${(p2[0] - ((p3[0] - p1[0]) / 6) * k).toFixed(1)} ${(p2[1] - ((p3[1] - p1[1]) / 6) * k).toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function readStoredGuideId() {
  if (typeof window === 'undefined') return '';
  try {
    const id = String(window.localStorage.getItem('selectedGuideId') || '').trim();
    if (SELECTABLE_GUIDE_PERSONAS.some((p) => p.id === id)) return id;
  } catch {
    /* ignore */
  }
  return '';
}

function resolveActiveGuideId(personaId) {
  if (SELECTABLE_GUIDE_PERSONAS.some((p) => p.id === personaId)) return personaId;
  return readStoredGuideId() || DEFAULT_GUIDE_ID;
}

/**
 * Two-beat chapter handoff that stays on one card:
 * 1) Complete — map, chapter line, title, button
 * 2) Walk — porthole pans along the trail with the pulse fixed at center
 * 3) Begin — the cream card slides left as a guide panel opens on the right
 *    so the combined shape stays centered
 */
export default function JourneyChapterCeremony({
  open,
  fromIndex,
  toIndex,
  onDone,
  copy = null,
  skipWalk = false,
}) {
  const [phase, setPhase] = useState('complete');
  const [focus, setFocus] = useState(null);
  const pathRef = useRef(null);
  const timers = useRef([]);
  const frame = useRef(null);
  const openedAtRef = useRef(0);
  const reducedMotion = useMemo(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ), []);
  const { personaId } = useGuide();
  const guideId = resolveActiveGuideId(personaId);
  const guide = getPersona(guideId);

  const fromStation = JOURNEY_STATIONS[fromIndex] || JOURNEY_STATIONS[0];
  const toStation = JOURNEY_STATIONS[toIndex] || JOURNEY_STATIONS[Math.min(fromIndex + 1, JOURNEY_STATIONS.length - 1)];
  const fromLabel = copy?.fromLabel || fromStation.label;
  const toLabel = copy?.toLabel || toStation.label;
  const arriveStationKey = resolveCeremonyStationKey({
    stationKey: copy?.toStationKey,
    chapterId: copy?.toChapterId,
    index: toIndex,
  });
  const guideLine = getGuideChapterLine(arriveStationKey, guideId);
  const shouldSkipWalk = Boolean(skipWalk || fromIndex === toIndex);
  const segmentPoints = useMemo(() => {
    const start = COMPASS_TRAIL.STATION_POINT_INDICES[fromIndex] || 0;
    const end = COMPASS_TRAIL.STATION_POINT_INDICES[toIndex] || start;
    return COMPASS_TRAIL.POINTS.slice(Math.min(start, end), Math.max(start, end) + 1);
  }, [fromIndex, toIndex]);
  const pathD = useMemo(() => segmentPathD(segmentPoints), [segmentPoints]);

  const clearAsync = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (frame.current) window.cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const skip = useCallback(() => {
    clearAsync();
    setPhase('idle');
    onDone?.();
  }, [clearAsync, onDone]);

  // Desktop nav clicks (mousedown on link → navigation → mouseup/click on the
  // newly mounted backdrop) were instantly dismissing the popup. Guard that.
  const dismissFromBackdrop = useCallback(() => {
    if (Date.now() - openedAtRef.current < 600) return;
    skip();
  }, [skip]);

  useEffect(() => {
    if (!open) return undefined;
    openedAtRef.current = Date.now();
    setPhase('complete');
    setFocus({ x: fromStation.x, y: fromStation.y });
    return clearAsync;
  }, [clearAsync, open, fromStation.x, fromStation.y, fromIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, skip]);

  const after = (ms, fn) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const playWalk = () => {
    const path = pathRef.current;
    if (!path) {
      setFocus({ x: toStation.x, y: toStation.y });
      setPhase('begin');
      return;
    }
    const total = path.getTotalLength();
    if (!total) {
      setFocus({ x: toStation.x, y: toStation.y });
      setPhase('begin');
      return;
    }
    const started = performance.now();
    const duration = Math.min(4200, Math.max(2200, total * 4.2));

    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - started) / duration));
      const len = total * easeInOutCubic(t);
      const p = path.getPointAtLength(len);
      setFocus({
        x: p.x / COMPASS_TRAIL.W,
        y: p.y / COMPASS_TRAIL.H,
      });
      if (t < 1) {
        frame.current = window.requestAnimationFrame(tick);
      } else {
        setFocus({ x: toStation.x, y: toStation.y });
        after(280, () => setPhase('begin'));
      }
    };
    frame.current = window.requestAnimationFrame(tick);
  };

  const continueFromComplete = () => {
    if (phase !== 'complete') return;
    if (shouldSkipWalk || reducedMotion) {
      setFocus({ x: toStation.x, y: toStation.y });
      setPhase('begin');
      return;
    }
    setPhase('walk');
    // Let the hidden SVG path mount, then animate.
    after(40, playWalk);
  };

  const begin = () => {
    clearAsync();
    setPhase('idle');
    onDone?.();
  };

  if (!open || phase === 'idle' || typeof document === 'undefined') return null;

  const isCompleteBeat = phase === 'complete' || phase === 'walk';
  const panelOpen = phase === 'begin';
  const portholeIndex = isCompleteBeat ? fromIndex : toIndex;
  const eyebrow = isCompleteBeat ? (
    <>
      Chapter {JOURNEY_ROMAN[fromIndex]}
      {' · '}
      <Box component="span" sx={{ color: colors.green, fontWeight: 800 }}>
        Complete ✓
      </Box>
    </>
  ) : (
    chapterText(toIndex)
  );
  const title = isCompleteBeat ? fromLabel : toLabel;
  const button = isCompleteBeat
    ? (phase === 'walk' ? 'On the trail…' : "I'm Finished")
    : "Let's get started";
  const buttonDisabled = phase === 'walk';
  const onButton = isCompleteBeat
    ? (event) => { event.stopPropagation(); continueFromComplete(); }
    : (event) => { event.stopPropagation(); begin(); };

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Chapter transition ceremony"
      onClick={dismissFromBackdrop}
      onMouseUp={(event) => {
        // Swallow the trailing mouseup from the click that opened this dialog.
        if (Date.now() - openedAtRef.current < 600) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(9,16,31,0.5)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      {/* Hidden path used only for getPointAtLength during the walk beat */}
      <svg width={0} height={0} style={{ position: 'absolute', overflow: 'hidden' }} aria-hidden>
        <path ref={pathRef} d={pathD} fill="none" stroke="none" />
      </svg>

      <Box
        // Center with left/top 50% + translate(-50%) so a 620→870 width
        // transition moves both edges. The cream card rides left as the owl
        // panel opens, and the combined shape stays in the middle.
        data-ceremony-shell=""
        data-phase={phase}
        onClick={(event) => event.stopPropagation()}
        sx={{
          display: 'flex',
          overflow: 'hidden',
          borderRadius: radii.xl,
          boxShadow: '0 40px 90px rgba(9,16,31,0.4)',
          boxSizing: 'border-box',
          width: 'min(100%, 620px)',
          flexDirection: 'column',
          [`@media (min-width: ${MOBILE_MAX + 1}px)`]: {
            position: 'absolute',
            left: '50vw',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            flexDirection: 'row',
            flexShrink: 0,
            height: CARD_H,
            width: panelOpen ? CARD_W + PANEL_W : CARD_W,
            transition: reducedMotion
              ? 'none'
              : `width 660ms ${PANEL_EASE}`,
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        }}
      >
        <CeremonyCard
          index={portholeIndex}
          focus={focus}
          walking={phase === 'walk'}
          arrived={panelOpen}
          reducedMotion={reducedMotion}
          eyebrow={eyebrow}
          title={title}
          guideLine={panelOpen ? guideLine : null}
          button={button}
          buttonDisabled={buttonDisabled}
          onClick={onButton}
        />
        <GuidePanel
          open={panelOpen}
          reducedMotion={reducedMotion}
          guideId={guideId}
          guideName={guide?.name || 'Mentor'}
        />
      </Box>
    </Box>,
    document.body,
  );
}

function CeremonyCard({
  index,
  focus,
  walking,
  arrived,
  reducedMotion,
  eyebrow,
  title,
  guideLine,
  button,
  buttonDisabled,
  onClick,
}) {
  return (
    <Box
      sx={{
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: `${PORTHOLE}px 1fr`,
        gap: '40px',
        alignItems: 'center',
        bgcolor: colors.sand50,
        border: '1px solid var(--sand-200)',
        borderRadius: arrived
          ? `${radiiPx.xl}px 0 0 ${radiiPx.xl}px`
          : radii.xl,
        p: '26px 30px 26px 26px',
        [`@media (max-width: ${MOBILE_MAX}px)`]: {
          width: '100%',
          height: 'auto',
          minHeight: CARD_H,
          gridTemplateColumns: '1fr',
          justifyItems: 'center',
          textAlign: 'center',
          gap: '24px',
          p: '24px 22px',
          borderRadius: arrived
            ? `${radiiPx.xl}px ${radiiPx.xl}px 0 0`
            : radii.xl,
        },
      }}
    >
      <JourneyPorthole
        chapterIndex={index}
        variant="ceremony"
        focusX={focus?.x}
        focusY={focus?.y}
        instant={walking}
      />
      <Box
        sx={{
          minWidth: 0,
          width: '100%',
          [`@media (max-width: ${MOBILE_MAX}px)`]: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
        }}
      >
        <Box
          key={arrived ? 'arrive' : 'complete'}
          sx={{
            ...(arrived && !reducedMotion ? {
              animation: 'ceremonyArriveText 520ms ease 280ms both',
              '@keyframes ceremonyArriveText': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            } : {}),
          }}
        >
          <Typography
            sx={{
              fontFamily: fonts.mono,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: colors.orangeDeep,
              mb: 1,
              lineHeight: 1.35,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontSize: 31,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: colors.ink,
              mb: guideLine ? 1.2 : 2,
            }}
          >
            {title}
          </Typography>
          {guideLine ? (
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontSize: 15.5,
                fontWeight: 500,
                lineHeight: 1.45,
                color: colors.inkSoft,
                maxWidth: 300,
                mb: 2.2,
              }}
            >
              {guideLine}
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="contained"
          onClick={onClick}
          disabled={buttonDisabled}
          sx={{
            ...buttons.primary,
            opacity: buttonDisabled ? 0.6 : 1,
            '&.Mui-disabled': {
              opacity: 0.6,
              color: colors.amberSoft,
              bgcolor: colors.navy900,
            },
          }}
        >
          {button}
        </Button>
      </Box>
    </Box>
  );
}

function GuidePanel({ open, reducedMotion, guideId, guideName }) {
  const portraitSrc = guideImage(guideId, 'idle');
  return (
    <Box
      aria-hidden={!open}
      sx={{
        position: 'relative',
        minWidth: 0,
        flexShrink: 0,
        overflow: 'hidden',
        height: CARD_H,
        width: open ? PANEL_W : 0,
        opacity: open ? 1 : 0,
        bgcolor: colors.navy900,
        transition: reducedMotion
          ? 'none'
          : `width 660ms ${PANEL_EASE}, opacity 380ms ${PANEL_EASE} 140ms`,
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        [`@media (max-width: ${MOBILE_MAX}px)`]: {
          width: '100%',
          height: open ? MOBILE_PANEL_H : 0,
          transition: reducedMotion
            ? 'none'
            : `height 660ms ${PANEL_EASE}, opacity 380ms ${PANEL_EASE} 140ms`,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: PANEL_W,
          height: '100%',
          overflow: 'hidden',
          bgcolor: colors.navy900,
          boxShadow: 'inset 18px 0 34px -18px rgba(4,9,26,0.8)',
          [`@media (max-width: ${MOBILE_MAX}px)`]: {
            width: '100%',
          },
        }}
      >
        <Box
          component="img"
          src={portraitSrc}
          alt=""
          sx={{
            position: 'absolute',
            left: '50%',
            top: '-6%',
            transform: 'translateX(-50%)',
            width: '240%',
            maxWidth: 'none',
            height: 'auto',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(16,34,60,0) 48%, rgba(16,34,60,0.6) 78%, rgba(9,16,31,0.96) 100%)',
            pointerEvents: 'none',
          }}
        />
        <Typography
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '16px',
            zIndex: 1,
            textAlign: 'center',
            fontFamily: fonts.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.amberSoft,
          }}
        >
          — {guideName}
        </Typography>
      </Box>
    </Box>
  );
}
