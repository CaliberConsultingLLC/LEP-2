/**
 * The eight Today states, on demand.
 *
 * The room only ever draws one moment at a time, and reaching the later ones in
 * the running product costs a campaign, a reading, and a written plan. This page
 * hands the room the fixture the mockups were drawn from so any of the eight can
 * be opened, compared, and screenshotted without playing the year to get there.
 *
 * It is the real chrome — the same `ChapterHeader` the dashboard renders — so
 * what you see here is what Chapter VI looks like, not a facsimile of it.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ChapterHeader from '../components/ChapterHeader';
import TodayRoom from './Dashboard/cc/TodayRoom';
import { demoTodayView, MOMENTS, THEMES } from './Dashboard/cc/todayRoomModel.js';
import { useGuide } from '../context/GuideContext';
import { colors, fonts, radii } from '../styles/tokens';

// The mockups' ids, so a screenshot can be named the same thing the design file
// calls it and the two can be laid side by side without a decoder ring.
const STATES = [
  { id: '3a', moment: 'listening', theme: 'night', label: 'Listening window · Night' },
  { id: '3b', moment: 'listening', theme: 'day', label: 'Listening window · Day' },
  { id: '3c', moment: 'reading', theme: 'night', label: 'Mid-reading · Night' },
  { id: '3d', moment: 'reading', theme: 'day', label: 'Mid-reading · Day' },
  { id: '3e', moment: 'notes', theme: 'night', label: 'Notes, no plan · Night' },
  { id: '3f', moment: 'notes', theme: 'day', label: 'Notes, no plan · Day' },
  { id: '3g', moment: 'plan', theme: 'night', label: 'Plan in hand · Night' },
  { id: '3h', moment: 'plan', theme: 'day', label: 'Plan in hand · Day' },
];

/**
 * Which tabs are open at each moment. The listening window has nothing to read
 * yet, and Practice stays shut until the evidence has been.
 */
const STEP_STATUS = {
  listening: { narrative: 'locked', signal: 'locked', evidence: 'locked', practice: 'locked' },
  reading: { practice: 'locked' },
  notes: {},
  plan: {},
};

const stateFor = (search) => {
  const params = new URLSearchParams(search || '');
  const id = String(params.get('state') || '').trim().toLowerCase();
  const byId = STATES.find((s) => s.id === id);
  if (byId) return byId;
  const moment = String(params.get('moment') || '').trim().toLowerCase();
  const theme = String(params.get('theme') || '').trim().toLowerCase();
  return (
    STATES.find(
      (s) => (MOMENTS.includes(moment) ? s.moment === moment : s.moment === 'listening')
        && (THEMES.includes(theme) ? s.theme === theme : s.theme === 'night'),
    ) || STATES[0]
  );
};

export default function TodayStates() {
  const navigate = useNavigate();
  const location = useLocation();
  const { personaId, setSuppress } = useGuide();
  const active = useMemo(() => stateFor(location.search), [location.search]);
  // `?bare=1` drops the scaffolding so a screenshot of this page can be laid
  // straight over the PNG it is meant to match.
  const bare = new URLSearchParams(location.search || '').get('bare') === '1';
  const [showSwitcher, setShowSwitcher] = useState(true);

  // The owl lives inside the room here. The overlay owl would be a second one
  // in the same corner saying something else.
  useEffect(() => {
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress]);

  const view = useMemo(
    () => demoTodayView(active.moment, active.theme, personaId),
    [active.moment, active.theme, personaId],
  );

  const go = (state) => navigate(`/today-states?state=${state.id}`, { replace: true });

  // Anything App renders above this page — the demo banner — pushes it down, so
  // a flat `100svh` shell would hang off the bottom by exactly that much and put
  // a scrollbar on a page whose whole point is that it does not need one. The
  // dashboard measures the same offset for the same reason.
  const shellRef = useRef(null);
  const [shellTop, setShellTop] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = shellRef.current;
      if (!el) return;
      const top = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY));
      setShellTop((prev) => (prev === top ? prev : top));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    // The same shell the dashboard gives the room: one viewport tall, the stage
    // taking whatever the rail leaves behind. Checking the room against the
    // mockups in a page that is free to scroll would prove nothing about the
    // one place it actually has to fit.
    //
    // The rail's status chip spills past a phone-width viewport — it does on
    // every page that passes one. Every shell that renders the rail clips it;
    // this one has to as well, or the whole page pans sideways.
    <Box
      ref={shellRef}
      sx={{
        height: `calc(100svh - ${shellTop}px)`,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.sand50,
        overflowX: 'hidden',
      }}
    >
      <ChapterHeader
        chapterId="review"
        activeStepId="today"
        stepStatus={STEP_STATUS[active.moment]}
        onStepSelect={() => {}}
        chip={{
          variant: 'dashboard',
          label: 'Responses',
          current: view.responded,
          total: view.invited,
          status: active.moment === 'listening' ? 'Signal forming' : 'Signal ready',
        }}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: { xs: '20px 16px 32px', md: '28px 40px 40px' },
          overflowX: 'hidden',
          overflowY: 'auto',
          '@media (min-width:1024px)': { overflowY: 'hidden' },
        }}
      >
        <TodayRoom view={view} onLockIn={() => {}} onNavigate={() => {}} />
      </Box>

      {/* The switcher. Deliberately plain — it is scaffolding for looking at the
          room, and anything prettier would start competing with it. */}
      {!bare && (
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        {showSwitcher && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              p: '10px',
              borderRadius: radii.md,
              bgcolor: colors.surface1,
              border: `1px solid ${colors.sand200}`,
              boxShadow: '0 18px 48px rgba(15,28,46,0.18)',
            }}
          >
            {STATES.map((state) => {
              const on = state.id === active.id;
              return (
                <Box
                  key={state.id}
                  component="button"
                  type="button"
                  onClick={() => go(state)}
                  sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    px: '10px',
                    py: '6px',
                    borderRadius: radii.sm,
                    bgcolor: on ? colors.navy900 : colors.sand50,
                    border: `1px solid ${on ? colors.navy900 : colors.sand200}`,
                    color: on ? colors.amberSoft : colors.inkSoft,
                    fontFamily: fonts.sans,
                    fontSize: 11.5,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    '&:focus-visible': { outline: `2px solid ${colors.orange}`, outlineOffset: 2 },
                  }}
                >
                  <Box component="span" sx={{ fontFamily: fonts.mono, mr: '6px' }}>{state.id}</Box>
                  {state.label}
                </Box>
              );
            })}
          </Box>
        )}
        <Box
          component="button"
          type="button"
          onClick={() => setShowSwitcher((v) => !v)}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            px: '12px',
            py: '6px',
            borderRadius: radii.pill,
            bgcolor: colors.navy900,
            color: colors.amberSoft,
            fontFamily: fonts.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            boxShadow: '0 10px 24px rgba(15,28,46,0.22)',
            '&:focus-visible': { outline: `2px solid ${colors.orange}`, outlineOffset: 2 },
          }}
        >
          {showSwitcher ? 'Hide states' : `States · ${active.id}`}
        </Box>
      </Box>
      )}

      {!bare && (
      <Typography
        sx={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          zIndex: 40,
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: colors.inkSoft,
          pointerEvents: 'none',
        }}
      >
        {active.id} · {active.label}
      </Typography>
      )}
    </Box>
  );
}
