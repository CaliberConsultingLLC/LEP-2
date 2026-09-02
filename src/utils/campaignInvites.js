// How many people the leader actually sent the survey to.
//
// Compass never emails the team — the leader copies a link and a password and
// sends them himself. That is what keeps the answers anonymous, and it also
// means the system cannot possibly know how many went out. Until now the
// dashboard guessed from team size and fell back to 8, so "6 of 8 responded"
// was two-thirds invention.
//
// So we ask. The leader declares the number when they take the link, and every
// count after that is measured against what they said rather than what we
// assumed.

import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const KEY = 'campaignInviteTarget';

// A floor of 2 because one respondent is not anonymous — with a single answer
// the leader knows exactly whose it is. The ceiling is a sanity bound, not a
// licence limit: past this the survey is an org-wide instrument and wants a
// different conversation.
export const INVITE_MIN = 2;
export const INVITE_MAX = 50;

/**
 * Suggests a starting number from the team size given at intake.
 *
 * Team size is a free-text field and arrives as "12", "10-25", or "50+".
 * Reading the first number handles all three; stripping non-digits would turn
 * "10-25" into 1025.
 */
export function suggestedInviteCount(teamSize) {
  const match = String(teamSize ?? '').match(/\d+/);
  const n = match ? Number(match[0]) : NaN;
  if (!Number.isFinite(n) || n <= 0) return 8;
  return Math.min(INVITE_MAX, Math.max(INVITE_MIN, Math.round(n)));
}

export function clampInviteCount(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return INVITE_MIN;
  return Math.min(INVITE_MAX, Math.max(INVITE_MIN, n));
}

/**
 * The declared number, or null when the leader has not said yet. Null is
 * meaningful: callers should show "responses so far" rather than a fraction
 * with a made-up denominator.
 */
export function readInviteTarget() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    const n = Number(raw?.declared);
    if (!Number.isFinite(n) || n <= 0) return null;
    return { declared: clampInviteCount(n), declaredAt: String(raw?.declaredAt || '') };
  } catch {
    return null;
  }
}

export async function setInviteTarget(count) {
  const declared = clampInviteCount(count);
  const record = { declared, declaredAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch { /* storage unavailable — the session still has it in state */ }

  const uid = String(auth?.currentUser?.uid || '').trim();
  if (uid) {
    try {
      await setDoc(doc(db, 'responses', uid), { inviteTarget: record }, { merge: true });
    } catch {
      // A failed sync must not block the leader from sending the link. The
      // local record is what the dashboard reads.
    }
  }
  return record;
}

/**
 * What to say about the window, given what came back.
 *
 * `state` is what the UI acts on:
 *   'waiting'  — nothing to say yet
 *   'nudge'    — enough in that closing is reasonable, the leader decides
 *   'complete' — everyone answered; this is what triggers the auto-lock
 */
export function inviteProgress(respondents, target) {
  const got = Math.max(0, Math.round(Number(respondents) || 0));
  const declared = Number(target?.declared);
  if (!Number.isFinite(declared) || declared <= 0) {
    return { state: 'waiting', got, declared: null, pct: null, message: '' };
  }

  const pct = Math.min(100, Math.round((got / declared) * 100));

  if (got >= declared) {
    return {
      state: 'complete',
      got,
      declared,
      pct: 100,
      message: `All ${declared} answered. The window closed on its own.`,
    };
  }
  // Below 70% there is nothing useful to say — the leader is still waiting and
  // a nudge would only add noise.
  if (pct >= 70) {
    return {
      state: 'nudge',
      got,
      declared,
      pct,
      message: `${got} of ${declared} in. Enough to read — close it when you are ready.`,
    };
  }
  return {
    state: 'waiting',
    got,
    declared,
    pct,
    message: `${got} of ${declared} in.`,
  };
}
