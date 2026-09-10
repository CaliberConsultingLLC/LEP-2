/**
 * The third ingredient.
 *
 * The guide has always been given two things: this leader's insight map, and
 * its own voice. It was never given the data on the screen it was talking
 * about — it got the screen's NAME and the generic line already sitting there,
 * and was told to beat it.
 *
 * On a screen with no numbers that is enough. On a screen made of numbers it is
 * not: the guide wrote confidently about figures it had never seen, which is
 * how a statement scoring 33 on effort earned the line "don't add effort here."
 * It was not reasoning badly. It was guessing, in a convincing voice.
 *
 * This module builds, per screen key, exactly what that screen is showing. The
 * prompt then forbids any number that is not in here — so a guide with no data
 * for a screen has to say something true without numbers, which is the correct
 * behaviour and was never available before.
 *
 * Keep the payloads small. All of this is spent six times over, once per guide,
 * inside a single batched call.
 */

const r = (n) => Math.round(Number(n) || 0);

// Statement text is the expensive part of this payload and the guide only needs
// enough of it to know which behaviour it is looking at.
const trim = (s, max = 110) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

/**
 * One statement, as the guide should see it. `self` is null rather than 0 when
 * the leader never rated it — a missing rating and a rating of zero are
 * different facts and the guide must not conflate them.
 */
const statementPayload = (s, i) => ({
  n: i + 1,
  text: trim(s.text),
  effort: r(s.effort),
  effectiveness: r(s.efficacy),
  selfEffort: s.effortSelf == null ? null : r(s.effortSelf),
  selfEffectiveness: s.efficacySelf == null ? null : r(s.efficacySelf),
  score: r(s.compass),
  selfScore: s.compassSelf == null ? null : r(s.compassSelf),
});

const traitPayload = (row, label, role) => ({
  trait: label,
  role,
  effort: r(row?.team?.effort),
  effectiveness: r(row?.team?.efficacy),
  score: r(row?.team?.lepScore),
  selfEffort: row?.self?.effort == null ? null : r(row.self.effort),
  selfEffectiveness: row?.self?.efficacy == null ? null : r(row.self.efficacy),
  selfScore: row?.self?.lepScore == null ? null : r(row.self.lepScore),
  split: r(row?.team?.effort) - r(row?.team?.efficacy),
});

/**
 * @param {object}   args
 * @param {Array}    args.rows          benchmark rows, already ordered by role
 * @param {object}   args.roles         from deriveTraitRoles()
 * @param {Function} args.mapStatements mapRowStatements, injected to avoid a
 *                                      cycle back into the Evidence view
 * @param {boolean}  args.hasSelfData
 * @param {number}   args.respondents
 * @returns {Record<string, object>} keyed by `routeKey::stepKey`
 */
export function buildGuideScreenData({
  rows = [],
  roles = null,
  mapStatements,
  hasSelfData = false,
  respondents = 0,
}) {
  const ordered = roles?.ordered?.length ? roles.ordered : rows.filter((row) => row.team);
  if (!ordered.length || typeof mapStatements !== 'function') return {};

  const out = {};
  const roleOf = (row) =>
    row.trait === roles?.edge?.trait ? 'edge'
      : row.trait === roles?.lifting?.trait ? 'lifting'
        : 'strength';

  // Everything below is derived from this one pass, so the trait indexes here
  // and the `trait-N` / `tN-sM` keys the Evidence room asks for stay in step.
  const traits = ordered.map((row, i) => {
    const label = row.subTrait || row.trait;
    const role = roleOf(row);
    const statements = mapStatements(row).map(statementPayload);
    return { i: i + 1, row, label, role, statements, payload: traitPayload(row, label, role) };
  });

  const allTraits = traits.map((t) => t.payload);
  const allStatements = traits.flatMap((t) =>
    t.statements.map((s) => ({ ...s, trait: t.label }))
  );

  const context = { respondents, traitCount: traits.length, leaderRatedThemselves: hasSelfData };

  // ---- Sentiment ---------------------------------------------------------
  out['dashboardSignal::traits'] = { ...context, traits: allTraits };
  out['dashboardSignal::snapshot'] = { ...context, traits: allTraits };
  out['dashboardSignal::default'] = { ...context, traits: allTraits };

  if (hasSelfData) {
    const gaps = allTraits
      .filter((t) => t.selfScore != null)
      .map((t) => ({ trait: t.trait, team: t.score, self: t.selfScore, gap: t.selfScore - t.score }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    out['dashboardSignal::gap'] = { ...context, gaps };
    out['dashboardEvidence::ev-gaps'] = { ...context, gaps };
    out['dashboardNarrative::gap-statements'] = {
      ...context,
      statements: allStatements
        .filter((s) => s.selfScore != null)
        .map((s) => ({ trait: s.trait, text: s.text, team: s.score, self: s.selfScore, gap: s.selfScore - s.score }))
        .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
        .slice(0, 10),
    };
  }

  // The four reaction lines are the only place the guide is answering a person
  // rather than a screen, so each gets the number most likely to be behind it.
  const widest = [...allTraits].sort((a, b) => Math.abs(b.split) - Math.abs(a.split))[0] || null;
  const lowest = [...allStatements].sort((a, b) => a.score - b.score)[0] || null;
  out['dashboardSignal::reaction-resonates'] = { ...context, widestSplit: widest };
  out['dashboardSignal::reaction-surprises'] = { ...context, widestSplit: widest };
  out['dashboardSignal::reaction-stings'] = { ...context, lowestStatement: lowest };
  out['dashboardSignal::reaction-disagree'] = { ...context, widestSplit: widest, lowestStatement: lowest };

  // ---- Narrative debrief -------------------------------------------------
  out['dashboardNarrative::statements'] = { ...context, statements: allStatements };
  out['dashboardNarrative::map'] = { ...context, statements: allStatements };
  out['dashboardNarrative::measurements'] = {
    ...context,
    widestSplit: widest,
    narrowestSplit: [...allTraits].sort((a, b) => Math.abs(a.split) - Math.abs(b.split))[0] || null,
  };

  // ---- Evidence ----------------------------------------------------------
  out['dashboardEvidence::ev-floor'] = {
    ...context,
    statements: [...allStatements].sort((a, b) => a.score - b.score).slice(0, 3),
  };
  out['dashboardEvidence::snapshot'] = {
    ...context,
    statements: [...allStatements].sort((a, b) => a.score - b.score).slice(0, 3),
  };

  traits.forEach((t) => {
    const room = { ...context, ...t.payload, statements: t.statements };
    // Walkthrough chapter and trait room show the same five statements; they are
    // separate keys because the walkthrough is passing through and the room is
    // being read, and the guide should not say the same thing twice.
    out[`dashboardEvidence::ev-trait-${t.i}`] = room;
    out[`dashboardEvidence::trait-${t.i}`] = room;

    t.statements.forEach((s) => {
      out[`dashboardEvidence::t${t.i}-s${s.n}`] = {
        ...context,
        trait: t.label,
        role: t.role,
        traitEffort: t.payload.effort,
        traitEffectiveness: t.payload.effectiveness,
        statement: s,
        // The other four are what makes a single score mean anything.
        siblings: t.statements.filter((x) => x.n !== s.n),
      };
    });

    // ---- Practice & Field Journal ---------------------------------------
    out[`dashboardPractice::pr-${t.role}`] = { ...context, ...t.payload, statements: t.statements };
    // The journal page shows this trait's two scores and its five statements —
    // there are no written team comments in the result set, so the guide is not
    // given any and cannot invent having read some.
    out[`dashboardPractice::${t.role}-p1`] = { ...context, ...t.payload, statements: t.statements };
  });

  return out;
}

