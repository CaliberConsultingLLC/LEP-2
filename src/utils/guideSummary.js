import { GUIDE_VOICE_IDS, DEFAULT_GUIDE_VOICE_ID, resolveGuideVoiceId } from '../data/guideVoices.js';

const LEAVE_RE = /\b(quit|resign|leaving|leave the (team|company|org)|attrition|turnover|walk away|exit the|talent leaves|people leave|they leave)\b/i;

const ADVICE_RE = /\b(you should|focus on|start with|begin by)\b/gi;

function asText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function asSentences(value, max = 6) {
  const text = asText(value);
  if (!text) return [];
  const matches = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [];
  return matches
    .map((s) => asText(s))
    .filter(Boolean)
    .slice(0, max)
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
}

function stripExamplePrefix(value) {
  return asText(String(value || '').replace(/^EXAMPLE\s*:/i, ''));
}

function stripListMarkers(value) {
  return asText(String(value || '').replace(/^\s*[-–—•●▪·‣*]\s+/, ''));
}

function softenLight(value) {
  return String(value || '')
    .replace(/\byou should\b/gi, 'you may notice a pull to')
    .replace(/\bfocus on\b/gi, 'when attention turns toward')
    .replace(/\bstart with\b/gi, 'when it begins with')
    .replace(/\bbegin by\b/gi, 'when this shifts through')
    .replace(/\bif addressed\b[:,]?\s*/gi, 'if this pattern shifts, ')
    .replace(/\*\*/g, '')
    .trim();
}

function sentenceCount(value) {
  return asSentences(value, 20).length;
}

export function emptyGuideSummary() {
  return {
    trailhead: '',
    markers: { framing: '', examples: [] },
    hazards: { framing: '', examples: [] },
    newTrail: '',
  };
}

export function spokenSeedsFromInsightMap(insightMap = {}) {
  const seeds = insightMap?.spokenSeeds && typeof insightMap.spokenSeeds === 'object'
    ? insightMap.spokenSeeds
    : {};
  const markerMoments = Array.isArray(seeds.markerMoments)
    ? seeds.markerMoments.map((item) => stripListMarkers(stripExamplePrefix(item))).filter(Boolean).slice(0, 2)
    : [];
  const hazardIfStay = Array.isArray(seeds.hazardIfStay)
    ? seeds.hazardIfStay.map((item) => stripListMarkers(stripExamplePrefix(item))).filter(Boolean).slice(0, 2)
    : [];

  const strength = Array.isArray(insightMap?.coreStrengths) ? insightMap.coreStrengths[0] : null;
  const tension = Array.isArray(insightMap?.coreTensions) ? insightMap.coreTensions[0] : null;

  return {
    clearestAsset: asText(seeds.clearestAsset || strength?.implication || insightMap?.leadershipMirror),
    coreTension: asText(seeds.coreTension || tension?.implication || insightMap?.protectivePattern || insightMap?.hiddenTradeoff),
    markerMoments,
    hazardIfStay,
  };
}

function pairExamples(rawExamples, lockedSeeds, fallbacks) {
  const incoming = (Array.isArray(rawExamples) ? rawExamples : [])
    .map((item) => stripListMarkers(stripExamplePrefix(item)))
    .filter(Boolean);
  return [0, 1].map((index) => (
    incoming[index]
    || lockedSeeds[index]
    || fallbacks[index]
    || ''
  ));
}

function replaceLeaveCopouts(examples, lockedHazards, markerExamples) {
  return examples.map((line, index) => {
    if (line && !LEAVE_RE.test(line)) return line;
    if (lockedHazards[index] && !LEAVE_RE.test(lockedHazards[index])) return lockedHazards[index];
    const marker = markerExamples[index] || 'that early pattern';
    const stay = index === 0
      ? 'people who stay learn to withhold unfinished thinking and wait for your signal before they own anything.'
      : 'people who stay build quiet workarounds, over-ask for permission, and protect themselves more than they escalate risk.';
    return `A year into ${asText(marker).replace(/\.$/, '')}, ${stay}`;
  });
}

export function normalizeGuideSummary(raw, insightMap = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const seeds = spokenSeedsFromInsightMap(insightMap);
  const trailheadSentences = asSentences(src.trailhead, 12);
  const trailhead = (trailheadSentences.length >= 8 ? trailheadSentences : trailheadSentences.concat(
    [seeds.clearestAsset, seeds.coreTension].filter(Boolean)
  ).slice(0, 12)).join(' ');

  const markerFraming = asSentences(src?.markers?.framing, 7).join(' ')
    || asSentences(src?.markers, 7).join(' ');
  const hazardFraming = asSentences(src?.hazards?.framing, 7).join(' ')
    || asSentences(src?.hazards, 7).join(' ');

  const markerExamples = pairExamples(
    src?.markers?.examples,
    seeds.markerMoments,
    [
      'In a high-stakes meeting, the room slows while people wait for your final read before they commit.',
      'Under deadline pressure, clarity arrives late and the team spends energy decoding mixed signals.',
    ]
  );
  const hazardExamples = replaceLeaveCopouts(
    pairExamples(src?.hazards?.examples, seeds.hazardIfStay, []),
    seeds.hazardIfStay,
    markerExamples
  );

  let newTrailSentences = asSentences(src.newTrail, 10);
  if (newTrailSentences.length < 7) {
    const extra = asSentences(insightMap?.trajectory?.bestCase, 6);
    extra.forEach((sentence) => {
      if (newTrailSentences.length >= 10) return;
      if (!newTrailSentences.includes(sentence)) newTrailSentences.push(sentence);
    });
  }

  return {
    trailhead: softenLight(trailhead),
    markers: {
      framing: softenLight(markerFraming),
      examples: markerExamples.map((line) => softenLight(line)).filter(Boolean).slice(0, 2),
    },
    hazards: {
      framing: softenLight(hazardFraming),
      examples: hazardExamples.map((line) => softenLight(line)).filter(Boolean).slice(0, 2),
    },
    newTrail: softenLight(newTrailSentences.join(' ')),
  };
}

export function flattenGuideSummary(summary) {
  const src = summary && typeof summary === 'object' ? summary : emptyGuideSummary();
  const markerLines = [
    asText(src?.markers?.framing),
    ...(Array.isArray(src?.markers?.examples) ? src.markers.examples : [])
      .map((line) => stripExamplePrefix(line))
      .filter(Boolean)
      .map((line) => `EXAMPLE: ${line}`),
  ].filter(Boolean);
  const hazardLines = [
    asText(src?.hazards?.framing),
    ...(Array.isArray(src?.hazards?.examples) ? src.hazards.examples : [])
      .map((line) => stripExamplePrefix(line))
      .filter(Boolean)
      .map((line) => `EXAMPLE: ${line}`),
  ].filter(Boolean);
  return [asText(src.trailhead), markerLines.join('\n'), hazardLines.join('\n'), asText(src.newTrail)]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function parseFlattenedSummary(text) {
  const sections = String(text || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const [trailhead = '', markersRaw = '', hazardsRaw = '', newTrail = ''] = [
    sections[0] || '',
    sections[1] || '',
    sections[2] || '',
    sections.slice(3).join('\n\n'),
  ];
  const splitStage = (raw) => {
    const lines = String(raw || '').split('\n').map((line) => line.trim()).filter(Boolean);
    const examples = lines
      .filter((line) => /^EXAMPLE\s*:/i.test(line) || /^[-–—•●▪·‣*]\s+/.test(line))
      .map((line) => stripListMarkers(stripExamplePrefix(line)))
      .filter(Boolean)
      .slice(0, 2);
    const framing = lines
      .filter((line) => !/^EXAMPLE\s*:/i.test(line) && !/^[-–—•●▪·‣*]\s+/.test(line))
      .join(' ')
      .trim();
    return { framing, examples };
  };
  return {
    trailhead,
    markers: splitStage(markersRaw),
    hazards: splitStage(hazardsRaw),
    newTrail,
  };
}

export function coerceGuideSummary(value, insightMap = {}) {
  if (value && typeof value === 'object' && (value.trailhead || value.markers || value.newTrail)) {
    return normalizeGuideSummary(value, insightMap);
  }
  if (typeof value === 'string' && value.trim()) {
    return normalizeGuideSummary(parseFlattenedSummary(value), insightMap);
  }
  return emptyGuideSummary();
}

export function normalizeSummariesByGuide(raw, insightMap = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const next = {};
  GUIDE_VOICE_IDS.forEach((id) => {
    if (src[id]) next[id] = coerceGuideSummary(src[id], insightMap);
  });
  return next;
}

export function pickGuideSummary(summariesByGuide, guideId, fallbackText = '') {
  const id = resolveGuideVoiceId(guideId);
  const map = summariesByGuide && typeof summariesByGuide === 'object' ? summariesByGuide : {};
  if (map[id]) return { id, summary: coerceGuideSummary(map[id]) };
  const first = GUIDE_VOICE_IDS.find((key) => map[key]);
  if (first) return { id: first, summary: coerceGuideSummary(map[first]) };
  if (fallbackText) {
    return { id, summary: coerceGuideSummary(fallbackText) };
  }
  return { id: DEFAULT_GUIDE_VOICE_ID, summary: emptyGuideSummary() };
}

export { GUIDE_VOICE_IDS, ADVICE_RE, sentenceCount };
