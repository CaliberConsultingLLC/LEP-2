// Store for personalized guide lines.
//
// After intake, /api/get-guide-lines writes one line per post-intake screen per
// guide, drawn from that leader's insight map. This module holds them and lets
// getGuideLine() prefer them over the canned copy in guideCopy.generated.js.
//
// Only the TEXT is overridden. Pose stays with the canned entry — that is art
// direction for the owl, not content, and the model has no business choosing it.
//
// Every lookup can miss. A miss falls through to the canned line, so a failed
// generation, a partial response, or a leader who has not finished intake all
// degrade to exactly today's behavior rather than an empty panel.

const STORAGE_KEY = 'compassGuideLines';

let store = null;

function readStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function ensureLoaded() {
  if (store === null) store = readStorage() || {};
  return store;
}

/**
 * @param {Record<string, Record<string, string>>} linesByGuide
 *   { mentor: { 'summary::default': 'text', ... }, ... }
 * @param {object} [meta] provenance, so a stale set can be recognized later
 */
export function setGeneratedGuideLines(linesByGuide, meta = {}) {
  if (!linesByGuide || typeof linesByGuide !== 'object') return;
  const merged = { ...ensureLoaded() };
  Object.entries(linesByGuide).forEach(([guideId, lines]) => {
    if (!lines || typeof lines !== 'object') return;
    // Merge rather than replace: the dashboard subset is regenerated separately
    // once campaign results exist, and must not wipe the rest.
    merged[guideId] = { ...(merged[guideId] || {}), ...lines };
  });
  merged.__meta = { ...(ensureLoaded().__meta || {}), ...meta, updatedAt: new Date().toISOString() };
  store = merged;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Storage full or unavailable — the in-memory copy still serves this session.
    }
  }
}

export function clearGeneratedGuideLines() {
  store = {};
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Returns the generated text for one guide + full step key, or '' if there is none. */
export function getGeneratedGuideLine(personaId, fullStepKey) {
  const lines = ensureLoaded()[personaId];
  if (!lines) return '';
  return String(lines[fullStepKey] || '').trim();
}

export function hasGeneratedGuideLines(personaId = null) {
  const loaded = ensureLoaded();
  if (personaId) return Object.keys(loaded[personaId] || {}).length > 0;
  return Object.keys(loaded).some((k) => k !== '__meta' && Object.keys(loaded[k] || {}).length > 0);
}

export function generatedGuideLinesMeta() {
  return ensureLoaded().__meta || null;
}
