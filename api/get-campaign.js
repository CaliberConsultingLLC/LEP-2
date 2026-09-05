// /api/get-campaign.js
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';
import { NARRATIVE_MODEL, createJson, hasAnthropicKey } from './_anthropic.js';
import traitSystem from '../src/data/traitSystem.js';

// Five statements go out to the team. Five more are written in the same pass
// and held back.
//
// Dismissing a statement used to mean a round trip to the model and a wait, so
// a leader who disliked the set paid for the privilege of reading it. Writing
// ten at once costs a few hundred output tokens and makes the swap instant.
// The reserve is written to the same brief as the five that ship, in one call,
// with the model told to order them strongest first — so the reserve is the
// tail of one considered set, not a consolation batch.
const STATEMENTS_PER_TRAIT = 5;
const RESERVE_PER_TRAIT = 5;
const TOTAL_PER_TRAIT = STATEMENTS_PER_TRAIT + RESERVE_PER_TRAIT;
const MAX_STATEMENT_CHARS = 140;

const bullets = (items) => items.map((s) => `  - ${s}`).join('\n');

/**
 * Everything known about one selected focus area, in one object.
 *
 * This endpoint used to send the model the raw id string —
 * "communication-clarity" — plus the flattened summary prose, and nothing
 * else. The trait library holds the sub-trait's definition and its observable
 * signals, and the insight map holds what this leader's intake predicted about
 * it. Both sat unused while the model guessed from an id.
 */
function resolveTraitContext(traitId, insightMap) {
  const parts = String(traitId).split('-');
  const coreTraitId = parts[0] || '';
  const subTraitId = parts.slice(1).join('-') || '';
  if (!coreTraitId) return null;

  const coreTrait = (traitSystem?.CORE_TRAITS || []).find((t) => t?.id === coreTraitId) || null;
  const subTrait = subTraitId ? traitSystem.getSubTrait(coreTraitId, subTraitId) : null;

  // The intake made a prediction about this sub-trait. Find it, so the
  // statements can be written to test it rather than to decorate it.
  const recommendations = Array.isArray(insightMap?.focusRecommendations)
    ? insightMap.focusRecommendations
    : [];
  const wanted = String(subTrait?.name || '').trim().toLowerCase();
  const focus = wanted
    ? recommendations.find((r) => String(r?.subTraitName || '').trim().toLowerCase() === wanted) || null
    : null;

  const take = (value, n) => (Array.isArray(value) ? value.slice(0, n) : []);

  return {
    fullId: String(traitId).trim(),
    coreTraitName: coreTrait?.name || coreTraitId,
    subTraitName: subTrait?.name || '',
    definition: subTrait?.definition || subTrait?.shortDescription || coreTrait?.definition || '',
    strengthSignals: take(subTrait?.strengthSignals, 4),
    underuseSignals: take(subTrait?.riskSignals?.underuse, 3),
    impact: subTrait?.impact || '',
    focus,
  };
}

/** One prompt block per selected focus area. */
function renderTraitBrief(ctx, idx) {
  const heading = `### ${idx + 1}. ${ctx.coreTraitName}${ctx.subTraitName ? ` — ${ctx.subTraitName}` : ''}  (id: ${ctx.fullId})`;
  const blocks = [
    heading,
    ctx.definition ? `What it means: ${ctx.definition}` : '',
    ctx.strengthSignals.length ? `Observable when strong:\n${bullets(ctx.strengthSignals)}` : '',
    ctx.underuseSignals.length ? `Observable when weak:\n${bullets(ctx.underuseSignals)}` : '',
    ctx.impact ? `Why it matters: ${ctx.impact}` : '',
  ];

  const f = ctx.focus;
  if (f) {
    const predicted = [
      f.selfSignal ? `  - How they read themselves: ${f.selfSignal}` : '',
      f.predictedTeamRead ? `  - How the team is predicted to rate it: ${f.predictedTeamRead}` : '',
      f.confidence ? `  - Confidence in that prediction: ${f.confidence}` : '',
      f.ifWrong ? `  - What it would mean if that prediction is wrong: ${f.ifWrong}` : '',
      f.rationale ? `  - Why this area was chosen for them: ${f.rationale}` : '',
    ].filter(Boolean);

    if (predicted.length) {
      blocks.push([
        'What this leader\'s intake predicted here:',
        predicted.join('\n'),
        'Write statements whose ratings would actually confirm or refute that prediction.',
      ].join('\n'));
    }
  }

  return blocks.filter(Boolean).join('\n');
}
// --- helpers ---------------------------------------------------------------
// Counts live in the prompt and in these descriptions, not in minItems /
// maxItems.
//
// Structured output rejects both: minItems above 1 is unsupported, and
// maxItems is unsupported outright. Asking for 3 and 5 there did not constrain
// the model, it 400'd the request — so every campaign build failed instantly,
// and had been failing since this endpoint moved to schema-enforced output.
// The handler still checks the shape it got back, which is where a count
// belongs anyway.
const CAMPAIGN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['campaign'],
  properties: {
    campaign: {
      type: 'array',
      description: 'Exactly three traits, in the order the leader selected them.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['trait', 'statements'],
        properties: {
          trait: { type: 'string', description: 'The core trait name, e.g. "Communication".' },
          statements: {
            type: 'array',
            description: `Exactly ${TOTAL_PER_TRAIT} statements for this trait, strongest first.`,
            items: {
              type: 'string',
              description: `An observable leader behavior the team can rate on both effort and efficacy. At most ${MAX_STATEMENT_CHARS} characters.`,
            },
          },
        },
      },
    },
  },
};

// Unwrap a statement the model wrapped in quotes, without eating punctuation
// that belongs to it.
//
// Stripping any leading-or-trailing quote independently truncated statements
// that legitimately end on one: "Distinguishes between 'decided' and 'still
// open'" came out missing its final quote. Only strip a matching pair, and
// only when the same quote does not also appear inside — otherwise it is
// content, not wrapping.
const QUOTE_PAIRS = [['"', '"'], ["'", "'"], ['“', '”'], ['‘', '’']];

function stripWrappingQuotes(text) {
  for (const [open, close] of QUOTE_PAIRS) {
    if (text.length > 1 && text.startsWith(open) && text.endsWith(close)) {
      const inner = text.slice(1, -1);
      if (!inner.includes(open) && !inner.includes(close)) return inner.trim();
    }
  }
  return text;
}

const clean = (value) => stripWrappingQuotes(
  String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-*\d.)]+\s*/, '')
    .trim()
);

/**
 * Split each trait's statements into the five that ship and the five held in
 * reserve for instant swaps.
 *
 * A short return is not fatal — the leader still gets a campaign, just with a
 * thinner bench, and the dismissal path falls back to a live rewrite when the
 * bench runs out.
 */
function normalizeCampaign(data) {
  const out = { campaign: [] };
  const arr = Array.isArray(data?.campaign) ? data.campaign : [];
  for (const item of arr) {
    const trait = typeof item?.trait === 'string' ? item.trait.trim() : '';
    const stmts = Array.isArray(item?.statements) ? item.statements : [];
    const cleaned = [];
    const seen = new Set();
    for (const raw of stmts) {
      const text = clean(raw);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push(text);
      if (cleaned.length >= TOTAL_PER_TRAIT) break;
    }
    if (trait && cleaned.length) {
      out.campaign.push({
        trait,
        statements: cleaned.slice(0, STATEMENTS_PER_TRAIT),
        reserve: cleaned.slice(STATEMENTS_PER_TRAIT),
      });
    }
  }
  if (out.campaign.length > 3) out.campaign = out.campaign.slice(0, 3);
  return out;
}

// --- handler ---------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-campaign',
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!hasAnthropicKey()) {
    return res.status(503).json({
      error: 'Campaign generation is not configured. ANTHROPIC_API_KEY is missing from this environment.',
    });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) {
      return;
    }

    const body = req.body;
    const { aiSummary, sessionId, selectedTraits } = body;
    // Optional. When the caller supplies the persisted insight map, statements
    // are grounded in structured evidence rather than inferred back out of the
    // flattened narrative prose.
    const insightMap = body?.insightMap && typeof body.insightMap === 'object' ? body.insightMap : null;
    const isRebuild = body?.rebuild === true;
    const avoidStatements = Array.isArray(body?.avoidStatements)
      ? body.avoidStatements.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 45)
      : [];

    // Input validation: aiSummary must be a non-empty string
    if (!aiSummary || typeof aiSummary !== 'string' || !aiSummary.trim()) {
      return res.status(400).json({ 
        error: 'Missing or invalid aiSummary in request body (must be non-empty string)',
        sessionId: sessionId || null 
      });
    }

    // Input validation: selectedTraits must be an array
    if (!selectedTraits) {
      return res.status(400).json({ error: 'Missing selectedTraits in request body' });
    }

    if (!Array.isArray(selectedTraits)) {
      return res.status(400).json({ error: 'selectedTraits must be an array' });
    }

    if (selectedTraits.length === 0) {
      return res.status(400).json({ error: 'selectedTraits array cannot be empty' });
    }

    // Allow any number of traits, but warn if not 3
    if (selectedTraits.length !== 3) {
      console.warn(`Expected 3 selectedTraits, but received ${selectedTraits.length}`);
    }

    // Resolve each selected id into everything known about it: the sub-trait
    // from the trait library, and the intake's prediction from the insight map.
    const traitInfo = selectedTraits
      .filter((traitId) => traitId && typeof traitId === 'string' && traitId.trim())
      .map((traitId) => resolveTraitContext(traitId, insightMap))
      .filter(Boolean);

    if (traitInfo.length === 0) {
      return res.status(400).json({ error: 'No valid trait IDs found in selectedTraits' });
    }

    const groundedCount = traitInfo.filter((t) => t.focus).length;

    const systemPrompt = `
You write the team-facing survey for a Compass leadership campaign.

A leader has finished an intake, read their reflection, and chosen three focus areas. You write the
statements their team will rate. These statements are the instrument: everything the leader learns
about how they are actually seen comes from how the team rates them. A vague statement produces a
vague rating and teaches the leader nothing.

WHAT MAKES A USABLE STATEMENT
- An observable behavior a teammate could witness, written from the team's perspective.
- Rateable independently on EFFORT (how much the leader visibly tries) and EFFICACY (how well it lands).
  "Is a good communicator" fails both. "Clearly explains priorities in team meetings" passes both.
- At most ${MAX_STATEMENT_CHARS} characters. No numbering, no markdown, no quotation marks.
- Plain observable language. Not a trait name, not a competency label, not coaching advice.
- Specific enough that two teammates watching the same week would rate it similarly.

WHAT THE SET HAS TO DO
- ${TOTAL_PER_TRAIT} statements per trait, each probing a DISTINCT behavior. No two should be rephrasings.
- Order them strongest first. The first ${STATEMENTS_PER_TRAIT} go to the team; the rest are held in reserve
  and swapped in if the leader rejects one. A reserve statement must be able to stand in the set it replaces
  into — write ${TOTAL_PER_TRAIT} you would be willing to ship, not ${STATEMENTS_PER_TRAIT} good ones and ${RESERVE_PER_TRAIT} filler.
- Stay inside the named sub-trait. Drifting to a neighbouring competency breaks what the campaign measures.
- Use the leader's own context — their role, their team, what their reflection surfaced — so the statements
  read as written for them rather than pulled from a generic leadership inventory.
- Where an intake prediction is given for a sub-trait, write statements whose ratings would actually settle it.
  A prediction that the team rates something lower than the leader does is only testable if the statements
  describe the behavior precisely enough for the gap to show up.

DO NOT
- Do not evaluate or praise the leader. The team rates; you only describe what to rate.
- Do not write two statements that would always be rated the same way.
- Do not reference the intake, the reflection, or this prompt. The team sees only the statements.
`.trim();

    const userPrompt = `
THE LEADER'S THREE FOCUS AREAS

${traitInfo.map((ctx, idx) => renderTraitBrief(ctx, idx)).join('\n\n')}

THE LEADER'S REFLECTION (their context — use it, do not quote it)
---
${String(aiSummary).trim()}
---
${insightMap ? `
WHAT THE INTAKE FOUND (structured; prefer this over the prose above where they overlap)
---
${JSON.stringify({
    coreTensions: insightMap?.evidence?.coreTensions || [],
    blindSpots: insightMap?.evidence?.blindSpots || [],
  })}
---
` : ''}${isRebuild ? `
THIS IS A REBUILD
The leader asked for a different set. Do not repeat or lightly rephrase any of these:
${(avoidStatements.length ? avoidStatements : ['(none provided)']).map((s) => `  - ${s}`).join('\n')}
Every statement must take an observably different angle from all of the above.
` : ''}
Write ${TOTAL_PER_TRAIT} statements for each of the three focus areas, strongest first.
Use the core trait name (e.g. "Communication", "Decision-Making & Judgment") as each trait's name.
Return only the JSON.
`.trim();

    const { data: parsed } = await createJson({
      model: NARRATIVE_MODEL,
      system: systemPrompt,
      user: userPrompt,
      schema: CAMPAIGN_SCHEMA,
      // Ten statements a trait instead of five, so the ceiling doubles too.
      maxTokens: isRebuild ? 5000 : 4200,
      effort: 'low',
      thinking: false,
    });

    const normalized = normalizeCampaign(parsed);

    // Final validation: exactly 3 traits, each shipping 1-5 statements.
    if (
      !Array.isArray(normalized.campaign) ||
      normalized.campaign.length !== 3 ||
      normalized.campaign.some(
        (t) => !t.trait
          || !Array.isArray(t.statements)
          || t.statements.length === 0
          || t.statements.length > STATEMENTS_PER_TRAIT
      )
    ) {
      return res.status(502).json({ error: 'Invalid campaign structure after normalization' });
    }

    // Worth knowing without opening a payload: whether the caller sent the
    // insight map at all, and how deep a bench each trait got. A campaign
    // built from prose alone is a weaker campaign, and it should be visible
    // in the logs rather than inferred from the statements later.
    console.log('get-campaign built:', JSON.stringify({
      traits: normalized.campaign.length,
      groundedTraits: `${groundedCount}/${traitInfo.length}`,
      reserve: normalized.campaign.map((t) => t.reserve.length),
      rebuild: isRebuild,
    }));

    return res.status(200).json(normalized);
  } catch (err) {
    console.error('get-campaign error:', err);
    
    // Handle specific error types
    if (err?.response?.status === 401 || err?.status === 401) {
      return res.status(500).json({ error: 'Campaign generation failed' });
    }
    
    if (err?.response?.status === 429 || err?.status === 429) {
      return res.status(503).json({ error: 'Campaign generation failed' });
    }
    
    if (err?.code === 'ENOTFOUND' || err?.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Campaign generation failed' });
    }
    
    return safeServerError(res, 'get-campaign error:', err);
  }
}
