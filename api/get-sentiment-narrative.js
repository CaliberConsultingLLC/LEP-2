// /api/get-sentiment-narrative.js
//
// The nine answers on the Sentiment page — three traits by three questions —
// written in one guide's voice, in one call.
//
// It runs downstream of /api/get-results-analysis rather than beside it: that
// pass has already read the whole result set and scored the intake's
// predictions, so this one is a rendering of what it found into the four beats
// the page reads in. Passing its headline and cross-cutting patterns through
// keeps the two surfaces from contradicting each other.
//
// One guide per call rather than all six. The results analysis pre-renders
// every voice because it is the moment a campaign closes and nobody is
// watching; this is asked for by a leader who has already chosen a guide, and
// rendering the five they did not choose is five sixths waste. Swapping guide
// later simply asks again and caches under the new voice.
//
// The page has a complete deterministic version of all nine answers. Nothing
// here is load-bearing: a failure means the leader reads those instead.

import fs from 'fs';
import path from 'path';
import {
  SENTIMENT_SCHEMA,
  buildSentimentSystemPrompt,
  buildSentimentUserPrompt,
} from './sentimentPromptBuilder.js';
import { NARRATIVE_MODEL, buildCachedSystem, createJson, hasAnthropicKey } from './_anthropic.js';
import { buildPersonaVoiceBlock, getGuideVoice, resolveGuideVoiceId } from '../src/data/guideVoices.js';
import { buildNarrativeVoiceSuffix } from './promptBuilder.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export const SENTIMENT_SCHEMA_VERSION = 1;

const MAX_TOKENS = 12000;
const QUESTION_IDS = ['q01', 'q02', 'q03'];

let cachedAgentIdentity = '';
try {
  cachedAgentIdentity = fs
    .readFileSync(path.join(process.cwd(), 'api', 'AgentIdentity.txt'), 'utf8')
    .replace(/\r/g, '')
    .trim();
} catch {
  cachedAgentIdentity = '';
}

const text = (v) => String(v || '').replace(/\s+/g, ' ').trim();

/**
 * Keeps only answers that name a trait the caller actually sent, and only the
 * four fields the page renders. A model that invents a tenth trait gets it
 * dropped rather than rendered against a room that does not exist.
 */
export function normalizeSentimentAnswers(raw, validTraitKeys) {
  const items = Array.isArray(raw?.answers) ? raw.answers : [];
  const byTrait = {};

  items.forEach((item) => {
    const traitKey = text(item?.traitKey);
    const questionId = text(item?.questionId);
    if (!validTraitKeys.has(traitKey) || !QUESTION_IDS.includes(questionId)) return;

    const answer = {
      verdict: text(item?.verdict),
      definition: text(item?.definition),
      reading: text(item?.reading),
      consequence: text(item?.consequence),
    };
    // A partial answer is worse than none: the page would show three generated
    // beats and one templated one, in two different voices, under one heading.
    if (Object.values(answer).some((v) => !v)) return;

    byTrait[traitKey] = byTrait[traitKey] || {};
    byTrait[traitKey][questionId] = answer;
  });

  return byTrait;
}

export function sentimentProblems(byTrait, validTraitKeys) {
  const problems = [];
  validTraitKeys.forEach((key) => {
    const got = Object.keys(byTrait[key] || {});
    const missing = QUESTION_IDS.filter((q) => !got.includes(q));
    if (missing.length) problems.push(`${key} is missing ${missing.join(', ')}`);
  });
  return problems;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'get-sentiment-narrative', limit: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!hasAnthropicKey()) {
    return res.status(503).json({
      error: 'Sentiment narrative is not configured. ANTHROPIC_API_KEY is missing from this environment.',
    });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const body = req.body || {};
    const traits = Array.isArray(body.traits) ? body.traits : [];

    if (!traits.length) {
      return res.status(400).json({ error: 'traits is required and must be a non-empty array.' });
    }

    const validTraitKeys = new Set(traits.map((t) => text(t?.key)).filter(Boolean));
    if (!validTraitKeys.size) {
      return res.status(400).json({ error: 'every trait needs a key.' });
    }

    const guideId = resolveGuideVoiceId(body.guideId);
    const voice = getGuideVoice(guideId);

    const system = buildCachedSystem(
      buildSentimentSystemPrompt({ agentIdentity: cachedAgentIdentity }),
      buildNarrativeVoiceSuffix({ voiceBlock: buildPersonaVoiceBlock(guideId), guideName: voice.name })
    );
    const user = buildSentimentUserPrompt({
      traits,
      analysis: body.resultsAnalysis || null,
      respondents: Number(body.respondents) || 0,
      hasSelfData: Boolean(body.hasSelfData),
    });

    let byTrait = null;
    let problems = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const { data } = await createJson({
          model: NARRATIVE_MODEL,
          system,
          user,
          schema: SENTIMENT_SCHEMA,
          maxTokens: MAX_TOKENS,
          effort: 'medium',
          thinking: false,
        });
        const candidate = normalizeSentimentAnswers(data, validTraitKeys);
        problems = sentimentProblems(candidate, validTraitKeys);
        byTrait = candidate;
        if (!problems.length) break;
      } catch (err) {
        problems = [err?.message || 'sentiment generation failed'];
        byTrait = null;
      }
    }

    // A partial set is still worth returning: the page falls back per answer,
    // so seven generated answers and two templated ones is better than nine
    // templated ones.
    if (!byTrait || !Object.keys(byTrait).length) {
      console.error('Sentiment narrative failed:', problems);
      return res.status(502).json({ error: 'Could not write the sentiment answers.', details: problems });
    }

    return res.status(200).json({
      schemaVersion: SENTIMENT_SCHEMA_VERSION,
      guideId,
      generatedAt: new Date().toISOString(),
      answersByTrait: byTrait,
      incomplete: problems,
    });
  } catch (err) {
    return safeServerError(res, 'Sentiment narrative error:', err);
  }
}
