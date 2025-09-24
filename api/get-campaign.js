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
    const { aiSummary, sessionId } = body;

    // The API expects aiSummary from the caller (DevSkipTwo or Summary flow).
    // If not present, fail fast (no Firestore read here).
    if (!aiSummary || !String(aiSummary).trim()) {
      return res.status(400).json({ error: 'Missing aiSummary in request body', sessionId: sessionId || null });
    }

    const systemPrompt = `
You are the LEP Campaign Builder Agent.
Translate a leader’s 3-paragraph summary into a focused growth campaign.

OUTPUT FORMAT (strict JSON):
{
  "campaign": [
    { "trait": "string", "statements": ["string", "string", "string", "string", "string"] },
    { "trait": "string", "statements": ["string", "string", "string", "string", "string"] },
    { "trait": "string", "statements": ["string", "string", "string", "string", "string"] }
  ]
}

CONSTRAINTS:
- Exactly THREE distinct traits/themes (no more, no less).
- For EACH trait, provide FIVE concise, non-redundant statements (actions, behaviors, or practices).
- Statements must be concrete and observable; avoid vague platitudes.
- Keep statements ≤ 140 chars each; no numbering, no markdown bullets.
- Keep trait names short (2–4 words), actionable, and non-jargony.
- Do not include any text outside of the JSON object.
`.trim();

    const userPrompt = `
Here is the leader's 3-paragraph summary (Momentum / Blind Spots / Growth Spark):
---
${String(aiSummary).trim()}
---
Task:
- Derive 3 traits that, if practiced, would most improve outcomes.
- For each trait, produce 5 crisp, testable statements that can be shared with a team as norms/practices for the next sprint.
- Return ONLY the JSON described above.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',          // keep aligned with your summary route; change if your org requires
      max_tokens: 600,         // hard cap per your directive
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
