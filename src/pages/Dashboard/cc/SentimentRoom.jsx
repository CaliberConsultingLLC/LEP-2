// The Sentiment room — the Sentiment page body, one trait at a time.
//
// Three questions down the left, one answer on the right. The questions never
// change and never reorder: what it is like to be led by you, what you are
// getting right, what your team sees that you do not. Selecting a question
// swaps the whole right column, including the picture underneath it — each
// question is sourced by a different rule, so each one is drawn differently.
//
// This is a teaching surface, not a score readout, and it carries no scores at
// all: the numbers live in Evidence, one tab away, where they are the point.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, shadows } from '../../../styles/tokens';
import { useGuide } from '../../../context/GuideContext';
import { spokenGuide } from '../../../data/guideContent';
import { useFitScale } from './useFitScale.js';
import SentimentChart from './SentimentChart.jsx';
import {
  SENTIMENT_FOOTNOTE,
  SENTIMENT_QUESTIONS,
  buildSentiment,
  sentimentGuideLine,
} from './sentimentContent.js';

const EYEBROW = {
  fontFamily: fonts.mono,
  fontWeight: 700,
  textTransform: 'uppercase',
};

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
// Right column — the answer.
// ---------------------------------------------------------------------------

const BODY = {
  fontFamily: fonts.sans,
  fontSize: 15,
  lineHeight: 1.65,
  textWrap: 'pretty',
};

function Answer({ question, answer }) {
  return (
    // The answer is the room; the guide is a note in the margin of it.
    <Box data-guide-keepclear="" sx={{ maxWidth: 600 }}>
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
          fontSize: { xs: 28, md: 38 },
          color: colors.ink,
          m: '0 0 18px',
          textWrap: 'pretty',
        }}
      >
        {question.text}
      </Typography>

      {/* The answer in one line, the way somebody on the team would say it. */}
      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 18.5,
          lineHeight: 1.5,
          color: colors.ink,
          m: '0 0 16px',
          textWrap: 'pretty',
        }}
      >
        {answer.verdict}
      </Typography>

      {/* Then what the trait is, then what they live, then what it leaves
          open. The teaching used to come last, behind a paragraph of scores,
          which is the wrong way round: a leader cannot weigh a reading of a
          trait before they have been told what the trait is. */}
      <Typography sx={{ ...BODY, color: colors.ink, m: '0 0 12px' }}>{answer.definition}</Typography>
      <Typography sx={{ ...BODY, color: colors.ink, m: '0 0 12px' }}>{answer.reading}</Typography>
      <Typography sx={{ ...BODY, color: colors.inkSoft, m: '0 0 22px' }}>{answer.consequence}</Typography>

      <SentimentChart chart={answer.chart} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Fallback guide copy for the three questions, per trait.
//
// The generic version reads the same in all three rooms, which is exactly the
// complaint: the trait changes, the numbers change, the guide does not. These
// take the trait's own effort, effectiveness and split so the same question
// gets a different reading in each room. A generated line replaces them.
// ---------------------------------------------------------------------------
function sentimentFallback(questionId, page, generic) {
  const { compass, effort, efficacy } = page.scores || {};
  if (![compass, effort, efficacy].every(Number.isFinite)) return generic;
  const split = effort - efficacy;
  const label = page.label;

  if (questionId === 'q01') {
    return split >= 20
      ? `${label} sits at ${compass}, and the two halves disagree — ${effort} effort against ${efficacy} landing. Read this one for the distance between them, not the headline.`
      : split <= -20
        ? `${label} lands at ${efficacy} on only ${effort} of effort. That is cheaper than it should be. Worth knowing why before you assume it will hold.`
        : `${label} comes in at ${compass}, with effort and effect close together. What you put in is roughly what they feel — so this number is about level, not aim.`;
  }
  if (questionId === 'q02') {
    return split >= 20
      ? `This is where the ${split}-point gap on ${label.toLowerCase()} actually shows up — in specific behaviours, not in the average.`
      : `The average on ${label.toLowerCase()} hides the spread. These statements are where it stops being one number.`;
  }
  return split >= 20
    ? `You already know ${label.toLowerCase()} is costing more than it returns. This is the part where you decide whether that stays true next cycle.`
    : `${label} is not asking for rescue. The question is whether you keep it deliberate or let it run on its own.`;
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

export default function SentimentRoom({ row, statements, hasSelfData, traitIndex = 0 }) {
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
  //
  // Keyed on the trait as well as the question. Three questions on one key
  // meant all three traits said the same three things — the room changed
  // underneath a line that never did. The fallback carries this trait's own
  // numbers so the three rooms differ before a generated line lands.
  useEffect(() => {
    const line = sentimentGuideLine(question.id);
    const spoken = spokenGuide(
      personaId,
      'dashboardSignal',
      `sent-t${traitIndex + 1}-${question.id}`,
      sentimentFallback(question.id, page, line.text),
      line.pose
    );
    setPageMessage({ text: spoken.text, pose: spoken.pose, eyebrow: page.label });
  }, [question.id, page, traitIndex, personaId, setPageMessage]);

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
        {/* No header strip. The scores used to sit across the top of this room,
            which made a page about what it is like to be led by you open on
            three numbers. They are one tab away in Evidence, where they are the
            point. What is left is the trait's name, and it sits in the left
            column on the same line as "Question 01" on the right — with nothing
            above either of them, a full-width header row was only whitespace. */}
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
            <Typography sx={{ ...EYEBROW, fontSize: 9.5, letterSpacing: '0.2em', color: colors.orangeDeep, mb: '12px' }}>
              Sentiment · {page.label}
            </Typography>
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
