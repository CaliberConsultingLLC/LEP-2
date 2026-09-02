import { GUIDE_VOICE_IDS, DEFAULT_GUIDE_VOICE_ID, resolveGuideVoiceId } from '../data/guideVoices.js';

// The hazard beat is about what people who STAY learn to do. Leave-language is
// a real failure of that constraint, so it is surfaced as a regeneration signal
// rather than patched over with canned replacement sentences.
const LEAVE_RE = /\b(quit|resign|leaving|leave the (team|company|org)|attrition|turnover|walk away|exit the|talent leaves|people leave|they leave)\b/i;

function asText(value) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(' ');
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * Paragraph-preserving text. The beats arrive from the model as arrays of
 * paragraphs now; a single newline joins them so the flat round-trip still
 * reads a blank line as the boundary between beats.
 */
function asProse(value) {
  const parts = Array.isArray(value) ? value : String(value || '').split(/\n+/);
  return parts.map(asText).filter(Boolean).join('\n');
}

/**
 * Splits prose into sentences without losing any of it.
 *
 * This used String.match with /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g, which required
 * whitespace or end-of-string after the terminal punctuation. "the 2 a.m. fix"
 * has no space after "a.", so that alternative could not claim the run and the
 * engine skipped forward — silently deleting the twelve words in front of it.
 * The remaining text was still grammatical, so nothing downstream noticed. It
 * hit five of six guide voices in a single generation.
 *
 * Matching can drop what it fails to claim. Splitting cannot, so this splits.
 *
 * The boundary also requires the next run to look like the start of a sentence,
 * which keeps "a.m. fix", "e.g. this", "1.5 times" and "No. 3" intact — they
 * continue lowercase or mid-token.
 */
export function splitSentences(value, max = Infinity) {
  const text = asText(value);
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=["'“‘([]?[A-Z])/)
    .map((s) => asText(s))
    .filter(Boolean)
    .slice(0, max);
}

const asSentences = splitSentences;

function stripExamplePrefix(value) {
  return asText(String(value || '').replace(/^EXAMPLE\s*:/i, ''));
}

function stripListMarkers(value) {
  return asText(String(value || '').replace(/^\s*[-–—•●▪·‣*]\s+/, ''));
}

function sentenceCount(value) {
  return asSentences(value).length;
}

export function emptyGuideSummary() {
  return {
    trailhead: '',
    markers: { framing: '', examples: [] },
    hazards: { framing: '', examples: [] },
    newTrail: '',
  };
}

/**
 * Reads the locked spoken seeds out of an insight map. Handles the v2 nested
 * shape (rendering.spokenSeeds + evidence.*) and falls back to evidence when
 * the rendering layer is thin.
 */
export function spokenSeedsFromInsightMap(insightMap = {}) {
  const evidence = insightMap?.evidence || {};
  const seeds = insightMap?.rendering?.spokenSeeds || {};

  const cleanList = (value) =>
    Array.isArray(value)
      ? value.map((item) => stripListMarkers(stripExamplePrefix(item))).filter(Boolean).slice(0, 3)
      : [];

  const strength = Array.isArray(evidence.coreStrengths) ? evidence.coreStrengths[0] : null;
  const tension = Array.isArray(evidence.coreTensions) ? evidence.coreTensions[0] : null;

  return {
    clearestAsset: asText(seeds.clearestAsset || strength?.implication || evidence.leadershipMirror),
    // Three threads now. The first is kept as coreTension so the Trailhead
    // highlight keeps working while everything else reads the list.
    coreTensions: cleanList(seeds.coreTensions),
    coreTension: asText(
      seeds.coreTensions?.[0] || seeds.coreTension || tension?.implication
      || evidence.protectivePattern || evidence.hiddenTradeoff
    ),
    markerMoments: cleanList(seeds.markerMoments),
    hazardIfStay: cleanList(seeds.hazardIfStay),
  };
}

/**
 * The locked seeds are the source of truth for the four example scenes — the
 * guide rewrites their diction, never their substance. If the model dropped one,
 * the seed is used directly rather than inventing a replacement.
 */
function pairExamples(rawExamples, lockedSeeds) {
  const incoming = (Array.isArray(rawExamples) ? rawExamples : [])
    .map((item) => stripListMarkers(stripExamplePrefix(item)))
    .filter(Boolean);
  return [0, 1, 2].map((index) => incoming[index] || lockedSeeds[index] || '').filter(Boolean);
}

/**
 * Normalizes a guide narrative. Deliberately does NOT pad short output — a beat
 * that comes back thin is reported by the caller's quality gate and regenerated.
 * Concatenating seeds or trajectory prose onto a short beat produced literal
 * self-restatement and broke the guide's voice.
 */
export function normalizeGuideSummary(raw, insightMap = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const seeds = spokenSeedsFromInsightMap(insightMap);

  const markerFraming = asProse(src?.markers?.framing) || asProse(src?.markers);
  const hazardFraming = asProse(src?.hazards?.framing) || asProse(src?.hazards);

  return {
    trailhead: asProse(src.trailhead),
    markers: {
      framing: markerFraming,
      examples: pairExamples(src?.markers?.examples, seeds.markerMoments),
    },
    hazards: {
      framing: hazardFraming,
      examples: pairExamples(src?.hazards?.examples, seeds.hazardIfStay),
    },
    newTrail: asProse(src.newTrail),
  };
}

/** True when the hazard beat slipped into leave-language instead of stay-behavior. */
export function hasLeaveLanguage(summary) {
  const parts = [
    summary?.hazards?.framing,
    ...(Array.isArray(summary?.hazards?.examples) ? summary.hazards.examples : []),
  ];
  return parts.some((part) => LEAVE_RE.test(String(part || '')));
}

export function flattenGuideSummary(summary) {
  const src = summary && typeof summary === 'object' ? summary : emptyGuideSummary();
  const stage = (framing, examples) =>
    [
      asProse(framing),
      ...(Array.isArray(examples) ? examples : [])
        .map((line) => stripExamplePrefix(line))
        .filter(Boolean)
        .map((line) => `EXAMPLE: ${line}`),
    ]
      .filter(Boolean)
      .join('\n');

  return [
    asProse(src.trailhead),
    stage(src?.markers?.framing, src?.markers?.examples),
    stage(src?.hazards?.framing, src?.hazards?.examples),
    asProse(src.newTrail),
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function parseFlattenedSummary(text) {
  const sections = String(text || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const [trailhead = '', markersRaw = '', hazardsRaw = ''] = sections;
  const newTrail = sections.slice(3).join('\n\n');
  const splitStage = (raw) => {
    const lines = String(raw || '').split('\n').map((line) => line.trim()).filter(Boolean);
    const isExample = (line) => /^EXAMPLE\s*:/i.test(line) || /^[-–—•●▪·‣*]\s+/.test(line);
    return {
      framing: lines.filter((line) => !isExample(line)).join('\n').trim(),
      examples: lines.filter(isExample).map((line) => stripListMarkers(stripExamplePrefix(line))).filter(Boolean).slice(0, 3),
    };
  };
  return { trailhead, markers: splitStage(markersRaw), hazards: splitStage(hazardsRaw), newTrail };
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
  if (fallbackText) return { id, summary: coerceGuideSummary(fallbackText) };
  return { id: DEFAULT_GUIDE_VOICE_ID, summary: emptyGuideSummary() };
}

export { GUIDE_VOICE_IDS, sentenceCount };
