// Prompt construction for personalized guide lines.
//
// Every screen after intake shows the guide a one- or two-sentence line. Today
// those are canned — the same 466 strings for every leader. Once the insight map
// exists there is no reason for that: the guide already knows this leader's
// clearest asset, their core tension, and what they predicted about themselves.
//
// One batched call per guide covers every screen. Doing it per-screen-per-visit
// would mean hundreds of requests, latency on every navigation, and lines with
// no awareness of each other — the guide would repeat its best observation on
// six different pages.

// Screens shown before intake completes keep their canned copy: there is no map
// to personalize from, and a quip is the right register there anyway.
export const PRE_INTAKE_PREFIXES = ['landing', 'signIn', 'faq', 'userInfo', 'guideSelect', 'default', 'intake'];

export function isPostIntakeStepKey(key) {
  return !PRE_INTAKE_PREFIXES.includes(String(key || '').split('::')[0]);
}

/**
 * Builds the per-screen request list. Passing the existing canned line does two
 * jobs at once: it tells the model what the screen is for, and it anchors the
 * length and register far better than any description of the screen would.
 */
export function buildStepRequests(guideSteps, guideId, stepKeys = null) {
  const keys = (stepKeys && stepKeys.length ? stepKeys : Object.keys(guideSteps || {}))
    .filter((k) => guideSteps?.[k])
    .filter(isPostIntakeStepKey);

  return keys.map((key) => ({
    key,
    screen: String(guideSteps[key]?.title || key.split('::')[0]).trim(),
    canned: String(guideSteps[key]?.[guideId]?.text || '').trim(),
  }));
}

export const GUIDE_LINES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lines'],
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'text'],
        properties: {
          key: { type: 'string', description: 'Must exactly match a key from the request list.' },
          text: { type: 'string', description: 'One or two sentences. Under 200 characters.' },
        },
      },
    },
  },
};

export const buildGuideLinesSystemPrefix = ({ agentIdentity }) => `
ROLE
You are a Compass guide. Your specific identity is named at the end of this prompt.

You are writing the short line you say to one leader on each screen of the product. You know this leader
already — their insight map is below. You are not introducing yourself and you are not narrating the UI.

WHAT YOU ARE REPLACING
Each request carries the generic line currently shown on that screen. Treat it as three things: what the
screen is for, roughly how long your line should be, and the bar you have to clear. Do not rewrite it.
Say something only this leader's guide could say.

HARD RULES
- Return one entry for EVERY key you are given, using that exact key. No additions, no omissions.
- One or two sentences. Under 200 characters. These sit in a small panel, not a page.
- Do NOT restate their intake answers back to them, and never quote their own words as if reciting them.
- Do NOT give advice, steps, or directives. Notice, name, or ask — do not instruct.
- Do NOT repeat an observation across screens. You have one shot at each idea; spend it where it fits best
  and find something else for the other screens.
- Do NOT explain what the screen does. They can see the screen.
- Do NOT mention the insight map, scores, guides, personas, or that you are an AI.
- Avoid consultant filler. A line that would work for any leader has failed.

CALIBRATION
- Screens before results exist (summary, trait selection, campaign setup) draw on the map: their asset,
  their tension, the tradeoff they have not named yet.
- Screens after results exist draw on what their team actually said, and on whether their own predictions
  held up. If no results are supplied, stay on the map and do not invent team reactions.
- A few lines should land as recognition. A few should be uncomfortable. Not every line is a revelation —
  some are just a steady voice in the room, in your register.

COMPASS PHILOSOPHY
${agentIdentity}
`.trim();

export const buildGuideLinesUserPrompt = ({ insightProfile, resultsAnalysis = null, requests }) => `
THIS LEADER (insight map)
${JSON.stringify({
  leadershipMirror: insightProfile?.evidence?.leadershipMirror || '',
  protectivePattern: insightProfile?.evidence?.protectivePattern || '',
  pressurePattern: insightProfile?.evidence?.pressurePattern || '',
  hiddenTradeoff: insightProfile?.evidence?.hiddenTradeoff || '',
  peopleImpact: insightProfile?.evidence?.peopleImpact || '',
  coreStrengths: (insightProfile?.evidence?.coreStrengths || []).map((s) => ({ label: s.label, implication: s.implication })),
  coreTensions: (insightProfile?.evidence?.coreTensions || []).map((t) => ({ label: t.label, implication: t.implication })),
  blindSpots: (insightProfile?.evidence?.blindSpots || []).map((b) => ({ label: b.label, teamImpact: b.teamImpact })),
  spokenSeeds: insightProfile?.rendering?.spokenSeeds || {},
  focusRecommendations: (insightProfile?.focusRecommendations || []).map((f) => ({
    subTraitName: f.subTraitName, selfSignal: f.selfSignal, predictedTeamRead: f.predictedTeamRead,
  })),
  openQuestions: insightProfile?.openQuestions || [],
})}
${resultsAnalysis ? `
WHAT THEIR TEAM ACTUALLY SAID
${JSON.stringify({
    headline: resultsAnalysis.headline,
    predictionScorecard: resultsAnalysis.predictionScorecard,
    crossCuttingPatterns: resultsAnalysis.crossCuttingPatterns,
  })}
` : `
No campaign results exist yet. Write the post-results screens from the map alone, and do not invent
anything about how their team responded.
`}
SCREENS (write one line for each key)
${JSON.stringify(requests)}

Write all of them now. Same keys. Sound like yourself, and say something true about this leader.
`.trim();
