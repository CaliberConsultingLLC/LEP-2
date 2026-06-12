import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { buttons, colors, fonts, motion, radii, shadows, type } from '../../../styles/tokens';
import { fmtGap, gapOf } from './debriefContent.js';

// ----------------------------------------------------------------------------
// Shared UI for the Signal / Evidence / Practice walkthroughs and snapshots.
// ----------------------------------------------------------------------------

const HIGHLIGHT_TRANSITION =
  'opacity 320ms ease, transform 320ms cubic-bezier(.2,.8,.2,1), border-color 320ms ease, box-shadow 320ms ease';

// ---------------------------------------------------------------------------
// PageFade — entrance via JS-driven transition. The base state is fully
// visible; the hidden start-state exists for one frame after mount, with a
// timer safety net, so content never depends on an animation completing.
// ---------------------------------------------------------------------------
export function PageFade({ fadeKey, sx, children }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    let raf2 = 0;
    let timer = 0;
    const show = () => {
      el.style.transition =
        'opacity 360ms cubic-bezier(.2,.8,.2,1), transform 360ms cubic-bezier(.2,.8,.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'none';
    };
    const raf1 = requestAnimationFrame(() => {
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      raf2 = requestAnimationFrame(show);
      // Timers fire even when rAF doesn't — a frozen frame clock can never
      // strand content hidden.
      timer = setTimeout(show, 120);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    };
  }, [fadeKey]);
  return (
    <Box ref={ref} sx={{ opacity: 1, ...sx }}>
      {children}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Chapter scaffolding
// ---------------------------------------------------------------------------
export function ChapterEyebrow({ index, label, sx }) {
  return (
    <Typography sx={{ ...type.eyebrow, mb: 1.6, ...sx }}>
      {typeof index === 'number' ? String(index).padStart(2, '0') : index} · {label}
    </Typography>
  );
}

export function Headline({ children, size = 'lg', sx }) {
  return (
    <Typography
      component="h1"
      sx={{
        fontFamily: fonts.serif,
        fontWeight: 500,
        letterSpacing: '-0.03em',
        lineHeight: 1.08,
        fontSize: size === 'xl' ? { xs: 34, md: 52 } : { xs: 28, md: 40 },
        color: colors.textPrimary,
        mb: 2.2,
        textWrap: 'pretty',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

export function Prose({ children, serif = false, sx }) {
  return (
    <Typography
      sx={{
        fontFamily: serif ? fonts.serif : fonts.sans,
        fontStyle: serif ? 'italic' : 'normal',
        fontSize: serif ? 18 : 15.5,
        lineHeight: 1.6,
        color: colors.textSecondary,
        mb: 1.8,
        maxWidth: 620,
        textWrap: 'pretty',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

export function TwoCol({ left, right }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' },
        gap: { xs: 3, md: 4.5 },
        alignItems: 'center',
      }}
    >
      <Box>{left}</Box>
      <Box>{right}</Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Walk arrows — the down/up controls inside the trait & gap walks
// ---------------------------------------------------------------------------
export function WalkArrow({ dir, onClick, primary = false, label }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={label || (dir === 'down' ? 'Next' : 'Previous')}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        width: primary ? 48 : 38,
        height: primary ? 48 : 38,
        borderRadius: radii.circle,
        border: primary ? 'none' : `1px solid ${colors.sand300}`,
        bgcolor: primary ? colors.navy900 : colors.surface1,
        color: primary ? colors.amberSoft : colors.textSecondary,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: primary ? 20 : 15,
        boxShadow: primary ? shadows.buttonPrimary : shadows.none,
        transition: motion.standard,
        flexShrink: 0,
        '&:hover': primary ? { bgcolor: colors.navy800 } : { borderColor: colors.navy500 },
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
      }}
    >
      {dir === 'down' ? '↓' : '↑'}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Progress dots — soft gated: clickable, Next is the visual path
// ---------------------------------------------------------------------------
export function ProgressDots({ chapters, current, onJump }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.2} role="tablist" aria-label="Chapters">
      {chapters.map((ch, i) => {
        const active = i === current;
        const past = i < current;
        return (
          <Box
            key={ch.id}
            component="button"
            type="button"
            title={ch.label}
            aria-label={`Chapter ${i + 1}: ${ch.label}`}
            aria-current={active ? 'step' : undefined}
            onClick={() => onJump(i)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              width: active ? 26 : 9,
              height: 9,
              borderRadius: radii.pill,
              bgcolor: active ? colors.orange : past ? colors.navy500 : colors.sand200,
              transition: motion.standard,
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          />
        );
      })}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Footer nav — Back / dots / Next, clustered center
// ---------------------------------------------------------------------------
export function FooterNav({ chapters, idx, setIdx, isLast }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={3.5}
      sx={{ width: '100%', maxWidth: 980, mx: 'auto', px: 3.5, py: 1.6 }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => setIdx(idx - 1)}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          ...buttons.outlinedPrimary,
          visibility: idx === 0 ? 'hidden' : 'visible',
        }}
      >
        ← Back
      </Box>
      <ProgressDots chapters={chapters} current={idx} onJump={setIdx} />
      <Box
        component="button"
        type="button"
        onClick={() => setIdx(idx + 1)}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          ...buttons.primary,
          visibility: isLast ? 'hidden' : 'visible',
        }}
      >
        {idx === 0 ? 'Begin' : 'Next'} →
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Stage — single-viewport centered page + footer, with keyboard nav
// ---------------------------------------------------------------------------
export function WalkthroughStage({ chapters, idx, setIdx, children }) {
  const isLast = idx === chapters.length - 1;

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' && !isLast) setIdx(idx + 1);
      if (e.key === 'ArrowLeft') setIdx(Math.max(0, idx - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, isLast, setIdx]);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3.5,
          pt: 3,
          pb: 1,
        }}
      >
        <PageFade fadeKey={chapters[idx].id} sx={{ width: '100%', maxWidth: 1040 }}>
          {children}
        </PageFade>
      </Box>
      <FooterNav chapters={chapters} idx={idx} setIdx={setIdx} isLast={isLast} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trait scores panel — all traits stacked, one highlighted at a time.
// Compass big; efficacy / effort bars (navy-500 / orange on sand-100 tracks).
// NOTE: cards are <button>s whose styles change across re-renders — explicit
// style reset (not `all: unset`) so React style diffing stays intact.
// ---------------------------------------------------------------------------
const cardResetSx = {
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  appearance: 'none',
  WebkitAppearance: 'none',
  m: 0,
};

function ScoreBar({ label, value, fillColor }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 0.9 }}>
      <Typography sx={{ ...type.monoLabel, width: 60, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, height: 7, borderRadius: radii.pill, bgcolor: colors.sand100, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${Math.round(value)}%`,
            height: '100%',
            borderRadius: radii.pill,
            bgcolor: fillColor,
          }}
        />
      </Box>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 12.5,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: colors.textPrimary,
          width: 26,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {Math.round(value)}
      </Typography>
    </Stack>
  );
}

export function TraitScoresPanel({ rows, highlightKey = null, onSelect = null, cardMinHeight = 0 }) {
  return (
    <Stack spacing={1.5}>
      {rows.map((r) => {
        const isHi = highlightKey === r.trait;
        const dim = highlightKey && !isHi;
        return (
          <Box
            key={r.trait}
            component="button"
            type="button"
            onClick={onSelect ? () => onSelect(r.trait) : undefined}
            sx={{
              ...cardResetSx,
              cursor: onSelect ? 'pointer' : 'default',
              boxSizing: 'border-box',
              display: 'block',
              width: '100%',
              minHeight: cardMinHeight || undefined,
              px: 2.5,
              pt: 2,
              pb: 1.5,
              borderRadius: radii.lg,
              border: `1.5px solid ${isHi ? colors.orange : colors.sand200}`,
              bgcolor: colors.surface1,
              boxShadow: isHi ? shadows.card : shadows.none,
              opacity: dim ? 0.4 : 1,
              transform: isHi ? 'scale(1.025)' : 'scale(1)',
              transition: HIGHLIGHT_TRANSITION,
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1.5} sx={{ mb: 1.2 }}>
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 18, fontWeight: 600, color: colors.textPrimary }}>
                {r.subTrait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.9}>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontWeight: 600,
                    fontSize: isHi ? 36 : 28,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    color: colors.orange,
                    transition: 'font-size 320ms ease',
                  }}
                >
                  {Math.round(r.team.lepScore)}
                </Typography>
                <Typography sx={{ ...type.monoLabel }}>Compass</Typography>
              </Stack>
            </Stack>
            <ScoreBar label="Efficacy" value={r.team.efficacy} fillColor={colors.navy500} />
            <ScoreBar label="Effort" value={r.team.effort} fillColor={colors.orange} />
          </Box>
        );
      })}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Gap scores panel — gap measurements only: signed Compass gap + diverging
// efficacy/effort bars around a center tick (±30 → half-track).
// ---------------------------------------------------------------------------
const GAP_SCALE = 30;

function DivergeBar({ label, gap }) {
  const w = Math.min(50, (Math.abs(gap) / GAP_SCALE) * 50);
  return (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 0.9 }}>
      <Typography sx={{ ...type.monoLabel, width: 60, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, height: 7, borderRadius: radii.pill, bgcolor: colors.sand100, position: 'relative' }}>
        <Box sx={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: '1.5px', bgcolor: colors.sand300 }} />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: gap >= 0 ? '50%' : `${50 - w}%`,
            width: `${w}%`,
            borderRadius: radii.pill,
            bgcolor: gap >= 0 ? colors.orange : colors.navy500,
          }}
        />
      </Box>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 12.5,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: colors.textPrimary,
          width: 32,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {fmtGap(gap)}
      </Typography>
    </Stack>
  );
}

export function GapScoresPanel({ rows, highlightKey, onSelect }) {
  return (
    <Stack spacing={1.5}>
      {rows.map((row) => {
        const isHi = highlightKey === row.trait;
        const dim = highlightKey && !isHi;
        const g = gapOf(row);
        return (
          <Box
            key={row.trait}
            component="button"
            type="button"
            onClick={onSelect ? () => onSelect(row.trait) : undefined}
            sx={{
              ...cardResetSx,
              cursor: onSelect ? 'pointer' : 'default',
              boxSizing: 'border-box',
              display: 'block',
              width: '100%',
              px: 2.5,
              pt: 2,
              pb: 1.5,
              borderRadius: radii.lg,
              border: `1.5px solid ${isHi ? colors.orange : colors.sand200}`,
              bgcolor: colors.surface1,
              boxShadow: isHi ? shadows.card : shadows.none,
              opacity: dim ? 0.4 : 1,
              transform: isHi ? 'scale(1.025)' : 'scale(1)',
              transition: HIGHLIGHT_TRANSITION,
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1.5} sx={{ mb: 1.2 }}>
              <Typography sx={{ fontFamily: fonts.serif, fontSize: 18, fontWeight: 600, color: colors.textPrimary }}>
                {row.subTrait}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.9}>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontWeight: 600,
                    fontSize: isHi ? 34 : 26,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    color: g.compass >= 0 ? colors.orange : colors.navy500,
                    transition: 'font-size 320ms ease',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtGap(g.compass)}
                </Typography>
                <Typography sx={{ ...type.monoLabel }}>Gap</Typography>
              </Stack>
            </Stack>
            <DivergeBar label="Efficacy" gap={g.efficacy} />
            <DivergeBar label="Effort" gap={g.effort} />
          </Box>
        );
      })}
      <Stack direction="row" justifyContent="center" spacing={2}>
        {[
          { c: colors.orange, l: 'You see more' },
          { c: colors.navy500, l: 'They see more' },
        ].map((x) => (
          <Stack key={x.l} direction="row" alignItems="center" spacing={0.7}>
            <Box sx={{ width: 9, height: 9, borderRadius: radii.circle, bgcolor: x.c }} />
            <Typography sx={{ ...type.monoLabel }}>{x.l}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Snapshot scaffolding
// ---------------------------------------------------------------------------
export function SnapshotShell({ children }) {
  return (
    <Box component="main" sx={{ width: '100%', maxWidth: 1180, mx: 'auto', px: 3.5, pt: 4.5, pb: 7 }}>
      {children}
    </Box>
  );
}

export function SnapshotHeader({ phaseLabel, title, sub, onReplay, replayLabel = 'Walk through again' }) {
  return (
    <Stack
      direction="row"
      alignItems="flex-end"
      justifyContent="space-between"
      spacing={2.5}
      sx={{ mb: 3.2, flexWrap: 'wrap', rowGap: 1.6 }}
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1 }}>
          <Typography sx={{ ...type.eyebrow }}>{phaseLabel}</Typography>
          <Typography sx={{ ...type.eyebrow, color: colors.green, letterSpacing: '0.14em' }}>✓ Complete</Typography>
        </Stack>
        <Typography
          component="h1"
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            fontSize: { xs: 26, md: 34 },
            lineHeight: 1.1,
            color: colors.textPrimary,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ ...type.italicBody, color: colors.textSecondary, maxWidth: 560 }}>{sub}</Typography>
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onReplay}
        sx={{ all: 'unset', cursor: 'pointer', ...buttons.outlinedPrimary, flexShrink: 0 }}
      >
        ↻ {replayLabel}
      </Box>
    </Stack>
  );
}
