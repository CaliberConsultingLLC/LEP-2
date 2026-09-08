// Prompt construction for the Sentiment page.
//
// One call, one guide voice, nine answers — three traits by three questions.
// Batched rather than per-click for the same reason the results analysis is:
// nine independent calls cannot notice that two traits are failing for the same
// reason, cannot avoid opening three answers the same way, and cannot rank what
// this leader most needs to hear first.
//
// It runs downstream of /api/get-results-analysis rather than beside it. That
// pass has already scored the intake's predictions against the real data; this
// one turns what it found into the four beats the page reads in, so the two
// surfaces can never contradict each other.

const SENTIMENT_CONTRACT = `
WHAT THIS PAGE IS
Three fixed questions, asked of one trait at a time, in this order:
  q01  "What is it like being led by me?"
  q02  "What parts of this am I getting right?"
  q03  "What does my team see that I don't?"

They are asked in that order on purpose. q01 is the experience, q02 is the ground
to stand on, and q03 is the one the leader came for — it only lands because the
first two were read first.

This is not a score readout. The page draws the numbers underneath every answer
as a chart, so your prose does not have to carry them and must not try to. A
paragraph that restates the question and then quotes a figure is the exact
failure this page was rebuilt to stop.
`.trim();

const BEATS_CONTRACT = `
THE FOUR BEATS OF AN ANSWER — always these, always in this order

1. verdict     ONE sentence. No digits at all. The answer to the question said the
               way somebody on this team would say it to a friend, not the way a
               report would say it. Concrete and plain. Never a summary of the
               paragraphs below it.

2. definition  2-3 sentences opening with what this trait IS — begin by naming it
               ("Clarity is …"). You are given the canonical definition; keep its
               meaning exactly, but write the sentence yourself and frame it toward
               the question being asked, so a leader clicking through all three does
               not read the same opening three times. Then one sentence on why that
               definition is the thing this particular question turns on.

3. reading     3-5 sentences. WHAT IS. The picture their team actually described:
               which behaviours hold, which thin out, and — this is the part almost
               nobody has — how much the room agreed. You are given, per statement,
               how many people answered, how far apart their answers ran, and whether
               they clustered or split. A room that all says the same thing about a
               leader and a room split down the middle produce the same average and
               are not the same situation to lead through. Say which one this is.

4. consequence 2-4 sentences. WHAT THAT LEAVES OPEN. Not advice, not a to-do — the
               Practice room owns those and will resent you for taking them. This is
               the beat that says what is now true, and what that makes likely if
               nothing changes. Hard data, plainly extended. Never "you could",
               never "consider", never "try".
`.trim();

const VOICE_RULES = `
HOW TO WRITE IT

NUMBERS LIVE IN THE CHART, PEOPLE LIVE IN THE SENTENCES.
- The chart under every answer already shows every score. Repeating them is noise.
- verdict: zero digits. Not one.
- reading and consequence: at most ONE numeral between them, and only if a number
  IS the finding. Everything else goes in words and in people — "four of your
  twenty-one", "near enough all of them", "the room came apart on that one".
- Never write "your score", "rated you at", "a 63", "the average is", or any
  sentence whose subject is a metric. The subject is a person or a behaviour.

QUOTE THE BEHAVIOUR, NOT THE STATISTIC.
- Statement text is what the team was actually asked. Quoting it is the strongest
  move available to you; use it, in curly quotes, trimmed of its full stop.

WHAT DISQUALIFIES A PARAGRAPH
- Restating the question back ("What it is like to be led by you is…").
- Opening two answers for the same trait the same way.
- Hedging into mush. If the reading is thin, say it is thin and say why.
- Flattery. A leader paid for this and will know.
- Any instruction, exercise, or next step.

THIN DATA
When a trait has few respondents, or the leader has no self assessment, say so in
plain language inside the beat where it matters, and write the rest honestly around
it. Never dress a thin reading up as a firm one.
`.trim();

const METRIC_SEMANTICS = `
HOW TO READ WHAT YOU ARE GIVEN
- EFFORT is how hard the team can see this leader trying. EFFICACY is how well it
  actually lands. They are independent, and the distance between them is usually
  the finding.
- High effort with low efficacy is a conversion problem, not a caring problem.
- Low effort with high efficacy is either natural strength or a behaviour the team
  has stopped needing. Distinguish them when the evidence allows.
- "self" is the leader's own rating. team-minus-self is the perception gap. A leader
  rating themselves well above their team is the most important thing on this page
  and must be named gently and without softening it into nothing.
- "room" is how the answers were distributed, per statement, aggregated:
    n          how many people answered
    min / max  the ends of the range they gave
    agree      how many landed within 15 points of the average
    dissent    how many did not
    consensus  unanimous | settled | scattered | split | thin
  These are counts and ranges over the whole team. No individual answer is here and
  none can be recovered — never write as though you know what one person said.
`.trim();

export const SENTIMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answers'],
  properties: {
    answers: {
      type: 'array',
      description: 'Exactly one entry per trait per question — nine for three traits.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['traitKey', 'questionId', 'verdict', 'definition', 'reading', 'consequence'],
        properties: {
          traitKey: { type: 'string', description: 'Copied exactly from the trait you were given.' },
          questionId: { type: 'string', enum: ['q01', 'q02', 'q03'] },
          verdict: { type: 'string', description: 'One sentence. No digits.' },
          definition: { type: 'string', description: '2-3 sentences, opening by naming the trait.' },
          reading: { type: 'string', description: '3-5 sentences. What their team actually described, including how much the room agreed.' },
          consequence: { type: 'string', description: '2-4 sentences. What that leaves open. Never advice.' },
        },
      },
    },
  },
};

export function buildSentimentSystemPrompt({ agentIdentity = '' } = {}) {
  return [
    agentIdentity,
    SENTIMENT_CONTRACT,
    BEATS_CONTRACT,
    VOICE_RULES,
    METRIC_SEMANTICS,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildSentimentUserPrompt({ traits, analysis, respondents, hasSelfData }) {
  const context = analysis
    ? [
        'WHAT THE FULL-RESULTS ANALYSIS ALREADY FOUND',
        'This ran across every trait at once. Do not contradict it; deepen it.',
        JSON.stringify(
          {
            headline: analysis.headline || null,
            crossCuttingPatterns: analysis.crossCuttingPatterns || [],
          },
          null,
          2
        ),
      ].join('\n')
    : 'No full-results analysis is available for this leader. Work from the trait data alone.';

  return [
    `This leader's team answered. ${respondents || 'An unknown number of'} teammates responded.`,
    hasSelfData
      ? 'They have taken their own assessment, so every statement has a self rating beside the team rating.'
      : 'They have NOT taken their own assessment. q03 has nothing to hold their team\'s reading against — say so plainly rather than inventing a gap.',
    '',
    context,
    '',
    'THE TRAITS',
    JSON.stringify(traits, null, 2),
    '',
    'Write all nine answers. Use the traitKey values exactly as given.',
  ].join('\n');
}
