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
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EXTRACTION_MODEL = process.env.SUMMARY_EXTRACTION_MODEL || 'gpt-4o-mini';
const NARRATIVE_MODEL = process.env.SUMMARY_NARRATIVE_MODEL || 'gpt-4o-mini';
const SUMMARY_ENABLE_RETRY = process.env.SUMMARY_ENABLE_RETRY === '1';

// Cache AgentIdentity.txt at module scope to avoid re-reading on every request
let cachedAgentIdentity = '';
const identityPath = path.join(process.cwd(), 'api', 'AgentIdentity.txt');
try {
  cachedAgentIdentity = fs.readFileSync(identityPath, 'utf8').replace(/\r/g, '').trim();
} catch {
  cachedAgentIdentity = '';
}

// ---- utils ---------------------------------------------------------------

function clipSentenceSafe(text, limit) {
  if (!text) return '';
  const s = String(text).trim();
  if (s.length <= limit) return s;

  const cut = s.slice(0, limit);
  // prefer to end on a sentence terminator (., !, ?) possibly followed by quotes/brackets
  const re = /[.!?](?:[”’'")\]]+)?(?=\s|$)/g;
  let lastEnd = -1;
  let m;
  while ((m = re.exec(cut)) !== null) lastEnd = re.lastIndex;

  if (lastEnd > 0) return cut.slice(0, lastEnd).trim();

  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) return cut.slice(0, lastSpace).trim();

  return cut.trim();
}

function clipToChars(text, limit) {
  const n = Math.max(0, Number(limit) || 0);
  return clipSentenceSafe(text, n);
}

function enforceThreeParagraphs(text, maxChars) {
  const parts = String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  while (parts.length < 3) parts.push('');
  const total = Math.max(0, Number(maxChars) || 0);
  const firstBudget = Math.max(520, Math.floor(total * 0.32));
  const secondBudget = Math.max(520, Math.floor(total * 0.32));
  const thirdBudget = Math.max(520, total - firstBudget - secondBudget);
  const [p1, p2, p3] = parts.slice(0, 3);
  const out1 = clipToChars(p1, firstBudget);
  const out2 = clipToChars(p2, secondBudget);
  const out3 = clipToChars(p3, thirdBudget);
  return [out1, out2, out3].join('\n\n').trim();
}

function toWordWindow(text, minWords = 6, maxWords = 8) {
  const fallback = 'Consistently demonstrates this behavior under everyday pressure';
  const source = String(text || fallback)
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = source.split(' ').filter(Boolean);
  const base = words.length ? words : fallback.split(' ');
  const clipped = base.slice(0, maxWords);
  while (clipped.length < minWords) {
    clipped.push('consistently');
  }
  return clipped.join(' ');
}

function stripListMarkers(text) {
  return String(text || '')
    .replace(/^\s*[-–—•●▪·‣*]\s+/gm, '')
    .replace(/(^|[.!?]\s*)[-–—•●▪·‣*]\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureNewTrailProseOnly(text) {
  const sections = String(text || '').split(/\n\s*\n/);
  while (sections.length < 4) sections.push('');
  const lastIdx = 3;
  const prose = stripListMarkers(
    String(sections[lastIdx] || '')
      .split('\n')
      .map((line) => stripListMarkers(String(line || '').replace(/^\s*EXAMPLE\s*:/i, '')))
      .filter(Boolean)
      .join(' ')
  );
  const sentences = (prose.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [])
    .map((s) => stripListMarkers(s))
    .filter(Boolean);
  const fillers = [
    'A new trail opens when you put intention behind the shifts that already want to emerge.',
    'The leader you could become is clearer, steadier, and easier for your team to follow under pressure.',
    'That pivot is available now — not as a reinvention, but as a sharper version of how you already lead.',
  ];
  for (const next of fillers) {
    if (sentences.length >= 3) break;
    if (!sentences.includes(next)) sentences.push(next);
  }
  sections[lastIdx] = sentences.slice(0, 5).join(' ').trim();
  return sections.join('\n\n').trim();
}

function ensureTrailMarkers(text) {
  // Markers/hazards shaping is handled in normalizeFourSections.
  const sections = String(text || '').split(/\n\s*\n/);
  while (sections.length < 4) sections.push('');
  return sections.join('\n\n').trim();
}

function extractFirstJsonObject(text) {
  const input = String(text || '').trim();
  if (!input) return null;
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : input;
  try {
    return JSON.parse(candidate);
  } catch {
    // Best-effort scan for the first object block
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const sliced = candidate.slice(start, end + 1);
      try {
        return JSON.parse(sliced);
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
    // Backward-compatible aliases used throughout shaping logic.
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

function normalizeFourSections(text, insightMap) {
  const stripHeading = (s) =>
    String(s || '')
      .replace(/^(trailhead|trail markers|trajectory|upcoming hazards|a new trail|snapshot|a new way forward)\s*[:\-]\s*/i, '')
      .trim();

  const toSentences = (input) =>
    (String(input || '')
      .replace(/^\s*#+\s*/gm, '')
      .match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [])
      .map((s) => stripListMarkers(stripHeading(String(s || '').trim())))
      .filter(Boolean);

  const isExampleLine = (line) => {
    const t = String(line || '').trim();
    if (/^EXAMPLE\s*:/i.test(t)) return true;
    if (!/^[-–—•●▪·‣*]\s+/.test(t)) return false;
    // A leading bullet on multi-sentence prose is usually New Trail corruption, not an example.
    const withoutBullet = t.replace(/^[-–—•●▪·‣*]\s+/, '');
    const sentenceCount = (withoutBullet.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [])
      .map((s) => s.trim())
      .filter(Boolean).length;
    return sentenceCount < 2;
  };
  const toExampleLine = (line) => {
    const raw = stripListMarkers(
      String(line || '').trim()
        .replace(/^EXAMPLE\s*:/i, '')
        .trim()
    );
    return raw ? `EXAMPLE: ${raw}` : '';
  };

  const padFraming = (framing, fallbackSentences) => {
    const list = toSentences(framing);
    for (const s of fallbackSentences) {
      if (list.length >= 3) break;
      if (!list.includes(s)) list.push(s);
    }
    while (list.length < 2) {
      list.push(fallbackSentences[list.length % fallbackSentences.length]);
    }
    // Always keep 2-3 framing sentences — never ship a single-sentence open.
    return list.slice(0, 3).join(' ').trim();
  };

  const rawLines = String(text || '')
    .replace(/^\s*#+\s*/gm, '')
    .split('\n')
    .map((l) => l.trim());

  // Linear parse: prose before first EXAMPLE = trailhead (+ maybe markers framing).
  // Then EXAMPLE pairs, with prose between example groups = hazards framing, then new trail.
  const examples = [];
  const proseBeforeExamples = [];
  const proseBetweenExampleGroups = []; // after 2 examples, before next examples
  const proseAfterExamples = [];
  let phase = 'before'; // before | markersExamples | hazardsFraming | hazardsExamples | newTrail

  for (const line of rawLines) {
    if (!line) continue;
    if (isExampleLine(line)) {
      const ex = toExampleLine(line);
      if (!ex) continue;
      if (phase === 'before' || phase === 'markersExamples') {
        phase = 'markersExamples';
        examples.push(ex);
        if (examples.length >= 2) phase = 'hazardsFraming';
      } else if (phase === 'hazardsFraming' || phase === 'hazardsExamples') {
        phase = 'hazardsExamples';
        examples.push(ex);
        if (examples.length >= 4) phase = 'newTrail';
      }
      continue;
    }
    const cleaned = stripHeading(line);
    if (!cleaned) continue;
    if (phase === 'before' || phase === 'markersExamples') proseBeforeExamples.push(cleaned);
    else if (phase === 'hazardsFraming') proseBetweenExampleGroups.push(cleaned);
    else if (phase === 'hazardsExamples') proseBetweenExampleGroups.push(cleaned);
    else proseAfterExamples.push(cleaned);
  }

  // Split the pre-example prose into trailhead (bulk) + markers framing (last 2-3 sentences).
  const beforeSentences = toSentences(proseBeforeExamples.join(' '));
  let markerFramingSentences = [];
  let trailheadSentences = beforeSentences.slice();
  if (beforeSentences.length >= 8) {
    markerFramingSentences = beforeSentences.slice(-3);
    // Prefer 2-3 framing sentences without starving trailhead below 6.
    while (markerFramingSentences.length > 2 && beforeSentences.length - markerFramingSentences.length < 6) {
      markerFramingSentences = markerFramingSentences.slice(1);
    }
    if (markerFramingSentences.length >= 2 && beforeSentences.length - markerFramingSentences.length >= 6) {
      trailheadSentences = beforeSentences.slice(0, beforeSentences.length - markerFramingSentences.length);
    } else {
      markerFramingSentences = [];
      trailheadSentences = beforeSentences;
    }
  }

  // If model already separated framing with blank-line chunks historically, also accept short tails.
  if (!markerFramingSentences.length && beforeSentences.length >= 3) {
    const take = Math.min(3, Math.max(2, beforeSentences.length - 6));
    if (take >= 2 && beforeSentences.length - take >= 6) {
      markerFramingSentences = beforeSentences.slice(-take);
      trailheadSentences = beforeSentences.slice(0, beforeSentences.length - take);
    }
  }

  let p1List = trailheadSentences.slice();
  if (p1List.length < 6) {
    const topUps = [
      String(insightMap?.leadershipMirror || '').trim(),
      String(insightMap?.protectivePattern || '').trim(),
      String(insightMap?.peopleImpact || '').trim(),
      ...(Array.isArray(insightMap?.coreStrengths) ? insightMap.coreStrengths.map((x) => x?.implication).filter(Boolean) : []),
      ...(Array.isArray(insightMap?.coreTensions) ? insightMap.coreTensions.map((x) => x?.implication).filter(Boolean) : []),
    ]
      .map((s) => String(s || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
    for (let i = 0; i < topUps.length && p1List.length < 8; i += 1) {
      if (!p1List.includes(topUps[i])) p1List.push(topUps[i]);
    }
  }
  if (p1List.length > 12) p1List = p1List.slice(0, 12);
  const p1 = p1List.join(' ').trim()
    || 'Your leadership shows clear strengths and a meaningful tension that shapes team experience.';

  const markerFallbackExamples = [
    'EXAMPLE: In a high-stakes meeting, the room slows while people wait for your final read before they commit.',
    'EXAMPLE: Under deadline pressure, clarity arrives late and the team spends energy decoding mixed signals.',
  ];

  const isLeaveCopout = (line) =>
    /\b(quit|resign|leaving|leave the (team|company|org)|attrition|turnover|walk away|exit the|talent leaves|people leave|they leave)\b/i
      .test(String(line || ''));

  const extrapolateHazardFromMarker = (markerLine, index) => {
    const marker = stripListMarkers(
      String(markerLine || '').replace(/^EXAMPLE\s*:/i, '').trim()
    ).replace(/\.$/, '');
    const behaviors = [
      'people who stay learn to withhold unfinished thinking, wait for your signal, and execute without real ownership.',
      'people who stay build quiet workarounds, over-ask for permission, and protect themselves more than they escalate risk.',
    ];
    if (!marker) {
      return `EXAMPLE: A year into that pattern, ${behaviors[index % 2]}`;
    }
    return `EXAMPLE: A year after that early pattern keeps repeating — ${marker} — ${behaviors[index % 2]}`;
  };

  const markerFraming = padFraming(
    markerFramingSentences.join(' '),
    [
      'Pay attention here — a few recurring moments already show how this pattern lands with your team.',
      'These are the places worth watching in real time as you lead.',
      'Notice where the same friction shows up when pressure rises.',
    ]
  );
  const markerExamples = [
    ...(examples.slice(0, 2).length ? examples.slice(0, 2) : markerFallbackExamples),
  ].slice(0, 2);
  while (markerExamples.length < 2) {
    markerExamples.push(markerFallbackExamples[markerExamples.length]);
  }
  const p2 = [markerFraming, ...markerExamples].join('\n');

  // Hazards framing = prose between example groups; if empty, use insight map / pad.
  const betweenSentences = toSentences(proseBetweenExampleGroups.join(' '));
  const afterSentences = toSentences(proseAfterExamples.join(' '));
  // If model put hazards framing after the 2nd example pair starts late, steal first 2-3 of after when between is empty.
  let hazardFramingSource = betweenSentences.join(' ');
  let newTrailSourceSentences = afterSentences.slice();
  if (!betweenSentences.length && afterSentences.length >= 5) {
    hazardFramingSource = afterSentences.slice(0, 3).join(' ');
    newTrailSourceSentences = afterSentences.slice(3);
  }

  const hazardFraming = padFraming(
    hazardFramingSource || insightMap?.futureRiskIfUnchanged || insightMap?.trajectory?.driftCase || '',
    [
      'If those early markers keep running for a year, the cost shows up in how people behave while they stay.',
      'This is not about who exits — it is about what the pattern trains in the people who remain.',
      'Take that seriously before those habits become the team’s quiet operating system.',
    ]
  );

  // Always exactly 2 hazard examples, paired 1:1 with marker examples; replace leave-copouts.
  const rawHazardExamples = examples.slice(2, 4);
  const hazardExamples = [0, 1].map((i) => {
    const candidate = rawHazardExamples[i];
    if (candidate && !isLeaveCopout(candidate)) return candidate;
    return extrapolateHazardFromMarker(markerExamples[i], i);
  });
  const p3 = [hazardFraming, ...hazardExamples].join('\n');

  let p4List = newTrailSourceSentences.map(stripListMarkers).filter(Boolean);
  const newTrailFillers = [
    'A new trail opens when you put intention behind the shifts that already want to emerge.',
    'The leader you could become is clearer, steadier, and easier for your team to follow under pressure.',
    'That pivot is available now — not as a reinvention, but as a sharper version of how you already lead.',
  ];
  for (const s of newTrailFillers) {
    if (p4List.length >= 3) break;
    if (!p4List.includes(s)) p4List.push(s);
  }
  const p4 = p4List.slice(0, 5).map(stripListMarkers).join(' ').trim();
  return [p1, p2, p3, p4].join('\n\n').trim();
}

function hasOverusedGenericTheme(text) {
  const src = String(text || '').toLowerCase();
  const communicationHits = (src.match(/\bcommunicat\w*\b/g) || []).length;
  const delegationHits = (src.match(/\bdelegat\w*\b/g) || []).length;
  return communicationHits + delegationHits >= 4;
}

function hasEmotionalArc(text) {
  const src = String(text || '').toLowerCase();
  const seenTokens = /\b(seen|accurate|mirror|recognized|understood)\b/g;
  const exposedTokens = /\b(tension|friction|strain|cost|tradeoff|pressure)\b/g;
  const hopefulTokens = /\b(agency|possible|path|opening|regain|stabilize)\b/g;
  const motivatedTokens = /\b(momentum|forward|commitment|energized|intentional|ready)\b/g;
  const hasSeen = (src.match(seenTokens) || []).length >= 1;
  const hasExposed = (src.match(exposedTokens) || []).length >= 1;
  const hasHopeful = (src.match(hopefulTokens) || []).length >= 1;
  const hasMotivated = (src.match(motivatedTokens) || []).length >= 1;
  return hasSeen && hasExposed && hasHopeful && hasMotivated;
}

function softenPrescriptiveLanguage(text) {
  return String(text || '')
    .replace(/\byou should\b/gi, 'you may feel pressure to')
    .replace(/\bshould\b/gi, 'could')
    .replace(/\bmust\b/gi, 'may need to')
    .replace(/\bneed to\b/gi, 'may need to')
    .replace(/\bhave to\b/gi, 'may feel required to')
    .replace(/\btry to\b/gi, 'may attempt to')
    .replace(/\bfocus on\b/gi, 'when attention shifts to')
    .replace(/\bstart with\b/gi, 'when it begins with')
    .replace(/\bbegin by\b/gi, 'when this shifts through')
    .replace(/\bby\s+([a-z]+ing)\b/gi, 'when this pattern shifts')
    .replace(/\bif addressed\b[:,]?\s*/gi, 'if this pattern shifts, ');
}

function removeDanglingMarkdown(text) {
  let cleaned = String(text || '');
  if (((cleaned.match(/\*\*/g) || []).length % 2) !== 0) {
    cleaned = cleaned.replace(/\*\*/g, '');
  }
  cleaned = cleaned
    .replace(/^\s*\*\*\s+/gm, '')
    .replace(/\s+\*\*\s*$/gm, '')
    .replace(/\n\s*\*\*\s*\n/g, '\n');
  return cleaned;
}

function sectionSentenceCount(text) {
  const matches = String(text || '').match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  return (matches || []).map((s) => s.trim()).filter(Boolean).length;
}

function evaluateNarrativeQuality(text, insightMap) {
  const sections = String(text || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const [trailhead = '', markers = '', trajectory = '', newTrail = ''] = sections;
  const badPhrases = [
    /unlock potential/i,
    /effective leader/i,
    /growth mindset/i,
    /improve communication/i,
    /high-performing team/i,
    /be more strategic/i,
  ];
  const advicePattern = /\b(you should|should|must|need to|have to|try to|focus on|start with|begin by|by\s+[a-z]+ing)\b/i;
  const danglingFragment = /(?:^|[.!?]\s+)[^.!?]*\b(to|by|of|for|with|into|onto|from|about|as|at|in|on|and|or|but|if|when|while)\.\s*(?:$|[A-Z])/i;

  let score = 0;
  if (sections.length >= 4) score += 1;
  if (sectionSentenceCount(trailhead) >= 7) score += 1;
  const framingBeforeExamples = (section) => {
    const idx = String(section || '').search(/(?:^|\n)\s*EXAMPLE\s*:/im);
    const framing = idx >= 0 ? String(section).slice(0, idx) : String(section || '');
    return sectionSentenceCount(framing);
  };
  if (framingBeforeExamples(markers) >= 2 && (/^EXAMPLE\s*:/im.test(markers) ? (markers.match(/^EXAMPLE\s*:/gim) || []).length : 0) >= 2) score += 1;
  const hazardExampleCount = (trajectory.match(/^EXAMPLE\s*:/gim) || []).length;
  if (framingBeforeExamples(trajectory) >= 2 && hazardExampleCount >= 2) score += 1;
  if (hazardExampleCount >= 2 && !/\b(quit|resign|leaving|attrition|turnover|talent leaves|people leave)\b/i.test(trajectory)) score += 1;
  if (sectionSentenceCount(newTrail) >= 3) score += 1;
  if (String(insightMap?.signaturePattern || '') && String(text).toLowerCase().includes(String(insightMap.signaturePattern).toLowerCase().split(' ').slice(0, 3).join(' '))) score += 1;
  if (String(insightMap?.hiddenCost || '') && String(text).toLowerCase().includes(String(insightMap.hiddenCost).toLowerCase().split(' ').slice(0, 3).join(' '))) score += 1;
  if (!badPhrases.some((re) => re.test(text))) score += 1;
  if (!hasOverusedGenericTheme(text)) score += 1;
  if (hasEmotionalArc(text)) score += 1;
  if (!danglingFragment.test(trajectory)) score += 1;
  if (!/^\s*#+/m.test(text)) score += 1;
  if (!advicePattern.test(`${trailhead} ${trajectory}`)) score += 1;
  if (/\*\*[^*]+\*\*/.test(trailhead) || /\*[^*]+\*/.test(trailhead)) score += 1;
  return score;
}

function buildNarrativeRepairPrompt() {
  return `
Repair this draft to satisfy all requirements:
- Keep four sections separated by blank lines.
- Trailhead must be current-state only, 8-12 sentences, generally affirming and intriguing, with light **bold** / *italic* emphasis on key phrases.
- Trail Markers must open with 2-3 framing sentences in guide voice (call to pay attention), then exactly 2 lines starting with "EXAMPLE:" (no bullet points). Those two EXAMPLES are early-pattern moments.
- Upcoming Hazards must open with 2-3 framing sentences, then exactly 2 lines starting with "EXAMPLE:" — paired 1:1 with the Trail Marker examples (Hazard 1 = Marker 1 a year later; Hazard 2 = Marker 2 a year later).
- Each hazard EXAMPLE must describe employee behavior if people stay under that leadership and the pattern becomes perpetual — withholding, over-asking, self-protection, workarounds, slowed ownership, compliance without candor, etc.
- Ban leave-copouts in hazards: no quitting, resigning, leaving, attrition, turnover, or "they walk."
- A New Trail must be at least 3 prose sentences only — no lists, no trait names, no EXAMPLE lines, no bullet points.
- Do not invent claims. Keep fidelity to intake evidence.
- No advice, directives, or headings.
`.trim();
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
  const strengthLabel = String(strength?.label || 'Core strength').trim() || 'Core strength';
  const focusLabel = String(tension?.label || 'Focus point').trim() || 'Focus point';
  const strengthText = pickText(strength, [
    insightMap?.leadershipMirror,
    'A reliable leadership asset that already creates clarity and momentum for others.',
  ]);
  const focusText = pickText(tension, [
    insightMap?.protectivePattern,
    insightMap?.hiddenTradeoff,
    'A recurring tension that quietly shapes how the team experiences your leadership.',
  ]);
  return {
    strength: { label: strengthLabel, text: strengthText },
    focus: { label: focusLabel, text: focusText },
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

/**
 * Apply per-section budgets to exactly 4 paragraphs (canonical format):
 * [0] Your Leadership Foundation
 * [1] Areas for Growth (Part 1)
 * [2] Areas for Growth (Part 2)
 * [3] Trajectory
 */
function enforceBudgets(text, budgets) {
  const parts = String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim());

  while (parts.length < 4) parts.push('');
  const [p1, p2, p3, p4] = parts.slice(0, 4);

  const out1 = clipToChars(p1, budgets.foundation);
  const out2 = clipToChars(p2, budgets.growthPart1);
  const out3 = clipToChars(p3, budgets.growthPart2);
  const out4 = clipToChars(p4, budgets.trajectory);

  return [out1, out2, out3, out4].join('\n\n');
}

// ---- handler -------------------------------------------------------------

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
    
    const { selectedAgent = 'balancedMentor', charLimit } = body;
    
    // Log missing expected fields (non-blocking)
    if (!body.societalResponses && !body.selectedAgent) {
      console.warn('get-ai-summary: Missing expected fields (societalResponses, selectedAgent)');
    }
    
    // Use cached Agent Identity (loaded at module scope)
    const cleanIdentity = cachedAgentIdentity;

    // Agent personas (tone/voice only)
    // Agent personas (tone/voice with concrete style guides)
const agents = {
  bluntPracticalFriend: {
    prompt: `You are a blunt, practical friend. Be direct, concrete, and no-fluff.`,
    style: {
      sentences: `Short to medium sentences. Declarative and crisp.`,
      do: [
        `Call things plainly; cut filler.`,
        `Name one tradeoff explicitly.`,
        `Keep it grounded in context.`
      ],
      dont: [
        `No euphemisms.`,
        `No “inspirational fluff.”`,
        `No multi-clause run-ons.`
      ],
      lexicon: [
        `cut`, `clarity`, `decision`, `evidence`, `scope`, `boundary`, `tradeoff`
      ]
    },
    params: { temperature: 0.4, frequency_penalty: 0.3, presence_penalty: 0.0 }
  },

  formalEmpatheticCoach: {
    prompt: `You are a formal, empathetic guide. Polished, supportive, professional.`,
    style: {
      sentences: `Medium sentences. Warm, respectful, executive-ready.`,
      do: [
        `Acknowledge intent before critique.`,
        `Ground points with 1 concrete example.`,
        `Use measured verbs (“clarify”, “align”).`
      ],
      dont: [
        `No slang or jokes.`,
        `No judgmental phrasing.`,
        `No bullet spam.`
      ],
      lexicon: [
        `clarify`, `prioritize`, `calibrate`, `align`, `evidence`, `stakeholders`
      ]
    },
    params: { temperature: 0.3, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  balancedMentor: {
    prompt: `You are a balanced mentor. Mix critique with encouragement and calm clarity.`,
    style: {
      sentences: `Medium sentences. Even, steady voice.`,
      do: [
        `Name 1 strength for every critique.`,
        `Tie observations to stated context (role/industry/team size).`,
        `Keep the tone steady and grounded.`
      ],
      dont: [
        `Don’t waffle.`,
        `Don’t over-generalize.`,
        `Don’t list steps or directives.`
      ],
      lexicon: [
        `signal`, `pattern`, `tradeoff`, `cadence`, `feedback loop`
      ]
    },
    params: { temperature: 0.35, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  comedyRoaster: {
    prompt: `You are a witty roaster. Humorous, insightful, and respectful.`,
    style: {
      sentences: `Short zingers + clear insights.`,
      do: [
        `Light roast, never mean.`,
        `Always land on a concrete insight.`,
        `One joke per paragraph max.`
      ],
      dont: [
        `No sarcasm about identity/demographics.`,
        `No profanity.`,
        `No sarcasm without insight.`
      ],
      lexicon: [
        `hot take`, `plot twist`, `nope`, `low-lift`, `one move`
      ]
    },
    params: { temperature: 0.55, frequency_penalty: 0.25, presence_penalty: 0.0 }
  },

  pragmaticProblemSolver: {
    prompt: `You are a pragmatic problem solver. No fluff; plain-spoken.`,
    style: {
      sentences: `Short. Plain.`,
      do: [
        `State problem → constraint → implication.`,
        `Include a concrete detail.`,
        `Strip adjectives.`
      ],
      dont: [
        `No metaphors.`,
        `No visionary language.`,
        `No step lists or directives.`
      ],
      lexicon: [
        `metric`, `risk`, `scope`, `constraint`, `signal`, `boundary`
      ]
    },
    params: { temperature: 0.25, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  highSchoolCoach: {
    prompt: `You are an encouraging coach. Motivational, clear, and respectful.`,
    style: {
      sentences: `Conversational. Encouraging.`,
      do: [
        `Affirm effort, then mirror the pattern.`,
        `Keep language simple and repeatable.`,
        `Use vivid but respectful language.`
      ],
      dont: [
        `No condescension.`,
        `No clichés without specifics.`,
        `No long-winded pep talks.`
      ],
      lexicon: [
        `rep`, `drill`, `focus`, `reset`, `breathe`, `own it`, `next play`
      ]
    },
    params: { temperature: 0.45, frequency_penalty: 0.2, presence_penalty: 0.0 }
  }
};

    const personaInterpretiveLens = {
      bluntPracticalFriend: {
        focus: 'decision friction, execution drag, and avoidable complexity',
        mustSurface: [
          'Name the highest-cost leadership tradeoff in plain language.',
          'Explain what the current pattern optimizes for (often unintentionally).',
          'Call out the single operational consequence that will keep repeating.',
        ],
      },
      formalEmpatheticCoach: {
        focus: 'trust dynamics, relational safety, and leadership signal consistency',
        mustSurface: [
          'Reflect intent vs impact with neutral, respectful language.',
          'Describe how team confidence is shaped by repeated leadership signals.',
          'Highlight one tension between care and clarity without blame.',
        ],
      },
      balancedMentor: {
        focus: 'strength/tension balance and compounding leadership patterns',
        mustSurface: [
          'Anchor one clear strength and one costly recurring tension.',
          'Connect both to role context and likely team-level consequences.',
          'Frame growth as an achievable shift without prescribing steps.',
        ],
      },
      comedyRoaster: {
        focus: 'pattern visibility through light contrast while preserving dignity',
        mustSurface: [
          'Use humor sparingly to reveal (not mask) the core pattern.',
          'After each light edge line, land on a specific evidence-backed insight.',
          'Keep psychological safety intact: sharp on patterns, kind to person.',
        ],
      },
      pragmaticProblemSolver: {
        focus: 'constraint analysis, signal integrity, and repeatable outcomes',
        mustSurface: [
          'Map signal -> operating constraint -> downstream effect clearly.',
          'Prioritize the bottleneck pattern over broad narrative language.',
          'Use compact, concrete interpretation with minimal abstraction.',
        ],
      },
      highSchoolCoach: {
        focus: 'identity confidence, motivation energy, and consistency cues',
        mustSurface: [
          'Affirm effort while naming the exact pattern that limits results.',
          'Translate tension into understandable, emotionally honest language.',
          'Leave the user feeling challenged, seen, and ready to keep going.',
        ],
      },
    };


    if (!agents[selectedAgent]) {
      return res
        .status(400)
        .json({ error: `Invalid agent. Choose: ${Object.keys(agents).join(', ')}` });
    }

    const maxChars = Math.max(2400, Math.min(Number(charLimit) || 3200, 4000));

    // Build a compact persona voice guide
    const voiceGuide = (() => {
      const a = agents[selectedAgent];
      const lens = personaInterpretiveLens[selectedAgent] || personaInterpretiveLens.balancedMentor;
      const structureRuleByAgent = {
        bluntPracticalFriend: 'Use short declarative sentences and explicit tradeoffs.',
        formalEmpatheticCoach: 'Use polished medium-length sentences with calibrated qualifiers.',
        balancedMentor: 'Use balanced cadence; alternate challenge and reinforcement.',
        comedyRoaster: 'Use one light edge line per section max, then concrete insight.',
        pragmaticProblemSolver: 'Use compact cause->effect constructions with minimal adjectives.',
        highSchoolCoach: 'Use energetic but clear phrasing with plain-language momentum cues.',
      };
      const doList = (a.style?.do || []).map((d) => `- ${d}`).join('\n');
      const dontList = (a.style?.dont || []).map((d) => `- ${d}`).join('\n');
      const lex = (a.style?.lexicon || []).slice(0, 8).join(', ');
      const sentences = a.style?.sentences || '';
      return `
VOICE & TONE GUIDE (apply consistently):
- Sentence shape: ${sentences}
- Structural rule: ${structureRuleByAgent[selectedAgent] || 'Use natural, varied sentence structure tied to evidence.'}
- Prefer vocabulary: ${lex || 'plain, concrete verbs; avoid fluff'}
- Interpretive lens focus: ${lens.focus}
- Lens non-negotiables:
${(lens.mustSurface || []).map((item) => `  - ${item}`).join('\n')}
- Do:
${doList || '- Keep it concrete.\n- Tie to context.\n- End with a clear insight.'}
- Don’t:
${dontList || '- No fluff.\n- No hedging.\n- No generic platitudes.'}
`.trim();
    })();

    // Pass A: structured insight extraction
    const extractSystem = buildInsightExtractionSystemPrompt({ agentIdentity: cleanIdentity });
    const focusTraitCatalog = buildFocusTraitCatalog();
    const extractUser = `${buildInsightExtractionUserPrompt(body, focusTraitCatalog)}

PERSONA INTERPRETIVE LENS
- Focus: ${(personaInterpretiveLens[selectedAgent] || personaInterpretiveLens.balancedMentor).focus}
- Must surface:
${((personaInterpretiveLens[selectedAgent] || personaInterpretiveLens.balancedMentor).mustSurface || [])
  .map((item) => `  - ${item}`)
  .join('\n')}
`.trim();
    const extraction = await openai.chat.completions.create({
      model: EXTRACTION_MODEL,
      max_tokens: 650,
      temperature: 0.2,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      messages: [
        { role: 'system', content: extractSystem },
        { role: 'user', content: extractUser },
      ],
    });
    const extractionRaw = extraction?.choices?.[0]?.message?.content?.trim() || '{}';
    const insightMap = normalizeInsightMap(extractFirstJsonObject(extractionRaw));
    const focusAreas = buildFocusAreas(body, insightMap);

    // Pass B: narrative generation from extracted insight map
    const narrativeSystem = buildSummaryNarrativeSystemPrompt({
      agentPrompt: agents[selectedAgent].prompt,
      voiceGuide,
      agentIdentity: cleanIdentity,
    });
    const contextSnapshot = {
      birthYear: body?.birthYear || '',
      generationBand: body?.birthYear ? (
        Number(body.birthYear) >= 1997 ? 'Gen Z' :
        Number(body.birthYear) >= 1981 ? 'Millennial' :
        Number(body.birthYear) >= 1965 ? 'Gen X' :
        Number(body.birthYear) > 0 ? 'Boomer+' : ''
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
    };
    const narrativeUser = buildSummaryNarrativeUserPrompt({ insightMap, focusAreas, contextSnapshot });
    const completion = await openai.chat.completions.create({
      model: NARRATIVE_MODEL,
      max_tokens: 2200,
      temperature: Math.min((agents[selectedAgent]?.params?.temperature ?? 0.35) + 0.12, 0.75),
      frequency_penalty: agents[selectedAgent]?.params?.frequency_penalty ?? 0.2,
      presence_penalty: Math.max(agents[selectedAgent]?.params?.presence_penalty ?? 0.0, 0.15),
      messages: [
        { role: 'system', content: narrativeSystem },
        { role: 'user', content: narrativeUser },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content?.trim() || '';
    const shapePipeline = (value) => {
      const shaped = normalizeFourSections(value, insightMap);
      const withMarkers = ensureTrailMarkers(shaped, insightMap);
      const withBullets = ensureNewTrailProseOnly(withMarkers);
      const softened = softenPrescriptiveLanguage(withBullets);
      const cleanedMarkdown = removeDanglingMarkdown(softened);
      return cleanedMarkdown.replace(/\*\*/g, '');
    };
    let capped = shapePipeline(raw);
    let quality = evaluateNarrativeQuality(capped, insightMap);

    if (SUMMARY_ENABLE_RETRY && quality < 10) {
      const repairPrompt = `${buildNarrativeRepairPrompt()}\n\nDRAFT TO REPAIR:\n${capped}`;
      const retry = await openai.chat.completions.create({
        model: NARRATIVE_MODEL,
        max_tokens: 2200,
        temperature: Math.min((agents[selectedAgent]?.params?.temperature ?? 0.35) + 0.08, 0.72),
        frequency_penalty: agents[selectedAgent]?.params?.frequency_penalty ?? 0.2,
        presence_penalty: Math.max(agents[selectedAgent]?.params?.presence_penalty ?? 0.0, 0.15),
        messages: [
          { role: 'system', content: narrativeSystem },
          { role: 'user', content: narrativeUser },
          { role: 'user', content: repairPrompt },
        ],
      });
      const retryRaw = retry?.choices?.[0]?.message?.content?.trim() || '';
      const retryCapped = shapePipeline(retryRaw);
      const retryQuality = evaluateNarrativeQuality(retryCapped, insightMap);
      if (retryQuality >= quality) {
        capped = retryCapped;
        quality = retryQuality;
      }
    }

    return res.status(200).json({
      aiSummary: capped,
      maxChars,
      focusAreas,
      trailheadHighlights: buildTrailheadHighlights(insightMap),
    });
  } catch (err) {
    return safeServerError(res, 'AI Summary error:', err);
  }
}
