// Intake clarification check. Decides whether the finished intake contains a
// resolvable ambiguity worth one open follow-up question. Defaults hard to
// asking nothing — most intakes should skip this entirely.

import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';
import { SHORT_FORM_MODEL, createJson, hasAnthropicKey } from './_anthropic.js';
import { buildIntakeProjection } from './promptBuilder.js';

function emptyResult() {
  return { needsClarification: false, notice: '', questions: [] };
}

const CLARIFICATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['needsClarification', 'notice', 'questions'],
  properties: {
    needsClarification: { type: 'boolean' },
    notice: {
      type: 'string',
      description: 'One or two sentences to the user, only when asking. Empty string otherwise.',
    },
    questions: {
      type: 'array',
      minItems: 0,
      maxItems: 2,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'prompt', 'relatedSignals'],
        properties: {
          id: { type: 'string' },
          prompt: { type: 'string', description: 'Under 220 characters. One open-ended question.' },
          relatedSignals: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'string' } },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `
You are the Compass intake check. Your only job is to decide whether the finished intake has a resolvable
ambiguity that would change the five trait recommendations.

DEFAULT: return needsClarification=false and questions=[]. Most intakes should skip.

ASK only when BOTH are true:
1) Two answers on the SAME construct pull apart (likely misclick, confusion, or a correction the user would
   want to make), OR the five traits would rest on thin or conflicting evidence for a specific named signal.
2) A short open question would actually help lock the five.

DO NOT ASK for:
- Productive tension (speed vs care, warning label vs proud moment, Balance Line poles that simply describe this leader).
- Coverage gaps in the instrument.
- Generic "tell us more about your leadership".
- Anything already answered in proudMoment.

TONE
- Curious, not accusatory. Never imply they were wrong, sloppy, or testing the tool.
- Frame as noticing, then offering a chance to clarify.
- Each question must name the two signals in plain language.

Do not mention "the five", locking traits, or survey mechanics in the notice.
`.trim();

function normalizeResult(raw) {
  const questions = (Array.isArray(raw?.questions) ? raw.questions : [])
    .slice(0, 2)
    .map((q, index) => ({
      id: String(q?.id || `c${index + 1}`).trim() || `c${index + 1}`,
      prompt: String(q?.prompt || '').trim(),
      relatedSignals: (Array.isArray(q?.relatedSignals) ? q.relatedSignals : [])
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .slice(0, 4),
    }))
    .filter((q) => q.prompt);

  if (!questions.length || raw?.needsClarification === false) return emptyResult();

  return {
    needsClarification: true,
    notice:
      String(raw?.notice || '').trim() ||
      'Two signals can be true at once. If one of them was doing different work than it looks like, say so here.',
    questions,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'get-ai-reflection', limit: 40, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    // This step is optional by design — if it cannot run, the intake proceeds
    // without a clarification question rather than blocking the user.
    if (!hasAnthropicKey()) return res.status(200).json(emptyResult());

    const { data } = await createJson({
      model: SHORT_FORM_MODEL,
      system: SYSTEM_PROMPT,
      user: `FINISHED INTAKE (JSON)\n${JSON.stringify(buildIntakeProjection(req.body || {}))}`,
      schema: CLARIFICATION_SCHEMA,
      maxTokens: 2000,
      effort: 'low',
      thinking: false,
    });

    return res.status(200).json(normalizeResult(data));
  } catch (err) {
    console.warn('Intake clarification check failed:', err?.message || err);
    try {
      return res.status(200).json(emptyResult());
    } catch {
      return safeServerError(res, 'Reflection AI error:', err);
    }
  }
}
