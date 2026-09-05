/**
 * The Today room — Chapter VI's landing, across four moments and two themes.
 *
 * One component, not eight. `view.moment` decides the pose, the copy, and what
 * sits under the headline; `view.theme` swaps the palette. The layout underneath
 * is the same in all eight states, which is the point: a leader who comes back
 * in March should recognise the room they left in January.
 *
 * Sizing is in container-query units against the room itself, so the whole
 * composition scales with the card rather than the viewport. Every ratio below
 * is taken from the 1280px mockups: the room's padding is 3.3% of its width,
 * the porthole a quarter, the owl a third, and the owl bleeds off its corner by
 * roughly a quarter of its own size.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import JourneyPorthole from '../../../components/JourneyPorthole';
import { JOURNEY_STATIONS } from '../journey/journeyModel.js';
import { LOCK_PHRASE, lockHint } from './todayRoomModel.js';

// ---------------------------------------------------------------------------
// Palette. Two themes, one shape. Raw hex rather than tokens in a few places
// because the room paints its own night ground — these colours are the room's,
// not the app surface's, and remapping them with the app theme would break it.
// ---------------------------------------------------------------------------

const PALETTE = {
  night: {
    isDay: false,
    room: 'radial-gradient(ellipse 46% 70% at 84% 78%, rgba(236,201,75,0.28), transparent 70%), radial-gradient(ellipse 60% 60% at 18% 30%, rgba(30,58,92,0.6), transparent 70%), linear-gradient(160deg,#10223c,#09101f 75%)',
    roomShadow: '0 30px 60px rgba(9,16,31,0.28), inset 0 1px 0 rgba(244,206,161,0.18)',
    mapOpacity: 0.07,
    mapBlend: 'screen',
    lantern: 'radial-gradient(circle, rgba(236,201,75,0.42), rgba(224,122,63,0.14) 45%, transparent 70%)',
    lanternNotes: 'radial-gradient(circle, rgba(224,122,63,0.45), rgba(236,201,75,0.14) 45%, transparent 70%)',
    ink: '#fbf7f0',
    inkSoft: 'rgba(251,247,240,0.75)',
    amber: '#f4cea1',
    accent: '#e07a3f',
    faint: 'rgba(244,206,161,0.6)',
    panel: 'rgba(251,247,240,0.06)',
    panelBorder: 'rgba(244,206,161,0.16)',
    hair: 'rgba(244,206,161,0.16)',
    rowHover: 'rgba(244,206,161,0.08)',
    rowActive: 'rgba(244,206,161,0.12)',
    footerFade: 'linear-gradient(180deg, rgba(9,16,31,0), rgba(9,16,31,0.75) 30%)',
    bubbleBg: '#fbf7f0',
    bubbleInk: '#0f1c2e',
    bubbleShadow: '0 12px 32px rgba(0,0,0,0.35)',
    owlFilter: 'drop-shadow(0 0 40px rgba(236,201,75,0.35)) drop-shadow(0 20px 30px rgba(0,0,0,0.5))',
    btnBg: '#f4cea1',
    btnInk: '#10223c',
    btnShadow: '0 8px 20px rgba(0,0,0,0.3)',
    ghostBorder: 'rgba(244,206,161,0.4)',
    ghostInk: '#f4cea1',
    ghostHover: '#f4cea1',
    inputBg: 'rgba(9,16,31,0.5)',
    inputBorder: 'rgba(244,206,161,0.35)',
    inputFocus: '#f4cea1',
    dialFace: '#0e1c31',
    dialInk: '#fbf7f0',
    dialSub: 'rgba(244,206,161,0.6)',
    ringTrack: 'rgba(244,206,161,0.14)',
    ringHigh: '#e1af43',
    traitCardBg: 'rgba(244,206,161,0.1)',
    traitCardBorder: 'rgba(244,206,161,0.35)',
    traitCardHover: 'rgba(244,206,161,0.1)',
    chipBorder: 'rgba(244,206,161,0.25)',
    chipInk: '#fbf7f0',
    noteShadow: '0 14px 30px rgba(0,0,0,0.35)',
    nudgeBg: 'rgba(224,122,63,0.12)',
    nudgeBorder: 'rgba(224,122,63,0.35)',
    toggleBg: 'rgba(251,247,240,0.06)',
    toggleBorder: 'rgba(244,206,161,0.3)',
    toggleInk: '#f4cea1',
    stationDone: '#2f855a',
    stationIdleBorder: 'rgba(244,206,161,0.35)',
    stationIdleInk: 'rgba(244,206,161,0.6)',
    stationLabelDone: 'rgba(251,247,240,0.75)',
    stationLabelIdle: 'rgba(244,206,161,0.5)',
    good: '#6f9a83',
  },
  day: {
    isDay: true,
    room: 'radial-gradient(ellipse 50% 70% at 88% 6%, rgba(244,206,161,0.75), transparent 70%), radial-gradient(ellipse 60% 60% at 10% 90%, rgba(232,219,195,0.6), transparent 70%), linear-gradient(160deg,#ffffff,#fbf7f0 75%)',
    roomShadow: '0 18px 40px rgba(15,28,46,0.06), 0 0 0 1px #e8dbc3',
    mapOpacity: 0.22,
    mapBlend: 'multiply',
    lantern: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(244,206,161,0.35) 45%, transparent 70%)',
    lanternNotes: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(244,206,161,0.35) 45%, transparent 70%)',
    ink: '#0f1c2e',
    inkSoft: '#44566c',
    amber: '#e07a3f',
    accent: '#c0612a',
    faint: '#44566c',
    panel: '#ffffff',
    panelBorder: '#e8dbc3',
    hair: '#e8dbc3',
    rowHover: 'rgba(15,28,46,0.05)',
    rowActive: '#ffffff',
    footerFade: 'linear-gradient(180deg, rgba(251,247,240,0), rgba(251,247,240,0.9) 30%)',
    bubbleBg: '#10223c',
    bubbleInk: '#f4cea1',
    bubbleShadow: '0 12px 32px rgba(15,28,46,0.22)',
    owlFilter: 'drop-shadow(0 24px 30px rgba(15,28,46,0.22))',
    btnBg: '#10223c',
    btnInk: '#f4cea1',
    btnShadow: '0 8px 20px rgba(15,28,46,0.18)',
    ghostBorder: '#3f647b',
    ghostInk: '#10223c',
    ghostHover: '#c0612a',
    inputBg: '#ffffff',
    inputBorder: '#e8dbc3',
    inputFocus: '#c0612a',
    dialFace: '#ffffff',
    dialInk: '#0f1c2e',
    dialSub: '#44566c',
    ringTrack: 'rgba(15,28,46,0.08)',
    ringHigh: '#10223c',
    traitCardBg: '#ffffff',
    traitCardBorder: '#e8dbc3',
    traitCardHover: '#ffffff',
    chipBorder: '#e8dbc3',
    chipInk: '#0f1c2e',
    noteShadow: '0 14px 30px rgba(15,28,46,0.14)',
    nudgeBg: 'rgba(244,206,161,0.25)',
    nudgeBorder: '#e07a3f',
    toggleBg: '#ffffff',
    toggleBorder: '#e8dbc3',
    toggleInk: '#44566c',
    stationDone: '#2f855a',
    stationIdleBorder: '#d1bc93',
    stationIdleInk: '#44566c',
    stationLabelDone: '#2f855a',
    stationLabelIdle: '#44566c',
    good: '#2f855a',
  },
};

const ORANGE = '#e07a3f';
const GREEN = '#2f855a';
const RED = '#b4321f';

const FONT_SERIF = '"Fraunces", Georgia, serif';
const FONT_SANS = '"Manrope", "Inter", "Segoe UI", sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';

const NUMBER_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const spellOut = (n) => (Number.isFinite(Number(n)) && NUMBER_WORD[Number(n)]) || String(n ?? '');

const NOTE_UP = [
  'Logged. Keep it small enough to keep.',
  'Good. That is the one they will notice first.',
  'Noted. Say it out loud once more this week.',
];
const NOTE_DOWN = [
  'Fair. Six weeks is long. Pick one day this week.',
  'Then start with the smallest decision you own.',
  'Honest counts. The check-in will show it either way.',
];

/* Native <button> chrome does not fall to `all: unset` on Windows browsers. */
const bare = {
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  border: 'none',
  boxShadow: 'none',
  margin: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  textAlign: 'inherit',
  '&::-moz-focus-inner': { border: 0, padding: 0 },
};

const eyebrowSx = (color, size = 10) => ({
  fontFamily: FONT_MONO,
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color,
});

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function PillButton({ p, variant = 'solid', children, onClick, disabled, sx }) {
  const solid = variant === 'solid';
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        ...bare,
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 42,
        px: '22px',
        borderRadius: '999px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        bgcolor: solid ? p.btnBg : 'transparent',
        color: solid ? p.btnInk : p.ghostInk,
        border: solid ? 'none' : `1px solid ${p.ghostBorder}`,
        boxShadow: solid ? p.btnShadow : 'none',
        fontFamily: FONT_SANS,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), border-color 180ms',
        '&:hover': disabled ? undefined : { transform: 'translateY(-1px)', borderColor: solid ? undefined : p.ghostHover },
        '&:focus-visible': { outline: `3px solid ${ORANGE}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** The year, nine rows. Clicking a row pans the porthole — it navigates nowhere. */
function StationList({ p, currentIndex, picked, onPick }) {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', px: '6px', pb: '8px' }}>
        <Typography component="span" sx={eyebrowSx(p.accent, 9.5)}>The year</Typography>
        <Typography
          component="span"
          sx={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: p.faint }}
        >
          {currentIndex} / {JOURNEY_STATIONS.length}
        </Typography>
      </Box>
      {JOURNEY_STATIONS.map((station, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const selected = i === picked;
        return (
          <Box
            key={station.key}
            component="button"
            type="button"
            onClick={() => onPick(i)}
            /* `aria-current="location"`, not `aria-pressed`: picking a station
               pans the map rather than toggling anything, and the app's global
               chip styling owns `aria-pressed` and would paint this row navy. */
            aria-current={selected ? 'location' : undefined}
            sx={{
              ...bare,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              px: '8px',
              py: '5px',
              borderRadius: '10px',
              bgcolor: selected ? p.rowActive : 'transparent',
              transition: 'background 180ms cubic-bezier(0.2,0.8,0.2,1)',
              '&:hover': { bgcolor: p.rowHover },
              '&:focus-visible': { outline: `2px solid ${ORANGE}`, outlineOffset: 1 },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 18,
                height: 18,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                fontFamily: FONT_MONO,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: done ? p.stationDone : current ? ORANGE : 'transparent',
                border: `1px solid ${done ? p.stationDone : current ? ORANGE : p.stationIdleBorder}`,
                color: done || current ? '#fff' : p.stationIdleInk,
              }}
            >
              {done ? '✓' : i + 1}
            </Box>
            <Typography
              component="span"
              sx={{
                flex: 1,
                textAlign: 'left',
                fontFamily: FONT_SANS,
                fontSize: 12.5,
                fontWeight: current ? 700 : 500,
                color: current ? p.ink : done ? p.stationLabelDone : p.stationLabelIdle,
              }}
            >
              {station.label}
            </Typography>
            {current && (
              <Typography
                component="span"
                sx={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: ORANGE }}
              >
                now
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/** One trait ring. `compact` is the row form the notes moment uses. */
function TraitDial({ p, trait, selected, onClick, sub, subColor, compact = false }) {
  const low = trait.team < 60;
  const ringColor = low ? ORANGE : p.ringHigh;
  const size = compact ? 64 : 104;
  const face = compact ? 50 : 84;
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      sx={{
        ...bare,
        cursor: 'pointer',
        flex: 1,
        minWidth: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: 'center',
        gap: compact ? '12px' : '10px',
        padding: compact ? '8px 12px' : '16px 10px 14px',
        borderRadius: '20px',
        bgcolor: selected ? p.traitCardBg : 'transparent',
        border: `1px solid ${selected ? p.traitCardBorder : 'transparent'}`,
        transition: 'all 220ms cubic-bezier(0.2,0.8,0.2,1)',
        '&:hover': { bgcolor: p.traitCardHover },
        '&:focus-visible': { outline: `3px solid ${ORANGE}`, outlineOffset: 2 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '50%',
          background: `conic-gradient(${ringColor} ${trait.team * 3.6}deg, ${p.ringTrack} 0)`,
          boxShadow: selected
            ? (p.isDay
              ? '0 0 0 4px rgba(224,122,63,0.18), 0 14px 30px rgba(15,28,46,0.16)'
              : `0 0 0 4px rgba(244,206,161,0.18), 0 0 40px ${low ? 'rgba(224,122,63,0.55)' : 'rgba(236,201,75,0.45)'}`)
            : '0 0 0 0 transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 220ms',
        }}
      >
        <Box
          sx={{
            width: face,
            height: face,
            borderRadius: '50%',
            bgcolor: p.dialFace,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: FONT_SERIF,
              fontWeight: 600,
              fontSize: compact ? 20 : 32,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: p.dialInk,
            }}
          >
            {trait.team}
          </Typography>
          {!compact && (
            <Typography
              component="span"
              sx={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: '0.14em', color: p.dialSub }}
            >
              SELF {trait.self}
            </Typography>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: compact ? 'flex-start' : 'center',
          gap: compact ? '3px' : '10px',
          minWidth: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 700,
            color: p.isDay ? p.ink : p.amber,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {trait.name}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: FONT_MONO,
            fontSize: compact ? 9 : 9.5,
            fontWeight: 700,
            letterSpacing: compact ? '0.1em' : '0.12em',
            color: subColor,
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </Typography>
      </Box>
    </Box>
  );
}

/** The frosted panel every moment puts its one action inside. */
function ActionPanel({ p, children, tinted = false, sx }) {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        bgcolor: tinted ? p.nudgeBg : p.panel,
        border: `1px solid ${tinted ? p.nudgeBorder : p.panelBorder}`,
        padding: tinted ? '18px 22px' : 'clamp(18px, 2.1cqw, 26px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function FooterChip({ p, mark, label, bg, border }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 12px',
        borderRadius: '999px',
        border: `1px solid ${border || p.chipBorder}`,
        bgcolor: bg || 'transparent',
        fontFamily: FONT_SANS,
        fontSize: 12,
        fontWeight: 600,
        color: p.chipInk,
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" aria-hidden>{mark}</Box>
      {label}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

export default function TodayRoom({
  view,
  onLockIn,
  onNavigate = () => {},
  onCopyLink,
}) {
  const { moment, theme, traits } = view;
  const p = PALETTE[theme] || PALETTE.night;
  const isReading = moment === 'reading';

  const [picked, setPicked] = useState(view.stationIndex);
  const [traitIdx, setTraitIdx] = useState(() => {
    const firstUnread = traits.findIndex((t) => !t.read);
    return firstUnread >= 0 ? firstUnread : 0;
  });
  const [lockText, setLockText] = useState('');
  const [kept, setKept] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => { setPicked(view.stationIndex); }, [view.stationIndex]);

  const trait = traits[Math.min(traitIdx, traits.length - 1)] || traits[0] || {};
  const lockReady = lockText.trim().toLowerCase() === LOCK_PHRASE.toLowerCase();
  const outstanding = Math.max(0, (view.invited || 0) - (view.responded || 0));

  // Clicking a station shifts the map and nothing else, so the line the guide
  // is saying should follow the map rather than stay pinned to the moment.
  const spokenLine = useMemo(() => {
    if (picked === view.stationIndex) return view.owlLine;
    const station = JOURNEY_STATIONS[picked];
    if (!station) return view.owlLine;
    // Behind them, the station is something they did; ahead, it is something
    // waiting. Reading the wrong one out loud is how a guide stops sounding
    // like he was there.
    const walked = picked < view.stationIndex;
    return (walked ? station.completeBlurb : station.blurb) || station.blurb || view.owlLine;
  }, [picked, view.stationIndex, view.owlLine]);

  const gapSub = (t) => {
    const gap = t.team - t.self;
    return {
      sub: `${gap > 0 ? '+' : ''}${gap} vs self`,
      subColor: gap < -8 ? ORANGE : gap >= 0 ? p.good : p.faint,
    };
  };

  const copyLink = () => {
    if (onCopyLink) onCopyLink(view.teamLink);
    else if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(view.teamLink).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  // -- the three columns ------------------------------------------------------

  const portholeCell = (
    <Box
      sx={{
        gridColumn: { xs: '1 / -1', md: isReading ? '2 / 3' : '1 / 2', lg: isReading ? '3 / 4' : '1 / 2' },
        gridRow: { xs: 2, md: 1 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '22px',
        minWidth: 0,
      }}
    >
      <JourneyPorthole variant="room" size="var(--porthole)" chapterIndex={picked} />
      <StationList p={p} currentIndex={view.stationIndex} picked={picked} onPick={setPicked} />
    </Box>
  );

  const owlCell = (
    <Box
      sx={{
        gridColumn: { xs: '1 / -1', md: '1 / -1', lg: isReading ? '1 / 2' : '3 / 4' },
        gridRow: { xs: 3, md: 2, lg: 1 },
        position: 'relative',
        minHeight: {
          xs: 'calc(var(--owl-w) * 0.74 + 150px)',
          lg: 'calc(var(--owl-w) * 1.4)',
        },
      }}
    >
      {/* Owl box. The bubble is a child so it follows when the owl scales. */}
      <Box
        sx={{
          position: 'absolute',
          width: 'var(--owl-w)',
          height: 'var(--owl-w)',
          bottom: 'calc(var(--owl-w) * -0.275)',
          ...(isReading
            ? { left: 'calc(var(--owl-w) * -0.15)' }
            : { right: 'calc(var(--owl-w) * -0.15)' }),
        }}
      >
        <Box
          component="img"
          src={view.owlSrc}
          alt=""
          draggable={false}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: p.owlFilter,
            pointerEvents: 'none',
            transformOrigin: '50% 100%',
            animation: 'todayOwlBob 4s ease-in-out infinite',
            '@keyframes todayOwlBob': {
              '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
              '50%': { transform: 'translateY(-6px) rotate(-1deg)' },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '93%',
            ...(isReading ? { left: '22.5%' } : { right: '22.5%' }),
            // Tall and narrow, never a wide speech box: the mock's 196px of
            // text plus 18px of padding either side, held at ~58% of the owl.
            width: 'clamp(196px, calc(var(--owl-w) * 0.58), 268px)',
            padding: '16px 18px 18px',
            borderRadius: '18px',
            bgcolor: p.bubbleBg,
            color: p.bubbleInk,
            boxShadow: p.bubbleShadow,
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontSize: 14.5,
            lineHeight: 1.5,
          }}
        >
          {spokenLine}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              bottom: -11,
              ...(isReading ? { left: '27.5%' } : { right: '27.5%' }),
              width: 0,
              height: 0,
              borderTop: `12px solid ${p.bubbleBg}`,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  // -- what sits under the headline ------------------------------------------

  const body = (() => {
    if (moment === 'listening') {
      // No declared invite count means no denominator: the room shows how many
      // came back and leaves the fraction alone. The dot row is a glance, not a
      // tally, so it stands down once a team is too big to count at a glance.
      const target = Number(view.invited) || 0;
      const showDots = target > 0 && target <= 16 && view.responded <= target;
      return (
        <>
          <Typography
            sx={{
              fontFamily: FONT_SERIF,
              fontWeight: 600,
              fontSize: 'clamp(74px, 10cqw, 132px)',
              lineHeight: 0.85,
              letterSpacing: '-0.05em',
              color: p.ink,
              whiteSpace: 'nowrap',
            }}
          >
            {view.responded}
            {target > 0 && (
              <Box component="span" sx={{ fontSize: '0.32em', color: p.faint, fontWeight: 500, letterSpacing: '-0.02em' }}>
                {' '}/ {target}
              </Box>
            )}
          </Typography>
          <ActionPanel p={p}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Typography component="span" sx={eyebrowSx(p.accent)}>Lock in this assessment</Typography>
              <Box aria-hidden sx={{ display: showDots ? 'flex' : 'none', gap: '6px', flexWrap: 'wrap' }}>
                {Array.from({ length: showDots ? target : 0 }, (_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      boxSizing: 'border-box',
                      bgcolor: i < view.responded ? ORANGE : 'transparent',
                      border: `1px solid ${i < view.responded ? ORANGE : p.stationIdleBorder}`,
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Typography sx={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 500, lineHeight: 1.35, color: p.ink }}>
              You can lock it in now{target > 0 ? ` — even before all ${spellOut(target)}` : ''}. It is
              irreversible: results are calculated and no more feedback lands.
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', mt: '4px' }}>
              <Box
                component="input"
                type="text"
                value={lockText}
                spellCheck={false}
                aria-label={`Type “${LOCK_PHRASE}” to confirm`}
                placeholder={`Type “${LOCK_PHRASE}”`}
                onChange={(e) => setLockText(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: 240,
                  height: 42,
                  px: '16px',
                  boxSizing: 'border-box',
                  borderRadius: '10px',
                  border: `1px solid ${p.inputBorder}`,
                  bgcolor: p.inputBg,
                  color: p.ink,
                  fontFamily: FONT_SANS,
                  fontSize: 14,
                  outline: 'none',
                  '&::placeholder': { color: p.faint },
                  '&:focus': { borderColor: p.inputFocus },
                }}
              />
              <PillButton p={p} disabled={!lockReady} onClick={() => lockReady && onLockIn?.()}>
                Lock In
              </PillButton>
            </Box>
            <Typography
              sx={{ fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 13, color: p.amber, minHeight: 18 }}
              aria-live="polite"
            >
              {lockHint(lockText, lockReady, outstanding)}
            </Typography>
          </ActionPanel>
        </>
      );
    }

    if (moment === 'reading') {
      return (
        <>
          <Box sx={{ display: 'flex', gap: 'clamp(10px, 1.5cqw, 18px)' }}>
            {traits.map((t, i) => (
              <TraitDial
                key={t.key}
                p={p}
                trait={t}
                selected={i === traitIdx}
                onClick={() => setTraitIdx(i)}
                sub={t.read ? 'Read' : 'Unread'}
                subColor={t.read ? p.good : ORANGE}
              />
            ))}
          </Box>
          <ActionPanel p={p}>
            <Typography component="span" sx={eyebrowSx(p.accent)}>
              {trait.name} · {trait.read ? 'Evidence read' : 'Evidence unread'}
            </Typography>
            <Typography sx={{ fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 19, lineHeight: 1.35, color: p.ink }}>
              “{trait.statement}”
            </Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 14, lineHeight: 1.5, color: p.inkSoft }}>
              {view.readingBody}
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', mt: '6px', flexWrap: 'wrap' }}>
              <PillButton p={p} onClick={() => onNavigate('evidence')}>Keep reading · Evidence</PillButton>
              <PillButton p={p} variant="ghost" onClick={() => onNavigate('narrative')}>Replay the narrative</PillButton>
            </Box>
          </ActionPanel>
        </>
      );
    }

    if (moment === 'notes') {
      const notes = trait.notes || [];
      return (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              {traits.map((t, i) => (
                <TraitDial
                  key={t.key}
                  p={p}
                  trait={t}
                  compact
                  selected={i === traitIdx}
                  onClick={() => setTraitIdx(i)}
                  sub={`${(t.notes || []).length} notes`}
                  subColor={p.faint}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                <Typography component="span" sx={eyebrowSx(p.accent)}>{trait.name} · Your notes</Typography>
                <Typography
                  component="span"
                  sx={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.faint }}
                >
                  field journal
                </Typography>
              </Box>
              {notes.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '16px', alignItems: 'start' }}>
                  {notes.map((note, i) => (
                    <Box
                      key={`${trait.key}-${i}`}
                      sx={{
                        position: 'relative',
                        minWidth: 0,
                        bgcolor: '#f4ecdd',
                        backgroundImage:
                          'repeating-linear-gradient(180deg, transparent 0 25px, rgba(209,188,147,0.45) 25px 26px)',
                        borderRadius: '4px 12px 4px 12px',
                        padding: '14px 16px 12px',
                        boxShadow: p.noteShadow,
                        transform: i % 2 ? 'rotate(0.5deg)' : 'rotate(-0.6deg)',
                      }}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          top: -8,
                          transform: 'translateX(-50%) rotate(1.5deg)',
                          width: 56,
                          height: 16,
                          bgcolor: 'rgba(244,206,161,0.75)',
                          border: '1px solid rgba(192,97,42,0.25)',
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: FONT_SERIF,
                          fontStyle: 'italic',
                          fontSize: 14.5,
                          lineHeight: 1.8,
                          color: '#0f1c2e',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        “{note}”
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 15, color: p.inkSoft }}>
                  Nothing written against {trait.name} yet. The evidence page is where notes get made.
                </Typography>
              )}
            </Box>
          </Box>
          <ActionPanel p={p} tinted>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
              <Typography
                sx={{ flex: 1, minWidth: 260, fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 500, lineHeight: 1.35, color: p.ink }}
              >
                No practice written for{' '}
                <Box component="em" sx={{ color: p.amber }}>{trait.name}</Box>{' '}
                yet. One visible behavior, small enough for a normal week.
              </Typography>
              <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <PillButton p={p} onClick={() => onNavigate('practice')}>Write the practice</PillButton>
                <PillButton p={p} variant="ghost" onClick={() => onNavigate('practice')}>Later — email me a nudge</PillButton>
              </Box>
            </Box>
          </ActionPanel>
        </>
      );
    }

    // plan
    const answer = kept[traitIdx];
    const setAnswer = (value) =>
      setKept((prev) => ({ ...prev, [traitIdx]: prev[traitIdx] === value ? null : value }));
    const toggleSx = (active, activeBg) => ({
      ...bare,
      cursor: 'pointer',
      boxSizing: 'border-box',
      height: 40,
      px: '18px',
      borderRadius: '999px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: FONT_SANS,
      fontSize: 13,
      fontWeight: 700,
      bgcolor: active ? activeBg : p.toggleBg,
      border: `1px solid ${active ? activeBg : p.toggleBorder}`,
      color: active ? '#fff' : p.toggleInk,
      transition: 'all 180ms',
      '&:hover': { borderColor: p.ghostHover },
      '&:focus-visible': { outline: `3px solid ${ORANGE}`, outlineOffset: 2 },
    });
    return (
      <>
        <Box sx={{ display: 'flex', gap: 'clamp(10px, 1.5cqw, 18px)' }}>
          {traits.map((t, i) => {
            const { sub, subColor } = gapSub(t);
            return (
              <TraitDial
                key={t.key}
                p={p}
                trait={t}
                selected={i === traitIdx}
                onClick={() => setTraitIdx(i)}
                sub={sub}
                subColor={subColor}
              />
            );
          })}
        </Box>
        <ActionPanel p={p}>
          <Typography component="span" sx={eyebrowSx(p.accent)}>{trait.name} · Action plan</Typography>
          <Typography
            sx={{ fontFamily: FONT_SERIF, fontSize: 23, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.01em', color: p.ink }}
          >
            {trait.practice}
          </Typography>
          <Typography sx={{ fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 17, lineHeight: 1.4, color: p.amber, mt: '4px' }}>
            Have you actually been doing this? Just checking.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', mt: '4px' }}>
            <Box component="button" type="button" onClick={() => setAnswer('up')} sx={toggleSx(answer === 'up', GREEN)}>
              <span aria-hidden>👍</span> Yes, mostly
            </Box>
            <Box component="button" type="button" onClick={() => setAnswer('down')} sx={toggleSx(answer === 'down', RED)}>
              <span aria-hidden>👎</span> Not really
            </Box>
            <Typography
              sx={{ fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 13.5, color: p.amber, ml: '6px' }}
              aria-live="polite"
            >
              {answer === 'up' ? NOTE_UP[traitIdx % NOTE_UP.length] : answer === 'down' ? NOTE_DOWN[traitIdx % NOTE_DOWN.length] : ''}
            </Typography>
          </Box>
        </ActionPanel>
      </>
    );
  })();

  // -- footer -----------------------------------------------------------------

  const footerBody = (() => {
    if (moment === 'listening') {
      return (
        <Box
          component="button"
          type="button"
          onClick={copyLink}
          sx={{
            ...bare,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 14px',
            borderRadius: '999px',
            border: `1px solid ${p.chipBorder}`,
            fontFamily: FONT_MONO,
            fontSize: 11.5,
            color: p.amber,
            transition: 'border-color 180ms',
            '&:hover': { borderColor: p.ghostHover },
            '&:focus-visible': { outline: `2px solid ${ORANGE}`, outlineOffset: 2 },
          }}
        >
          {view.teamLink}
          <Box component="span" sx={{ color: p.faint }}>· {copied ? 'copied' : 'copy'}</Box>
        </Box>
      );
    }
    if (moment === 'reading') {
      return (
        <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {traits.map((t) => (
            <FooterChip
              key={t.key}
              p={p}
              mark={t.read ? '✓' : '○'}
              label={t.name}
              bg={t.read ? (theme === 'night' ? 'rgba(47,133,90,0.25)' : 'rgba(47,133,90,0.12)') : undefined}
              border={t.read ? GREEN : undefined}
            />
          ))}
        </Box>
      );
    }
    if (moment === 'notes') {
      return (
        <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {traits.map((t) => <FooterChip key={t.key} p={p} mark="○" label={t.name} />)}
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {traits.map((t, i) => {
          const v = kept[i];
          return (
            <FooterChip
              key={t.key}
              p={p}
              mark={v === 'up' ? '👍' : v === 'down' ? '👎' : '○'}
              label={t.name}
              bg={v === 'up'
                ? (theme === 'night' ? 'rgba(47,133,90,0.25)' : 'rgba(47,133,90,0.12)')
                : v === 'down'
                  ? (theme === 'night' ? 'rgba(180,50,31,0.25)' : 'rgba(180,50,31,0.1)')
                  : undefined}
              border={v === 'up' ? GREEN : v === 'down' ? RED : undefined}
            />
          );
        })}
      </Box>
    );
  })();

  // -- the room ---------------------------------------------------------------

  return (
    <Box
      data-today-room={moment}
      sx={{
        containerType: 'inline-size',
        position: 'relative',
        width: '100%',
        maxWidth: 1560,
        mx: 'auto',
        borderRadius: '24px',
        overflow: 'hidden',
        background: p.room,
        boxShadow: p.roomShadow,
        color: p.ink,
        fontFamily: FONT_SANS,
        minHeight: { xs: 480, lg: 600 },
        display: 'flex',
        flexDirection: 'column',
        // Every ratio below is measured off the 1280px mockups, expressed
        // against the room instead of the page so the composition survives the
        // shell being any width at all.
        '--room-pad': 'clamp(22px, 3.35cqw, 54px)',
        '--porthole': 'clamp(212px, 25cqw, 320px)',
        '--owl-w': 'clamp(268px, 33cqw, 440px)',
        '--lantern': 'clamp(300px, 35cqw, 540px)',
      }}
    >
      {/* Layer 1 — the map, screened into the ground. */}
      <Box
        component="img"
        src="/journey-base.png"
        alt=""
        aria-hidden
        draggable={false}
        sx={{
          position: 'absolute',
          left: '-3%',
          top: -120,
          width: '114%',
          opacity: p.mapOpacity,
          mixBlendMode: p.mapBlend,
          filter: 'grayscale(1)',
          pointerEvents: 'none',
        }}
      />
      {/* Layer 2 — the lantern, breathing behind the owl. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          ...(isReading ? { left: '10%' } : { right: '10%' }),
          bottom: '10%',
          width: 'var(--lantern)',
          height: 'var(--lantern)',
          borderRadius: '50%',
          background: moment === 'notes' ? p.lanternNotes : p.lantern,
          pointerEvents: 'none',
          animation: 'todayLantern 4.5s ease-in-out infinite',
          '@keyframes todayLantern': {
            '0%, 100%': { opacity: 0.55 },
            '50%': { opacity: 0.85 },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.7 },
        }}
      />

      {/* Layer 3 — the content grid. */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: isReading
              ? 'minmax(0, 1fr) clamp(248px, 30cqw, 360px)'
              : 'clamp(248px, 30cqw, 360px) minmax(0, 1fr)',
            // The mock's 340 / fluid / 300 split, pulled in by ~20px a side. The
            // owl column only sets where the owl anchors — its outer edge is
            // the grid's, so narrowing it moves nothing — and the porthole is
            // centred with room to spare. What the two give up, the middle
            // column takes, which is what keeps the action card's buttons on
            // one row instead of spilling past the card the way the mock does.
            lg: isReading
              ? 'clamp(232px, 22.5cqw, 320px) minmax(0, 1fr) clamp(268px, 26.8cqw, 366px)'
              : 'clamp(268px, 26.8cqw, 366px) minmax(0, 1fr) clamp(232px, 22.5cqw, 320px)',
          },
          gap: 'clamp(22px, 2.6cqw, 40px)',
          padding: 'var(--room-pad) var(--room-pad) 0',
          alignContent: 'start',
        }}
      >
        {portholeCell}

        <Box
          sx={{
            gridColumn: { xs: '1 / -1', md: isReading ? '1 / 2' : '2 / 3', lg: '2 / 3' },
            gridRow: { xs: 1, md: 1 },
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
            minWidth: 0,
          }}
        >
          <Box>
            <Typography sx={{ ...eyebrowSx(p.accent), mb: '12px' }}>{view.eyebrow}</Typography>
            <Typography
              component="h1"
              sx={{
                margin: 0,
                fontFamily: FONT_SERIF,
                fontWeight: 500,
                fontSize: 'clamp(29px, 3.5cqw, 46px)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: p.ink,
                textWrap: 'pretty',
              }}
            >
              {view.headline.lead}{' '}
              <Box component="em" sx={{ color: p.amber }}>{view.headline.em}</Box>
              {view.headline.tail ? ` ${view.headline.tail}` : ''}
            </Typography>
          </Box>
          {body}
        </Box>

        {owlCell}
      </Box>

      {/* Layer 4 — the footer strip, with its own fade so the owl's feet do not
          collide with the link chip. */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 4,
          mt: '26px',
          mx: 'var(--room-pad)',
          pt: '16px',
          pb: '26px',
          borderTop: `1px solid ${p.hair}`,
          display: 'flex',
          alignItems: 'center',
          gap: '26px',
          flexWrap: 'wrap',
          background: p.footerFade,
        }}
      >
        <Typography component="span" sx={{ ...eyebrowSx(p.faint, 9.5), whiteSpace: 'nowrap' }}>
          {view.footerLabel}
        </Typography>
        {footerBody}
        <Typography
          sx={{
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontSize: 14,
            color: p.inkSoft,
            maxWidth: 320,
            ml: 'auto',
          }}
        >
          {view.aside}
        </Typography>
      </Box>
    </Box>
  );
}
