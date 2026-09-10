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
 *
 * `screenData` carries what the screen is actually SHOWING — the scores, the
 * statements, the gaps. Without it the guide was writing about data it had
 * never seen, which is exactly how it produced confident sentences about
 * numbers that were not on the page. A request with no `data` is a screen with
 * nothing on it to be wrong about.
 *
 * Keys are no longer required to exist in the copy sheet. The Evidence rooms
 * and the journal pages are keyed per trait and per statement, and no static
 * sheet can enumerate those — this leader's traits differ from the next one's.
 * Those keys arrive through `screenData` and carry their own description.
 */
export function buildStepRequests(guideSteps, guideId, stepKeys = null, screenData = null) {
  const sheetKeys = Object.keys(guideSteps || {});
  const dataKeys = Object.keys(screenData || {});
  const requested = stepKeys && stepKeys.length
    ? stepKeys
    : [...new Set([...sheetKeys, ...dataKeys])];

  return requested
    .filter((k) => guideSteps?.[k] || screenData?.[k])
    .filter(isPostIntakeStepKey)
    .map((key) => {
      const step = guideSteps?.[key];
      const data = screenData?.[key] || null;
      const req = {
        key,
        screen: String(step?.title || describeKey(key)).trim(),
        canned: String(step?.[guideId]?.text || '').trim(),
      };
      if (data) req.data = data;
      return req;
    });
}

/**
 * A readable screen name for a key the copy sheet has never heard of. The model
 * uses this to know where it is standing, so "trait room 2, statement 3" beats
 * the raw key by a wide margin.
 */
function describeKey(key) {
  const step = String(key || '').split('::')[1] || '';
  let m = step.match(/^t(\d+)-s(\d+)$/);
  if (m) return `Evidence · trait room ${m[1]}, statement ${m[2]} of 5`;
  m = step.match(/^trait-(\d+)$/);
  if (m) return `Evidence · trait room ${m[1]}`;
  m = step.match(/^ev-trait-(\d+)$/);
  if (m) return `Evidence · walkthrough chapter for trait ${m[1]}`;
  m = step.match(/^(edge|lifting|strength)-p(\d+)$/);
  if (m) return `Field Journal · ${m[1]} trait, page ${m[2]}`;
  return step || key;
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
Say something only this leader's guide could say. Where "canned" is empty there is no generic line to
beat — that screen has never had one written for it. Use "screen" and "data" to know where you are
standing, and hold the same length as the rest.

WHAT THE SCREEN IS SHOWING
A request may also carry a "data" object. That object IS the screen — the scores, statements and gaps
this leader is looking at while you speak. It is the ground truth for that line.
- Every number you write must appear in that screen's own "data". Not the map, not another screen, not
  a figure you worked out in your head. If it is not in this request's "data", you may not state it.
- A request with NO "data" is a screen with no figures on it. Write about the moment, not about numbers,
  and do not reach for one.
- "self" fields are what this leader predicted about themselves; the plain fields are what their team
  reported. A null self field means they never rated it — say so if it matters, never print it as zero.
- Read the whole object before writing. A single statement's "siblings" are the other four in the room,
  and one score almost never means anything until it is read against them.

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

NUMBERS
Most of these screens sit directly beside the numbers they are about. The leader can already read
effort 92 and effectiveness 38 off the page; saying them back is not an observation, it is the page
read aloud, and it is the most common way one of these lines fails.
- At most ONE number in a line, and only when that number IS the point. "A 54-point gap on one
  behaviour" earns its place. "Effort 92, effectiveness 38, a 54-point gap" does not.
- Never open with a pair of scores. Open with what is interesting about them.
- On a screen showing data, the job is to answer one question: what is worth noticing here that this
  leader would not notice on their own? A pattern across the five. A contradiction with what they
  predicted. Something the number implies that it does not say.
- If this particular data point holds nothing genuinely interesting, DO NOT manufacture an insight.
  Say the steady, true, general thing about the screen in your own register and spend the revelation
  where one actually exists. A quiet line is better than a forced one, and there are 82 of these —
  they cannot all be revelations.
- Accuracy outranks interest. A quiet true line is worth more than a sharp line that misreads the
  screen, because the leader is looking straight at the number while you talk. Before you write a
  claim about effort, check the effort figure in this request's "data" and make sure the claim
  survives it: telling someone to stop pushing on their lowest-effort behaviour is the exact failure
  this section exists to prevent.

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
Where a screen carries "data", that is what the leader is looking at while you speak. Every figure you
write for that screen must come from its own "data" object; a screen with no "data" gets no figures.
${JSON.stringify(requests)}

Write all of them now. Same keys. Sound like yourself, say something true about this leader, and do not
state a number the screen does not show.
`.trim();
