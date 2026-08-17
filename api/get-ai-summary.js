// /api/get-ai-summary.js
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import {
  buildInsightExtractionSystemPrompt,
  buildInsightExtractionUserPrompt,
  buildSummaryNarrativeSystemPrompt,
  buildSummaryNarrativeUserPrompt,
} from './promptBuilder.js';
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
  normalizeGuideSummary,
  spokenSeedsFromInsightMap,
} from '../src/utils/guideSummary.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EXTRACTION_MODEL = process.env.SUMMARY_EXTRACTION_MODEL || 'gpt-4o-mini';
const NARRATIVE_MODEL = process.env.SUMMARY_NARRATIVE_MODEL || 'gpt-4o-mini';

let cachedAgentIdentity = '';
const identityPath = path.join(process.cwd(), 'api', 'AgentIdentity.txt');
try {
  cachedAgentIdentity = fs.readFileSync(identityPath, 'utf8').replace(/\r/g, '').trim();
} catch {
  cachedAgentIdentity = '';
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

function normalizeInsightMap(map) {
  const src = map && typeof map === 'object' ? map : {};
  const normArray = (arr, max = 3) =>
    Array.isArray(arr)
      ? arr
          .slice(0, max)
          .map((x) => ({
            label: String(x?.label || '').trim(),
            evidence: Array.isArray(x?.evidence) ? x.evidence.map((e) => String(e || '').trim()).filter(Boolean).slice(0, 2) : [],
            implication: String(x?.implication || x?.teamImpact || '').trim(),
            teamImpact: String(x?.teamImpact || '').trim(),
          }))
          .filter((x) => x.label || x.evidence.length || x.implication || x.teamImpact)
      : [];

  const spokenRaw = src.spokenSeeds && typeof src.spokenSeeds === 'object' ? src.spokenSeeds : {};
  const spokenSeeds = {
    clearestAsset: String(spokenRaw.clearestAsset || '').trim(),
    coreTension: String(spokenRaw.coreTension || '').trim(),
    markerMoments: Array.isArray(spokenRaw.markerMoments)
      ? spokenRaw.markerMoments.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 2)
      : [],
    hazardIfStay: Array.isArray(spokenRaw.hazardIfStay)
      ? spokenRaw.hazardIfStay.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 2)
      : [],
  };

  return {
    leadershipMirror: String(src.leadershipMirror || src.leadershipEssence || '').trim(),
    protectivePattern: String(src.protectivePattern || src.signaturePattern || '').trim(),
    pressurePattern: String(src.pressurePattern || '').trim(),
    peopleImpact: String(src.peopleImpact || '').trim(),
    performanceImpact: String(src.performanceImpact || '').trim(),
    hiddenTradeoff: String(src.hiddenTradeoff || src.hiddenCost || '').trim(),
    teamLikelyFeels: Array.isArray(src.teamLikelyFeels) ? src.teamLikelyFeels.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 4) : [],
    whatThisLeaderOveruses: Array.isArray(src.whatThisLeaderOveruses) ? src.whatThisLeaderOveruses.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 4) : [],
    whatThisLeaderAvoids: Array.isArray(src.whatThisLeaderAvoids) ? src.whatThisLeaderAvoids.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 4) : [],
    futureRiskIfUnchanged: String(src.futureRiskIfUnchanged || '').trim(),
    leadershipEssence: String(src.leadershipEssence || src.leadershipMirror || '').trim(),
    signaturePattern: String(src.signaturePattern || src.protectivePattern || '').trim(),
    hiddenCost: String(src.hiddenCost || src.hiddenTradeoff || '').trim(),
    missingOutcome: String(src.missingOutcome || src.performanceImpact || '').trim(),
    coreStrengths: normArray(src.coreStrengths, 3),
    coreTensions: normArray(src.coreTensions, 3),
    blindSpots: normArray(src.blindSpots, 3),
    contradictionMap: Array.isArray(src.contradictionMap)
      ? src.contradictionMap
          .slice(0, 2)
          .map((x) => ({
            tension: String(x?.tension || '').trim(),
            cause: String(x?.cause || '').trim(),
            effect: String(x?.effect || '').trim(),
          }))
          .filter((x) => x.tension || x.cause || x.effect)
      : [],
    spokenSeeds,
    trajectory: {
      bestCase: String(src?.trajectory?.bestCase || '').trim(),
      driftCase: String(src?.trajectory?.driftCase || '').trim(),
    },
    focusRecommendations: Array.isArray(src.focusRecommendations)
      ? src.focusRecommendations
          .slice(0, 7)
          .map((x) => ({
            subTraitName: String(x?.subTraitName || '').trim(),
            parentTraitHint: String(x?.parentTraitHint || '').trim(),
            rationale: String(x?.rationale || '').trim(),
          }))
          .filter((x) => x.subTraitName)
      : [],
    languageAvoid: Array.isArray(src.languageAvoid) ? src.languageAvoid.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 6) : [],
    confidence: {
      overall: String(src?.confidence?.overall || '').trim().toLowerCase() || 'medium',
      trailhead: String(src?.confidence?.trailhead || '').trim().toLowerCase() || 'medium',
      trajectory: String(src?.confidence?.trajectory || '').trim().toLowerCase() || 'medium',
    },
  };
}

function buildTrailheadHighlights(insightMap = null) {
  const strength = Array.isArray(insightMap?.coreStrengths) ? insightMap.coreStrengths[0] : null;
  const tension = Array.isArray(insightMap?.coreTensions) ? insightMap.coreTensions[0] : null;
  const pickText = (item, fallbacks = []) => {
    const candidates = [
      item?.implication,
      Array.isArray(item?.evidence) ? item.evidence[0] : '',
      item?.label,
      ...fallbacks,
    ];
    return candidates.map((x) => String(x || '').replace(/\s+/g, ' ').trim()).find(Boolean) || '';
  };
  const seeds = spokenSeedsFromInsightMap(insightMap);
  return {
    strength: {
      label: String(strength?.label || 'Core strength').trim() || 'Core strength',
      text: pickText(strength, [
        seeds.clearestAsset,
        insightMap?.leadershipMirror,
        'A reliable leadership asset that already creates clarity and momentum for others.',
      ]),
    },
    focus: {
      label: String(tension?.label || 'Focus point').trim() || 'Focus point',
      text: pickText(tension, [
        seeds.coreTension,
        insightMap?.protectivePattern,
        insightMap?.hiddenTradeoff,
        'A recurring tension that quietly shapes how the team experiences your leadership.',
      ]),
    },
  };
}

function buildFocusAreas(data, insightMap = null) {
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
        aliasesLc: (Array.isArray(subTrait?.aliases) ? subTrait.aliases : [])
          .map((a) => String(a || '').toLowerCase()),
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
  const whyByKey = {};
  const pick = (entry, whyYou = '') => {
    if (!entry) return;
    if (seen.has(entry.key)) return;
    seen.add(entry.key);
    if (whyYou) whyByKey[entry.key] = whyYou;
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

  const recs = Array.isArray(insightMap?.focusRecommendations) ? insightMap.focusRecommendations : [];
  recs.forEach((rec) => {
    const subTraitName = String(rec?.subTraitName || '').trim().toLowerCase();
    const parentHint = String(rec?.parentTraitHint || '').trim().toLowerCase();
    if (!subTraitName) return;
    pick(matchSubtrait(subTraitName, parentHint), String(rec?.rationale || '').trim());
  });

  const byTraitBuckets = CORE_TRAITS.map((trait) =>
    allSubtraits.filter((entry) => entry.trait.id === trait.id)
  );
  let traitCursor = hash % byTraitBuckets.length;
  while (selected.length < 5) {
    const bucket = byTraitBuckets[traitCursor % byTraitBuckets.length] || [];
    if (bucket.length) {
      const pickIdx = (hash + traitCursor * 7) % bucket.length;
      pick(bucket[pickIdx]);
    }
    traitCursor += 1;
    if (traitCursor > byTraitBuckets.length * 3) break;
  }

  while (selected.length < 5) {
    const pickIdx = (hash + selected.length * 11) % allSubtraits.length;
    pick(allSubtraits[pickIdx]);
    if (selected.length > allSubtraits.length) break;
  }

  return selected.slice(0, 5).map(({ trait, subTrait, key }) => ({
    id: `${trait.id}-${subTrait.id}`,
    traitName: trait.name,
    traitDefinition: trait.definition || trait.description,
    subTraitName: subTrait.name,
    subTraitDefinition: subTrait.definition || subTrait.shortDescription,
    example: Array.isArray(subTrait?.examples) ? (subTrait.examples[0] || '') : '',
    risk: Array.isArray(subTrait?.riskSignals?.underuse) ? (subTrait.riskSignals.underuse[0] || '') : '',
    impact: subTrait.impact || '',
    whyYou: whyByKey[key] || '',
  }));
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

function buildContextSnapshot(body) {
  return {
    birthYear: body?.birthYear || '',
    generationBand: body?.birthYear ? (
      Number(body.birthYear) >= 1997 ? 'Gen Z'
        : Number(body.birthYear) >= 1981 ? 'Millennial'
          : Number(body.birthYear) >= 1965 ? 'Gen X'
            : Number(body.birthYear) > 0 ? 'Boomer+' : ''
    ) : '',
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
    intakeClarification: body?.intakeClarification || null,
  };
}

async function generateGuideNarrative({
  guideId,
  insightMap,
  focusAreas,
  contextSnapshot,
  spokenSeeds,
  agentIdentity,
}) {
  const voice = getGuideVoice(guideId);
  const narrativeSystem = buildSummaryNarrativeSystemPrompt({
    voiceBlock: buildPersonaVoiceBlock(guideId),
    agentIdentity,
    guideName: voice.name,
  });
  const narrativeUser = buildSummaryNarrativeUserPrompt({
    insightMap,
    focusAreas,
    contextSnapshot,
    spokenSeeds,
  });
  const completion = await openai.chat.completions.create({
    model: NARRATIVE_MODEL,
    max_tokens: 1100,
    temperature: Math.min(voice.params?.temperature ?? 0.42, 0.72),
    frequency_penalty: voice.params?.frequency_penalty ?? 0.2,
    presence_penalty: voice.params?.presence_penalty ?? 0.12,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: narrativeSystem },
      { role: 'user', content: narrativeUser },
    ],
  });
  const raw = completion?.choices?.[0]?.message?.content?.trim() || '{}';
  const parsed = extractFirstJsonObject(raw) || {};
  return normalizeGuideSummary(parsed, insightMap);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-ai-summary',
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
    const body = req.body || {};
    const selectedGuideId = resolveGuideVoiceId(body.guideId || body.selectedAgent);
    const cleanIdentity = cachedAgentIdentity;

    const extractSystem = buildInsightExtractionSystemPrompt({ agentIdentity: cleanIdentity });
    const extractUser = buildInsightExtractionUserPrompt(body, buildFocusTraitCatalog());
    const extraction = await openai.chat.completions.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1800,
      temperature: 0.2,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: extractSystem },
        { role: 'user', content: extractUser },
      ],
    });
    const extractionRaw = extraction?.choices?.[0]?.message?.content?.trim() || '{}';
    const insightMap = normalizeInsightMap(extractFirstJsonObject(extractionRaw));
    const focusAreas = buildFocusAreas(body, insightMap);
    const spokenSeeds = spokenSeedsFromInsightMap(insightMap);
    const contextSnapshot = buildContextSnapshot(body);

    const narrativeArgs = {
      insightMap,
      focusAreas,
      contextSnapshot,
      spokenSeeds,
      agentIdentity: cleanIdentity,
    };

    const settled = await Promise.allSettled(
      GUIDE_VOICE_IDS.map((guideId) => generateGuideNarrative({ guideId, ...narrativeArgs }))
    );

    const summariesByGuide = {};
    const missingGuides = [];
    settled.forEach((result, index) => {
      const guideId = GUIDE_VOICE_IDS[index];
      if (result.status === 'fulfilled' && result.value?.trailhead) {
        summariesByGuide[guideId] = result.value;
      } else {
        missingGuides.push(guideId);
      }
    });

    if (missingGuides.length) {
      const retries = await Promise.allSettled(
        missingGuides.map((guideId) => generateGuideNarrative({ guideId, ...narrativeArgs }))
      );
      retries.forEach((result, index) => {
        const guideId = missingGuides[index];
        if (result.status === 'fulfilled' && result.value?.trailhead) {
          summariesByGuide[guideId] = result.value;
        }
      });
    }

    const stillMissing = GUIDE_VOICE_IDS.filter((id) => !summariesByGuide[id]?.trailhead);
    if (!summariesByGuide[selectedGuideId]?.trailhead && stillMissing.length === GUIDE_VOICE_IDS.length) {
      return res.status(502).json({ error: 'Summary generation failed for every guide.' });
    }

    const selectedSummary = summariesByGuide[selectedGuideId]
      || summariesByGuide[GUIDE_VOICE_IDS.find((id) => summariesByGuide[id])]
      || null;
    if (!selectedSummary) {
      return res.status(502).json({ error: 'Summary generation returned no usable narrative.' });
    }

    const aiSummary = flattenGuideSummary(selectedSummary);

    return res.status(200).json({
      aiSummary,
      summariesByGuide,
      selectedGuideId,
      missingGuides: GUIDE_VOICE_IDS.filter((id) => !summariesByGuide[id]),
      focusAreas,
      trailheadHighlights: buildTrailheadHighlights(insightMap),
    });
  } catch (err) {
    return safeServerError(res, 'AI Summary error:', err);
  }
}
