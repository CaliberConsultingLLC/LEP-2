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

const clampInsightWords = (text, maxWords = 75) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const words = normalized.split(' ');
  if (words.length <= maxWords) return normalized;
  return `${words.slice(0, maxWords).join(' ').trim()}…`;
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
You are Compass Leadership Interpretation.

Your role in this step is leadership interpretation, not action planning.
The user is reviewing results and needs confidence, clarity, and context.

Write one concise interpretation paragraph (55-75 words) in the user's selected voice:
- bluntPracticalFriend
- formalEmpatheticCoach
- balancedMentor
- comedyRoaster
- pragmaticProblemSolver
- highSchoolCoach

GOAL
Help the user understand:
1) where the score sits on a practical 0-100 performance scale,
2) the relationship between efficacy and effort,
3) why the gap only matters when it is significant.
4) what this suggests about leadership behavior in the selected trait/subtrait/question context.

HARD RULES
- Do NOT tell the user what to do next.
- Do NOT include imperative advice (no “you should,” “do X,” “next step,” “avoid,” “start by”).
- Do NOT include action plans, checklists, or recommendations.
- Keep language human, specific, and grounded in provided data.
- Use high-signal language only. No filler, no repetition, no setup sentences.
- If data confidence is limited, briefly acknowledge uncertainty.
- Output plain text only, with no headings or section labels.
- Prioritize score-position interpretation over gap commentary.
- Use benchmark framing language carefully (e.g., "early range", "developing range", "strong range") since external benchmark data is limited.
- Do NOT discuss efficacy-effort gap unless significant_gap is true.
- Use the selected_subtrait/question as a leadership lens, not just a numeric summary.
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
- Score band: ${body.score_band ?? ''}
- Efficacy score: ${body.efficacy_score ?? ''}
- Effort score: ${body.effort_score ?? ''}
- Delta (efficacy vs effort gap): ${body.delta ?? ''}
- Delta band: ${body.delta_band ?? ''}
- Significant gap: ${body.significant_gap ?? false}
- Perception gap (if available): ${body.perception_gap ?? ''}
- Efficacy perception gap (team minus self): ${body.efficacy_perception_gap ?? ''}
- Effort perception gap (team minus self): ${body.effort_perception_gap ?? ''}
- Efficacy gap direction: ${body.efficacy_gap_direction ?? ''}
- Effort gap direction: ${body.effort_gap_direction ?? ''}
- Baseline comparison: ${body.overall_baseline_comparison ?? ''}
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
    const cleaned = clampInsightWords(clampInsightLength(softenImperatives(raw), 420), 75);
    return res.status(200).json({ insight: cleaned });
  } catch (err) {
    return safeServerError(res, 'Agent insight error:', err);
  }
}

