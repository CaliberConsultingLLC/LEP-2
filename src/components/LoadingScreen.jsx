// The wait.
//
// Generating a reflection takes about three minutes, which is a long time to
// look at three pulsing dots on a photograph. This is the same room as the
// rest of the product — sand, Fraunces, the guide standing at the left edge —
// so the wait reads as part of the walk rather than a gap in it.
//
// Callers keep the props they already passed: `title`, `subtitle`, `hint`.
// `step` / `totalSteps` are optional; supply them and the card shows real
// progress instead of a spinner that knows nothing.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useGuide } from '../context/GuideContext';
import { guideImage } from '../data/guideArt';
import { SUMMARY_GUIDE_OWL_SX } from './summaryGuideLayout';
import { colors, fonts, radii, surfaces, type } from '../styles/tokens';

// Shown only when a caller has nothing more specific to say. Written to be
// true of any long wait in the product, and to sound like the guide is in the
// room rather than a progress bar apologising.
const WAITING_LINES = [
  'Reading what you actually wrote, not what it expected.',
  'This part does not hurry well. Give it the three minutes.',
  'Sorting the patterns from the one-offs.',
  'The good version of this takes longer than the fast one.',
];

function LoadingScreen({ title = 'Loading…', subtitle, hint, step, totalSteps }) {
  const { personaId, persona } = useGuide();
  const [lineIdx, setLineIdx] = useState(0);

  // Only rotates when the caller has not supplied its own line.
  useEffect(() => {
    if (hint) return undefined;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % WAITING_LINES.length), 7000);
    return () => clearInterval(id);
  }, [hint]);

  const owl = useMemo(() => guideImage(personaId || 'mentor', 'lantern'), [personaId]);

  const hasProgress = Number.isFinite(step) && Number.isFinite(totalSteps) && totalSteps > 0;
  const pct = hasProgress ? Math.min(100, Math.max(0, ((step + 1) / totalSteps) * 100)) : null;
  const line = hint || WAITING_LINES[lineIdx];

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'relative',
        minHeight: '100svh',
        width: '100%',
        overflow: 'hidden',
        bgcolor: colors.sand50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2.5, md: 4 },
      }}
    >
      {/* Same owl treatment as the Summary: large, mirrored, anchored to the
          bottom-left so the card sits clear of it. */}
      <Box
        component="img"
        src={owl}
        alt=""
        aria-hidden
        draggable={false}
        sx={{ ...SUMMARY_GUIDE_OWL_SX, opacity: 0.92, zIndex: 0 }}
      />

      <Box
        sx={{
          ...surfaces.card,
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 620,
          ml: { xs: 0, md: '18%', lg: '22%' },
          p: { xs: '26px 24px', md: '34px 40px' },
        }}
      >
        <Typography sx={{ ...type.eyebrow, mb: '12px' }}>
          {persona?.name ? `${persona.name} is working` : 'Working'}
        </Typography>

        <Typography sx={{
          fontFamily: fonts.serif, fontSize: { xs: 24, md: 29 }, fontWeight: 500,
          lineHeight: 1.15, letterSpacing: '-0.02em', color: colors.ink, mb: subtitle ? '10px' : '18px',
        }}>
          {title}
        </Typography>

        {subtitle ? (
          <Typography sx={{ ...type.body, mb: '18px' }}>{subtitle}</Typography>
        ) : null}

        {/* The quote box — the guide's note for the wait. */}
        <Box sx={{
          borderLeft: `2px solid ${colors.brass}`,
          pl: '16px',
          py: '2px',
          mb: hasProgress ? '20px' : 0,
        }}>
          <Typography sx={{
            fontFamily: fonts.serif, fontStyle: 'italic', fontSize: { xs: 14.5, md: 15.5 },
            lineHeight: 1.55, color: colors.inkSoft,
            transition: 'opacity 400ms',
          }}>
            {line}
          </Typography>
        </Box>

        {hasProgress ? (
          <Box>
            <Box
              sx={{
                position: 'relative',
                height: 4,
                borderRadius: radii.pill,
                bgcolor: colors.sand200,
                overflow: 'hidden',
                mb: '9px',
              }}
            >
              <Box sx={{
                position: 'absolute', inset: 0, right: 'auto',
                width: `${pct}%`,
                bgcolor: colors.orange,
                borderRadius: radii.pill,
                transition: 'width 600ms cubic-bezier(.2,.8,.2,1)',
              }} />
            </Box>
            <Typography sx={{
              fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: colors.inkSoft,
            }}>
              Step {step + 1} of {totalSteps} · {Math.round(pct)}%
            </Typography>
          </Box>
        ) : (
          // No step count to show, so the card breathes instead of counting.
          <Box sx={{ display: 'flex', gap: '6px', mt: '18px' }} aria-hidden>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6, height: 6, borderRadius: radii.circle, bgcolor: colors.orange,
                  animation: 'compassWait 1400ms ease-in-out infinite',
                  animationDelay: `${i * 180}ms`,
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      <style>
        {`@keyframes compassWait {
            0%, 100% { opacity: 0.28; transform: translateY(0); }
            50%      { opacity: 1;    transform: translateY(-3px); }
          }`}
      </style>
    </Box>
  );
}

export default LoadingScreen;
