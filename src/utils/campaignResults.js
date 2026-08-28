// Adapter between the dashboard's internal row shape and the contract
// /api/get-results-analysis expects.
//
// The endpoint needs stable ids it can attach findings to, because a finding is
// only useful if the UI can look up which statement or trait it belongs to. Ids
// are derived from the campaign structure rather than the trait name, so a
// renamed trait does not orphan every finding written about it.

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

export function traitKeyFor(row, index) {
  const id = String(row?.traitId || '').trim();
  const sub = String(row?.subTraitId || '').trim();
  if (id && sub) return `${id}-${sub}`;
  if (id) return id;
  return `trait-${index + 1}`;
}

export function statementIdFor(row, traitIndex, statementIndex) {
  return `${traitKeyFor(row, traitIndex)}::s${statementIndex + 1}`;
}

const metrics = (m) =>
  m
    ? {
        efficacy: round1(m.efficacy),
        effort: round1(m.effort),
        delta: round1(m.delta),
        lepScore: round1(m.lepScore),
      }
    : null;

/**
 * @param {Array} rows        from useBenchmarkData()
 * @param {number} responseCount how many teammates actually responded
 * @param {boolean} hasSelfData whether self ratings are real enough to compare
 */
export function buildCampaignResults(rows, responseCount = 0, hasSelfData = false) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const traits = safeRows
    .filter((row) => row?.team)
    .map((row, index) => {
      const teamStatements = row.team?.statements || [];
      const selfStatements = row.self?.statements || [];
      return {
        key: traitKeyFor(row, index),
        name: String(row.subTrait || row.trait || '').trim(),
        parentTrait: String(row.trait || '').trim(),
        team: metrics(row.team),
        self: hasSelfData ? metrics(row.self) : null,
        statements: teamStatements.map((stmt, sIdx) => ({
          id: statementIdFor(row, index, sIdx),
          text: String(stmt?.text || '').trim(),
          team: metrics(stmt),
          self: hasSelfData && selfStatements[sIdx] ? metrics(selfStatements[sIdx]) : null,
        })),
      };
    });

  const lepScores = traits.map((t) => t.team?.lepScore ?? 0);
  const deltas = traits.map((t) => t.team?.delta ?? 0);

  return {
    responseCount: Number(responseCount || 0),
    hasSelfData: Boolean(hasSelfData),
    overall: {
      avgLEP: lepScores.length ? round1(lepScores.reduce((a, b) => a + b, 0) / lepScores.length) : 0,
      avgDelta: deltas.length ? round1(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0,
      highGapCount: deltas.filter((d) => d > 10).length,
    },
    traits,
  };
}

/**
 * Identity of one result set. The analysis is expensive and must not be
 * regenerated on every dashboard visit — but it MUST be regenerated when late
 * responses change the numbers, so the signature covers the scores themselves,
 * not just the campaign id.
 */
export function campaignResultsSignature(campaignResults) {
  if (!campaignResults?.traits?.length) return '';
  const parts = campaignResults.traits.map(
    (t) => `${t.key}:${t.team?.efficacy}:${t.team?.effort}`
  );
  return `v1|${campaignResults.responseCount}|${campaignResults.hasSelfData ? 'self' : 'team'}|${parts.join('|')}`;
}

export function hasUsableResults(campaignResults) {
  return Boolean(
    campaignResults?.traits?.length
    && campaignResults.traits.some((t) => (t.team?.efficacy || 0) > 0 || (t.team?.effort || 0) > 0)
  );
}
