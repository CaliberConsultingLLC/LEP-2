// The wait.
//
// Generating a reflection takes about three minutes, which is a long time to
// look at three pulsing dots on a photograph. This is the same room as the
// rest of the product — sand, Fraunces, the guide standing at the left edge —
// so the wait reads as part of the walk rather than a gap in it.
//
// Callers keep the props they already passed: `title`, `subtitle`, `hint`.
// Progress is optional and comes in two grades:
//
//   step + totalSteps   an unlabelled segmented bar
//   step + steps[]      the same bar, plus a check and a line naming the step
//                       that just finished
//
// `explain` is the standing sentence about what is happening — said once, and
// deliberately kept apart from `elapsedSeconds`. When the only thing moving on
// a three-minute screen is a number, the number is what people read, and then
// they refresh.

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

function CheckMark() {
  return (
    <Box
      component="svg"
      viewBox="0 0 16 16"
      aria-hidden
      sx={{ width: 14, height: 14, flexShrink: 0, display: 'block' }}
    >
      <Box
        component="path"
        d="M3 8.4 L6.4 11.8 L13 4.6"
        sx={{
          fill: 'none',
          stroke: colors.green,
          strokeWidth: 2.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: 20,
          animation: 'compassCheck 460ms cubic-bezier(.2,.8,.2,1) both',
        }}
      />
    </Box>
  );
}

function LoadingScreen({
  title = 'Loading…',
  subtitle,
  explain,
  hint,
  step,
  totalSteps,
  steps,
  elapsedSeconds,
}) {
  const { personaId, persona } = useGuide();
  const [lineIdx, setLineIdx] = useState(0);

  // Only rotates when the caller has not supplied its own line.
  useEffect(() => {
    if (hint) return undefined;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % WAITING_LINES.length), 7000);
    return () => clearInterval(id);
  }, [hint]);

  const owl = useMemo(() => guideImage(personaId || 'mentor', 'lantern'), [personaId]);

  const labels = Array.isArray(steps) ? steps : null;
  const count = labels ? labels.length : totalSteps;
  const hasProgress = Number.isFinite(step) && Number.isFinite(count) && count > 0;
  const at = hasProgress ? Math.min(Math.max(step, 0), count - 1) : 0;
  // The step behind the marker is the one just completed, so it is the one
  // worth confirming. Nothing to confirm on the first.
  const justFinished = labels && at > 0 ? labels[at - 1] : null;
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
          <Typography sx={{ ...type.body, mb: explain ? '8px' : '18px' }}>{subtitle}</Typography>
        ) : null}

        {/* Said once, about the whole wait rather than this moment in it. */}
        {explain ? (
          <Typography sx={{
            ...type.body,
            fontSize: { xs: 13.5, md: 14 },
            color: colors.inkSoft,
            mb: '18px',
          }}>
            {explain}
          </Typography>
        ) : null}

        {/* The quote box — the guide's note for the wait. */}
        <Box sx={{
          borderLeft: `2px solid ${colors.brass}`,
          pl: '16px',
          py: '2px',
          mb: hasProgress ? '22px' : 0,
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
            {/* What was just done. Keyed on the step so the check redraws each
                time the marker moves, and the row holds its height so the bar
                below does not jump when the first one appears. */}
            <Box sx={{ minHeight: 20, mb: '10px' }}>
              {justFinished ? (
                <Box
                  key={at}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'compassStepIn 420ms cubic-bezier(.2,.8,.2,1) both',
                  }}
                >
                  <CheckMark />
                  <Typography sx={{
                    fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.green,
                  }}>
                    {justFinished}
                  </Typography>
                </Box>
              ) : null}
            </Box>

            {/* Equidistant dashes rather than a filling sweep: a step arriving
                somewhere is visible, and the end is a place rather than a
                percentage. The one in progress carries a travelling highlight
                so the screen is never still. */}
            <Box sx={{ display: 'flex', gap: '6px', mb: '10px' }} aria-hidden>
              {Array.from({ length: count }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: radii.pill,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: i < at ? colors.green : colors.sand200,
                    transition: 'background-color 420ms ease',
                    ...(i === at
                      ? {
                        '&:after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '55%',
                          borderRadius: radii.pill,
                          bgcolor: colors.orange,
                          animation: 'compassSegment 2200ms ease-in-out infinite',
                        },
                      }
                      : null),
                  }}
                />
              ))}
            </Box>

            <Typography sx={{
              fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: colors.inkSoft,
            }}>
              {`Step ${at + 1} of ${count}`}
              {Number.isFinite(elapsedSeconds) ? ` · ${elapsedSeconds}s` : ''}
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
          }
          @keyframes compassSegment {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(182%); }
          }
          @keyframes compassStepIn {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes compassCheck {
            from { stroke-dashoffset: 20; }
            to   { stroke-dashoffset: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes compassSegment { 0%, 100% { transform: translateX(0); } }
            @keyframes compassStepIn { from { opacity: 1; } to { opacity: 1; } }
            @keyframes compassCheck { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 0; } }
          }`}
      </style>
    </Box>
  );
}

export default LoadingScreen;
