// Decides whether a team response is thoughtful enough to count.
//
// A response that fails is never stored, so nothing downstream (counts, scores,
// the leader's dashboard) has to know validation exists. The leader is never
// told that anyone failed; only the respondent sees it, and can retake or opt out.

// Under this, 15 two-part answers cannot have been read, let alone weighed.
export const MIN_COMPLETION_MS = 90_000;

function rowsOf(ratings) {
  return Object.values(ratings || {})
    .map((row) => ({ effort: Number(row?.effort), efficacy: Number(row?.efficacy) }));
}

/**
 * @param {object} ratings     { "0": { effort, efficacy }, ... }
 * @param {number} durationMs  time from first question shown to submit
 * @returns {{ ok: boolean, reasons: string[], malformed?: boolean }}
 */
export function validateTeamRatings(ratings, durationMs) {
  const rows = rowsOf(ratings);
  const wellFormed = rows.length > 0 && rows.every(
    (r) => Number.isFinite(r.effort) && Number.isFinite(r.efficacy)
      && r.effort >= 0 && r.effort <= 10 && r.efficacy >= 0 && r.efficacy <= 10
  );
  if (!wellFormed) return { ok: false, malformed: true, reasons: ['malformed'] };

  const reasons = [];

  // One number all the way down: every 1, every 5, every 10.
  const first = rows[0].effort;
  if (rows.every((r) => r.effort === first && r.efficacy === first)) {
    reasons.push('uniform');
  }

  // Effort and effectiveness identical on every statement. The two scales exist
  // to be told apart, so a respondent who never separates them is not answering.
  if (rows.every((r) => r.effort === r.efficacy)) {
    reasons.push('no-split');
  }

  const ms = Number(durationMs);
  if (!Number.isFinite(ms) || ms < MIN_COMPLETION_MS) {
    reasons.push('too-fast');
  }

  return { ok: reasons.length === 0, reasons };
}
