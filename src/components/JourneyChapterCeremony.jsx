import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, Typography } from '@mui/material';
import JourneyPorthole from './JourneyPorthole';
import { COMPASS_TRAIL } from '../pages/Dashboard/journey/trail-data.js';
import {
  JOURNEY_ROMAN,
  JOURNEY_STATIONS,
} from '../pages/Dashboard/journey/journeyModel.js';
import { buttons, colors, fonts, radii } from '../styles/tokens';

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

/**
 * Two-beat chapter handoff that stays on one card:
 * 1) Complete — celebrate the finished station
 * 2) Walk — porthole pans along the trail with the pulse fixed at center
 * 3) Begin — same card swaps to the next chapter + "Let's get started"
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

  const fromStation = JOURNEY_STATIONS[fromIndex] || JOURNEY_STATIONS[0];
  const toStation = JOURNEY_STATIONS[toIndex] || JOURNEY_STATIONS[Math.min(fromIndex + 1, JOURNEY_STATIONS.length - 1)];
  const from = {
    ...fromStation,
    label: copy?.fromLabel || fromStation.label,
    completeBlurb: copy?.completeBlurb || fromStation.completeBlurb,
  };
  const to = {
    ...toStation,
    label: copy?.toLabel || toStation.label,
    blurb: copy?.blurb || toStation.blurb,
    arriveHint: copy?.arriveHint || toStation.arriveHint,
  };
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
    setFocus({ x: from.x, y: from.y });
    return clearAsync;
  }, [clearAsync, open, from.x, from.y, fromIndex]);

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
      setFocus({ x: to.x, y: to.y });
      setPhase('begin');
      return;
    }
    const total = path.getTotalLength();
    if (!total) {
      setFocus({ x: to.x, y: to.y });
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
        setFocus({ x: to.x, y: to.y });
        after(280, () => setPhase('begin'));
      }
    };
    frame.current = window.requestAnimationFrame(tick);
  };

  const continueFromComplete = () => {
    if (phase !== 'complete') return;
    if (shouldSkipWalk || reducedMotion) {
      setFocus({ x: to.x, y: to.y });
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
  const portholeIndex = isCompleteBeat ? fromIndex : toIndex;
  const eyebrow = isCompleteBeat ? (
    <>
      Chapter {JOURNEY_ROMAN[fromIndex]}
      {' · '}
      <Box component="span" sx={{ color: colors.green, fontWeight: 800, fontSize: '1.15em' }}>
        Complete ✓
      </Box>
    </>
  ) : (
    <>Chapter {JOURNEY_ROMAN[Math.min(toIndex, 6)]} of VII · {to.label}</>
  );
  const title = isCompleteBeat ? from.label : to.label;
  const body = isCompleteBeat
    ? (from.completeBlurb || `You just completed ${from.label}. Here’s what you accomplished on this stretch of the trail.`)
    : (to.blurb || to.subtitle);
  const button = isCompleteBeat
    ? (phase === 'walk' ? 'On the trail…' : `Continue to ${to.label}`)
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

      <CeremonyCard
        index={portholeIndex}
        focus={focus}
        walking={phase === 'walk'}
        eyebrow={eyebrow}
        title={title}
        body={body}
        nextHint={isCompleteBeat ? (to.arriveHint || to.subtitle || to.blurb) : null}
        button={button}
        buttonDisabled={buttonDisabled}
        onClick={onButton}
      />
    </Box>,
    document.body,
  );
}

function CeremonyCard({
  index,
  focus,
  walking,
  eyebrow,
  title,
  body,
  nextHint,
  button,
  buttonDisabled,
  onClick,
}) {
  return (
    <Box
      onClick={(event) => event.stopPropagation()}
      sx={{
        width: 'min(600px, calc(100vw - 32px))',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '218px 1fr' },
        gap: { xs: 2.4, sm: 3 },
        alignItems: 'center',
        bgcolor: colors.sand50,
        border: '1px solid var(--sand-200)',
        borderRadius: radii.xl,
        boxShadow: '0 40px 90px rgba(9,16,31,0.4)',
        p: { xs: 2.4, sm: 3 },
      }}
    >
      <JourneyPorthole
        chapterIndex={index}
        variant="ceremony"
        focusX={focus?.x}
        focusY={focus?.y}
        instant={walking}
      />
      <Box>
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
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
            fontSize: { xs: 28, sm: 32 },
            fontWeight: 600,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            color: colors.ink,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 15.5,
            fontWeight: 500,
            lineHeight: 1.45,
            color: colors.inkSoft,
            mb: nextHint ? 1.2 : 2.4,
          }}
        >
          {body}
        </Typography>
        {nextHint && (
          <Typography
            sx={{
              fontFamily: fonts.sans,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.45,
              color: colors.inkSoft,
              mb: 2.4,
            }}
          >
            Next: {nextHint}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={onClick}
          disabled={buttonDisabled}
          sx={{
            ...buttons.primary,
            opacity: buttonDisabled ? 0.72 : 1,
          }}
        >
          {button}
        </Button>
      </Box>
    </Box>
  );
}
