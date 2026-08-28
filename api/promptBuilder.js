// Prompt construction for the Compass summary pipeline.
//
// Two passes:
//   1. Extraction  — persona-blind. Produces the leadership insight map, which
//      is persisted and consumed by the narratives, campaign generation, the
//      dashboard, and longitudinal comparison. This is a durable record, not a
//      script for one voice.
//   2. Narrative   — one guide voice speaking the map out loud in four beats.
//      Facts are locked; only diction changes between guides.
//
// Both prompts are ordered stable-content-first so the shared prefix can carry
// a cache breakpoint. Anything that varies per leader (or per guide) comes
// after it — caching is a prefix match, so a single early variation costs the
// whole cache.

const COMPASS_PHILOSOPHY_HEADER = 'COMPASS PHILOSOPHY';

const EVIDENCE_RUBRIC = `
EVIDENCE RUBRIC
- Treat responses as behavioral signal, not aspiration.
- Every claim must connect at least two signals. Never single-point diagnose.
- Prefer second-order implications ("what this causes downstream") over restating inputs.
- Name what is working and what it costs. Both, always.
- When the evidence for something is thin, say so in openQuestions instead of asserting it anyway.
`.trim();

const CLARIFICATION_RULES = `
CLARIFICATION INTERPRETATION
- If intakeClarification is missing, ignore this section.
- Structured answers (clicks, ranks, sliders) are the primary evidence. Open text is not automatically weightier because it is prose.
- If resolution is "both_accurate", "none", or "check_failed", keep existing tensions. Do not flatten them.
- If the user wrote a clarification that corrects or disambiguates a named prior answer, treat that write-in as the intended meaning for those relatedSignals. Do not claim the stored clicks changed; interpret as if those signals now mean what the user clarified.
- Ignore asides that do not address the named conflict.
`.trim();

// The single most consequential line in this prompt. Telling the model its
// output will later be checked against real team ratings shifts it from claims
// that merely resonate to claims that are actually falsifiable.
const DOWNSTREAM_CONTRACT = `
WHAT THIS MAP IS FOR
This map is a durable record, not a one-time script. It is stored and later used to:
1. Let six different guide voices speak the same truth to this leader.
2. Generate team-facing survey statements about these specific behaviors.
3. Be compared directly against how this leader's team actually rates them, months from now.
4. Be compared against a future version of this same map to show what changed.

Because of (3), prefer claims a team rating could contradict over claims that merely sound insightful.
A prediction that turns out wrong is more useful here than an observation too vague to be wrong.
`.trim();

const SIGNAL_VOCABULARY = [
  'birthYear', 'industry', 'department', 'role', 'responsibilities', 'teamSize',
  'leadershipExperience', 'careerExperience', 'resourcePick', 'projectApproach',
  'energyDrains', 'crisisResponse', 'pushbackFeeling', 'roleModelTrait',
  'warningLabel', 'leaderFuel', 'proudMoment', 'behaviorDichotomies',
  'visibilityComfort', 'decisionPace', 'teamPerception', 'societalInstincts',
  'intakeClarification',
];

/**
 * Explicit, deterministically ordered projection of the intake. Replaces
 * JSON.stringify(req.body), which leaked sessionId and whatever else the client
 * attached, and whose key order varied enough to defeat prompt caching.
 */
export function buildIntakeProjection(body = {}) {
  const str = (v) => String(v ?? '').trim();
  const arr = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? x : str(x))) : []);
  const societal = Array.isArray(body.societalResponses) ? body.societalResponses : [];
  const societalLabels = Array.isArray(body.societalLabels) ? body.societalLabels : [];

  return {
    birthYear: str(body.birthYear),
    industry: str(body.industry),
    department: str(body.department),
    role: str(body.role),
    responsibilities: str(body.responsibilities),
    teamSize: str(body.teamSize),
    leadershipExperience: str(body.leadershipExperience),
    careerExperience: str(body.careerExperience),
    resourcePick: str(body.resourcePick),
    projectApproach: str(body.projectApproach),
    energyDrains: arr(body.energyDrains),
    crisisResponse: arr(body.crisisResponse),
    pushbackFeeling: arr(body.pushbackFeeling),
    roleModelTrait: str(body.roleModelTrait),
    warningLabel: str(body.warningLabel),
    leaderFuel: arr(body.leaderFuel),
    proudMoment: str(body.proudMoment),
    behaviorDichotomies: arr(body.behaviorDichotomies),
    visibilityComfort: str(body.visibilityComfort),
    decisionPace: str(body.decisionPace),
    teamPerception: str(body.teamPerception),
    societalInstincts: societal.map((score, i) => ({
      item: societalLabels[i] || `instinct_${i + 1}`,
      score,
    })),
    intakeClarification: body.intakeClarification || null,
  };
}

// Fields that carry real behavioral signal. Demographics alone (role, industry,
// team size) describe a job, not a leader, so they are deliberately excluded.
const SIGNAL_BEARING_FIELDS = [
  'responsibilities', 'resourcePick', 'projectApproach', 'energyDrains',
  'crisisResponse', 'pushbackFeeling', 'roleModelTrait', 'warningLabel',
  'leaderFuel', 'proudMoment', 'behaviorDichotomies', 'visibilityComfort',
  'decisionPace', 'teamPerception', 'societalInstincts',
];

const MINIMUM_SIGNAL_FIELDS = 6;

/**
 * Counts how many signal-bearing intake fields actually have content.
 *
 * Without this, an empty or near-empty body still produces a confident,
 * fully-formed leadership profile — the model will happily invent a leader from
 * nothing, and every downstream gate passes because the shape is valid. Shape
 * validation cannot catch fabrication; only refusing to ask can.
 */
export function intakeSignalCount(projection = {}) {
  return SIGNAL_BEARING_FIELDS.reduce((count, key) => {
    const value = projection[key];
    if (Array.isArray(value)) return count + (value.length ? 1 : 0);
    return count + (String(value ?? '').trim() ? 1 : 0);
  }, 0);
}

export function intakeIsSufficient(projection = {}) {
  return intakeSignalCount(projection) >= MINIMUM_SIGNAL_FIELDS;
}

export { MINIMUM_SIGNAL_FIELDS };

/**
 * JSON Schema for the insight map, enforced by the API. A truncated or
 * malformed map is structurally impossible with this in place.
 *
 * Counts are ranges with a stated evidence bar rather than fixed quotas —
 * fixed counts force padding when the evidence supports fewer and force
 * dropping when it supports more.
 */
const observationList = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['observation', 'sourceSignals'],
    properties: {
      observation: {
        type: 'string',
        description: 'A short reworded behavioral observation. Never copied answer text.',
      },
      sourceSignals: {
        type: 'array',
        items: { type: 'string' },
        description: 'Which intake signal names this observation is drawn from. Use names from the SIGNAL VOCABULARY.',
      },
    },
  },
};

export const INSIGHT_MAP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['evidence', 'focusRecommendations', 'rendering', 'openQuestions'],
  properties: {
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: [
        'leadershipMirror', 'protectivePattern', 'pressurePattern', 'peopleImpact',
        'performanceImpact', 'hiddenTradeoff', 'futureRiskIfUnchanged',
        'teamLikelyFeels', 'overuses', 'avoids',
        'findings', 'contradictions', 'trajectory',
      ],
      properties: {
        leadershipMirror: { type: 'string', description: '4-6 sentences. Identity-level mirror with enough texture to feel specific.' },
        protectivePattern: { type: 'string', description: '2-3 sentences. The pattern that keeps this leader safe.' },
        pressurePattern: { type: 'string', description: '2-3 sentences. How stress distorts their behavior.' },
        peopleImpact: { type: 'string', description: '2-3 sentences. Likely team-level impact.' },
        performanceImpact: { type: 'string', description: '2-3 sentences. Likely performance-level impact.' },
        hiddenTradeoff: { type: 'string', description: '2-3 sentences. What this approach protects and what it costs.' },
        futureRiskIfUnchanged: { type: 'string', description: '4-6 sentences. Downside trajectory if people stay.' },
        teamLikelyFeels: { type: 'array', items: { type: 'string' } },
        overuses: { type: 'array', items: { type: 'string' } },
        avoids: { type: 'array', items: { type: 'string' } },
        findings: {
          type: 'array',
          description: 'Strengths, tensions, and blind spots in one list. The three kinds are merged because the API refuses to compile a grammar with three near-identical nested array shapes.',
          items: {
            type: 'object', additionalProperties: false,
            required: ['kind', 'label', 'observations', 'implication'],
            properties: {
              kind: { type: 'string', enum: ['strength', 'tension', 'blindSpot'] },
              label: { type: 'string' },
              observations: observationList,
              implication: {
                type: 'string',
                description: '2-3 sentences. For a strength or tension, what it causes downstream. For a blind spot, how the team experiences it.',
              },
            },
          },
        },
        contradictions: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            required: ['tension', 'cause', 'effect', 'sourceSignals'],
            properties: {
              tension: { type: 'string' },
              cause: { type: 'string' },
              effect: { type: 'string' },
              sourceSignals: { type: 'string', description: 'Comma-separated signal names from the SIGNAL VOCABULARY.' },
            },
          },
        },
        trajectory: {
          type: 'object', additionalProperties: false,
          required: ['bestCase', 'driftCase'],
          properties: {
            bestCase: { type: 'string', description: '5-7 sentences. Who they become if they pivot.' },
            driftCase: { type: 'string', description: '5-7 sentences. What hardens if they do not.' },
          },
        },
      },
    },
    focusRecommendations: {
      type: 'array',
      description: 'The five growth sub-traits, each carrying a falsifiable prediction about how this leader\'s team will rate them.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['subTraitName', 'parentTraitHint', 'rationale', 'selfSignal', 'predictedTeamRead', 'basis', 'confidence', 'ifWrong'],
        properties: {
          subTraitName: { type: 'string', description: 'Must be an exact name from the VALID FOCUS SUBTRAITS catalog.' },
          parentTraitHint: { type: 'string' },
          rationale: { type: 'string', description: '1-2 sentences on why this sub-trait is the leverage point.' },
          selfSignal: { type: 'string', description: 'How this leader described themselves on this behavior at intake.' },
          predictedTeamRead: {
            type: 'string',
            description: 'A specific, checkable prediction about how the team will rate effort vs efficacy on this behavior.',
          },
          basis: { type: 'string', description: 'Comma-separated signal names from the SIGNAL VOCABULARY.' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          ifWrong: { type: 'string', description: 'What it would mean about this leader if the team data contradicts the prediction.' },
        },
      },
    },
    rendering: {
      type: 'object', additionalProperties: false,
      required: ['spokenSeeds'],
      description: 'Regenerable phrasing layer. Safe to discard and rebuild from evidence.',
      properties: {
        spokenSeeds: {
          type: 'object', additionalProperties: false,
          required: ['clearestAsset', 'coreTension', 'markerMoments', 'hazardIfStay'],
          properties: {
            clearestAsset: { type: 'string', description: '2-3 sentences naming the clearest leadership asset.' },
            coreTension: { type: 'string', description: '2-3 sentences naming the core tension without solving it.' },
            markerMoments: {
              type: 'array',
              items: { type: 'string', description: 'A vivid, concrete, present-tense scene the leader can already recognize.' },
            },
            hazardIfStay: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Paired 1:1 with markerMoments. Year-later behavior of people who STAY — never quitting, resigning, leaving, attrition, or turnover.',
              },
            },
          },
        },
      },
    },
    openQuestions: {
      type: 'array',
      description: 'Where the read is genuinely uncertain. Replaces a confidence rating with something actionable.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['question', 'whatItWouldChange'],
        properties: {
          question: { type: 'string' },
          whatItWouldChange: { type: 'string' },
        },
      },
    },
  },
};

export const buildInsightExtractionSystemPrompt = ({ agentIdentity, traitCatalog = [] }) => `
ROLE
You are the Compass Insight Extractor. You turn one leader's intake into a persona-blind evidence map.

This pass has no guide voice. Do not write as Mentor, Catalyst, Challenger, Best Friend, Mother, or Roaster.
Extract the truth any of them could later speak.

${DOWNSTREAM_CONTRACT}

NON-NEGOTIABLES
- Do NOT mention survey mechanics, questions, sliders, or scales.
- Do NOT repeat exact phrasing from the intake options — reword every observation.
- Do NOT give advice, steps, or coaching directives. This is a mirror, not a plan.
- Ground every claim in at least two signals, and name those signals in sourceSignals.

${EVIDENCE_RUBRIC}

${CLARIFICATION_RULES}

REQUIRED COUNTS (the schema cannot enforce these — you must)
- evidence.findings: 9 to 15 entries total — at least 3 of each kind (strength, tension, blindSpot).
- evidence.teamLikelyFeels, overuses, avoids: 3 to 5 each.
- evidence.contradictions: 2 or 3.
- Every observations array: 2 or 3 entries, each naming at least 2 comma-separated sourceSignals.
- focusRecommendations: exactly 5, each naming at least 2 comma-separated signals in basis.
- rendering.spokenSeeds.markerMoments: exactly 2. hazardIfStay: exactly 2, paired 1:1 with them.
- openQuestions: 0 to 3. Only where the read is genuinely uncertain.

DEPTH
Write to the top of each field's stated range when the evidence supports it. Thin, clipped fields make the
downstream product generic. But do not manufacture texture you cannot source — that is what openQuestions is for.

HAZARD CONSTRAINT
rendering.spokenSeeds.hazardIfStay describes how people who STAY change their behavior: withholding, over-asking,
self-protection, quiet workarounds, slowed ownership, political caution, compliance without candor.
Never quitting, resigning, leaving, attrition, or turnover. Each hazard pairs 1:1 with the marker moment at the same index.

SIGNAL VOCABULARY (use these exact names in sourceSignals and basis)
${SIGNAL_VOCABULARY.join(', ')}

VALID FOCUS SUBTRAITS
Use exact names from this catalog and no others:
${Array.isArray(traitCatalog) ? traitCatalog.join(', ') : ''}


${COMPASS_PHILOSOPHY_HEADER}
${agentIdentity}
`.trim();

export const buildInsightExtractionUserPrompt = (body) => `
INTAKE SIGNALS (JSON)
${JSON.stringify(buildIntakeProjection(body))}

Build the insight map for this leader now.
`.trim();

/**
 * Narrative schema. Sentence ranges are stated here and in the prompt, but they
 * are driven by coverage requirements rather than a "keep writing" instruction —
 * length should be a consequence of doing the work, not a quota to fill.
 */
export const GUIDE_NARRATIVE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['trailhead', 'markers', 'hazards', 'newTrail'],
  properties: {
    trailhead: { type: 'string', description: '8-12 spoken sentences.' },
    markers: {
      type: 'object', additionalProperties: false,
      required: ['framing', 'examples'],
      properties: {
        framing: { type: 'string', description: '5-7 spoken sentences.' },
        examples: { type: 'array', items: { type: 'string' } },
      },
    },
    hazards: {
      type: 'object', additionalProperties: false,
      required: ['framing', 'examples'],
      properties: {
        framing: { type: 'string', description: '5-7 spoken sentences.' },
        examples: { type: 'array', items: { type: 'string' } },
      },
    },
    newTrail: { type: 'string', description: '7-10 spoken sentences.' },
  },
};

// Stable half of the narrative system prompt — identical for all six guides and
// every leader, so it carries the cache breakpoint. The voice block is appended
// after it as the volatile half.
export const buildNarrativeSystemPrefix = ({ agentIdentity }) => `
ROLE
You are a Compass guide, speaking out loud to one leader. Your specific identity is named at the end of this prompt.

This is a mirror, not a plan, score, label, or diagnosis. Optimize to land — to be heard.
A leader should finish each beat feeling the pattern, not skimming a caption.

SAFETY NON-NEGOTIABLES
- Do NOT restate intake answers verbatim, or mention questions, sliders, or survey mechanics.
- Do NOT invent claims, motives, or scenes that are not in the insight map.
- Do NOT give advice, directives, steps, or trait lists. Naming what could be is fine; telling them what to do is not.
- Do NOT name guides or personas, or refer to yourself as an AI.
- Avoid consultant filler and leadership clichés. If a sentence would survive being pasted into any other leader's summary, rewrite it.
- Speak as "I" to "you". This is spoken, not a report.

WHAT TO WRITE
Four beats. The emotional sequence across them is: Seen -> Exposed -> Hopeful -> Motivated.

1) TRAILHEAD — land, then stay with them. 8-12 sentences.
   Cover, in order: the clearest asset as something already true; the honest undercurrent running beneath it;
   what that specific pairing costs the room. Develop each — do not name and move on.
   Draw the substance from evidence.coreStrengths, evidence.coreTensions, and evidence.hiddenTradeoff.
   No future hazards, no solutions, no bio recap. Do not name generation, tenure, or team size unless the
   sentence genuinely needs it.
   Emotional target: seen, then quietly intrigued.

2) MARKERS — recognizable right now. Framing 5-7 sentences.
   Cover: meet them where they are, name the pattern plainly, show how it surfaces in ordinary weeks,
   and ask them to notice it. Draw on evidence.pressurePattern and evidence.protectivePattern.
   examples[0] and examples[1] MUST be the locked markerMoments, rewritten in your diction only.
   Present tense. Human. No trait names.

3) HAZARDS — if that pattern runs about a year and people stay. Framing 5-7 sentences.
   Cover: what hardens, who absorbs it, and why it compounds quietly. Serious, agency intact, not doom.
   Draw on evidence.futureRiskIfUnchanged and evidence.trajectory.driftCase.
   examples MUST pair 1:1 with the marker examples, using the locked hazardIfStay seeds, rewritten in your diction only.
   Stay-behavior only: withholding, over-asking, self-protection, quiet workarounds, slowed ownership,
   political caution, compliance without candor.
   Never: quitting, resigning, leaving, attrition, turnover, "they walk", "they exit", "talent leaves".

4) NEW TRAIL — the turn toward who they become. 7-10 sentences.
   Cover: what the same strength looks like without the cost, what changes for the people around them,
   and why this version is reachable rather than aspirational. Draw on evidence.trajectory.bestCase.
   Specific to this leader. Energizing, never prescriptive. Give them a picture with enough texture to want it.
   No lists, no trait names, no steps.

LENGTH
The ranges above are real. They exist because each beat has several things to cover and covering them
properly takes that much room. Hit them by doing the work, not by padding — if you find yourself restating
a point in different words, you have run out of material and should go deeper into the evidence instead.
The two examples in each beat stay two vivid scenes; rewrite their diction, do not expand them into essays.

${COMPASS_PHILOSOPHY_HEADER}
${agentIdentity}
`.trim();

export const buildNarrativeVoiceSuffix = ({ voiceBlock, guideName }) => `
YOUR VOICE — you are ${guideName}
${voiceBlock}

Everything above defines what is true and what must be covered. This section defines who is saying it.
The facts must stay identical to the insight map. The voice must be unmistakably ${guideName}.
`.trim();

export const buildSummaryNarrativeUserPrompt = ({
  insightMap,
  focusAreas = [],
  contextSnapshot = {},
  spokenSeeds = {},
}) => `
LOCKED SPOKEN SEEDS (facts — rewrite diction only, never swap the underlying truth)
${JSON.stringify(spokenSeeds)}

INSIGHT MAP (your evidence — draw the substance of every beat from here)
${JSON.stringify(insightMap)}

CONTEXT SNAPSHOT (use only when it sharpens a sentence; never as a parenthetical bio dump)
${JSON.stringify(contextSnapshot)}

Focus leverage points are for your awareness only — do NOT list them in newTrail:
${(focusAreas || []).map((area) => `- ${area.subTraitName} (Parent: ${area.traitName})`).join('\n')}

Write the four beats now. Sound like yourself. Keep the seeds.
`.trim();
