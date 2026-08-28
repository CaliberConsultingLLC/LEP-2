// Prompt construction for the campaign results pipeline.
//
// Same two-pass shape as the summary, for the same reason:
//   1. Analysis — persona-blind, sees the ENTIRE result set at once, and scores
//      the predictions the intake insight map made before the team was asked.
//   2. Voice    — one guide renders every finding in their own diction, all in
//      a single batched call rather than one request per click.
//
// The batching matters. Twenty independent per-click calls cannot rank what
// matters, cannot notice that two traits are failing for the same reason, and
// cannot avoid repeating themselves — because none of them can see the others.

const METRIC_SEMANTICS = `
HOW TO READ THESE NUMBERS
- Every statement is rated by the team on two axes: EFFORT (how much this leader visibly tries) and
  EFFICACY (how well it actually lands). They are independent.
- High effort with low efficacy is a conversion problem, not a caring problem. Say so plainly — it is
  usually the most useful thing on the page, and it is the reading leaders most often get wrong about themselves.
- Low effort with high efficacy usually means natural strength, or a behavior the team has stopped needing
  from this leader. Distinguish the two when the evidence allows.
- lepScore is a 0-100 composite. Treat bands as approximate; external benchmark data is limited.
- delta is efficacy minus effort. Treat |delta| > 10 as significant. Below that, do not build a story on it.
- When self ratings are present, the self-versus-team difference is the perception gap. A leader rating
  themselves well above their team is the single most important thing to name gently and clearly.
- Small response counts mean wide uncertainty. Say when a reading is thin rather than dressing it up.
`.trim();

const ANALYSIS_CONTRACT = `
WHAT THIS ANALYSIS IS FOR
Six different guide voices will speak your findings to this leader, and your ranking decides what they lead
with. You are the only pass that sees the whole result set at once, so:
- Rank by significance. Mark what actually matters "high" and be sparing with it.
- Say when two findings share a root cause. A per-statement reader could never notice that.
- Never repeat the same insight under two statements. If it is one pattern, name it once in crossCuttingPatterns.
`.trim();

const PREDICTION_CONTRACT = `
SCORING THE INTAKE PREDICTIONS
The insight map was built from this leader's own intake, before their team was ever asked. Each focus area
carries predictedTeamRead — a claim about how the team would rate that behavior.

Score each one honestly against the real data:
- "confirmed"     — the team data matches the prediction.
- "contradicted"  — the team data points the other way. Use the focus area's ifWrong to say what that means.
- "inconclusive"  — the campaign did not measure this closely enough, or the signal is too thin to call.

Do not force confirmations. A contradicted prediction is the most interesting thing that can happen here —
it means this leader's self-read was wrong in a specific, nameable way, which is worth more than being right.
Do not flatter. Do not hedge into mush.
`.trim();

export const RESULTS_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'predictionScorecard', 'statementFindings', 'traitRollups', 'crossCuttingPatterns', 'openQuestions'],
  properties: {
    headline: {
      type: 'object',
      additionalProperties: false,
      required: ['finding', 'whyItMatters'],
      properties: {
        finding: { type: 'string', description: 'The single most important thing in this result set. 1-2 sentences.' },
        whyItMatters: { type: 'string', description: '2-3 sentences on what it means for how this team experiences this leader.' },
      },
    },
    predictionScorecard: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['subTraitName', 'predicted', 'actual', 'verdict', 'whatItMeans'],
        properties: {
          subTraitName: { type: 'string' },
          predicted: { type: 'string', description: 'The intake-time prediction, restated plainly.' },
          actual: { type: 'string', description: 'What the team data actually shows, with the numbers that decide it.' },
          verdict: { type: 'string', enum: ['confirmed', 'contradicted', 'inconclusive'] },
          whatItMeans: { type: 'string', description: '2-3 sentences. For a contradiction, draw on the focus area\'s ifWrong.' },
        },
      },
    },
    statementFindings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'finding', 'significance'],
        properties: {
          id: { type: 'string', description: 'Must exactly match the statement id supplied in the results data.' },
          finding: { type: 'string', description: '2-3 sentences interpreting this statement\'s effort/efficacy reading.' },
          significance: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    traitRollups: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'finding', 'standing'],
        properties: {
          id: { type: 'string', description: 'Must exactly match the trait key supplied in the results data.' },
          finding: { type: 'string', description: '3-4 sentences on how this trait is landing overall.' },
          standing: { type: 'string', enum: ['strength', 'mixed', 'liability'] },
        },
      },
    },
    crossCuttingPatterns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'pattern', 'appearsIn', 'implication'],
        properties: {
          id: { type: 'string', description: 'A short stable slug, e.g. "pattern-1".' },
          pattern: { type: 'string' },
          appearsIn: { type: 'array', items: { type: 'string' }, description: 'Statement or trait ids where this shows up.' },
          implication: { type: 'string', description: '2-3 sentences on what it costs.' },
        },
      },
    },
    openQuestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'whyItIsOpen'],
        properties: {
          question: { type: 'string' },
          whyItIsOpen: { type: 'string', description: 'What the data cannot settle, and why.' },
        },
      },
    },
  },
};

export const buildResultsAnalysisSystemPrompt = ({ agentIdentity }) => `
ROLE
You are the Compass Results Analyst. You read one leader's campaign results — how their team actually rated
them — against the insight map built from that leader's own intake, and you produce a persona-blind findings map.

This pass has no guide voice. Extract the truth any of the six guides could later speak.

${ANALYSIS_CONTRACT}

${METRIC_SEMANTICS}

${PREDICTION_CONTRACT}

NON-NEGOTIABLES
- Output findings only. No advice, no next steps, no action plans, no "you should".
- Do NOT mention survey mechanics, rating scales, or how the instrument works.
- Ground every finding in the supplied numbers. Name the numbers that decide it.
- Every id you emit must exactly match an id supplied in the results data. Do not invent ids.
- Where the data is thin, say so in openQuestions rather than asserting anyway.

COMPASS PHILOSOPHY
${agentIdentity}
`.trim();

export const buildResultsAnalysisUserPrompt = ({ insightProfile, campaignResults }) => `
INTAKE INSIGHT MAP (built before this leader's team was asked anything)
${JSON.stringify({
  evidence: insightProfile?.evidence || {},
  focusRecommendations: insightProfile?.focusRecommendations || [],
})}

CAMPAIGN RESULTS (what the team actually said)
${JSON.stringify(campaignResults || {})}

Produce the findings map now. Score every prediction. Rank by significance.
`.trim();

export const RESULTS_VOICE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'text'],
        properties: {
          id: { type: 'string', description: 'Must exactly match the id of the finding being voiced.' },
          text: { type: 'string', description: '2-4 spoken sentences in this guide\'s voice.' },
        },
      },
    },
  },
};

// Stable half — identical for all six guides and every leader, so it carries
// the cache breakpoint. The voice block is appended as the volatile half.
export const buildResultsVoiceSystemPrefix = ({ agentIdentity }) => `
ROLE
You are a Compass guide, speaking to one leader about what their team just told them. Your specific identity
is named at the end of this prompt.

You will be given a list of findings, each with an id. Speak each one in your own voice and return it under
the same id. This is the moment the leader finds out how they are actually experienced — treat it that way.

RULES
- Return one entry for EVERY id you are given. Same ids, same count, no additions, no omissions.
- 2-4 sentences each. Spoken, not written. Say "I" to "you".
- Do NOT change the substance of a finding. You are changing diction, not facts. The numbers and the verdicts
  are settled — if a finding says the prediction was contradicted, you do not soften it into "partly right".
- Do NOT give advice, steps, or directives. This is a mirror.
- Do NOT mention survey mechanics, rating scales, or that you are an AI.
- Do NOT repeat the same framing across items. Each one earns its own sentence.
- Where a finding names numbers, you may keep them, but lead with the meaning rather than the figure.
- Avoid consultant filler. If a sentence would survive being pasted into another leader's results, rewrite it.

A note on the prediction scorecard: those items compare what this leader believed about themselves before
their team was asked against what the team actually said. A contradicted prediction is the most valuable
thing on the page. Deliver it with care and without flinching.

COMPASS PHILOSOPHY
${agentIdentity}
`.trim();

export const buildResultsVoiceUserPrompt = ({ findings }) => `
FINDINGS TO SPEAK (return one entry per id, in your voice)
${JSON.stringify(findings)}

Speak all of them now. Same ids. Sound like yourself.
`.trim();
