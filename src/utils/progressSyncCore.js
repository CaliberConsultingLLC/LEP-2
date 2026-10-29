// Pure helpers for progress sync. No Firebase or browser imports, so they can be tested in Node.

const PREFIXES = ['signalDebrief_', 'traitRoomNotes_', 'practiceStudio_'];
const EXACT = ['actionPlansByCampaign', 'journeyCeremonySeen'];
export const META_KEY = 'progressSyncMeta'; // { [key]: last local write ms }
export const MARKER_KEY = 'progressSyncUid'; // which account this browser has synced
export const FLUSH_MS = 1500;

export const isSyncedKey = (key) =>
  typeof key === 'string' && (EXACT.includes(key) || PREFIXES.some((p) => key.startsWith(p)));

// Field names in the stored map: no dots or slashes.
export const encodeProgressKey = (key) => encodeURIComponent(key).replace(/\./g, '%2E');
export const decodeProgressKey = (enc) => decodeURIComponent(enc);


/**
 * Decides what to do with local storage when a leader signs in. Pure, so it
 * can be tested without a browser.
 *  - First time this browser syncs the account: unsynced local progress is
 *    dropped (clean start) before the saved copy is applied.
 *  - Saved entries newer than the local write replace the local value.
 *  - Local writes newer than the saved entry (made offline) are pushed up.
 */
export function planHydration({ remote = {}, meta = {}, localKeys = [], firstSync = false }) {
  const nextMeta = { ...meta };
  const remove = [];
  const set = [];
  const pushKeys = [];
  const remoteByKey = {};
  Object.entries(remote).forEach(([enc, entry]) => {
    let key;
    try { key = decodeProgressKey(enc); } catch { return; }
    if (isSyncedKey(key) && entry && typeof entry === 'object') remoteByKey[key] = entry;
  });

  if (firstSync) {
    localKeys.forEach((k) => remove.push(k));
    Object.keys(nextMeta).forEach((k) => delete nextMeta[k]);
  }
  Object.entries(remoteByKey).forEach(([key, entry]) => {
    const remoteT = Number(entry.t || 0);
    if (remoteT > Number(nextMeta[key] || 0)) {
      if (entry.v == null) { if (!remove.includes(key)) remove.push(key); }
      else {
        const i = remove.indexOf(key);
        if (i >= 0) remove.splice(i, 1);
        set.push([key, entry.v]);
      }
      nextMeta[key] = remoteT;
    }
  });
  if (!firstSync) {
    localKeys.forEach((k) => {
      const localT = Number(nextMeta[k] || 0);
      const remoteT = Number(remoteByKey[k]?.t || 0);
      if (localT > remoteT) pushKeys.push(k);
    });
  }
  return { remove, set, meta: nextMeta, pushKeys };
}

