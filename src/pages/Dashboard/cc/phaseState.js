import { useCallback, useMemo, useState } from 'react';

// ----------------------------------------------------------------------------
// Post-assessment journey state — Signal → Evidence → Practice.
//
// Translates the design prototype's `sigdeb_*` localStorage keys into the
// app's real persistence pattern: keys scoped per campaign + user, mirroring
// how `practiceStudio_*` keys work today.
//
//   <scope>_done     → { signal, evidence, practice }  phase completion flags
//   <scope>_pages    → { signal, evidence, practice }  per-phase chapter index
//   <scope>_reaction → check-in reaction id ('resonates'|'surprises'|'stings'|'disagree')
//
// Replays are session-only (React state, never persisted) — a reload returns
// the user to the snapshot.
// ----------------------------------------------------------------------------

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — state stays in memory for the session */
  }
};

export const PHASE_ORDER = ['signal', 'evidence', 'practice'];

const EMPTY_DONE = { signal: false, evidence: false, practice: false };
const EMPTY_PAGES = { signal: 0, evidence: 0, practice: 0 };

// Same campaign/user scoping used by PracticeStudio's plan keys.
export function getDebriefScope() {
  const userInfo = readJson('userInfo', {});
  const campaignRecords = readJson('campaignRecords', {});
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';
  return `signalDebrief_${campaignKey}_${userKey}`;
}

export function useDebriefPhases() {
  const scope = useMemo(() => getDebriefScope(), []);
  const doneKey = `${scope}_done`;
  const pagesKey = `${scope}_pages`;
  const reactionKey = `${scope}_reaction`;

  const [done, setDoneState] = useState(() => ({ ...EMPTY_DONE, ...readJson(doneKey, {}) }));
  const [pages, setPagesState] = useState(() => ({ ...EMPTY_PAGES, ...readJson(pagesKey, {}) }));
  const [reaction, setReactionState] = useState(() => readJson(reactionKey, null));
  // Session-only: replaying a completed phase never clears its completion.
  const [replaying, setReplaying] = useState({ ...EMPTY_DONE });

  const setPhasePage = useCallback(
    (phase, index) => {
      setPagesState((prev) => {
        const next = { ...prev, [phase]: index };
        writeJson(pagesKey, next);
        return next;
      });
    },
    [pagesKey]
  );

  const setReaction = useCallback(
    (id) => {
      setReactionState(id);
      writeJson(reactionKey, id);
    },
    [reactionKey]
  );

  // Mark a phase complete and land the user on the next phase's first chapter.
  const completePhase = useCallback(
    (phase) => {
      setDoneState((prev) => {
        const next = { ...prev, [phase]: true };
        writeJson(doneKey, next);
        return next;
      });
      setReplaying((prev) => ({ ...prev, [phase]: false }));
      const nextPhase = PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1];
      if (nextPhase) setPhasePage(nextPhase, 0);
      return nextPhase || null;
    },
    [doneKey, setPhasePage]
  );

  const startReplay = useCallback(
    (phase) => {
      setPhasePage(phase, 0);
      setReplaying((prev) => ({ ...prev, [phase]: true }));
    },
    [setPhasePage]
  );

  const isGated = useCallback(
    (phase) =>
      (phase === 'evidence' && !done.signal) || (phase === 'practice' && !done.evidence),
    [done.signal, done.evidence]
  );

  // 'snapshot' for completed phases at rest; 'walkthrough' on first visit or replay.
  const modeFor = useCallback(
    (phase) => (done[phase] && !replaying[phase] ? 'snapshot' : 'walkthrough'),
    [done, replaying]
  );

  // Drives the dock's ✓ / lock indicators.
  const dockStatus = useMemo(
    () => ({
      signal: done.signal ? 'done' : undefined,
      evidence: done.evidence ? 'done' : !done.signal ? 'locked' : undefined,
      practice: done.practice ? 'done' : !done.evidence ? 'locked' : undefined,
    }),
    [done]
  );

  return {
    scope,
    done,
    pages,
    reaction,
    replaying,
    setPhasePage,
    setReaction,
    completePhase,
    startReplay,
    isGated,
    modeFor,
    dockStatus,
  };
}
