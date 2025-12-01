// /api/get-campaign.js
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- helpers ---------------------------------------------------------------
function safeParseJSON(maybeJSON) {
  try {
    return JSON.parse(maybeJSON);
  } catch {
    // try to extract first JSON object/array from the text
    const match = maybeJSON.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
}

function normalizeCampaign(data) {
  // Expect: { campaign: [ { trait: string, statements: string[5] }, x3 ] }
  const out = { campaign: [] };
  const arr = Array.isArray(data?.campaign) ? data.campaign : [];
  for (const item of arr) {
    const trait = typeof item?.trait === 'string' ? item.trait.trim() : '';
    const stmts = Array.isArray(item?.statements) ? item.statements : [];
    const cleaned = stmts.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 5);
    if (trait && cleaned.length > 0) {
      out.campaign.push({ trait, statements: cleaned });
    }
  }
  // clamp/extend to exactly 3 traits (each ≤ 5 items)
  if (out.campaign.length > 3) out.campaign = out.campaign.slice(0, 3);
  return out;
}

// --- handler ---------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { aiSummary, sessionId, selectedTraits } = body;

    // Input validation: aiSummary must be a non-empty string
    if (!aiSummary || typeof aiSummary !== 'string' || !aiSummary.trim()) {
      return res.status(400).json({ error: 'Missing or invalid aiSummary in request body (must be non-empty string)', sessionId: sessionId || null });
    }

    // Input validation: selectedTraits must be an array of 3 trait IDs
    if (!Array.isArray(selectedTraits) || selectedTraits.length !== 3) {
      return res.status(400).json({ error: 'Missing or invalid selectedTraits (must be array of 3 trait IDs)' });
    }

    // Parse selected trait IDs to get trait and sub-trait names
    // Format: "communication-clarity" or "decisionMaking-speed"
    // We'll pass these to the AI to generate statements for these specific traits
    const traitInfo = selectedTraits.map((traitId) => {
      const parts = traitId.split('-');
      const coreTraitId = parts[0];
      const subTraitId = parts.slice(1).join('-'); // Handle multi-part sub-trait IDs
      return { coreTraitId, subTraitId, fullId: traitId };
    });

    const systemPrompt = `
You are the Compass Campaign Builder Agent.
Generate measurable team-facing survey statements for specific leadership traits/sub-traits.

The user has selected 3 specific leadership focus areas. For each, you must generate 5 concrete, observable statements that their team can rate using a dual-axis system (Effort vs. Efficacy).

OUTPUT FORMAT (strict JSON):
{
  "campaign": [
    { "trait": "string", "statements": ["string", "string", "string", "string", "string"] },
    { "trait": "string", "statements": ["string", "string", "string", "string", "string"] },
    { "trait": "string", "statements": ["string", "string", "string", "string", "string"] }
  ]
}

CONSTRAINTS:
- Exactly THREE traits (matching the selected traits provided).
- For EACH trait, provide FIVE concise, measurable statements.
- Statements must be:
  * Observable behaviors or actions the team can witness and rate
  * Rateable on TWO dimensions: EFFORT (how much the leader tries/commits) and EFFICACY (how effective/successful the leader is)
  * Specific to the trait/sub-trait (not generic leadership advice)
  * Written from the team's perspective (what they observe about the leader)
  * Clear enough that team members can distinguish between effort and effectiveness
  * ≤ 140 chars each; no numbering, no markdown bullets
- Trait names should be the core trait name (e.g., "Communication", "Decision-Making", "Team Development").
- Statements should be behaviors that can be rated on both effort (commitment/trying) and efficacy (results/effectiveness).
- Example good statement: "Clearly explains priorities in team meetings" (team can rate both: how much effort leader puts in AND how effective it is)
- Example bad statement: "Is a good communicator" (too vague, not observable, can't distinguish effort vs efficacy)
- Do not include any text outside of the JSON object.
`.trim();

    const userPrompt = `
The leader has selected these 3 specific focus areas (format: coreTrait-subTrait):
${traitInfo.map((t, idx) => `${idx + 1}. ${t.fullId}`).join('\n')}

Here is the leader's 4-paragraph summary for context:
---
${String(aiSummary).trim()}
---

Task:
- Generate exactly 3 traits matching the selected focus areas above.
- For each trait, create 5 team-facing survey statements that are:
  * Observable behaviors the team can witness and rate
  * Rateable on TWO dimensions: EFFORT (how much the leader tries/commits) and EFFICACY (how effective/successful the leader is)
  * Specific to the trait/sub-trait (e.g., for "communication-clarity": statements about clear communication)
  * Written from the team's perspective (what they observe about the leader)
  * Clear enough that team members can distinguish between effort and effectiveness
  * Grounded in the leader's specific context from the summary
- Example good statements: "Clearly explains priorities in team meetings" (team can rate both effort AND effectiveness), "Listens actively before responding" (observable, rateable on both dimensions), "Makes decisions within agreed timeframes" (can rate effort to decide AND effectiveness of decisions)
- Example bad statements: "Is a good communicator" (too vague), "Tries hard" (can't rate efficacy), "Is effective" (can't rate effort)
- Trait names should reflect the core trait (e.g., "Communication", "Decision-Making", "Team Development")
- Return ONLY the JSON described above.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Aligned with get-ai-summary model
      max_tokens: 600,      // Sufficient for 3 traits × 5 statements
      temperature: 0.35,
      frequency_penalty: 0.2,
      presence_penalty: 0.0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = safeParseJSON(raw);
    if (!parsed) {
      return res.status(502).json({ error: 'Malformed model output', raw });
    }

    const normalized = normalizeCampaign(parsed);

    // Final validation: exactly 3 traits, each with up to 5 statements (≥1)
    if (
      !Array.isArray(normalized.campaign) ||
      normalized.campaign.length !== 3 ||
      normalized.campaign.some(
        (t) => !t.trait || !Array.isArray(t.statements) || t.statements.length === 0 || t.statements.length > 5
      )
    ) {
      return res.status(502).json({ error: 'Invalid campaign structure after normalization', normalized, raw });
    }

    return res.status(200).json(normalized);
  } catch (err) {
    console.error('get-campaign error:', err);
    return res.status(500).json({ error: 'Campaign generation failed', details: String(err?.message || err) });
  }
}
