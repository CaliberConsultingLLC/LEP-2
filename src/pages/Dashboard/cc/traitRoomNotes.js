// Notes a leader jots while reading the evidence, on their way to the plan.
//
// Scoped per campaign + user the same way `getDebriefScope` and the
// `actionPlansByCampaign` keys are, so two campaigns never see each other's
// notes and a shared browser does not leak one leader's thinking to another.
//
// Each note records which statement was open when it was saved. Action
// planning reads that back to show a leader what they were looking at when
// the thought arrived — a note with no statement attached was written from the
// trait view, which is a different kind of observation.

import { getDebriefScope } from './phaseState';

const storeKey = () => `traitRoomNotes_${getDebriefScope().replace(/^signalDebrief_/, '')}`;

const readAll = () => {
  try {
    const raw = localStorage.getItem(storeKey());
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeAll = (value) => {
  try {
    localStorage.setItem(storeKey(), JSON.stringify(value));
  } catch {
    /* storage unavailable — the session keeps its own copy in React state */
  }
};

/** Every note for one trait, oldest first. */
export function readTraitNotes(trait) {
  const key = String(trait || '').trim();
  if (!key) return [];
  const all = readAll();
  return Array.isArray(all[key]) ? all[key] : [];
}

/**
 * Appends a note and returns the trait's full list, so a caller can set state
 * from the return value rather than re-reading storage.
 */
export function appendTraitNote(trait, text, statementIdx = null) {
  const key = String(trait || '').trim();
  const body = String(text || '').trim();
  if (!key || !body) return readTraitNotes(trait);

  const all = readAll();
  const next = Array.isArray(all[key]) ? [...all[key]] : [];
  next.push({
    text: body,
    statementIdx: Number.isInteger(statementIdx) ? statementIdx : null,
    ts: new Date().toISOString(),
  });
  all[key] = next;
  writeAll(all);
  return next;
}

/** "No notes yet" / "1 note saved" / "N notes saved". */
export function notesLabel(count) {
  if (!count) return 'No notes yet';
  return count === 1 ? '1 note saved' : `${count} notes saved`;
}
