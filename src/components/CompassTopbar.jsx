import React, { useMemo, useRef, useState } from 'react';
import { Box, Popover, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { auth } from '../firebase';
import GuidePickerMenu from './GuidePickerMenu';
import { isStagingHost } from '../config/runtimeFlags';
import { DOCUMENTS_PATH, FAQ_PATH, SUPPORT_MAILTO } from '../data/supportLinks';
import { colors, fonts, radii } from '../styles/tokens';

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

function GuidePill({ isDark }) {
  const { persona, pickerOpen, setPickerOpen } = useGuide();
  const anchorRef = useRef(null);

  return (
    <>
      <Box
        component="button"
        type="button"
        ref={anchorRef}
        onClick={() => setPickerOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={pickerOpen}
        aria-label={`Guide — ${persona.name}`}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 13px 6px 9px',
          borderRadius: radii.pill,
          border: isDark ? '1px solid rgba(244,206,161,0.22)' : '1px solid var(--sand-200)',
          bgcolor: isDark ? colors.navy800 : colors.surface1,
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 11.5,
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
      <GuidePickerMenu
        open={pickerOpen}
        anchorEl={anchorRef.current}
        onClose={() => setPickerOpen(false)}
        isDark={isDark}
      />
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
            width: 260,
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
      <Box sx={{ px: '20px', py: '12px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.inkSoft, textAlign: 'center', mb: '8px' }}>
          Joined {joinedDate}
        </Typography>
        {[
          { to: FAQ_PATH, label: 'FAQ' },
          { to: DOCUMENTS_PATH, label: 'Documents' },
        ].map((item) => (
          <Box
            key={item.to}
            component={RouterLink}
            to={item.to}
            onClick={onClose}
            sx={{
              fontFamily: fonts.sans,
              fontSize: 13.5,
              fontWeight: 700,
              color: isDark ? colors.amberSoft : colors.navy900,
              textDecoration: 'none',
              textAlign: 'center',
              py: '8px',
              borderRadius: radii.pill,
              '&:hover': { bgcolor: isDark ? 'rgba(244,206,161,0.08)' : colors.sand50 },
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            {item.label}
          </Box>
        ))}
        <Box
          component="a"
          href={SUPPORT_MAILTO}
          onClick={onClose}
          sx={{
            fontFamily: fonts.sans,
            fontSize: 13.5,
            fontWeight: 700,
            color: isDark ? colors.amberSoft : colors.navy900,
            textDecoration: 'none',
            textAlign: 'center',
            py: '8px',
            borderRadius: radii.pill,
            '&:hover': { bgcolor: isDark ? 'rgba(244,206,161,0.08)' : colors.sand50 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          Contact support
        </Box>
      </Box>
    </Popover>
  );
}

export default function CompassTopbar({ embedded = false }) {
  const location = useLocation();
  const pathname = location.pathname || '';
  const avatarRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const barDark = true;
  const { hasSelectedGuide } = useGuide();
  const stage = String(new URLSearchParams(location.search || '').get('stage') || '').trim().toLowerCase();
  const isCampaignRespondent = pathname.startsWith('/campaign/');
  const isPreGuide = pathname.startsWith('/user-info')
    || pathname.startsWith('/guide-select')
    || (pathname.startsWith('/form') && stage === 'profile')
    || !hasSelectedGuide
    || isCampaignRespondent;

  const { initials, userName, userEmail, joinedDate } = useMemo(() => {
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
      initials,
      userName: name,
      userEmail: email,
      joinedDate,
    };
  }, [pathname, location.search]);

  const hasAccount = Boolean(userName || userEmail);
  const envLabel = isStagingHost ? 'STAGING' : (import.meta.env.DEV ? 'DEV' : null);

  return (
    <Box
      component={embedded ? 'div' : 'header'}
      sx={{
        position: embedded ? 'relative' : 'sticky',
        top: embedded ? 'auto' : 0,
        zIndex: embedded ? 1 : 20,
        width: '100%',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '28px',
        bgcolor: colors.navy950,
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: 120, flexShrink: 0 }} aria-hidden />

      <Typography
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: fonts.brand,
          fontWeight: 600,
          fontSize: 23,
          letterSpacing: '-0.03em',
          fontVariant: 'small-caps',
          color: colors.amberSoft,
          lineHeight: 1,
          userSelect: 'none',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        The Compass
      </Typography>

      <Stack direction="row" alignItems="center" gap="12px" sx={{ position: 'relative', zIndex: 1, flexShrink: 0, ml: 'auto' }}>
        {envLabel && (
          <Typography
            sx={{
              fontFamily: fonts.mono,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--amber-soft) 50%, transparent)',
              whiteSpace: 'nowrap',
            }}
          >
            {envLabel}
          </Typography>
        )}
        {!isPreGuide && <GuidePill isDark={barDark} />}
        {hasAccount && (
        <Box
          component="button"
          type="button"
          ref={avatarRef}
          onClick={() => setProfileOpen(true)}
          aria-label="Your profile"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            width: 30,
            height: 30,
            borderRadius: '50%',
            bgcolor: 'rgba(22,42,68,0.9)',
            border: '1px solid rgba(244,206,161,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 12,
            color: colors.amberSoft,
            flexShrink: 0,
            userSelect: 'none',
            transition: 'all 180ms cubic-bezier(0.2,0.8,0.2,1)',
            '&:hover': { borderColor: 'rgba(244,206,161,0.5)', bgcolor: colors.navy700 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          {initials}
        </Box>
        )}
      </Stack>

      <ProfilePopover
        anchorEl={avatarRef.current}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        isDark={barDark}
        userName={userName}
        userEmail={userEmail}
        joinedDate={joinedDate}
        initials={initials}
      />
    </Box>
  );
}
