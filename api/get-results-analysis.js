// /api/get-results-analysis.js
//
// Campaign results interpretation, in two passes.
//   Pass 1 (Opus 5)   — one persona-blind analysis over the ENTIRE result set,
//                       scored against the predictions the intake insight map
//                       made before this leader's team was asked anything.
//   Pass 2 (Sonnet 5) — every finding rendered in one guide's voice, batched
//                       into a single call per guide.
//
// This moment is asynchronous — the campaign has closed and nobody is watching
// a spinner — which is why pass 1 runs at high effort. Callers should cache the
// result; regenerating it per page view is pure waste.

import fs from 'fs';
import path from 'path';
import {
  RESULTS_ANALYSIS_SCHEMA,
  RESULTS_VOICE_SCHEMA,
  buildResultsAnalysisSystemPrompt,
  buildResultsAnalysisUserPrompt,
  buildResultsVoiceSystemPrefix,
  buildResultsVoiceUserPrompt,
} from './resultsPromptBuilder.js';
import {
  EXTRACTION_MODEL,
  NARRATIVE_MODEL,
  buildCachedSystem,
  createJson,
  hasAnthropicKey,
} from './_anthropic.js';
import {
  GUIDE_VOICE_IDS,
  buildPersonaVoiceBlock,
  getGuideVoice,
  resolveGuideVoiceId,
} from '../src/data/guideVoices.js';
import { buildNarrativeVoiceSuffix } from './promptBuilder.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export const RESULTS_ANALYSIS_SCHEMA_VERSION = 1;

const ANALYSIS_MAX_TOKENS = 16000;
const VOICE_MAX_TOKENS = 8000;

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
const list = (v) => (Array.isArray(v) ? v.map(text).filter(Boolean) : []);

/**
 * Collects every id the results data legitimately contains. The model is told
 * to reuse these exactly; anything it invents is dropped rather than rendered
 * against a UI element that does not exist.
 */
function collectValidIds(campaignResults) {
  const ids = new Set();
  (campaignResults?.traits || []).forEach((trait) => {
    if (trait?.key) ids.add(String(trait.key));
    (trait?.statements || []).forEach((s) => {
      if (s?.id) ids.add(String(s.id));
    });
  });
  return ids;
}

export function normalizeResultsAnalysis(raw, validIds = null) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const keep = (id) => !validIds || validIds.has(String(id));

  return {
    schemaVersion: RESULTS_ANALYSIS_SCHEMA_VERSION,
    model: EXTRACTION_MODEL,
    generatedAt: new Date().toISOString(),
    headline: {
      finding: text(src?.headline?.finding),
      whyItMatters: text(src?.headline?.whyItMatters),
    },
    predictionScorecard: (Array.isArray(src.predictionScorecard) ? src.predictionScorecard : []).map((p) => ({
      subTraitName: text(p?.subTraitName),
      predicted: text(p?.predicted),
      actual: text(p?.actual),
      verdict: ['confirmed', 'contradicted', 'inconclusive'].includes(text(p?.verdict))
        ? text(p.verdict)
        : 'inconclusive',
      whatItMeans: text(p?.whatItMeans),
    })),
    statementFindings: (Array.isArray(src.statementFindings) ? src.statementFindings : [])
      .filter((f) => keep(f?.id))
      .map((f) => ({
        id: text(f?.id),
        finding: text(f?.finding),
        significance: ['high', 'medium', 'low'].includes(text(f?.significance)) ? text(f.significance) : 'medium',
      })),
    traitRollups: (Array.isArray(src.traitRollups) ? src.traitRollups : [])
      .filter((t) => keep(t?.id))
      .map((t) => ({
        id: text(t?.id),
        finding: text(t?.finding),
        standing: ['strength', 'mixed', 'liability'].includes(text(t?.standing)) ? text(t.standing) : 'mixed',
      })),
    crossCuttingPatterns: (Array.isArray(src.crossCuttingPatterns) ? src.crossCuttingPatterns : []).map((p, i) => ({
      id: text(p?.id) || `pattern-${i + 1}`,
      pattern: text(p?.pattern),
      appearsIn: list(p?.appearsIn).filter(keep),
      implication: text(p?.implication),
    })),
    openQuestions: (Array.isArray(src.openQuestions) ? src.openQuestions : []).map((q) => ({
      question: text(q?.question),
      whyItIsOpen: text(q?.whyItIsOpen),
    })),
  };
}

export function resultsAnalysisProblems(analysis) {
  const problems = [];
  if (!analysis?.headline?.finding) problems.push('headline.finding is empty');
  if (!(analysis?.statementFindings?.length)) problems.push('statementFindings is empty');
  if (!(analysis?.traitRollups?.length)) problems.push('traitRollups is empty');
  const unscored = (analysis?.predictionScorecard || []).filter((p) => !p.subTraitName || !p.actual);
  if (unscored.length) problems.push('predictionScorecard has entries missing subTraitName or actual');
  return problems;
}

/**
 * Flattens the analysis into the id/finding pairs the voice pass renders. Every
 * surface the user can click maps to exactly one id here.
 */
export function findingsForVoicing(analysis) {
  const items = [];
  if (analysis?.headline?.finding) {
    items.push({
      id: 'headline',
      kind: 'headline',
      finding: `${analysis.headline.finding} ${analysis.headline.whyItMatters}`.trim(),
    });
  }
  (analysis?.predictionScorecard || []).forEach((p, i) => {
    items.push({
      id: `prediction-${i + 1}`,
      kind: 'prediction',
      verdict: p.verdict,
      finding: `About ${p.subTraitName}. At intake this leader's read was: ${p.predicted}. The team data shows: ${p.actual}. Verdict: ${p.verdict}. ${p.whatItMeans}`.trim(),
    });
  });
  (analysis?.traitRollups || []).forEach((t) => {
    items.push({ id: t.id, kind: 'trait', finding: t.finding });
  });
  (analysis?.statementFindings || []).forEach((f) => {
    items.push({ id: f.id, kind: 'statement', significance: f.significance, finding: f.finding });
  });
  (analysis?.crossCuttingPatterns || []).forEach((p) => {
    items.push({ id: p.id, kind: 'pattern', finding: `${p.pattern} ${p.implication}`.trim() });
  });
  return items;
}

async function runAnalysis({ insightProfile, campaignResults }) {
  const system = buildCachedSystem(buildResultsAnalysisSystemPrompt({ agentIdentity: cachedAgentIdentity }));
  const { data } = await createJson({
    model: EXTRACTION_MODEL,
    system,
    user: buildResultsAnalysisUserPrompt({ insightProfile, campaignResults }),
    schema: RESULTS_ANALYSIS_SCHEMA,
    maxTokens: ANALYSIS_MAX_TOKENS,
    effort: 'high',
    thinking: true,
  });
  return normalizeResultsAnalysis(data, collectValidIds(campaignResults));
}

/**
 * One call per guide, rendering every finding at once. Doing this per click
 * instead would cost more, read worse, and give each paragraph no awareness of
 * the others.
 */
async function runVoicePass({ guideId, findings }) {
  const voice = getGuideVoice(guideId);
  const system = buildCachedSystem(
    buildResultsVoiceSystemPrefix({ agentIdentity: cachedAgentIdentity }),
    buildNarrativeVoiceSuffix({ voiceBlock: buildPersonaVoiceBlock(guideId), guideName: voice.name })
  );
  const { data } = await createJson({
    model: NARRATIVE_MODEL,
    system,
    user: buildResultsVoiceUserPrompt({ findings }),
    schema: RESULTS_VOICE_SCHEMA,
    maxTokens: VOICE_MAX_TOKENS,
    effort: 'low',
    thinking: false,
  });

  const wanted = new Set(findings.map((f) => f.id));
  const byId = {};
  (Array.isArray(data?.items) ? data.items : []).forEach((item) => {
    const id = text(item?.id);
    const body = text(item?.text);
    if (id && body && wanted.has(id)) byId[id] = body;
  });
  return byId;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'get-results-analysis', limit: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!hasAnthropicKey()) {
    return res.status(503).json({
      error: 'Results analysis is not configured. ANTHROPIC_API_KEY is missing from this environment.',
    });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const body = req.body || {};
    const { insightProfile, campaignResults } = body;

    if (!campaignResults || !Array.isArray(campaignResults.traits) || !campaignResults.traits.length) {
      return res.status(400).json({ error: 'campaignResults.traits is required and must be a non-empty array.' });
    }

    // Voices requested this call. Omitted means all six — this endpoint is
    // meant to run once, asynchronously, so eagerly rendering every voice is
    // the normal path rather than the expensive one.
    const requestedGuides = Array.isArray(body.guideIds) && body.guideIds.length
      ? [...new Set(body.guideIds.map(resolveGuideVoiceId))]
      : GUIDE_VOICE_IDS;

    // Reuse a prior analysis when the caller supplies one, so adding a voice
    // later never re-runs the expensive pass — and never produces findings that
    // disagree with the ones already shown.
    let analysis = null;
    if (body.resultsAnalysis && typeof body.resultsAnalysis === 'object') {
      const rehydrated = normalizeResultsAnalysis(body.resultsAnalysis, collectValidIds(campaignResults));
      if (!resultsAnalysisProblems(rehydrated).length) {
        if (body.resultsAnalysis.generatedAt) rehydrated.generatedAt = String(body.resultsAnalysis.generatedAt);
        analysis = rehydrated;
      }
    }

    if (!analysis) {
      let problems = [];
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const candidate = await runAnalysis({ insightProfile, campaignResults });
          problems = resultsAnalysisProblems(candidate);
          analysis = candidate;
          if (!problems.length) break;
        } catch (err) {
          problems = [err?.message || 'analysis failed'];
          analysis = null;
        }
      }
      if (!analysis || problems.length) {
        console.error('Results analysis failed:', problems);
        return res.status(502).json({ error: 'Could not analyze these campaign results.', details: problems });
      }
    }

    const findings = findingsForVoicing(analysis);
    const settled = await Promise.allSettled(
      requestedGuides.map((guideId) => runVoicePass({ guideId, findings }))
    );

    const voicedByGuide = {};
    settled.forEach((result, index) => {
      const guideId = requestedGuides[index];
      if (result.status === 'fulfilled' && Object.keys(result.value || {}).length) {
        voicedByGuide[guideId] = result.value;
      } else if (result.status === 'rejected') {
        console.warn(`Results voice pass failed for ${guideId}:`, result.reason?.message || result.reason);
      }
    });

    return res.status(200).json({
      resultsAnalysis: analysis,
      voicedByGuide,
      requestedGuides,
      missingGuides: requestedGuides.filter((id) => !voicedByGuide[id]),
      // Ids the UI can look up directly, so the client never has to guess which
      // finding belongs to which clickable surface.
      findingIds: findings.map((f) => ({ id: f.id, kind: f.kind })),
    });
  } catch (err) {
    return safeServerError(res, 'Results analysis error:', err);
  }
}
