import { OpenAI } from 'openai';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const clampInsightLength = (text, max = 420) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const cut = normalized.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > 220 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trimEnd()}…`;
};

const softenImperatives = (text) =>
  String(text || '')
    .replace(/\byou should\b/gi, 'you may notice')
    .replace(/\bshould\b/gi, 'can')
    .replace(/\bmust\b/gi, 'may need to')
    .replace(/\bneed to\b/gi, 'may need to')
    .replace(/\bnext move\b/gi, 'pattern signal')
    .replace(/\bstart by\b/gi, 'a common example is')
    .replace(/\bdo this\b/gi, 'this pattern often appears')
    .trim();

const buildSystemPrompt = () => `
You are Compass Insights.

Your role in this step is interpretation, not action planning.
The user is reviewing results and needs confidence, clarity, and context.

Write one concise insight (110-170 words) in the user's selected voice:
- bluntPracticalFriend
- formalEmpatheticCoach
- balancedMentor
- comedyRoaster
- pragmaticProblemSolver
- highSchoolCoach

GOAL
Help the user understand:
1) what this pattern means,
2) what tension/tradeoff it reveals,
3) how it relates to their broader profile.

HARD RULES
- Do NOT tell the user what to do next.
- Do NOT include imperative advice (no “you should,” “do X,” “next step,” “avoid,” “start by”).
- Do NOT include action plans, checklists, or recommendations.
- Keep language human, specific, and grounded in provided data.
- If data confidence is limited, briefly acknowledge uncertainty.

OUTPUT FORMAT (exactly 3 short sections)
Pattern:
<1-2 sentences interpreting the selected metric pattern>

Context:
<1-2 sentences linking this to broader profile/cross-trait signals>

Perspective:
<1 sentence offering high-level, non-prescriptive framing>
`.trim();

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-agent-insight',
    limit: 45,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const body = req.body || {};
    const userPrompt = `INPUTS
- Selected trait/subtrait: ${body.selected_subtrait ?? ''}
- Selected view: ${body.view_type ?? ''}
- Trait score (LEP): ${body.trait_score ?? ''}
- Efficacy score: ${body.efficacy_score ?? ''}
- Effort score: ${body.effort_score ?? ''}
- Delta (efficacy vs effort gap): ${body.delta ?? ''}
- Perception gap (if available): ${body.perception_gap ?? ''}
- Overall averages: ${body.overall_summary ?? ''}
- Notable cross-trait patterns: ${body.cross_trait_patterns ?? ''}
- Confidence signals: ${body.confidence_context ?? ''}
- Selected voice: ${body.selectedAgent ?? 'balancedMentor'}`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 260,
      temperature: 0.45,
      frequency_penalty: 0.15,
      presence_penalty: 0.1,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = clampInsightLength(softenImperatives(raw), 420);
    return res.status(200).json({ insight: cleaned });
  } catch (err) {
    return safeServerError(res, 'Agent insight error:', err);
  }
}

