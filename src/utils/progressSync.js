// Keeps a leader's working progress in Firebase instead of only in one browser.
//
// What it covers: debrief progress, reading notes, practice plans / action
// plans, and the journey ceremony flag. Those used to live only in
// localStorage, so a new browser, a cleared cache or a second device lost
// them, and nobody at Caliber could see them.
//
// How: the screens keep writing to localStorage exactly as before. This module
// watches those writes and mirrors them, debounced, into the leader's existing
// `responses/{uid}` document under a `progress` map. On sign-in the map is
// pulled back down before the dashboard renders. Nothing else in the app has
// to change, and `responses` already has owner-only rules.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

import {
  META_KEY, MARKER_KEY, FLUSH_MS, isSyncedKey, encodeProgressKey, planHydration,
} from './progressSyncCore';

let activeUid = null;
let pushKeysAfter = [];
let patched = false;
let timer = null;
const pending = new Map(); // key -> { v: string|null, t: ms }

const readMeta = () => {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch { return {}; }
};
const writeMeta = (meta) => {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ }
};

async function flush() {
  timer = null;
  if (!activeUid || pending.size === 0) return;
  const batch = new Map(pending);
  pending.clear();
  const progress = {};
  batch.forEach((entry, key) => { progress[encodeProgressKey(key)] = entry; });
  try {
    await setDoc(
      doc(db, 'responses', activeUid),
      { ownerUid: activeUid, progress, progressUpdatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    // Put them back so the next write retries; never block the screen.
    batch.forEach((entry, key) => { if (!pending.has(key)) pending.set(key, entry); });
    console.warn('Progress sync failed, will retry:', err?.message || err);
  }
}

function queue(key, value) {
  if (!activeUid || !isSyncedKey(key)) return;
  const t = Date.now();
  const meta = readMeta();
  meta[key] = t;
  writeMeta(meta);
  pending.set(key, { v: value, t });
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, FLUSH_MS);
}

function patchStorage() {
  if (patched || typeof Storage === 'undefined') return;
  patched = true;
  const origSet = Storage.prototype.setItem;
  const origRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function setItem(key, value) {
    origSet.call(this, key, value);
    if (this === window.localStorage && key !== META_KEY) queue(key, String(value));
  };
  Storage.prototype.removeItem = function removeItem(key) {
    origRemove.call(this, key);
    if (this === window.localStorage && key !== META_KEY) queue(key, null);
  };
  window.addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); flush(); } });
}

/**
 * Call once the leader is signed in, before the dashboard reads localStorage.
 * Remote progress is pulled down when it is newer; a browser that has never
 * synced this account starts clean, so old unsynced scraps never mix with the
 * saved copy. Resolves even on failure so the dashboard always opens.
 */
export async function hydrateProgress(uid) {
  const id = String(uid || '').trim();
  if (!id) return;
  patchStorage();
  activeUid = null;
  try {
    const snap = await getDoc(doc(db, 'responses', id));
    const remote = (snap.exists() && snap.data()?.progress) || {};
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (isSyncedKey(k)) localKeys.push(k);
    }
    const plan = planHydration({
      remote,
      meta: readMeta(),
      localKeys,
      firstSync: localStorage.getItem(MARKER_KEY) !== id,
    });
    plan.remove.forEach((k) => localStorage.removeItem(k));
    plan.set.forEach(([k, v]) => localStorage.setItem(k, v));
    writeMeta(plan.meta);
    pushKeysAfter = plan.pushKeys;
    localStorage.setItem(MARKER_KEY, id);
  } catch (err) {
    console.warn('Progress restore failed, continuing with this browser:', err?.message || err);
  }
  activeUid = id; // start mirroring only after the restore, so it is not echoed back
  pushKeysAfter.forEach((k) => queue(k, localStorage.getItem(k)));
  pushKeysAfter = [];
}

export function stopProgressSync() {
  activeUid = null;
  pending.clear();
  if (timer) clearTimeout(timer);
  timer = null;
}

export const currentSignedInUid = () => auth?.currentUser?.uid || null;
