// The picture under a Sentiment answer.
//
// This block used to be a grid of numbers with a heading that said "Where this
// comes from". It was the only quantitative thing on a page whose whole point
// is that the answer is not arithmetic, and a column of digits under a
// paragraph of prose wins that fight every time.
//
// Three questions, three source rules, three different pictures — because the
// three questions are not asking the same thing of the same data:
//
//   Q01  spread    five statements, ranked. A dot at the average and a line
//                  across the range the room actually gave, because "63" and
//                  "everyone said 63" are not the same fact.
//   Q02  paired    the top three, effort beside effectiveness — what it costs
//                  you against what it returns.
//   Q03  dumbbell  the three widest splits, your mark and theirs on one line,
//                  the distance between them coloured by which way it runs.
//
// Everything is on one 0–100 axis, so a reader carries the same ruler between
// the three. Series colours are the dial's two meanings, stepped to clear
// colour-vision separation against the chart surface in both themes; identity
// is carried by shape and a legend as well as hue, and every value is written
// out, so nothing here is gated behind seeing colour.

import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts } from '../../../styles/tokens';

const TRACK_H = 20;
const BAR_H = 9;
const DOT = 11;

const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));
const pct = (n) => `${clamp(n)}%`;

const EYEBROW = {
  fontFamily: fonts.mono,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
};

// Values, labels and legends wear text tokens. The coloured mark beside them
// carries the identity; a number in a series colour is a number pretending to
// be data ink.
const VALUE = {
  fontFamily: fonts.mono,
  fontSize: 12.5,
  fontWeight: 700,
  color: colors.ink,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

const STATEMENT = {
  fontFamily: fonts.serif,
  fontSize: 13,
  lineHeight: 1.3,
  color: colors.ink,
  textWrap: 'pretty',
};

/** The 2px ring in the surface colour that keeps overlapping marks legible. */
const ring = `0 0 0 2px ${colors.surface1}`;

function Row({ label, children, value }) {
  return (
    <>
      <Typography sx={STATEMENT}>{label}</Typography>
      <Box sx={{ position: 'relative', height: TRACK_H, minWidth: 0 }}>{children}</Box>
      <Typography sx={VALUE}>{value}</Typography>
    </>
  );
}

function Grid({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 44%) 34px',
        columnGap: '16px',
        rowGap: '8px',
        alignItems: 'center',
      }}
    >
      {children}
    </Box>
  );
}

/** A dot beside a word. Never hue alone — the shape differs too where it must. */
function Key({ ink, label, hollow = false }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <Box
        aria-hidden
        sx={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: hollow ? colors.surface1 : ink,
          border: hollow ? `2px solid ${ink}` : 'none',
          boxSizing: 'border-box',
        }}
      />
      <Typography sx={{ ...EYEBROW, fontSize: 8.5, color: colors.inkSoft }}>{label}</Typography>
    </Box>
  );
}

function Legend({ items }) {
  return (
    <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap', mb: '12px' }}>
      {items.map((it) => (
        <Key key={it.label} {...it} />
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Q01 — where each statement sits, and how much the room agreed about it.
// ---------------------------------------------------------------------------

function SpreadChart({ rows }) {
  return (
    <Grid>
      {rows.map((r) => {
        const lo = clamp(Math.min(r.min ?? r.value, r.value));
        const hi = clamp(Math.max(r.max ?? r.value, r.value));
        const hasRange = hi - lo >= 1;
        return (
          <Row key={r.text} label={r.text} value={Math.round(r.value)}>
            <Box
              title={
                hasRange
                  ? `${r.text} — average ${Math.round(r.value)}, answers ran ${lo} to ${hi}`
                  : `${r.text} — average ${Math.round(r.value)}`
              }
              sx={{ position: 'absolute', inset: 0 }}
            >
              {/* The range the room actually gave. Hairline and neutral: it is
                  context for the dot, not a second reading. */}
              {hasRange && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: pct(lo),
                    width: pct(hi - lo),
                    height: 2,
                    borderRadius: 1,
                    bgcolor: colors.sand300,
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: pct(r.value),
                  width: DOT,
                  height: DOT,
                  borderRadius: '50%',
                  bgcolor: colors.chartEfficacy,
                  boxShadow: ring,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </Box>
          </Row>
        );
      })}
    </Grid>
  );
}

// ---------------------------------------------------------------------------
// Q02 — what it costs you beside what it returns.
// ---------------------------------------------------------------------------

const bar = (ink, value) => ({
  height: BAR_H,
  width: pct(value),
  minWidth: 2,
  bgcolor: ink,
  // Square where it grows from, rounded where the data ends.
  borderRadius: '0 4px 4px 0',
});

function PairedChart({ rows }) {
  return (
    <>
      <Legend
        items={[
          { ink: colors.chartEffort, label: 'Effort' },
          { ink: colors.chartEfficacy, label: 'Effectiveness' },
        ]}
      />
      <Grid>
        {rows.map((r) => (
          <Row key={r.text} label={r.text} value={Math.round(r.efficacy)}>
            {/* 2px of surface between the two bars — the gap does the
                separating, never a stroke drawn around either one. */}
            <Box
              title={`${r.text} — effort ${Math.round(r.effort)}, effectiveness ${Math.round(r.efficacy)}`}
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <Box aria-hidden sx={bar(colors.chartEffort, r.effort)} />
              <Box aria-hidden sx={bar(colors.chartEfficacy, r.efficacy)} />
            </Box>
          </Row>
        ))}
      </Grid>
    </>
  );
}

// ---------------------------------------------------------------------------
// Q03 — your mark, theirs, and the distance.
// ---------------------------------------------------------------------------

function DumbbellChart({ rows }) {
  return (
    <>
      <Legend
        items={[
          { ink: colors.inkSoft, label: 'You', hollow: true },
          { ink: colors.chartEfficacy, label: 'Your team' },
        ]}
      />
      <Grid>
        {rows.map((r) => {
          const you = clamp(r.self);
          const them = clamp(r.team);
          const lo = Math.min(you, them);
          const span = Math.abs(them - you);
          const gap = Math.round(them - you);
          // The connector carries which way the distance runs: warm when they
          // read you higher than you read yourself, cool when you read higher.
          const connector = gap > 0 ? colors.chartEffort : gap < 0 ? colors.chartEfficacy : colors.sand300;
          return (
            <Row key={r.text} label={r.text} value={gap > 0 ? `+${gap}` : gap < 0 ? `−${Math.abs(gap)}` : '0'}>
              <Box
                title={`${r.text} — you ${you}, your team ${them}`}
                sx={{ position: 'absolute', inset: 0 }}
              >
                {span >= 1 && (
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: pct(lo),
                      width: pct(span),
                      height: 2,
                      borderRadius: 1,
                      bgcolor: connector,
                      opacity: 0.55,
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: pct(you),
                    width: DOT,
                    height: DOT,
                    borderRadius: '50%',
                    boxSizing: 'border-box',
                    bgcolor: colors.surface1,
                    border: `2px solid ${colors.inkSoft}`,
                    boxShadow: ring,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: pct(them),
                    width: DOT,
                    height: DOT,
                    borderRadius: '50%',
                    bgcolor: colors.chartEfficacy,
                    boxShadow: ring,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </Box>
            </Row>
          );
        })}
      </Grid>
    </>
  );
}

// ---------------------------------------------------------------------------

const CHARTS = { spread: SpreadChart, paired: PairedChart, dumbbell: DumbbellChart };

/**
 * @param {object} chart  { kind, caption, rows, footer } from buildSentiment
 */
export default function SentimentChart({ chart }) {
  const Chart = CHARTS[chart?.kind];
  if (!Chart || !chart.rows?.length) return null;

  return (
    <Box
      component="figure"
      role="group"
      aria-label={chart.caption}
      sx={{ m: 0, borderTop: `1px solid ${colors.sand200}`, pt: '16px' }}
    >
      <Typography component="figcaption" sx={{ ...EYEBROW, fontSize: 9, color: colors.inkSoft, mb: '12px' }}>
        {chart.caption}
        <Box
          component="span"
          sx={{ float: 'right', letterSpacing: '0.14em', opacity: 0.7 }}
        >
          0–100
        </Box>
      </Typography>

      <Chart rows={chart.rows} />

      {chart.footer && (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 1.5, color: colors.inkSoft, mt: '14px' }}>
          {chart.footer}
        </Typography>
      )}
    </Box>
  );
}
