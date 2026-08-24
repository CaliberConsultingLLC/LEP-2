import { OpenAI } from 'openai';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function emptyResult() {
  return { needsClarification: false, notice: '', questions: [] };
}

function extractFirstJsonObject(text) {
  const input = String(text || '').trim();
  if (!input) return null;
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : input;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function compactIntake(body = {}) {
  const societal = Array.isArray(body.societalResponses) ? body.societalResponses : [];
  const societalLabels = Array.isArray(body.societalLabels) ? body.societalLabels : [];
  return {
    industry: body.industry || '',
    role: body.role || '',
    teamSize: body.teamSize || '',
    leadershipExperience: body.leadershipExperience || '',
    careerExperience: body.careerExperience || '',
    resourcePick: body.resourcePick || '',
    projectApproach: body.projectApproach || '',
    energyDrains: body.energyDrains || [],
    crisisResponse: body.crisisResponse || [],
    pushbackFeeling: body.pushbackFeeling || [],
    roleModelTrait: body.roleModelTrait || '',
    warningLabel: body.warningLabel || '',
    leaderFuel: body.leaderFuel || [],
    proudMoment: body.proudMoment || '',
    behaviorDichotomies: body.behaviorDichotomies || [],
    visibilityComfort: body.visibilityComfort || '',
    decisionPace: body.decisionPace || '',
    teamPerception: body.teamPerception || '',
    societal: societal.map((score, index) => ({
      item: societalLabels[index] || `instinct_${index + 1}`,
      score,
    })),
  };
}

function normalizeResult(raw) {
  const questions = Array.isArray(raw?.questions)
    ? raw.questions
        .slice(0, 2)
        .map((q, index) => ({
          id: String(q?.id || `c${index + 1}`).trim() || `c${index + 1}`,
          prompt: String(q?.prompt || '').trim(),
          relatedSignals: Array.isArray(q?.relatedSignals)
            ? q.relatedSignals.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 4)
            : [],
        }))
        .filter((q) => q.prompt)
    : [];
  const needsClarification = questions.length > 0 && raw?.needsClarification !== false;
  if (!needsClarification || !questions.length) return emptyResult();
  return {
    needsClarification: true,
    notice: String(raw?.notice || '').trim()
      || 'Two signals can be true at once. If one of them was doing different work than it looks like, say so here.',
    questions,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-ai-reflection',
    limit: 40,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) {
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json(emptyResult());
    }

    const intake = compactIntake(req.body || {});
    const systemPrompt = `
You are the Compass intake check. Your only job is to decide whether the finished intake has a resolvable ambiguity that would change the five trait recommendations.

DEFAULT: return needsClarification=false and questions=[]. Most intakes should skip.

ASK only when BOTH are true:
1) Two answers on the SAME construct pull apart (likely misclick, confusion, or a correction the user would want to make), OR the five traits would rest on thin/conflicting evidence for a specific named signal.
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

OUTPUT JSON ONLY:
{
  "needsClarification": false,
  "notice": "",
  "questions": [
    {
      "id": "c1",
      "prompt": "You chose X and also Y. Which is closer to how you actually operate under pressure?",
      "relatedSignals": ["warningLabel", "decisionPace"]
    }
  ]
}

Rules:
- 0 questions unless the bar above is met. Max 2.
- notice: one or two sentences to the user if you are asking. Do not mention "the five", locking traits, or survey mechanics.
- prompts: under 220 characters, one question each, open-ended.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 420,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `FINISHED INTAKE (JSON)\n${JSON.stringify(intake)}` },
      ],
    });

    const raw = extractFirstJsonObject(completion?.choices?.[0]?.message?.content || '');
    return res.status(200).json(normalizeResult(raw));
  } catch (err) {
    console.warn('Intake clarification check failed:', err?.message || err);
    try {
      return res.status(200).json(emptyResult());
    } catch {
      return safeServerError(res, 'Reflection AI error:', err);
    }
  }
}
