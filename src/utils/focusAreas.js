// One writer for the five focus areas, and one rule about who wins.
//
// The five areas are the spine of everything after the reading: the traits you
// pick, the campaign built from them, the rooms on the dashboard. They were
// being written from three places with no notion of which source was better,
// so the weakest one — a client-side heuristic that ran on every mount of the
// summary — could silently overwrite the real, AI-derived set. It did, and a
// leader came back to their reflection to find five traits that were not
// theirs.
//
// Provenance is the fix. Every write declares where it came from, and a write
// that would replace a stronger source with a weaker one is refused. Resetting
// is explicit and separate: clearFocusAreas() is the only way to go backwards.

const KEY = 'focusAreas';
const SOURCE_KEY = 'focusAreasSource';

// Higher wins. Anything already on disk without a recorded source is treated
// as LEGACY: replaceable, because that is exactly the state a poisoned browser
// is in, but never preferred over a real one.
const RANK = {
  legacy: 1,
  heuristic: 1,
  seed: 2,
  ai: 3,
};

export const FOCUS_AREA_SOURCES = Object.keys(RANK);

/** A usable set is five areas. Every consumer already assumes it. */
export function isCompleteFocusAreaSet(value) {
  return Array.isArray(value) && value.length === 5 && value.every((a) => a && a.id);
}

export function readFocusAreas() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return isCompleteFocusAreaSet(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readFocusAreaSource() {
  try {
    const stored = localStorage.getItem(SOURCE_KEY);
    if (stored && RANK[stored]) return stored;
    return readFocusAreas() ? 'legacy' : null;
  } catch {
    return null;
  }
}

/**
 * Write the five areas, or refuse.
 *
 * Refuses an incomplete set, and refuses to downgrade a set that came from a
 * stronger source. Returns true only when the store actually changed, so a
 * caller can tell the difference between "saved" and "kept what was there".
 */
export function persistFocusAreas(areas, source) {
  if (!RANK[source]) throw new Error(`persistFocusAreas: unknown source "${source}"`);
  if (!isCompleteFocusAreaSet(areas)) return false;

  const existingSource = readFocusAreaSource();
  if (existingSource && RANK[existingSource] > RANK[source]) {
    // Say it out loud. The whole failure this guard exists for was silent.
    console.warn(
      `[focusAreas] refused a "${source}" write over an existing "${existingSource}" set.`
    );
    return false;
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(areas));
    localStorage.setItem(SOURCE_KEY, source);
    return true;
  } catch {
    return false;
  }
}

/** The one way backwards. Used when the reading itself is being discarded. */
export function clearFocusAreas() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SOURCE_KEY);
  } catch {
    // Non-fatal.
  }
}
