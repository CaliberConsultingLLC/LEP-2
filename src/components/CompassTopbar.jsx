import React, { useMemo, useRef, useState } from 'react';
import { Box, Popover, Stack, Typography } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import { useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { auth } from '../firebase';
import { useDarkMode } from '../hooks/useDarkMode';
import JourneyMapModal from './JourneyMapModal';
import {
  chapterText,
  getJourneyCompletion,
  getJourneyIndexForLocation,
  JOURNEY_STATIONS,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, radii } from '../styles/tokens';

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

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
          borderRadius: radii.pill,
          border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid var(--sand-200)',
          bgcolor: isDark ? 'rgba(22,42,68,0.9)' : colors.surface1,
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          color: isDark ? colors.amberSoft : colors.navy900,
          transition: 'all 180ms cubic-bezier(0.2,0.8,0.2,1)',
          boxShadow: '0 1px 3px rgba(15,28,46,0.06)',
          '&:hover': { borderColor: isDark ? 'rgba(244,206,161,0.5)' : colors.navy500 },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            flexShrink: 0,
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${persona.accent} 55%, rgba(0,0,0,0.18))`,
            border: '1.5px solid rgba(15,28,46,0.2)',
          }}
        />
        Guide
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
              borderRadius: radii.md,
              border: isDark ? '1px solid rgba(244,206,161,0.2)' : '1px solid var(--sand-200)',
              boxShadow: '0 18px 40px rgba(15,28,46,0.18)',
              bgcolor: isDark ? colors.navy800 : colors.surface1,
            },
          },
        }}
      >
        <Stack role="listbox" aria-label="Choose guide" spacing={0.25}>
          {personas.map((p) => {
            const selected = p.id === personaId;
            return (
              <Box
                key={p.id}
                component="button"
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { setPersona(p.id); setOpen(false); }}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: radii.sm,
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  fontWeight: selected ? 700 : 600,
                  color: selected ? colors.amberSoft : isDark ? colors.ink : colors.navy900,
                  bgcolor: selected ? colors.navy900 : 'transparent',
                  transition: 'background 140ms, color 140ms',
                  '&:hover': { bgcolor: selected ? colors.navy800 : isDark ? 'rgba(244,206,161,0.08)' : colors.sand50 },
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${p.accent} 55%, rgba(0,0,0,0.18))`,
                    border: `1.5px solid ${selected ? 'var(--amber-soft)' : 'rgba(15,28,46,0.25)'}`,
                    boxShadow: selected ? '0 0 0 2px rgba(244,206,161,0.35)' : 'none',
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
            borderRadius: radii.lg,
            border: isDark ? '1px solid rgba(244,206,161,0.2)' : '1px solid var(--sand-200)',
            boxShadow: '0 18px 48px rgba(15,28,46,0.14)',
            bgcolor: isDark ? colors.navy950 : colors.surface1,
            overflow: 'hidden',
            p: 0,
          },
        },
      }}
    >
      <Box
        sx={{
          pt: '26px',
          pb: '18px',
          px: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: isDark ? 'rgba(10,20,34,0.5)' : colors.sand50,
          borderBottom: isDark ? '1px solid rgba(244,206,161,0.1)' : '1px solid var(--sand-200)',
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: colors.navy900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 20,
            color: colors.amberSoft,
            mb: '12px',
            boxShadow: '0 4px 16px rgba(15,28,46,0.22)',
          }}
        >
          {initials}
        </Box>
        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 17, fontWeight: 600, color: isDark ? colors.ink : colors.navy900, mb: '4px', textAlign: 'center', lineHeight: 1.2 }}>
          {userName || 'Leader'}
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft, textAlign: 'center' }}>
          {userEmail || '—'}
        </Typography>
      </Box>
      <Box sx={{ px: '20px', py: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.inkSoft }}>
          Joined {joinedDate}
        </Typography>
      </Box>
    </Popover>
  );
}

function MapBanner({ chapterIndex, chapterName, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Your journey — open the map"
      sx={{
        all: 'unset',
        cursor: 'pointer',
        position: 'relative',
        width: 320,
        height: 46,
        borderRadius: radii.pill,
        overflow: 'hidden',
        border: '1px solid var(--sand-200)',
        boxShadow: '0 1px 4px rgba(15,28,46,0.06)',
        transform: 'translateY(0)',
        transition: 'border-color 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms cubic-bezier(0.2,0.8,0.2,1), transform 180ms cubic-bezier(0.2,0.8,0.2,1)',
        '&:hover': {
          borderColor: colors.orange,
          boxShadow: '0 4px 16px rgba(224,122,63,0.2)',
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        '&:hover .journey-banner-bg': { transform: 'scale(1.08)' },
      }}
    >
      <Box
        className="journey-banner-bg"
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/journey-base.png)',
          backgroundSize: 'cover',
          backgroundPosition: '78% 26%',
          transform: 'scale(1.02)',
          transition: 'transform 700ms cubic-bezier(0.2,0.8,0.2,1)',
        }}
      />
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(16,34,60,0.55), rgba(16,34,60,0.72) 46%, rgba(16,34,60,0.3))' }} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(244,206,161,0.85)', lineHeight: 1 }}>
          {chapterText(chapterIndex)}
        </Typography>
        <Typography sx={{ fontFamily: fonts.brand, fontVariant: 'small-caps', fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.035em', color: 'white', lineHeight: 1, whiteSpace: 'nowrap' }}>
          {chapterName}
        </Typography>
      </Box>
    </Box>
  );
}

export default function CompassTopbar() {
  const location = useLocation();
  const pathname = location.pathname || '';
  const avatarRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [isDark, toggleDark] = useDarkMode();
  const isPreGuide = pathname.startsWith('/user-info');

  const { chapterIndex, station, completion, initials, userName, firstName, userEmail, joinedDate } = useMemo(() => {
    const chapterIndex = getJourneyIndexForLocation(pathname, location.search);
    const station = JOURNEY_STATIONS[chapterIndex] || JOURNEY_STATIONS[0];
    const completion = getJourneyCompletion();
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const name = String(userInfo?.name || auth?.currentUser?.displayName || '').trim();
    const email = String(userInfo?.email || auth?.currentUser?.email || '').trim();
    const initials = name
      ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    let joinedDate = 'May 2026';
    try {
      const raw = userInfo?.consent?.acceptedAt || auth?.currentUser?.metadata?.creationTime;
      if (raw) joinedDate = new Date(raw).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      // Keep the profile popover resilient when auth metadata is unavailable.
    }
    return {
      chapterIndex,
      station,
      completion,
      initials,
      userName: name,
      firstName: name.split(/\s+/)[0] || '',
      userEmail: email,
      joinedDate,
    };
  }, [pathname, location.search]);

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
        bgcolor: isDark ? colors.navy950 : colors.surface1,
        borderBottom: '1px solid var(--sand-200)',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Typography
          sx={{
            fontFamily: fonts.brand,
            fontWeight: 600,
            fontSize: { xs: 22, sm: 25 },
            letterSpacing: '-0.045em',
            fontVariant: 'small-caps',
            color: isDark ? colors.amberSoft : colors.navy900,
            lineHeight: 0.95,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          The Compass
        </Typography>
      </Box>

      <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
        <MapBanner chapterIndex={chapterIndex} chapterName={station.label} onClick={() => setMapOpen(true)} />
      </Box>

      <Stack direction="row" alignItems="center" gap={1.5} sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        {!isPreGuide && <GuidePill isDark={isDark} />}
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
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid var(--sand-200)',
            bgcolor: isDark ? 'rgba(22,42,68,0.9)' : colors.surface1,
            color: isDark ? colors.amberSoft : colors.navy700,
            boxShadow: '0 1px 3px rgba(15,28,46,0.06)',
            flexShrink: 0,
            transition: 'all 180ms cubic-bezier(0.2,0.8,0.2,1)',
            '&:hover': { borderColor: isDark ? 'rgba(244,206,161,0.5)' : colors.navy500, bgcolor: isDark ? colors.navy700 : colors.sand50 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          {isDark ? <WbSunnyIcon sx={{ fontSize: 16 }} /> : <NightlightRoundIcon sx={{ fontSize: 16 }} />}
        </Box>

        <Box
          component="button"
          type="button"
          ref={avatarRef}
          onClick={() => setProfileOpen(true)}
          aria-label="Your profile"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: isDark ? 'rgba(22,42,68,0.9)' : colors.sand200,
            border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid rgba(15,28,46,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 13,
            color: isDark ? colors.amberSoft : colors.navy700,
            flexShrink: 0,
            userSelect: 'none',
            transition: 'all 180ms cubic-bezier(0.2,0.8,0.2,1)',
            '&:hover': { borderColor: isDark ? 'rgba(244,206,161,0.5)' : colors.navy500, bgcolor: isDark ? colors.navy700 : colors.sand100 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
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
      <JourneyMapModal
        open={mapOpen}
        mode="reference"
        currentIndex={chapterIndex}
        firstName={firstName}
        completion={completion}
        onClose={() => setMapOpen(false)}
      />
    </Box>
  );
}
