// The Sentiment room — the Sentiment page body, one trait at a time.
//
// Three questions down the left, one answer on the right. The questions never
// change and never reorder: what it is like to be led by you, what you are
// getting right, what your team sees that you do not. Selecting a question
// swaps the whole right column.
//
// There used to be a chart under each answer. It is gone: on a page whose
// whole claim is that this is a teaching surface and not a score readout, a
// picture built out of the rows was the one thing pulling the eye back to the
// numbers — and it took the bottom third of the room to do it. The words get
// that space now, and they are set large enough to be read at arm's length
// rather than skimmed. buildSentiment still assembles `answer.chart`, and
// SentimentChart still knows how to draw it, so putting it back is one line.
//
// This is a teaching surface, not a score readout, and it carries no scores at
// all: the numbers live in Evidence, one tab away, where they are the point.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, shadows } from '../../../styles/tokens';
import { useGuide } from '../../../context/GuideContext';
import { spokenGuide } from '../../../data/guideContent';
import { useFitScale } from './useFitScale.js';
import { traitKeyFor } from '../../../utils/campaignResults.js';
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
          fontSize: 18,
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

// Sized for the room the chart used to take. 17.5px at a 62ch measure is a
// long-form reading size, not a caption size — which is the point: this is the
// only place in the debrief where the answer is a paragraph rather than a
// number, and it should look like the thing worth stopping on.
const BODY = {
  fontFamily: fonts.sans,
  fontSize: 17.5,
  lineHeight: 1.7,
  textWrap: 'pretty',
};

function Answer({ question, answer }) {
  return (
    // The answer is the room; the guide is a note in the margin of it.
    <Box data-guide-keepclear="" sx={{ maxWidth: 660 }}>
      <Typography sx={{ ...EYEBROW, fontSize: 9.5, letterSpacing: '0.2em', color: colors.inkSoft, mb: '14px' }}>
        Question {question.num}
      </Typography>
      <Typography
        component="h1"
        sx={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
          fontSize: { xs: 30, md: 42 },
          color: colors.ink,
          m: '0 0 20px',
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
          fontSize: 22,
          lineHeight: 1.45,
          color: colors.ink,
          m: '0 0 20px',
          textWrap: 'pretty',
        }}
      >
        {answer.verdict}
      </Typography>

      {/* Then what the trait is, then what they live, then what it leaves
          open. The teaching used to come last, behind a paragraph of scores,
          which is the wrong way round: a leader cannot weigh a reading of a
          trait before they have been told what the trait is. */}
      <Typography sx={{ ...BODY, color: colors.ink, m: '0 0 15px' }}>{answer.definition}</Typography>
      <Typography sx={{ ...BODY, color: colors.ink, m: '0 0 15px' }}>{answer.reading}</Typography>
      <Typography sx={{ ...BODY, color: colors.inkSoft, m: 0 }}>{answer.consequence}</Typography>
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
//
// And each branch is written six times. These keys are per trait and per
// question, so no CSV row can hold them without dropping the scores that make
// them worth saying — the voice has to live beside the arithmetic. Six guides
// reading one sentence was the same bug one level down.
// ---------------------------------------------------------------------------
const SENTIMENT_VOICES = {
  q01Split: {
    mentor: (label, c, e, f) => `${label} sits at ${c}, and the two halves disagree — ${e} effort against ${f} landing. Read this one for the distance between them, not the headline.`,
    catalyst: (label, c, e, f) => `${label} is at ${c}, but the halves disagree — ${e} effort, ${f} landing. The distance is the story, not the headline.`,
    challenger: (label, c, e, f) => `${label} reads ${c}, and that number is hiding an argument: ${e} effort against ${f} landing. Read the distance, not the headline.`,
    bestFriend: (label, c, e, f) => `${label} is at ${c}, but the two halves do not agree — ${e} effort, ${f} landing. That gap is the real thing here.`,
    mother: (label, c, e, f) => `${label} sits at ${c}, and the two halves disagree — ${e} of effort against ${f} landing. Read this one for the distance between them, not for the headline.`,
    roaster: (label, c, e, f) => `${label} says ${c}. The fine print says ${e} effort, ${f} landing. The headline is doing a lot of work.`,
  },
  q01Cheap: {
    mentor: (label, e, f) => `${label} lands at ${f} on only ${e} of effort. That is cheaper than it should be. Worth knowing why before you assume it will hold.`,
    catalyst: (label, e, f) => `${label} lands at ${f} on just ${e} of effort. That is cheap. Find out why before you bank on it.`,
    challenger: (label, e, f) => `${label} lands at ${f} on ${e} of effort. That is cheaper than it should be, and you do not know why. Find out before you assume it holds.`,
    bestFriend: (label, e, f) => `${label} lands at ${f} on only ${e} of effort — cheaper than it should be. Worth knowing why before you count on it.`,
    mother: (label, e, f) => `${label} lands at ${f} on only ${e} of effort. That is cheaper than it should be. Find out why before you assume it will hold.`,
    roaster: (label, e, f) => `${label}: ${f} landing on ${e} of effort. Suspiciously good value. Find out why before you build on it.`,
  },
  q01Even: {
    mentor: (label, c) => `${label} comes in at ${c}, with effort and effect close together. What you put in is roughly what they feel — so this number is about level, not aim.`,
    catalyst: (label, c) => `${label} comes in at ${c}, effort and effect close together. Aim is fine. This one is about level.`,
    challenger: (label, c) => `${label} is ${c}, effort and effect close. Nothing is misaimed here. If you want a different number you have to want a different level.`,
    bestFriend: (label, c) => `${label} is at ${c}, with effort and effect pretty close. What you put in is what they feel — so this is a level question, not an aim one.`,
    mother: (label, c) => `${label} comes in at ${c}, with effort and effect close together. What you put in is roughly what they feel, so this number is about level, not aim.`,
    roaster: (label, c) => `${label}: ${c}, effort and effect in step. Nothing clever to say here. It is what it is, at the level you set.`,
  },
  q02Split: {
    mentor: (label, split) => `This is where the ${split}-point gap on ${label} actually shows up — in specific behaviours, not in the average.`,
    catalyst: (label, split) => `Here is where that ${split}-point gap on ${label} actually lives — specific behaviours, not the average.`,
    challenger: (label, split) => `The ${split}-point gap on ${label} is not an average problem. It is these behaviours. Look at them.`,
    bestFriend: (label, split) => `This is where that ${split}-point gap on ${label} actually shows up — in specific things, not in the average.`,
    mother: (label, split) => `This is where the ${split}-point gap on ${label} actually shows up — in particular behaviours, not in the average.`,
    roaster: (label, split) => `The ${split}-point gap on ${label} does not live in the average. It lives here, itemized.`,
  },
  q02Even: {
    mentor: (label) => `The average on ${label} hides the spread. These statements are where it stops being one number.`,
    catalyst: (label) => `The average on ${label} hides the spread. Here is where it stops being one number.`,
    challenger: (label) => `One number for ${label} is a convenience. These five are the truth of it.`,
    bestFriend: (label) => `The average on ${label} smooths everything out. This is where it stops being one number.`,
    mother: (label) => `The average on ${label} hides the spread. These statements are where it stops being a single number.`,
    roaster: (label) => `The average on ${label} is a rounding of five different opinions. Here they are, unrounded.`,
  },
  q03Split: {
    mentor: (label) => `You already know ${label} is costing more than it returns. This is the part where you decide whether that stays true next cycle.`,
    catalyst: (label) => `You know ${label} is costing more than it returns. This is where you decide if that is still true next cycle.`,
    challenger: (label) => `You already know ${label} costs more than it returns. Knowing has not changed it. This is where you decide.`,
    bestFriend: (label) => `You already know ${label} costs you more than it gives back. This is the part where you decide if that is still true next cycle.`,
    mother: (label) => `You already know ${label} is costing more than it returns. This is where you decide whether that stays true next cycle.`,
    roaster: (label) => `You know ${label} costs more than it returns. You have known a while. This is the deciding part.`,
  },
  q03Even: {
    mentor: (label) => `${label} is not asking for rescue. The question is whether you keep it deliberate or let it run on its own.`,
    catalyst: (label) => `${label} does not need rescuing. Question is whether you keep it deliberate or let it coast.`,
    challenger: (label) => `${label} does not need rescuing. It needs you to decide whether it stays deliberate or goes on autopilot.`,
    bestFriend: (label) => `${label} is not asking to be rescued. It is more: do you keep doing it on purpose, or let it run itself?`,
    mother: (label) => `${label} is not asking for rescue. The question is whether you keep it deliberate, or let it run on its own.`,
    roaster: (label) => `${label} is fine. The only question is whether it stays intentional or quietly becomes a habit you take credit for.`,
  },
};

const inSentimentVoice = (table, personaId) => table[personaId] || table.mentor;

function sentimentFallback(questionId, page, generic, personaId = 'mentor') {
  const { compass, effort, efficacy } = page.scores || {};
  if (![compass, effort, efficacy].every(Number.isFinite)) return generic;
  const split = effort - efficacy;
  const label = page.label;
  const lower = label.toLowerCase();
  const say = (branch) => inSentimentVoice(SENTIMENT_VOICES[branch], personaId);

  if (questionId === 'q01') {
    if (split >= 20) return say('q01Split')(label, compass, effort, efficacy);
    if (split <= -20) return say('q01Cheap')(label, effort, efficacy);
    return say('q01Even')(label, compass);
  }
  if (questionId === 'q02') {
    return split >= 20 ? say('q02Split')(lower, split) : say('q02Even')(lower);
  }
  return split >= 20 ? say('q03Split')(lower) : say('q03Even')(label);
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

/**
 * Prefers the written answer over the assembled one, beat by beat, and keeps
 * the chart either way — the picture is built from the rows themselves and is
 * the one thing on this page that cannot be written.
 *
 * Per beat rather than per answer, because a generated set can come back
 * incomplete: one missing paragraph should cost one paragraph, not the page.
 */
function preferWritten(built, written) {
  if (!written) return built;
  const answers = {};
  Object.entries(built.answers).forEach(([id, answer]) => {
    const w = written[id];
    answers[id] = w
      ? {
          ...answer,
          verdict: w.verdict || answer.verdict,
          definition: w.definition || answer.definition,
          reading: w.reading || answer.reading,
          consequence: w.consequence || answer.consequence,
        }
      : answer;
  });
  return { ...built, answers };
}

export default function SentimentRoom({ row, statements, hasSelfData, traitIndex = 0, answersByTrait = null }) {
  const [questionId, setQuestionId] = useState('q01');
  const { personaId, setPageMessage, clearPageMessage } = useGuide();

  const page = useMemo(() => {
    const built = buildSentiment(row, statements, hasSelfData);
    return preferWritten(built, answersByTrait?.[traitKeyFor(row, traitIndex)]);
  }, [row, statements, hasSelfData, answersByTrait, traitIndex]);

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
      sentimentFallback(question.id, page, line.text, personaId),
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
          {/* The question column is keep-clear too, not just the answer. With
              the chart under it the answer was the tall side of the room and
              the guide always chose the right corner; without it the two
              columns are the same height, the solver flips to the left, and
              the bubble lands on the third question — the one control on this
              page. Telling it about both columns is what stops that. */}
          <Box data-guide-keepclear="" sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
