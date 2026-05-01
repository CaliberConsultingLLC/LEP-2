import React, { useMemo, useRef, useState } from 'react';
import { Box, Stack, Popover } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { auth } from '../firebase';
import { useDarkMode } from '../hooks/useDarkMode';
import { useStepNav } from '../context/StepNavContext';

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

// Ordered linear page sequence for back/forward navigation
const PAGE_SEQUENCE = [
  '/user-info',
  '/form?stage=profile',
  '/guide-select',
  '/form?stage=intake',
  '/summary',
  '/trait-selection',
  '/campaign-intro',
  '/campaign-builder',
  '/campaign-verify',
  '/dashboard',
];

const getPhaseFromPath = (pathname) => {
  if (pathname.startsWith('/user-info'))       return 'profile';
  if (pathname.startsWith('/guide-select'))    return 'profile';
  if (pathname.startsWith('/form'))            return 'behaviors';
  if (pathname.startsWith('/summary'))         return 'insights';
  if (pathname.startsWith('/trait-selection')) return 'campaign';
  if (pathname.startsWith('/campaign-intro') || pathname.startsWith('/campaign-builder') || pathname.startsWith('/campaign-verify')) return 'campaign';
  if (pathname.startsWith('/campaign/'))       return 'self';
  if (pathname.startsWith('/dashboard'))       return 'review';
  return 'behaviors';
};

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

// ---- SVG progress ring (scaled 20% larger: radius 17, SVG 48x48) ----
function ProgressRing({ pct }) {
  const radius = 17;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg
      width={48}
      height={48}
      aria-hidden
      style={{ position: 'absolute', top: -7, left: -7, pointerEvents: 'none' }}
    >
      <circle cx={24} cy={24} r={radius} fill="none" stroke="rgba(224,122,63,0.15)" strokeWidth={2.5} />
      <circle
        cx={24} cy={24} r={radius}
        fill="none"
        stroke="var(--orange, #E07A3F)"
        strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(.2,.8,.2,1)' }}
      />
    </svg>
  );
}

// ---- Guide-switcher pill ----
function GuidePill({ isDark }) {
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
          border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid var(--sand-200, #E8DBC3)',
          bgcolor: isDark ? 'rgba(22,42,68,0.9)' : '#fff',
          fontFamily: '"Manrope", "Inter", sans-serif',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)',
          transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 1px 3px rgba(15,28,46,0.06)',
          '&:hover': { borderColor: isDark ? 'rgba(244,206,161,0.5)' : 'var(--navy-500, #3F647B)' },
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
              border: isDark ? '1px solid rgba(244,206,161,0.2)' : '1px solid var(--sand-200, #E8DBC3)',
              boxShadow: '0 18px 40px rgba(15,28,46,0.18)',
              bgcolor: isDark ? '#162A44' : '#fff',
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
                  color: sel ? 'var(--amber-soft, #F4CEA1)' : isDark ? '#F0E9DE' : 'var(--navy-900, #10223C)',
                  bgcolor: sel ? 'var(--navy-900, #10223C)' : 'transparent',
                  transition: 'background 140ms, color 140ms',
                  '&:hover': { bgcolor: sel ? 'var(--navy-800, #162A44)' : isDark ? 'rgba(244,206,161,0.08)' : 'var(--sand-50, #FBF7F0)' },
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

// ---- Chapter progress popover (redesigned: 30% larger, engaging) ----
function ChapterPopover({ phase, phaseIndex, anchorEl, open, onClose, isDark }) {
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
            mt: 1.5,
            width: 364,
            borderRadius: '20px',
            border: isDark ? '1px solid rgba(244,206,161,0.18)' : '1px solid var(--sand-200, #E8DBC3)',
            boxShadow: isDark
              ? '0 28px 64px rgba(0,0,0,0.55)'
              : '0 24px 64px rgba(15,28,46,0.18)',
            bgcolor: isDark ? '#0F1C2E' : '#fff',
            overflow: 'hidden',
            p: 0,
          },
        },
      }}
    >
      {/* Navy header with decorative chapter display */}
      <Box
        sx={{
          background: 'var(--navy-900, #10223C)',
          px: '26px', pt: '24px', pb: '22px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative large roman numeral watermark */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', right: '18px', top: '8px',
            fontFamily: '"Fraunces", Georgia, serif',
            fontStyle: 'italic', fontWeight: 700,
            fontSize: 88, lineHeight: 1,
            color: 'rgba(244,206,161,0.08)',
            userSelect: 'none', pointerEvents: 'none',
          }}
        >
          {phase.chapterNum}
        </Box>

        {/* Eyebrow */}
        <Box
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(244,206,161,0.55)',
            mb: '8px',
          }}
        >
          Your Journey · Chapter {phase.chapterNum}
        </Box>

        {/* Chapter title */}
        <Box
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontStyle: 'italic', fontSize: 26, fontWeight: 700,
            color: 'var(--amber-soft, #F4CEA1)',
            lineHeight: 1.1, mb: '10px',
          }}
        >
          {phase.title}
        </Box>

        {/* Description */}
        <Box
          sx={{
            fontFamily: '"Manrope", "Inter", sans-serif',
            fontSize: 13, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.68)',
            maxWidth: '88%',
          }}
        >
          {phase.description}
        </Box>
      </Box>

      {/* Chapter list */}
      <Box sx={{ p: '14px 16px 18px' }}>
        <Box
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: isDark ? 'rgba(244,206,161,0.45)' : 'var(--ink-soft, #44566C)',
            px: '8px', mb: '8px',
          }}
        >
          All Chapters
        </Box>

        {PHASE_MAP.map((p, idx) => {
          const isCurrent  = idx === phaseIndex;
          const isComplete = idx < phaseIndex;
          return (
            <Box
              key={p.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: '12px',
                px: '8px', py: '7px', borderRadius: '10px',
                bgcolor: isCurrent
                  ? isDark ? 'rgba(224,122,63,0.12)' : 'rgba(224,122,63,0.07)'
                  : 'transparent',
              }}
            >
              {/* Status circle */}
              <Box
                sx={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isComplete
                    ? 'var(--green, #2F855A)'
                    : isCurrent
                    ? 'var(--orange, #E07A3F)'
                    : isDark ? 'rgba(255,255,255,0.06)' : 'var(--sand-100, #F4ECDD)',
                  border: isComplete || isCurrent
                    ? 'none'
                    : isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--sand-200, #E8DBC3)',
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontStyle: 'italic', fontWeight: 700, fontSize: 10,
                  color: isComplete || isCurrent
                    ? '#fff'
                    : isDark ? 'rgba(255,255,255,0.35)' : 'var(--ink-soft, #44566C)',
                }}
              >
                {isComplete ? '✓' : p.chapterNum}
              </Box>

              {/* Chapter label */}
              <Box
                sx={{
                  flex: 1,
                  fontFamily: '"Manrope", "Inter", sans-serif',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: 13, lineHeight: 1,
                  color: isCurrent
                    ? isDark ? '#F0E9DE' : 'var(--navy-900, #10223C)'
                    : isComplete
                    ? 'var(--green, #2F855A)'
                    : isDark ? 'rgba(240,233,222,0.38)' : 'var(--ink-soft, #44566C)',
                }}
              >
                {p.title}
              </Box>

              {isCurrent && (
                <Box
                  sx={{
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--orange, #E07A3F)',
                    bgcolor: 'rgba(224,122,63,0.1)',
                    px: '6px', py: '2px', borderRadius: '4px',
                  }}
                >
                  Now
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Popover>
  );
}

// ---- Profile popover ----
function ProfilePopover({ anchorEl, open, onClose, isDark, userName, userEmail, joinedDate, initials }) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 248,
            borderRadius: '18px',
            border: isDark ? '1px solid rgba(244,206,161,0.2)' : '1px solid var(--sand-200, #E8DBC3)',
            boxShadow: isDark ? '0 18px 48px rgba(0,0,0,0.5)' : '0 18px 48px rgba(15,28,46,0.14)',
            bgcolor: isDark ? '#0F1C2E' : '#fff',
            overflow: 'hidden',
            p: 0,
          },
        },
      }}
    >
      {/* Avatar / name / email section */}
      <Box
        sx={{
          pt: '26px', pb: '18px', px: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: isDark ? 'rgba(10,20,34,0.5)' : 'var(--sand-50, #FBF7F0)',
          borderBottom: isDark
            ? '1px solid rgba(244,206,161,0.1)'
            : '1px solid var(--sand-200, #E8DBC3)',
        }}
      >
        {/* Large avatar circle */}
        <Box
          sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: 'var(--navy-900, #10223C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Fraunces", Georgia, serif',
            fontWeight: 700, fontSize: 20,
            color: 'var(--amber-soft, #F4CEA1)',
            mb: '12px',
            boxShadow: '0 4px 16px rgba(15,28,46,0.22)',
          }}
        >
          {initials}
        </Box>

        {/* Name */}
        <Box
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontStyle: 'italic', fontSize: 17, fontWeight: 600,
            color: isDark ? '#F0E9DE' : 'var(--navy-900, #10223C)',
            mb: '4px', textAlign: 'center', lineHeight: 1.2,
          }}
        >
          {userName || 'Leader'}
        </Box>

        {/* Email */}
        <Box
          sx={{
            fontFamily: '"Manrope", "Inter", sans-serif',
            fontSize: 12,
            color: isDark ? 'rgba(240,233,222,0.5)' : 'var(--ink-soft, #44566C)',
            textAlign: 'center',
          }}
        >
          {userEmail || '—'}
        </Box>
      </Box>

      {/* Joined date footer */}
      <Box
        sx={{
          px: '20px', py: '13px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
      >
        <Box
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: isDark ? 'rgba(244,206,161,0.45)' : 'var(--ink-soft, #44566C)',
          }}
        >
          Joined {joinedDate}
        </Box>
      </Box>
    </Popover>
  );
}

// ---- Small nav arrow button ----
function NavArrow({ onClick, disabled, dir, isDark }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={dir === 'back' ? 'Go to previous page' : 'Go to next page'}
      disabled={disabled}
      sx={{
        all: 'unset',
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34, height: 34,
        borderRadius: '50%',
        border: isDark
          ? `1px solid ${disabled ? 'rgba(244,206,161,0.08)' : 'rgba(244,206,161,0.22)'}`
          : `1px solid ${disabled ? 'rgba(15,28,46,0.08)' : 'var(--sand-200, #E8DBC3)'}`,
        bgcolor: isDark ? 'rgba(22,42,68,0.9)' : '#fff',
        color: disabled
          ? isDark ? 'rgba(244,206,161,0.2)' : 'rgba(15,28,46,0.18)'
          : isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-700, #1E3A5C)',
        boxShadow: disabled ? 'none' : '0 1px 3px rgba(15,28,46,0.06)',
        flexShrink: 0,
        transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
        opacity: disabled ? 0.45 : 1,
        ...(!disabled && {
          '&:hover': {
            borderColor: isDark ? 'rgba(244,206,161,0.5)' : 'var(--orange, #E07A3F)',
            bgcolor: isDark ? '#1E3A5C' : 'var(--sand-50, #FBF7F0)',
          },
        }),
        '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
      }}
    >
      {dir === 'back'
        ? <ChevronLeftIcon sx={{ fontSize: 18 }} />
        : <ChevronRightIcon sx={{ fontSize: 18 }} />
      }
    </Box>
  );
}

// ---- Main topbar ----
function CompassTopbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const pathname  = location.pathname || '';
  const pillRef   = useRef(null);
  const avatarRef = useRef(null);
  const [popoverOpen,  setPopoverOpen]  = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [isDark, toggleDark] = useDarkMode();
  const isPreGuide = pathname.startsWith('/user-info');
  const { nav: stepNav } = useStepNav();

  const { phase, phaseIndex, progressPct, initials, userName, userEmail, joinedDate } = useMemo(() => {
    const phaseId    = getPhaseFromPath(pathname);
    const phaseIndex = PHASE_MAP.findIndex((p) => p.id === phaseId);
    const phase      = phaseIndex >= 0 ? PHASE_MAP[phaseIndex] : PHASE_MAP[1];
    const progressPct = Math.round(((phaseIndex >= 0 ? phaseIndex : 1) + 1) / PHASE_MAP.length * 100);

    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const name     = String(userInfo?.name || auth?.currentUser?.displayName || '').trim();
    const email    = String(userInfo?.email || auth?.currentUser?.email || '').trim();
    const initials = name
      ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';

    let joinedDate = 'May 2026';
    try {
      const raw = userInfo?.consent?.acceptedAt || auth?.currentUser?.metadata?.creationTime;
      if (raw) joinedDate = new Date(raw).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {}

    return { phase, phaseIndex: phaseIndex >= 0 ? phaseIndex : 1, progressPct, initials, userName: name, userEmail: email, joinedDate };
  }, [pathname]);

  // Back / forward page sequence navigation
  const { prevPath, nextPath, canGoForward } = useMemo(() => {
    const currentFullPath = `${pathname}${location.search || ''}`;
    const idx  = PAGE_SEQUENCE.findIndex((p) => (
      p.includes('?') ? currentFullPath.startsWith(p) : pathname.startsWith(p)
    ));
    const prev = idx > 0 ? PAGE_SEQUENCE[idx - 1] : null;
    const next = idx >= 0 && idx < PAGE_SEQUENCE.length - 1 ? PAGE_SEQUENCE[idx + 1] : null;

    let canFwd = false;
    if (next) {
      if (pathname.startsWith('/user-info')) {
        canFwd = !!localStorage.getItem('userInfo');
      } else if (pathname.startsWith('/guide-select')) {
        canFwd = true;
      } else if (pathname.startsWith('/form')) {
        const s = parseJson(localStorage.getItem('intakeStatus'), {});
        canFwd = !!s?.complete;
      } else if (pathname.startsWith('/summary')) {
        canFwd = !!localStorage.getItem('aiSummary');
      } else if (pathname.startsWith('/trait-selection')) {
        const t = parseJson(localStorage.getItem('selectedTraits'), []);
        canFwd = Array.isArray(t) && t.length > 0;
      } else if (pathname.startsWith('/campaign-intro') || pathname.startsWith('/campaign-builder')) {
        canFwd = !!localStorage.getItem('currentCampaign');
      } else if (pathname.startsWith('/campaign-verify')) {
        canFwd = !!localStorage.getItem('campaignRecords');
      } else {
        canFwd = true;
      }
    }

    return { prevPath: prev, nextPath: next, canGoForward: canFwd };
  }, [pathname]);

  // If a page has registered step-level navigation, the arrows drive steps.
  // Otherwise they do page-level navigation using the PAGE_SEQUENCE.
  const goBack = () => {
    if (stepNav) { stepNav.goBack(); return; }
    if (prevPath) navigate(prevPath); else navigate(-1);
  };
  const goForward = () => {
    if (stepNav) { if (stepNav.canGoForward) stepNav.goForward(); return; }
    if (nextPath && canGoForward) navigate(nextPath);
  };
  const backDisabled    = stepNav ? !stepNav.canGoBack    : !prevPath;
  const forwardDisabled = stepNav ? !stepNav.canGoForward : !canGoForward;

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        width: '100%',
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '28px',
        bgcolor: isDark ? '#0F1C2E' : '#ffffff',
        borderBottom: '1px solid var(--sand-200, #E8DBC3)',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      {/* LEFT: brand title (no logo — background watermark serves that role) */}
      <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Box
          sx={{
            fontFamily: '"Cinzel", "Times New Roman", Georgia, serif',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: { xs: 22, sm: 25 },
            letterSpacing: '-0.045em',
            fontVariant: 'small-caps',
            color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)',
            lineHeight: 0.95,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          The Compass
        </Box>
      </Box>

      {/* CENTER: back arrow + chapter pill + forward arrow */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          {/* Back */}
          <NavArrow dir="back" onClick={goBack} disabled={backDisabled} isDark={isDark} />

          {/* Chapter pill — 20% larger than original */}
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
              gap: '14px',
              pl: '8px',
              pr: '22px',
              py: '8px',
              borderRadius: 999,
              border: isDark
                ? '1px solid rgba(244,206,161,0.22)'
                : '1px solid var(--sand-200, #E8DBC3)',
              bgcolor: isDark ? 'rgba(22,42,68,0.9)' : '#fff',
              boxShadow: '0 1px 4px rgba(15,28,46,0.04)',
              transition: 'box-shadow 160ms, border-color 160ms',
              '&:hover': {
                borderColor: 'var(--orange, #E07A3F)',
                boxShadow: '0 2px 12px rgba(224,122,63,0.18)',
              },
              '&:focus-visible': {
                outline: '3px solid rgba(224,122,63,0.32)',
                outlineOffset: 2,
              },
            }}
          >
            {/* Chapter circle with SVG progress ring (34x34) */}
            <Box sx={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
              <ProgressRing pct={progressPct} />
              <Box
                sx={{
                  width: 34, height: 34, borderRadius: '50%',
                  bgcolor: 'var(--navy-900, #10223C)',
                  color: 'var(--amber-soft, #F4CEA1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontStyle: 'italic', fontWeight: 700, fontSize: 14,
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
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: isDark ? 'rgba(244,206,161,0.7)' : 'var(--orange-deep, #C0612A)',
                  textTransform: 'uppercase',
                  mb: '3px', lineHeight: 1,
                }}
              >
                Chapter {phase.chapterNum}
              </Box>
              <Box
                sx={{
                  fontFamily: '"Cinzel", "Times New Roman", Georgia, serif',
                  fontStyle: 'normal',
                  fontSize: 16,
                  letterSpacing: '-0.035em',
                  fontVariant: 'small-caps',
                  color: isDark ? '#F0E9DE' : 'var(--navy-900, #10223C)',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {phase.title}
              </Box>
            </Box>
          </Box>

          {/* Forward */}
          <NavArrow dir="forward" onClick={goForward} disabled={forwardDisabled} isDark={isDark} />
        </Stack>

        <ChapterPopover
          phase={phase}
          phaseIndex={phaseIndex}
          anchorEl={pillRef.current}
          open={popoverOpen}
          onClose={() => setPopoverOpen(false)}
          isDark={isDark}
        />
      </Box>

      {/* RIGHT: guide pill (hidden before guide selection) + dark mode toggle + avatar */}
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        {!isPreGuide && <GuidePill isDark={isDark} />}

        {/* Dark mode toggle */}
        <Box
          component="button"
          type="button"
          onClick={toggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34, height: 34,
            borderRadius: '50%',
            border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid var(--sand-200, #E8DBC3)',
            bgcolor: isDark ? 'rgba(22,42,68,0.9)' : '#fff',
            color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-700, #1E3A5C)',
            boxShadow: '0 1px 3px rgba(15,28,46,0.06)',
            flexShrink: 0,
            transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
            '&:hover': {
              borderColor: isDark ? 'rgba(244,206,161,0.5)' : 'var(--navy-500, #3F647B)',
              bgcolor: isDark ? '#1E3A5C' : 'var(--sand-50, #FBF7F0)',
            },
            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
          }}
        >
          {isDark
            ? <WbSunnyIcon sx={{ fontSize: 16 }} />
            : <NightlightRoundIcon sx={{ fontSize: 16 }} />
          }
        </Box>

        {/* User avatar — click opens profile popover */}
        <Box
          component="button"
          type="button"
          ref={avatarRef}
          onClick={() => setProfileOpen(true)}
          aria-label="Your profile"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            width: 34, height: 34, borderRadius: '50%',
            bgcolor: isDark ? 'rgba(22,42,68,0.9)' : 'var(--sand-200, #E8DBC3)',
            border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid rgba(15,28,46,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Fraunces", Georgia, serif',
            fontWeight: 700, fontSize: 13,
            color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-700, #1E3A5C)',
            flexShrink: 0,
            userSelect: 'none',
            transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
            '&:hover': {
              borderColor: isDark ? 'rgba(244,206,161,0.5)' : 'var(--navy-500, #3F647B)',
              bgcolor: isDark ? '#1E3A5C' : 'var(--sand-100, #F4ECDD)',
            },
            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
          }}
        >
          {initials}
        </Box>
      </Stack>

      <ProfilePopover
        anchorEl={avatarRef.current}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        isDark={isDark}
        userName={userName}
        userEmail={userEmail}
        joinedDate={joinedDate}
        initials={initials}
      />
    </Box>
  );
}

export default CompassTopbar;
