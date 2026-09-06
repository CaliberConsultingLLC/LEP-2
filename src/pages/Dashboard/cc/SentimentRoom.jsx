// The Sentiment room — the Sentiment page body, one trait at a time.
//
// Three questions down the left, one answer on the right. The questions never
// change and never reorder: what it is like to be led by you, what you are
// getting right, what your team sees that you do not. Selecting a question
// swaps the whole right column, including the evidence block underneath it —
// each question is sourced by a different rule, and the block says which.
//
// This is a teaching surface, not a score readout. The header carries the
// trait's numbers so they are available without being the point.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../../../styles/tokens';
import { useGuide } from '../../../context/GuideContext';
import { spokenGuide } from '../../../data/guideContent';
import MetricHint from '../../../components/MetricHint';
import { SCORE_HINTS } from '../../../data/scoreGlossary';
import { useFitScale } from './useFitScale.js';
import {
  SENTIMENT_FOOTNOTE,
  SENTIMENT_QUESTIONS,
  buildSentiment,
  sentimentGuideLine,
  signedGap,
} from './sentimentContent.js';

// The mock's muted gray for the evidence descriptor sits between `ink-soft`
// and the hairline; nothing in the token set lands there yet.
const FAINT = '#8a94a3';

const EYEBROW = {
  fontFamily: fonts.mono,
  fontWeight: 700,
  textTransform: 'uppercase',
};

// ---------------------------------------------------------------------------
// Header — trait eyebrow on the left, the trait's numbers on the right.
// ---------------------------------------------------------------------------

function Score({ label, value, ink, hint }) {
  return (
    <Typography component="span" sx={{ whiteSpace: 'nowrap' }}>
      {label}{' '}
      <Box component="span" sx={{ color: ink, fontSize: 12 }}>
        <MetricHint title={hint}>{value}</MetricHint>
      </Box>
    </Typography>
  );
}

function SentimentHeader({ label, scores, zone }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        rowGap: '10px',
        mb: '24px',
        maxWidth: 1000,
      }}
    >
      <Typography sx={{ ...EYEBROW, fontSize: 10, letterSpacing: '0.22em', color: colors.orangeDeep }}>
        Sentiment · {label}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexShrink: 0,
          ...EYEBROW,
          fontSize: 9.5,
          letterSpacing: '0.2em',
          color: colors.inkSoft,
        }}
      >
        <Score label="Compass" value={scores.compass} ink={colors.orange} hint={SCORE_HINTS.compass} />
        <Score label="Effort" value={scores.effort} ink={colors.orangeDeep} hint={SCORE_HINTS.effort} />
        <Score label="Effectiveness" value={scores.efficacy} ink={colors.navy500} hint={SCORE_HINTS.efficacy} />
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            px: '11px',
            py: '4px',
            borderRadius: radii.pill,
            border: `1px solid ${zone.ink}`,
            letterSpacing: '0.12em',
            fontSize: 9,
            color: zone.ink,
            whiteSpace: 'nowrap',
          }}
        >
          <Box aria-hidden sx={{ width: 7, height: 7, borderRadius: radii.circle, bgcolor: zone.ink }} />
          {zone.label}
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Left column — the three questions.
// ---------------------------------------------------------------------------

function QuestionCard({ question, selected, onSelect }) {
  return (
    <Box
      component="button"
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        gap: '12px',
        alignItems: 'baseline',
        px: '18px',
        py: '16px',
        borderRadius: '16px',
        transition: '160ms ease',
        bgcolor: selected ? colors.navy900 : colors.surface1,
        border: `1.5px solid ${selected ? colors.navy900 : colors.sand200}`,
        boxShadow: selected ? '0 18px 40px rgba(15, 28, 46, 0.18)' : 'none',
        opacity: selected ? 1 : 0.7,
        // In dark mode the navy card sits a shade above a near-black page and
        // its drop shadow does nothing, so the selected card loses its edge.
        // The rim gives it back. Light mode is untouched.
        'html[data-dark="true"] &': selected
          ? { borderColor: 'rgba(244, 206, 161, 0.22)' }
          : undefined,
        '&:hover': selected ? undefined : { opacity: 1, boxShadow: shadows.card },
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: fonts.mono,
          fontSize: 10,
          fontWeight: 700,
          color: selected ? 'rgba(244, 206, 161, 0.75)' : colors.inkSoft,
        }}
      >
        {question.num}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: fonts.serif,
          fontSize: 17,
          lineHeight: 1.35,
          color: selected ? '#fff' : colors.ink,
          textWrap: 'pretty',
        }}
      >
        {question.text}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Evidence block — "Where this comes from". The columns are the source rule:
// Q01 shows what the team said, Q02 what they rate highest, Q03 the splits.
// ---------------------------------------------------------------------------

const COLUMN_META = {
  effort: { head: 'Effort', ink: colors.orangeDeep },
  team: { head: 'Team', ink: colors.navy500 },
  self: { head: 'You', ink: colors.ink },
  gap: { head: 'Gap', ink: colors.orangeDeep },
};

const VALUE_INK = {
  effort: colors.orangeDeep,
  team: colors.navy500,
  self: colors.ink,
  gap: colors.orange,
};

function EvidenceBlock({ evidence }) {
  const { columns, rows, descriptor, footer } = evidence;
  return (
    <Box sx={{ borderTop: `1px solid ${colors.sand200}`, pt: '16px' }}>
      <Typography
        sx={{
          ...EYEBROW,
          fontSize: 9.5,
          letterSpacing: '0.2em',
          color: colors.inkSoft,
          mb: '10px',
        }}
      >
        Where this comes from&nbsp;&nbsp;
        <Box
          component="span"
          sx={{
            fontFamily: fonts.sans,
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'none',
            color: FAINT,
          }}
        >
          {descriptor}
        </Box>
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `1fr${' auto'.repeat(columns.length)}`,
          columnGap: '22px',
          rowGap: '9px',
          alignItems: 'baseline',
          fontSize: 13.5,
        }}
      >
        <Box />
        {columns.map((col) => (
          <Typography
            key={`head-${col}`}
            sx={{
              ...EYEBROW,
              fontSize: 8.5,
              letterSpacing: '0.2em',
              color: COLUMN_META[col].ink,
              textAlign: 'right',
            }}
          >
            {COLUMN_META[col].head}
          </Typography>
        ))}

        {rows.map((row, i) => (
          <React.Fragment key={`${row.text}-${i}`}>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontSize: 13.5,
                lineHeight: 1.35,
                color: row.cited ? colors.ink : colors.inkSoft,
                textWrap: 'pretty',
              }}
            >
              {row.text}
            </Typography>
            {columns.map((col) => (
              <Typography
                key={`${col}-${i}`}
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: 13.5,
                  fontWeight: 700,
                  textAlign: 'right',
                  color: row.cited ? VALUE_INK[col] : colors.inkSoft,
                }}
              >
                {col === 'gap' ? signedGap(row.gap) : row[col]}
              </Typography>
            ))}
          </React.Fragment>
        ))}
      </Box>

      {footer && (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 1.5, color: colors.inkSoft, mt: '12px' }}>
          {footer}
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Right column — the answer.
// ---------------------------------------------------------------------------

function Answer({ question, answer }) {
  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography sx={{ ...EYEBROW, fontSize: 9.5, letterSpacing: '0.2em', color: colors.inkSoft, mb: '12px' }}>
        Question {question.num}
      </Typography>
      <Typography
        component="h1"
        sx={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
          fontSize: { xs: 30, md: 40 },
          color: colors.ink,
          m: '0 0 20px',
          textWrap: 'pretty',
        }}
      >
        {question.text}
      </Typography>
      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 19,
          lineHeight: 1.55,
          color: colors.ink,
          m: '0 0 16px',
          textWrap: 'pretty',
        }}
      >
        {answer.verdict}
      </Typography>
      <Typography
        sx={{ fontFamily: fonts.sans, fontSize: 15.5, lineHeight: 1.65, color: colors.ink, m: '0 0 12px', textWrap: 'pretty' }}
      >
        {answer.para1}
      </Typography>
      <Typography
        sx={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 1.65, color: colors.inkSoft, m: '0 0 24px', textWrap: 'pretty' }}
      >
        {answer.para2}
      </Typography>
      <EvidenceBlock evidence={answer.evidence} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

export default function SentimentRoom({ row, statements, hasSelfData }) {
  const [questionId, setQuestionId] = useState('q01');
  const { personaId, setPageMessage, clearPageMessage } = useGuide();

  const page = useMemo(
    () => buildSentiment(row, statements, hasSelfData),
    [row, statements, hasSelfData]
  );

  // Arriving at a new trait returns to the first question — the third one has
  // no meaning until the first two have been read for this trait.
  useEffect(() => { setQuestionId('q01'); }, [page.label]);

  const question = SENTIMENT_QUESTIONS.find((q) => q.id === questionId) || SENTIMENT_QUESTIONS[0];
  const answer = page.answers[question.id];

  // The guide says how to read the question in front of you, not what it says.
  useEffect(() => {
    const line = sentimentGuideLine(question.id);
    const spoken = spokenGuide(personaId, 'dashboardSignal', `sent-${question.id}`, line.text, line.pose);
    setPageMessage({ text: spoken.text, pose: spoken.pose, eyebrow: page.label });
  }, [question.id, page.label, personaId, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  // The command center hands every page a fixed box with overflow hidden, so
  // the page measures itself into it rather than trusting it will fit.
  const { frameRef, contentRef, fit, remeasure } = useFitScale();
  useEffect(remeasure, [questionId, page.label, remeasure]);

  return (
    <Box
      ref={frameRef}
      sx={{
        width: '100%',
        maxWidth: 1180,
        mx: 'auto',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        '--fit': fit,
      }}
    >
      <Box
        ref={contentRef}
        sx={{
          width: 'calc(100% / var(--fit))',
          transformOrigin: 'top left',
          transform: 'scale(var(--fit))',
        }}
      >
        <SentimentHeader label={page.label} scores={page.scores} zone={page.zone} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' },
            gap: { xs: '24px', md: '40px' },
            alignItems: 'start',
            maxWidth: 1000,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SENTIMENT_QUESTIONS.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                selected={q.id === question.id}
                onSelect={() => setQuestionId(q.id)}
              />
            ))}
            <Typography
              sx={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 1.5, color: colors.inkSoft, p: '10px 4px 0' }}
            >
              {SENTIMENT_FOOTNOTE}
            </Typography>
          </Box>

          <Answer question={question} answer={answer} />
        </Box>
      </Box>
    </Box>
  );
}
