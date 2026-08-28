// /api/get-guide-lines.js
//
// Personalized guide lines for every post-intake screen, in all six voices.
// One batched call per guide covers all 52 screens; the canned copy in
// guideCopy.generated.js stays as the fallback for any line that fails to
// generate, so the overlay is never empty.

import fs from 'fs';
import path from 'path';
import {
  GUIDE_LINES_SCHEMA,
  buildGuideLinesSystemPrefix,
  buildGuideLinesUserPrompt,
  buildStepRequests,
  isPostIntakeStepKey,
} from './guideLinesPromptBuilder.js';
import { buildNarrativeVoiceSuffix } from './promptBuilder.js';
import { NARRATIVE_MODEL, buildCachedSystem, createJson, hasAnthropicKey } from './_anthropic.js';
import { GUIDE_STEPS } from '../src/data/guideCopy.generated.js';
import {
  GUIDE_VOICE_IDS,
  buildPersonaVoiceBlock,
  getGuideVoice,
  resolveGuideVoiceId,
} from '../src/data/guideVoices.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export const GUIDE_LINES_SCHEMA_VERSION = 1;

const VOICE_MAX_TOKENS = 8000;
const MAX_LINE_CHARS = 220;

let cachedAgentIdentity = '';
try {
  cachedAgentIdentity = fs
    .readFileSync(path.join(process.cwd(), 'api', 'AgentIdentity.txt'), 'utf8')
    .replace(/\r/g, '')
    .trim();
} catch {
  cachedAgentIdentity = '';
}

const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim();

/**
 * Keeps only lines that match a requested key and fit the panel. An overlong or
 * unrecognized line is dropped rather than trimmed mid-sentence — the canned
 * fallback reads better than a truncated one.
 */
function collectLines(data, requestedKeys) {
  const wanted = new Set(requestedKeys);
  const out = {};
  (Array.isArray(data?.lines) ? data.lines : []).forEach((item) => {
    const key = clean(item?.key);
    const text = clean(item?.text);
    if (!key || !text) return;
    if (!wanted.has(key)) return;
    if (text.length > MAX_LINE_CHARS) return;
    out[key] = text;
  });
  return out;
}

async function runGuideVoice({ guideId, insightProfile, resultsAnalysis, stepKeys }) {
  const voice = getGuideVoice(guideId);
  const requests = buildStepRequests(GUIDE_STEPS, guideId, stepKeys);
  if (!requests.length) return {};

  const system = buildCachedSystem(
    buildGuideLinesSystemPrefix({ agentIdentity: cachedAgentIdentity }),
    buildNarrativeVoiceSuffix({ voiceBlock: buildPersonaVoiceBlock(guideId), guideName: voice.name })
  );

  const { data } = await createJson({
    model: NARRATIVE_MODEL,
    system,
    user: buildGuideLinesUserPrompt({ insightProfile, resultsAnalysis, requests }),
    schema: GUIDE_LINES_SCHEMA,
    maxTokens: VOICE_MAX_TOKENS,
    effort: 'low',
    thinking: false,
  });

  return collectLines(data, requests.map((r) => r.key));
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'get-guide-lines', limit: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!hasAnthropicKey()) {
    return res.status(503).json({
      error: 'Guide line generation is not configured. ANTHROPIC_API_KEY is missing from this environment.',
    });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const body = req.body || {};
    const insightProfile = body.insightProfile;

    // Without a map there is nothing to personalize from, and the canned copy
    // is already the correct thing to show.
    if (!insightProfile?.evidence?.leadershipMirror) {
      return res.status(400).json({ error: 'insightProfile with evidence is required.' });
    }

    const resultsAnalysis = body.resultsAnalysis && typeof body.resultsAnalysis === 'object'
      ? body.resultsAnalysis
      : null;

    const requestedGuides = Array.isArray(body.guideIds) && body.guideIds.length
      ? [...new Set(body.guideIds.map(resolveGuideVoiceId))]
      : GUIDE_VOICE_IDS;

    // Callers can regenerate a subset — the dashboard screens are worth
    // rebuilding once real campaign results exist.
    const stepKeys = Array.isArray(body.stepKeys) && body.stepKeys.length
      ? body.stepKeys.filter(isPostIntakeStepKey)
      : null;

    const settled = await Promise.allSettled(
      requestedGuides.map((guideId) =>
        runGuideVoice({ guideId, insightProfile, resultsAnalysis, stepKeys })
      )
    );

    const linesByGuide = {};
    settled.forEach((result, index) => {
      const guideId = requestedGuides[index];
      if (result.status === 'fulfilled' && Object.keys(result.value || {}).length) {
        linesByGuide[guideId] = result.value;
      } else if (result.status === 'rejected') {
        console.warn(`Guide lines failed for ${guideId}:`, result.reason?.message || result.reason);
      }
    });

    if (!Object.keys(linesByGuide).length) {
      return res.status(502).json({ error: 'Guide line generation returned nothing usable.' });
    }

    return res.status(200).json({
      linesByGuide,
      schemaVersion: GUIDE_LINES_SCHEMA_VERSION,
      model: NARRATIVE_MODEL,
      generatedAt: new Date().toISOString(),
      basedOnResults: Boolean(resultsAnalysis),
      requestedGuides,
      missingGuides: requestedGuides.filter((id) => !linesByGuide[id]),
      coverage: Object.fromEntries(
        Object.entries(linesByGuide).map(([id, lines]) => [id, Object.keys(lines).length])
      ),
    });
  } catch (err) {
    return safeServerError(res, 'Guide lines error:', err);
  }
}
