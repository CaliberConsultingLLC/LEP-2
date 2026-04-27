import React, { useMemo, useRef, useState } from 'react';
import { Box, Stack, Popover } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { auth } from '../firebase';

const PHASE_MAP = [
  { id: 'profile',   chapterNum: 'I',   title: 'Identity' },
  { id: 'behaviors', chapterNum: 'II',  title: 'Behaviors' },
  { id: 'insights',  chapterNum: 'III', title: 'Leadership Reflection' },
  { id: 'campaign',  chapterNum: 'IV',  title: 'Campaign Creation' },
  { id: 'self',      chapterNum: 'V',   title: 'Inner Bearing' },
  { id: 'team',      chapterNum: 'VI',  title: 'Outer Signal' },
  { id: 'review',    chapterNum: 'VII', title: 'Review & Act' },
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

// ---- Inline guide-switcher pill ----
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
              mt: 0.75,
              p: 0.5,
              minWidth: 210,
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

// ---- Main topbar ----
function CompassTopbar() {
  const location = useLocation();
  const pathname = location.pathname || '';

  const { phase, initials } = useMemo(() => {
    const phaseId = getPhaseFromPath(pathname);
    const phase = PHASE_MAP.find((p) => p.id === phaseId) || PHASE_MAP[1];
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const name = String(userInfo?.name || auth?.currentUser?.displayName || '').trim();
    const initials = name
      ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    return { phase, initials };
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
      {/* ---- LEFT: brand + cropped compass logo ---- */}
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

      {/* ---- CENTER: chapter pill ---- */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pl: '6px',
            pr: '18px',
            py: '6px',
            borderRadius: 999,
            border: '1px solid var(--sand-200, #E8DBC3)',
            bgcolor: '#fff',
            boxShadow: '0 1px 4px rgba(15,28,46,0.04)',
          }}
        >
          <Box
            sx={{
              width: 28, height: 28, borderRadius: '50%',
              bgcolor: 'var(--navy-900, #10223C)',
              color: 'var(--amber-soft, #F4CEA1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Fraunces", Georgia, serif',
              fontStyle: 'italic', fontWeight: 700, fontSize: 12,
              flexShrink: 0,
            }}
          >
            {phase.chapterNum}
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
      </Box>

      {/* ---- RIGHT: guide pill + user avatar ---- */}
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
