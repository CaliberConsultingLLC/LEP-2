// Dashboard interpretation for a single selected sub-trait.
//
// The efficacy/effort gap is now withheld from the prompt entirely when it is
// not significant, rather than being included with a "do not mention this"
// instruction and policed afterwards with regexes and an enforcement retry.
// A model cannot leak data it was never given.

import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';
import { SHORT_FORM_MODEL, createText, hasAnthropicKey } from './_anthropic.js';

const clampWords = (text, maxWords) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const words = normalized.split(' ');
  if (words.length <= maxWords) return normalized;
  return `${words.slice(0, maxWords).join(' ').trim()}…`;
};

const normalizeBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const asText = String(value || '').trim().toLowerCase();
  return asText === 'true' || asText === '1' || asText === 'yes';
};

// Used only when the model call itself fails. Not a content guard.
const buildFallbackInsight = (body, significantGap) => {
  const subtrait = String(body?.selected_subtrait || 'this leadership area');
  const scoreBand = String(body?.score_band || 'developing range');
  const isCampaignResults = String(body?.view_type || '').trim().toLowerCase() === 'campaign_results';

  if (isCampaignResults) {
    return significantGap
      ? `Your team reads ${subtrait} as a ${scoreBand} signal, and the efficacy-effort relationship suggests visible energy is not converting cleanly into the experience they are actually having.`
      : `Your team reads ${subtrait} as a ${scoreBand} signal overall, with sentiment centered more on consistency and clarity than on any major disconnect in how this trait is landing.`;
  }

  return significantGap
    ? `In ${subtrait}, your score sits in the ${scoreBand}, and the efficacy-effort separation is now large enough to matter. This usually signals leadership energy not converting cleanly into team experience in this behavior. The practical insight is not effort alone, but conversion quality: how clearly intent, communication, and follow-through are being experienced by others in day-to-day execution.`
    : `In ${subtrait}, your score sits in the ${scoreBand}, which points to a leadership pattern your team can generally track and respond to. The signal here is about consistency and communication quality inside this specific behavior, not major structural friction. This is a calibration moment: strengthen what is already landing and tighten clarity where interpretation can drift.`;
};

const buildSystemPrompt = (isCampaignResults, significantGap) => `
You are Compass Leadership Interpretation.

Your role in this step is interpretation, not action planning. The user is reviewing results and needs
confidence, clarity, and context.

Write one interpretation paragraph of ${isCampaignResults ? '20-35' : '55-75'} words, in the user's selected voice.

GOAL
${isCampaignResults
    ? 'Synthesize what the team\'s feedback suggests about this behavior. Act like a data analyst with deep expertise in this leadership trait.'
    : `Help the user understand where the score sits on a practical 0-100 scale, and what that suggests about their leadership behavior in this specific trait context.${significantGap ? ' The efficacy-effort separation supplied below is large enough to be worth interpreting.' : ''}`}

HARD RULES
- Do NOT tell the user what to do next. No advice, no imperatives, no action plans, no checklists.
- Keep language human, specific, and grounded in the data provided. No filler, no setup sentences.
- Use benchmark framing carefully ("early range", "developing range", "strong range") — external benchmark data is limited.
- If data confidence is limited, briefly acknowledge the uncertainty.
- Treat the sub-trait as a leadership lens, not just a numeric summary.
- Output plain prose only. No headings, labels, bullets, or multiple paragraphs.
${significantGap ? '' : '- Interpret the score position on its own terms. Do not speculate about a comparison you have not been given.'}
`.trim();

const buildUserPrompt = (body, significantGap) => {
  const lines = [
    `Selected trait/subtrait: ${body.selected_subtrait ?? ''}`,
    `Selected view: ${body.view_type ?? ''}`,
    `Trait score (LEP): ${body.trait_score ?? ''}`,
    `Score band: ${body.score_band ?? ''}`,
    `Efficacy score: ${body.efficacy_score ?? ''}`,
    `Effort score: ${body.effort_score ?? ''}`,
    `Trait library context: ${body.trait_library_context ?? ''}`,
    `Intake context summary: ${body.intake_context_summary ?? ''}`,
    `Baseline comparison: ${body.overall_baseline_comparison ?? ''}`,
    `Overall averages: ${body.overall_summary ?? ''}`,
    `Notable cross-trait patterns: ${body.cross_trait_patterns ?? ''}`,
    `Confidence signals: ${body.confidence_context ?? ''}`,
    `Selected voice: ${body.selectedAgent ?? 'balancedMentor'}`,
  ];

  // Gap data is supplied only when it is significant. When it is not, these
  // lines are absent entirely rather than present-but-forbidden.
  if (significantGap) {
    lines.push(
      `Delta (efficacy vs effort gap): ${body.delta ?? ''}`,
      `Delta band: ${body.delta_band ?? ''}`,
      `Perception gap: ${body.perception_gap ?? ''}`,
      `Efficacy perception gap (team minus self): ${body.efficacy_perception_gap ?? ''}`,
      `Effort perception gap (team minus self): ${body.effort_perception_gap ?? ''}`,
      `Efficacy gap direction: ${body.efficacy_gap_direction ?? ''}`,
      `Effort gap direction: ${body.effort_gap_direction ?? ''}`
    );
  }

  return `INPUTS\n${lines.map((line) => `- ${line}`).join('\n')}`;
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'get-agent-insight', limit: 45, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const body = req.body || {};
    const isCampaignResults = String(body?.view_type || '').trim().toLowerCase() === 'campaign_results';
    const significantGap = normalizeBool(body.significant_gap);
    const maxWords = isCampaignResults ? 35 : 75;

    if (!hasAnthropicKey()) {
      return res.status(200).json({ insight: clampWords(buildFallbackInsight(body, significantGap), maxWords) });
    }

    const { text } = await createText({
      model: SHORT_FORM_MODEL,
      system: buildSystemPrompt(isCampaignResults, significantGap),
      user: buildUserPrompt(body, significantGap),
      maxTokens: 600,
      effort: 'low',
      thinking: false,
    });

    const insight = clampWords(text, maxWords) || clampWords(buildFallbackInsight(body, significantGap), maxWords);
    return res.status(200).json({ insight });
  } catch (err) {
    console.warn('Agent insight failed:', err?.message || err);
    try {
      const body = req.body || {};
      const significantGap = normalizeBool(body.significant_gap);
      const maxWords = String(body?.view_type || '').trim().toLowerCase() === 'campaign_results' ? 35 : 75;
      return res.status(200).json({ insight: clampWords(buildFallbackInsight(body, significantGap), maxWords) });
    } catch {
      return safeServerError(res, 'Agent insight error:', err);
    }
  }
}
