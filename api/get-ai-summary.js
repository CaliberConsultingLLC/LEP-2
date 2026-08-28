// /api/get-ai-summary.js
//
// Two-pass summary pipeline.
//   Pass 1 (Opus 5)   — persona-blind insight map. Persisted by the client.
//   Pass 2 (Sonnet 5) — six guide narratives, all built from that one map.
//
// Both passes use structured outputs, so a malformed or truncated body is not
// a possible failure mode. Incomplete responses throw rather than degrading
// into an empty map that ships as a success.

import fs from 'fs';
import path from 'path';
import {
  INSIGHT_MAP_SCHEMA,
  GUIDE_NARRATIVE_SCHEMA,
  MINIMUM_SIGNAL_FIELDS,
  buildInsightExtractionSystemPrompt,
  buildInsightExtractionUserPrompt,
  buildIntakeProjection,
  intakeSignalCount,
  buildNarrativeSystemPrefix,
  buildNarrativeVoiceSuffix,
  buildSummaryNarrativeUserPrompt,
} from './promptBuilder.js';
import {
  EXTRACTION_MODEL,
  NARRATIVE_MODEL,
  buildCachedSystem,
  createJson,
  hasAnthropicKey,
} from './_anthropic.js';
import traitSystem from '../src/data/traitSystem.js';
import { isEligibleForFocusRecommendation } from '../src/data/intakeTraitCoverage.js';
import {
  GUIDE_VOICE_IDS,
  buildPersonaVoiceBlock,
  getGuideVoice,
  resolveGuideVoiceId,
} from '../src/data/guideVoices.js';
import {
  flattenGuideSummary,
  hasLeaveLanguage,
  normalizeGuideSummary,
  sentenceCount,
  spokenSeedsFromInsightMap,
} from '../src/utils/guideSummary.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export const INSIGHT_MAP_SCHEMA_VERSION = 2;

// Token ceilings. Thinking tokens count against these, so both leave headroom
// for reasoning plus the answer. These are the hard cost bound per request.
const EXTRACTION_MAX_TOKENS = 12000;
const NARRATIVE_MAX_TOKENS = 4000;

let cachedAgentIdentity = '';
const identityPath = path.join(process.cwd(), 'api', 'AgentIdentity.txt');
try {
  cachedAgentIdentity = fs.readFileSync(identityPath, 'utf8').replace(/\r/g, '').trim();
} catch {
  cachedAgentIdentity = '';
}

function buildFocusTraitCatalog() {
  const CORE_TRAITS = traitSystem?.CORE_TRAITS || [];
  return CORE_TRAITS.flatMap((trait) =>
    (trait?.subTraits || [])
      .filter((subTrait) => isEligibleForFocusRecommendation(subTrait))
      .map((subTrait) => String(subTrait?.name || '').trim())
      .filter(Boolean)
  );
}

/**
 * The schema guarantees shape, so this is a light pass: trim strings, stamp
 * provenance, and expose the flattened accessors the narrative and rendering
 * layers read. No alias duplication — the four copied fields in the previous
 * implementation cost tokens in six prompts and invited the model to read a
 * duplicate as independent corroboration.
 */
export function normalizeInsightMap(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const ev = src.evidence && typeof src.evidence === 'object' ? src.evidence : {};
  const text = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const list = (v) => (Array.isArray(v) ? v.map(text).filter(Boolean) : []);

  // Signal lists arrive comma-joined because the API will not compile a grammar
  // with arrays of signal names repeated across this many nested shapes.
  const signals = (v) =>
    Array.isArray(v)
      ? list(v)
      : String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

  // The model returns one merged `findings` array for the same reason. It is
  // split back into the three named arrays here, so the persisted shape and
  // every downstream consumer stay exactly as they were.
  const rawFindings = Array.isArray(ev.findings) ? ev.findings : [];
  const byKind = (kind, impactKey) =>
    rawFindings
      .filter((f) => text(f?.kind).toLowerCase() === kind.toLowerCase())
      .map((f) => ({
        label: text(f?.label),
        observations: (Array.isArray(f?.observations) ? f.observations : []).map((o) => ({
          observation: text(o?.observation),
          sourceSignals: signals(o?.sourceSignals),
        })),
        [impactKey]: text(f?.implication),
      }));

  const seeds = src?.rendering?.spokenSeeds || {};

  return {
    schemaVersion: INSIGHT_MAP_SCHEMA_VERSION,
    model: EXTRACTION_MODEL,
    generatedAt: new Date().toISOString(),
    evidence: {
      leadershipMirror: text(ev.leadershipMirror),
      protectivePattern: text(ev.protectivePattern),
      pressurePattern: text(ev.pressurePattern),
      peopleImpact: text(ev.peopleImpact),
      performanceImpact: text(ev.performanceImpact),
      hiddenTradeoff: text(ev.hiddenTradeoff),
      futureRiskIfUnchanged: text(ev.futureRiskIfUnchanged),
      teamLikelyFeels: list(ev.teamLikelyFeels),
      overuses: list(ev.overuses),
      avoids: list(ev.avoids),
      coreStrengths: byKind('strength', 'implication'),
      coreTensions: byKind('tension', 'implication'),
      blindSpots: byKind('blindSpot', 'teamImpact'),
      contradictions: (Array.isArray(ev.contradictions) ? ev.contradictions : []).map((c) => ({
        tension: text(c?.tension),
        cause: text(c?.cause),
        effect: text(c?.effect),
        sourceSignals: signals(c?.sourceSignals),
      })),
      trajectory: {
        bestCase: text(ev?.trajectory?.bestCase),
        driftCase: text(ev?.trajectory?.driftCase),
      },
    },
    focusRecommendations: (Array.isArray(src.focusRecommendations) ? src.focusRecommendations : []).map((f) => ({
      subTraitName: text(f?.subTraitName),
      parentTraitHint: text(f?.parentTraitHint),
      rationale: text(f?.rationale),
      selfSignal: text(f?.selfSignal),
      predictedTeamRead: text(f?.predictedTeamRead),
      basis: signals(f?.basis),
      confidence: text(f?.confidence).toLowerCase() || 'medium',
      ifWrong: text(f?.ifWrong),
    })),
    rendering: {
      spokenSeeds: {
        clearestAsset: text(seeds.clearestAsset),
        coreTension: text(seeds.coreTension),
        markerMoments: list(seeds.markerMoments).slice(0, 2),
        hazardIfStay: list(seeds.hazardIfStay).slice(0, 2),
      },
    },
    openQuestions: (Array.isArray(src.openQuestions) ? src.openQuestions : []).map((q) => ({
      question: text(q?.question),
      whatItWouldChange: text(q?.whatItWouldChange),
    })),
  };
}

/**
 * Hard gate. A map that fails this is unusable downstream — the narratives
 * would be written from nothing, which is exactly the silent failure the
 * previous implementation shipped as a 200.
 */
export function insightMapProblems(map) {
  const problems = [];
  const ev = map?.evidence || {};
  const seeds = map?.rendering?.spokenSeeds || {};
  if (seeds.markerMoments?.length !== 2) problems.push('spokenSeeds.markerMoments must have exactly 2 entries');
  if (seeds.hazardIfStay?.length !== 2) problems.push('spokenSeeds.hazardIfStay must have exactly 2 entries');
  if (!seeds.clearestAsset) problems.push('spokenSeeds.clearestAsset is empty');
  if (!seeds.coreTension) problems.push('spokenSeeds.coreTension is empty');
  if ((ev.coreStrengths?.length || 0) < 3) problems.push('evidence.coreStrengths needs at least 3 entries');
  if ((ev.coreTensions?.length || 0) < 3) problems.push('evidence.coreTensions needs at least 3 entries');
  if ((ev.blindSpots?.length || 0) < 3) problems.push('evidence.blindSpots needs at least 3 entries');
  if (!ev.leadershipMirror) problems.push('evidence.leadershipMirror is empty');
  if (!ev.trajectory?.bestCase) problems.push('evidence.trajectory.bestCase is empty');
  if ((map?.focusRecommendations?.length || 0) !== 5) problems.push('focusRecommendations must have exactly 5 entries');
  return problems;
}

function buildTrailheadHighlights(map) {
  const strength = map?.evidence?.coreStrengths?.[0] || null;
  const tension = map?.evidence?.coreTensions?.[0] || null;
  const seeds = spokenSeedsFromInsightMap(map);
  const pick = (item, key, fallbacks = []) =>
    [item?.[key], item?.observations?.[0]?.observation, item?.label, ...fallbacks]
      .map((x) => String(x || '').replace(/\s+/g, ' ').trim())
      .find(Boolean) || '';

  return {
    strength: {
      label: strength?.label || 'Core strength',
      text: pick(strength, 'implication', [seeds.clearestAsset, map?.evidence?.leadershipMirror]),
    },
    focus: {
      label: tension?.label || 'Focus point',
      text: pick(tension, 'implication', [seeds.coreTension, map?.evidence?.protectivePattern, map?.evidence?.hiddenTradeoff]),
    },
  };
}

function buildFocusAreas(data, map) {
  const CORE_TRAITS = traitSystem?.CORE_TRAITS || [];
  if (!CORE_TRAITS.length) return [];
  const allSubtraits = CORE_TRAITS.flatMap((trait) =>
    (trait?.subTraits || [])
      .filter((subTrait) => isEligibleForFocusRecommendation(subTrait))
      .map((subTrait) => ({
        trait,
        subTrait,
        key: `${trait.id}-${subTrait.id}`,
        nameLc: String(subTrait?.name || '').toLowerCase(),
        aliasesLc: (Array.isArray(subTrait?.aliases) ? subTrait.aliases : []).map((a) => String(a || '').toLowerCase()),
        parentLc: String(trait?.name || '').toLowerCase(),
      }))
  );
  if (!allSubtraits.length) return [];

  const profileSeed = JSON.stringify({
    birthYear: data?.birthYear || '',
    industry: data?.industry || '',
    department: data?.department || '',
    role: data?.role || '',
    responsibilities: data?.responsibilities || '',
    teamSize: data?.teamSize || '',
    leadershipExperience: data?.leadershipExperience || '',
    careerExperience: data?.careerExperience || '',
  });
  let hash = 0;
  for (let i = 0; i < profileSeed.length; i += 1) hash = (hash * 31 + profileSeed.charCodeAt(i)) >>> 0;

  const selected = [];
  const seen = new Set();
  const metaByKey = {};
  const pick = (entry, meta = null) => {
    if (!entry || seen.has(entry.key)) return;
    seen.add(entry.key);
    if (meta) metaByKey[entry.key] = meta;
    selected.push(entry);
  };

  const matchSubtrait = (subTraitName, parentHint) => {
    const exact = allSubtraits.find(
      (e) =>
        (e.nameLc === subTraitName || e.aliasesLc.includes(subTraitName)) &&
        (!parentHint || e.parentLc.includes(parentHint))
    );
    if (exact) return exact;
    return allSubtraits.find(
      (e) =>
        e.nameLc.includes(subTraitName) ||
        subTraitName.includes(e.nameLc) ||
        e.aliasesLc.some((a) => a.includes(subTraitName) || subTraitName.includes(a))
    );
  };

  (map?.focusRecommendations || []).forEach((rec) => {
    const subTraitName = String(rec?.subTraitName || '').trim().toLowerCase();
    if (!subTraitName) return;
    pick(matchSubtrait(subTraitName, String(rec?.parentTraitHint || '').trim().toLowerCase()), rec);
  });

  const byTraitBuckets = CORE_TRAITS.map((trait) => allSubtraits.filter((e) => e.trait.id === trait.id));
  let traitCursor = hash % byTraitBuckets.length;
  while (selected.length < 5) {
    const bucket = byTraitBuckets[traitCursor % byTraitBuckets.length] || [];
    if (bucket.length) pick(bucket[(hash + traitCursor * 7) % bucket.length]);
    traitCursor += 1;
    if (traitCursor > byTraitBuckets.length * 3) break;
  }
  while (selected.length < 5) {
    pick(allSubtraits[(hash + selected.length * 11) % allSubtraits.length]);
    if (selected.length > allSubtraits.length) break;
  }

  return selected.slice(0, 5).map(({ trait, subTrait, key }) => {
    const meta = metaByKey[key] || {};
    return {
      id: `${trait.id}-${subTrait.id}`,
      traitName: trait.name,
      traitDefinition: trait.definition || trait.description,
      subTraitName: subTrait.name,
      subTraitDefinition: subTrait.definition || subTrait.shortDescription,
      example: Array.isArray(subTrait?.examples) ? (subTrait.examples[0] || '') : '',
      risk: Array.isArray(subTrait?.riskSignals?.underuse) ? (subTrait.riskSignals.underuse[0] || '') : '',
      impact: subTrait.impact || '',
      whyYou: meta.rationale || '',
      // Carried forward so the dashboard can score the intake-time prediction
      // against real team ratings once a campaign closes.
      selfSignal: meta.selfSignal || '',
      predictedTeamRead: meta.predictedTeamRead || '',
      predictionConfidence: meta.confidence || '',
      ifWrong: meta.ifWrong || '',
    };
  });
}

function buildContextSnapshot(body) {
  const year = Number(body?.birthYear);
  return {
    birthYear: body?.birthYear || '',
    generationBand: year >= 1997 ? 'Gen Z' : year >= 1981 ? 'Millennial' : year >= 1965 ? 'Gen X' : year > 0 ? 'Boomer+' : '',
    teamSize: body?.teamSize || '',
    yearsInRole: body?.leadershipExperience || '',
    yearsInLeadership: body?.careerExperience || '',
    role: body?.role || '',
    industry: body?.industry || '',
    department: body?.department || '',
    responsibilities: body?.responsibilities || '',
    projectApproach: body?.projectApproach || '',
    crisisResponse: body?.crisisResponse || '',
    pushbackFeeling: body?.pushbackFeeling || '',
    warningLabel: body?.warningLabel || '',
    teamPerception: body?.teamPerception || '',
    decisionPace: body?.decisionPace || '',
  };
}

async function runExtraction(body) {
  const system = buildCachedSystem(
    buildInsightExtractionSystemPrompt({
      agentIdentity: cachedAgentIdentity,
      traitCatalog: buildFocusTraitCatalog(),
    })
  );
  const { data } = await createJson({
    model: EXTRACTION_MODEL,
    system,
    user: buildInsightExtractionUserPrompt(body),
    schema: INSIGHT_MAP_SCHEMA,
    maxTokens: EXTRACTION_MAX_TOKENS,
    effort: 'high',
    thinking: true,
  });
  return normalizeInsightMap(data);
}

/**
 * A follow-up request for the remaining guides must reuse the map from the
 * first request. Re-extracting would produce a different map, and the six
 * guides would no longer be speaking the same facts — which is the entire
 * premise of the persona architecture.
 *
 * The map arrives from the client, so it is re-validated here rather than
 * trusted. It only ever contains that user's own generated content.
 */
function rehydrateInsightMap(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const normalized = normalizeInsightMap(raw);
  if (insightMapProblems(normalized).length) return null;
  if (raw.generatedAt) normalized.generatedAt = String(raw.generatedAt);
  if (raw.model) normalized.model = String(raw.model);
  return normalized;
}

/**
 * Thin narratives are regenerated with specific feedback rather than padded.
 * The previous implementation concatenated the spoken seeds onto a short
 * trailhead, which restated the beat's own opening in a flatter register.
 */
function narrativeProblems(summary) {
  const problems = [];
  const th = sentenceCount(summary?.trailhead);
  const mk = sentenceCount(summary?.markers?.framing);
  const hz = sentenceCount(summary?.hazards?.framing);
  const nt = sentenceCount(summary?.newTrail);
  if (th < 6) problems.push(`trailhead is ${th} sentences and needs 8-12`);
  if (mk < 4) problems.push(`markers.framing is ${mk} sentences and needs 5-7`);
  if (hz < 4) problems.push(`hazards.framing is ${hz} sentences and needs 5-7`);
  if (nt < 5) problems.push(`newTrail is ${nt} sentences and needs 7-10`);
  if ((summary?.markers?.examples || []).length !== 2) problems.push('markers.examples must have exactly 2 scenes');
  if ((summary?.hazards?.examples || []).length !== 2) problems.push('hazards.examples must have exactly 2 scenes');
  if (hasLeaveLanguage(summary)) {
    problems.push('the hazard beat used leaving/attrition language — it must describe how people who STAY change their behavior');
  }
  return problems;
}

async function generateGuideNarrative({ guideId, insightMap, focusAreas, contextSnapshot, spokenSeeds, feedback = '' }) {
  const voice = getGuideVoice(guideId);
  const system = buildCachedSystem(
    buildNarrativeSystemPrefix({ agentIdentity: cachedAgentIdentity }),
    buildNarrativeVoiceSuffix({ voiceBlock: buildPersonaVoiceBlock(guideId), guideName: voice.name })
  );
  const user = [
    buildSummaryNarrativeUserPrompt({ insightMap, focusAreas, contextSnapshot, spokenSeeds }),
    feedback
      ? `\nYour previous attempt fell short: ${feedback}. Go deeper into the insight map rather than restating points you already made.`
      : '',
  ].join('');

  const { data } = await createJson({
    model: NARRATIVE_MODEL,
    system,
    user,
    schema: GUIDE_NARRATIVE_SCHEMA,
    maxTokens: NARRATIVE_MAX_TOKENS,
    effort: 'low',
    thinking: false,
  });
  return normalizeGuideSummary(data, insightMap);
}

async function generateGuideNarrativeWithRetry(args) {
  const first = await generateGuideNarrative(args);
  const problems = narrativeProblems(first);
  if (!problems.length) return first;
  try {
    const second = await generateGuideNarrative({ ...args, feedback: problems.join('; ') });
    return narrativeProblems(second).length > problems.length ? first : second;
  } catch {
    return first;
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'get-ai-summary', limit: 40, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!hasAnthropicKey()) {
    return res.status(503).json({
      error: 'Summary generation is not configured. ANTHROPIC_API_KEY is missing from this environment.',
    });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const body = req.body || {};

    // Refuse to profile a leader who supplied nothing. Every structural gate
    // downstream checks shape, and a fabricated map has perfectly valid shape —
    // so this is the only place fabrication can be caught.
    const signalCount = intakeSignalCount(buildIntakeProjection(body));
    if (signalCount < MINIMUM_SIGNAL_FIELDS) {
      return res.status(400).json({
        error: 'Not enough intake data to build a summary.',
        details: [`Found ${signalCount} of the ${MINIMUM_SIGNAL_FIELDS} behavioral signals required.`],
      });
    }

    const selectedGuideId = resolveGuideVoiceId(body.guideId || body.selectedAgent);

    // Which guides to render this request. Omitted means all six (the dev
    // panels rely on that). The Summary page splits it: the selected guide
    // first so the Trailhead lands fast, then the remaining five in the
    // background, reusing the map returned by the first call.
    const requestedGuides = Array.isArray(body.guideIds) && body.guideIds.length
      ? [...new Set(body.guideIds.map(resolveGuideVoiceId))]
      : GUIDE_VOICE_IDS;

    let insightMap = rehydrateInsightMap(body.insightMap);

    // Extraction gets its own retry. It is the pass that cannot be recovered
    // from — a thin map poisons every narrative downstream.
    if (!insightMap) {
      let extractionProblems = [];
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const candidate = await runExtraction(body);
          extractionProblems = insightMapProblems(candidate);
          insightMap = candidate;
          if (!extractionProblems.length) break;
        } catch (err) {
          extractionProblems = [err?.message || 'extraction failed'];
          insightMap = null;
        }
      }

      if (!insightMap || extractionProblems.length) {
        console.error('Insight extraction failed:', extractionProblems);
        return res.status(502).json({
          error: 'Could not build a usable insight map from this intake.',
          details: extractionProblems,
        });
      }
    }

    const focusAreas = buildFocusAreas(body, insightMap);
    const spokenSeeds = spokenSeedsFromInsightMap(insightMap);
    const contextSnapshot = buildContextSnapshot(body);
    const narrativeArgs = { insightMap, focusAreas, contextSnapshot, spokenSeeds };

    const settled = await Promise.allSettled(
      requestedGuides.map((guideId) => generateGuideNarrativeWithRetry({ guideId, ...narrativeArgs }))
    );

    const summariesByGuide = {};
    settled.forEach((result, index) => {
      const guideId = requestedGuides[index];
      if (result.status === 'fulfilled' && result.value?.trailhead) {
        summariesByGuide[guideId] = result.value;
      } else if (result.status === 'rejected') {
        console.warn(`Narrative failed for ${guideId}:`, result.reason?.message || result.reason);
      }
    });

    const selectedSummary =
      summariesByGuide[selectedGuideId] ||
      summariesByGuide[requestedGuides.find((id) => summariesByGuide[id])] ||
      null;
    if (!selectedSummary) {
      return res.status(502).json({ error: 'Summary generation returned no usable narrative.' });
    }

    return res.status(200).json({
      aiSummary: flattenGuideSummary(selectedSummary),
      summariesByGuide,
      selectedGuideId,
      requestedGuides,
      missingGuides: requestedGuides.filter((id) => !summariesByGuide[id]),
      focusAreas,
      trailheadHighlights: buildTrailheadHighlights(insightMap),
      insightMap,
    });
  } catch (err) {
    return safeServerError(res, 'AI Summary error:', err);
  }
}
