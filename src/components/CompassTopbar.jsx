import React, { useMemo, useRef, useState } from 'react';
import { Box, Stack, Popover } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { auth } from '../firebase';

const PHASE_MAP = [
  {
    id: 'profile',
    chapterNum: 'I',
    title: 'Identity',
    description: 'Build your leader profile — the context that makes your results personal.',
  },
  {
    id: 'behaviors',
    chapterNum: 'II',
    title: 'Behaviors',
    description: 'Explore your natural instincts and behavioral patterns as a leader.',
  },
  {
    id: 'insights',
    chapterNum: 'III',
    title: 'Leadership Reflection',
    description: 'Review your AI-generated summary and choose your three focus areas.',
  },
  {
    id: 'campaign',
    chapterNum: 'IV',
    title: 'Campaign Creation',
    description: 'Design the campaign — three traits your team will assess you on.',
  },
  {
    id: 'self',
    chapterNum: 'V',
    title: 'Inner Bearing',
    description: 'Rate yourself honestly before seeing what your team says.',
  },
  {
    id: 'team',
    chapterNum: 'VI',
    title: 'Outer Signal',
    description: 'Your team is rating you. Their feedback becomes your growth plan.',
  },
  {
    id: 'review',
    chapterNum: 'VII',
    title: 'Review & Act',
    description: 'Interpret your results and commit to specific leadership actions.',
  },
];

const getPhaseFromPath = (pathname) => {
  if (pathname.startsWith('/user-info'))      return 'profile';
  if (pathname.startsWith('/form'))           return 'behaviors';
  if (pathname.startsWith('/summary'))        return 'insights';
  if (pathname.startsWith('/trait-selection')) return 'campaign';
  if (pathname.startsWith('/campaign-intro') || pathname.startsWith('/campaign-builder') || pathname.startsWith('/campaign-verify')) return 'campaign';
  if (pathname.startsWith('/campaign/'))      return 'self';
  if (pathname.startsWith('/dashboard'))      return 'review';
  return 'behaviors';
};

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

// ---- SVG progress ring ----
function ProgressRing({ pct }) {
  const radius = 14;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg
      width={40}
      height={40}
      aria-hidden
      style={{ position: 'absolute', top: -6, left: -6, pointerEvents: 'none' }}
    >
      {/* track */}
      <circle cx={20} cy={20} r={radius} fill="none" stroke="rgba(224,122,63,0.15)" strokeWidth={2.5} />
      {/* fill */}
      <circle
        cx={20} cy={20} r={radius}
        fill="none"
        stroke="var(--orange, #E07A3F)"
        strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 20 20)`}
        style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(.2,.8,.2,1)' }}
      />
    </svg>
  );
}

// ---- Guide-switcher pill (unchanged) ----
function GuidePill() {
  const { personas, personaId, persona, setPersona } = useGuide();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        component="button"
        type="button"
        ref={anchorRef}
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Guide — ${persona.name}`}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px 7px 10px',
          borderRadius: 999,
          border: '1px solid var(--sand-200, #E8DBC3)',
          bgcolor: '#fff',
          fontFamily: '"Manrope", "Inter", sans-serif',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          color: 'var(--navy-900, #10223C)',
          transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 1px 3px rgba(15,28,46,0.06)',
          '&:hover': { borderColor: 'var(--navy-500, #3F647B)' },
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${persona.accent} 55%, rgba(0,0,0,0.18))`,
            border: '1.5px solid rgba(15,28,46,0.2)',
          }}
        />
        Guide
        <Box aria-hidden sx={{ fontSize: 9, opacity: 0.65, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }}>▾</Box>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75, p: 0.5, minWidth: 210,
              borderRadius: '14px',
              border: '1px solid var(--sand-200, #E8DBC3)',
              boxShadow: '0 18px 40px rgba(15,28,46,0.18)',
              bgcolor: '#fff',
            },
          },
        }}
      >
        <Stack role="listbox" aria-label="Choose guide" spacing={0.25}>
          {personas.map((p) => {
            const sel = p.id === personaId;
            return (
              <Box
                key={p.id}
                component="button"
                type="button"
                role="option"
                aria-selected={sel}
                onClick={() => { setPersona(p.id); setOpen(false); }}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontFamily: '"Manrope", "Inter", sans-serif',
                  fontSize: 14,
                  fontWeight: sel ? 700 : 600,
                  color: sel ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)',
                  bgcolor: sel ? 'var(--navy-900, #10223C)' : 'transparent',
                  transition: 'background 140ms, color 140ms',
                  '&:hover': { bgcolor: sel ? 'var(--navy-800, #162A44)' : 'var(--sand-50, #FBF7F0)' },
                  '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${p.accent} 55%, rgba(0,0,0,0.18))`,
                    border: `1.5px solid ${sel ? 'var(--amber-soft, #F4CEA1)' : 'rgba(15,28,46,0.25)'}`,
                    boxShadow: sel ? '0 0 0 2px rgba(244,206,161,0.35)' : 'none',
                  }}
                />
                {p.name}
              </Box>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
}

// ---- Chapter progress popover ----
function ChapterPopover({ phase, phaseIndex, anchorEl, open, onClose }) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            p: '20px 22px 18px',
            width: 280,
            borderRadius: '16px',
            border: '1px solid var(--sand-200, #E8DBC3)',
            boxShadow: '0 18px 48px rgba(15,28,46,0.14)',
            bgcolor: '#fff',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--orange-deep, #C0612A)',
          mb: '6px',
        }}
      >
        Chapter {phase.chapterNum}
      </Box>
      <Box
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--navy-900, #10223C)',
          mb: '8px',
          lineHeight: 1.2,
        }}
      >
        {phase.title}
      </Box>
      <Box
        sx={{
          fontFamily: '"Manrope", "Inter", sans-serif',
          fontSize: 13,
          color: 'var(--ink-soft, #44566C)',
          lineHeight: 1.55,
          mb: '18px',
        }}
      >
        {phase.description}
      </Box>

      {/* 7-step progress dots */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {PHASE_MAP.map((p, idx) => {
          const isCurrent  = idx === phaseIndex;
          const isComplete = idx < phaseIndex;
          return (
            <Box
              key={p.id}
              sx={{
                flex: isCurrent ? '0 0 28px' : '0 0 8px',
                height: 8,
                borderRadius: 999,
                bgcolor: isComplete
                  ? 'var(--green, #2F855A)'
                  : isCurrent
                  ? 'var(--orange, #E07A3F)'
                  : 'var(--sand-200, #E8DBC3)',
                transition: 'flex 300ms cubic-bezier(.2,.8,.2,1)',
              }}
            />
          );
        })}
      </Box>

      {/* Step count */}
      <Box
        sx={{
          fontFamily: '"Manrope", sans-serif',
          fontSize: 11,
          color: 'var(--ink-soft, #44566C)',
          opacity: 0.65,
          mt: '8px',
        }}
      >
        Step {phaseIndex + 1} of {PHASE_MAP.length}
      </Box>
    </Popover>
  );
}

// ---- Main topbar ----
function CompassTopbar() {
  const location = useLocation();
  const pathname = location.pathname || '';
  const pillRef = useRef(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { phase, phaseIndex, progressPct, initials } = useMemo(() => {
    const phaseId   = getPhaseFromPath(pathname);
    const phaseIndex = PHASE_MAP.findIndex((p) => p.id === phaseId);
    const phase      = phaseIndex >= 0 ? PHASE_MAP[phaseIndex] : PHASE_MAP[1];
    const progressPct = Math.round(((phaseIndex >= 0 ? phaseIndex : 1) + 1) / PHASE_MAP.length * 100);
    const userInfo  = parseJson(localStorage.getItem('userInfo'), {});
    const name      = String(userInfo?.name || auth?.currentUser?.displayName || '').trim();
    const initials  = name
      ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    return { phase, phaseIndex: phaseIndex >= 0 ? phaseIndex : 1, progressPct, initials };
  }, [pathname]);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        width: '100%',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '32px',
        bgcolor: '#ffffff',
        borderBottom: '1px solid var(--sand-200, #E8DBC3)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* LEFT: brand */}
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Box
          component="img"
          src="/compasslogo2.png"
          alt="Compass"
          sx={{
            height: 210,
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        <Box
          sx={{
            fontFamily: '"Manrope", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--navy-900, #10223C)',
          }}
        >
          The Compass
        </Box>
      </Stack>

      {/* CENTER: chapter pill (clickable) */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      >
        <Box
          component="button"
          type="button"
          ref={pillRef}
          onClick={() => setPopoverOpen(true)}
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          aria-label={`Chapter ${phase.chapterNum} — ${phase.title}. Click for progress overview.`}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            pl: '6px',
            pr: '18px',
            py: '6px',
            borderRadius: 999,
            border: '1px solid var(--sand-200, #E8DBC3)',
            bgcolor: '#fff',
            boxShadow: '0 1px 4px rgba(15,28,46,0.04)',
            transition: 'box-shadow 160ms, border-color 160ms',
            '&:hover': {
              borderColor: 'var(--orange, #E07A3F)',
              boxShadow: '0 2px 10px rgba(224,122,63,0.15)',
            },
            '&:focus-visible': {
              outline: '3px solid rgba(224,122,63,0.32)',
              outlineOffset: 2,
            },
          }}
        >
          {/* Chapter circle with SVG progress ring */}
          <Box sx={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
            <ProgressRing pct={progressPct} />
            <Box
              sx={{
                width: 28, height: 28, borderRadius: '50%',
                bgcolor: 'var(--navy-900, #10223C)',
                color: 'var(--amber-soft, #F4CEA1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Fraunces", Georgia, serif',
                fontStyle: 'italic', fontWeight: 700, fontSize: 12,
                userSelect: 'none',
              }}
            >
              {phase.chapterNum}
            </Box>
          </Box>

          <Box>
            <Box
              sx={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.14em',
                color: 'var(--orange-deep, #C0612A)',
                textTransform: 'uppercase',
                mb: '2px',
                lineHeight: 1,
              }}
            >
              Chapter {phase.chapterNum}
            </Box>
            <Box
              sx={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontStyle: 'italic', fontSize: 13,
                color: 'var(--navy-900, #10223C)',
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {phase.title}
            </Box>
          </Box>
        </Box>

        <ChapterPopover
          phase={phase}
          phaseIndex={phaseIndex}
          anchorEl={pillRef.current}
          open={popoverOpen}
          onClose={() => setPopoverOpen(false)}
        />
      </Box>

      {/* RIGHT: guide pill + avatar */}
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <GuidePill />
        <Box
          sx={{
            width: 32, height: 32, borderRadius: '50%',
            bgcolor: 'var(--sand-200, #E8DBC3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Fraunces", Georgia, serif',
            fontWeight: 700, fontSize: 12,
            color: 'var(--navy-700, #1E3A5C)',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {initials}
        </Box>
      </Stack>
    </Box>
  );
}

export default CompassTopbar;
