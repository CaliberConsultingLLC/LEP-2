import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import JourneyPorthole from './JourneyPorthole';
import {
  COMPASS_TRAIL,
} from '../pages/Dashboard/journey/trail-data.js';
import {
  chapterText,
  JOURNEY_BASE_SRC,
  JOURNEY_ROMAN,
  JOURNEY_STATIONS,
} from '../pages/Dashboard/journey/journeyModel.js';
import { buttons, colors, fonts, radii } from '../styles/tokens';

const WALK_SCALE = 1;

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

export default function JourneyChapterCeremony({ open, fromIndex, toIndex, onDone }) {
  const [phase, setPhase] = useState('complete');
  const [visualIndex, setVisualIndex] = useState(fromIndex);
  const [traveler, setTraveler] = useState(null);
  const [footsteps, setFootsteps] = useState([]);
  const [arrived, setArrived] = useState(false);
  const [camera, setCamera] = useState({ transform: 'none', glide: false });
  const pathRef = useRef(null);
  const cameraRef = useRef(null);
  const timers = useRef([]);
  const frame = useRef(null);
  const reducedMotion = useMemo(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ), []);

  const from = JOURNEY_STATIONS[fromIndex] || JOURNEY_STATIONS[0];
  const to = JOURNEY_STATIONS[toIndex] || JOURNEY_STATIONS[Math.min(fromIndex + 1, JOURNEY_STATIONS.length - 1)];
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

  useEffect(() => {
    if (!open) return undefined;
    setPhase('complete');
    setVisualIndex(fromIndex);
    setTraveler(null);
    setFootsteps([]);
    setArrived(false);
    setCamera({ transform: 'none', glide: false });

    return clearAsync;
  }, [clearAsync, open, fromIndex]);

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

  const continueFromComplete = () => {
    if (phase !== 'complete') return;
    if (reducedMotion) {
      setPhase('begin');
      setVisualIndex(toIndex);
      return;
    }
    setPhase('walk');
    setCamera({ transform: 'none', glide: false });
    after(2150, playWalk);
  };

  const playWalk = () => {
    const path = pathRef.current;
    if (!path) {
      setPhase('begin');
      setVisualIndex(toIndex);
      return;
    }
    const total = path.getTotalLength();
    const started = performance.now() + 150;
    let lastStep = 0;
    setCamera({ transform: 'none', glide: false });

    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - started) / 3000));
      const len = total * easeInOutCubic(t);
      const p = path.getPointAtLength(len);
      setTraveler({ x: p.x, y: p.y });
      while (len - lastStep > 26) {
        lastStep += 26;
        const fp = path.getPointAtLength(lastStep);
        setFootsteps((steps) => [...steps, { x: fp.x, y: fp.y, id: `${fp.x}-${fp.y}-${steps.length}` }]);
      }
      if (t < 1) {
        frame.current = window.requestAnimationFrame(tick);
      } else {
        setTraveler(null);
        setVisualIndex(toIndex);
        setArrived(true);
        setCamera({ transform: 'none', glide: false });
        after(2700, () => setPhase('begin'));
      }
    };
    frame.current = window.requestAnimationFrame(tick);
  };

  const begin = () => {
    clearAsync();
    setPhase('idle');
    onDone?.();
  };

  if (!open || phase === 'idle') return null;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Chapter transition ceremony"
      onClick={skip}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(9,16,31,0.5)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      {phase === 'complete' && (
        <CeremonyCard
          index={fromIndex}
          eyebrow={<>Chapter {JOURNEY_ROMAN[fromIndex]} · <Box component="span" sx={{ color: colors.green }}>Complete ✓</Box></>}
          title={from.label}
          body={`Well walked — this ground is yours now. Ahead lies ${to.label}.`}
          button="Continue →"
          onClick={(event) => { event.stopPropagation(); continueFromComplete(); }}
        />
      )}

      {phase === 'walk' && (
        <MapWalk
          cameraRef={cameraRef}
          camera={camera}
          pathD={pathD}
          pathRef={pathRef}
          visualIndex={visualIndex}
          traveler={traveler}
          footsteps={footsteps}
          arrived={arrived}
        />
      )}

      {phase === 'begin' && (
        <CeremonyCard
          index={toIndex}
          eyebrow={chapterText(toIndex)}
          title={to.label}
          body={to.blurb}
          button={`Begin Chapter ${JOURNEY_ROMAN[toIndex]} →`}
          onClick={(event) => { event.stopPropagation(); begin(); }}
        />
      )}
    </Box>
  );
}

function CeremonyCard({ index, eyebrow, title, body, button, onClick }) {
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
      <JourneyPorthole chapterIndex={index} variant="ceremony" />
      <Box>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: colors.orangeDeep, mb: 1 }}>
          {eyebrow}
        </Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 500, lineHeight: 1.12, letterSpacing: '-0.02em', color: colors.ink, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15.5, fontWeight: 500, lineHeight: 1.45, color: colors.inkSoft, mb: 2.4 }}>
          {body}
        </Typography>
        <Button variant="contained" onClick={onClick} sx={buttons.primary}>
          {button}
        </Button>
      </Box>
    </Box>
  );
}

function MapWalk({ cameraRef, camera, pathD, pathRef, visualIndex, traveler, footsteps, arrived }) {
  return (
    <Box
      onClick={(event) => event.stopPropagation()}
      sx={{
        bgcolor: 'transparent',
        borderRadius: radii.lg,
        p: 0,
        boxShadow: '0 40px 90px rgba(9,16,31,0.4)',
      }}
    >
      <Box sx={{ position: 'relative', width: 'min(94vw, calc(94vh * 1.5))', aspectRatio: '3 / 2', overflow: 'hidden', borderRadius: radii.lg, bgcolor: colors.sand100 }}>
        <Box
          ref={cameraRef}
          sx={{
            position: 'absolute',
            inset: 0,
            transform: camera.transform,
            transformOrigin: 'center center',
            transition: camera.glide ? 'transform 1500ms cubic-bezier(0.3,0.7,0.2,1)' : 'none',
          }}
        >
          <Box component="img" src={JOURNEY_BASE_SRC} alt="" draggable={false} sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none' }} />
          <svg viewBox={`0 0 ${COMPASS_TRAIL.W} ${COMPASS_TRAIL.H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <path ref={pathRef} d={pathD} fill="none" stroke="none" />
            {footsteps.map((step) => <circle key={step.id} cx={step.x} cy={step.y} r="4.5" fill="var(--orange-deep)" />)}
            {traveler && <circle cx={traveler.x} cy={traveler.y} r="11" fill="var(--orange)" stroke="white" strokeWidth="3.5" />}
            {arrived && (
              <circle className="journey-arrival-ring" cx={JOURNEY_STATIONS[visualIndex].point[0]} cy={JOURNEY_STATIONS[visualIndex].point[1]} r="10" fill="none" stroke="var(--orange)" strokeWidth="5" />
            )}
          </svg>
          {JOURNEY_STATIONS.map((station, index) => (
            <Box
              key={station.key}
              sx={{
                position: 'absolute',
                left: `${station.x * 100}%`,
                top: `${station.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: index < visualIndex ? colors.green : index === visualIndex ? colors.orange : 'rgba(255,255,255,0.92)',
                border: index <= visualIndex ? 'none' : '1.5px solid var(--sand-300)',
                color: index <= visualIndex ? 'white' : colors.inkSoft,
                fontFamily: fonts.mono,
                fontSize: 11,
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(15,28,46,0.24)',
                zIndex: 3,
              }}
            >
              {index < visualIndex ? '✓' : index + 1}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
