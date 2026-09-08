import traitSystem from '../data/traitSystem.js';
import { normalizeCampaignItems } from './campaignState.js';

const { CORE_TRAITS } = traitSystem;

export function parseDashboardJson(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeDashboardScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric <= 10 ? numeric * 10 : numeric;
}

function trimText(value) {
  return String(value || '').trim();
}

function resolveTraitByName(traitName) {
  const lowered = trimText(traitName).toLowerCase();
  if (!lowered) return null;
  return CORE_TRAITS.find((trait) => trimText(trait?.name).toLowerCase() === lowered) || null;
}

export function getDashboardCampaignRows() {
  if (typeof window === 'undefined') return [];

  const rawCampaign = parseDashboardJson(window.localStorage.getItem('currentCampaign'), []);
  const selectedTraits = parseDashboardJson(window.localStorage.getItem('selectedTraits'), []);
  const campaignRows = normalizeCampaignItems(rawCampaign);

  return campaignRows.map((item, index) => {
    const selectedId = trimText(selectedTraits?.[index]);
    const [selectedTraitId, selectedSubTraitId] = selectedId.split('-');
    const matchedTrait =
      CORE_TRAITS.find((trait) => trimText(trait?.id) === selectedTraitId)
      || resolveTraitByName(item?.traitName || item?.trait || item?.title);
    const matchedSubTrait =
      matchedTrait?.subTraits?.find((subTrait) => trimText(subTrait?.id) === selectedSubTraitId)
      || matchedTrait?.subTraits?.find((subTrait) => trimText(subTrait?.name).toLowerCase() === trimText(item?.subTrait).toLowerCase())
      || null;

    const traitName = trimText(matchedTrait?.name || item?.traitName || item?.trait || item?.title);
    const subTraitName = trimText(matchedSubTrait?.name || item?.subTrait || item?.title);

    return {
      ...item,
      trait: traitName,
      traitId: trimText(matchedTrait?.id || item?.traitId),
      traitName,
      subTrait: subTraitName,
      subTraitId: trimText(matchedSubTrait?.id || item?.subTraitId),
      title: trimText(item?.title || subTraitName || traitName),
    };
  });
}

/**
 * The shape of one statement's ratings, not just their middle.
 *
 * A mean is the one fact about a set of answers that nobody in the set
 * actually said. Twelve people who all put a behaviour at 60 and a room split
 * between 90 and 30 average to the same number and are not remotely the same
 * situation to lead through — the first is a habit, the second is a policy some
 * people get and others do not.
 *
 * Everything here is an aggregate over the whole set. No individual rating is
 * ever carried out of this function, and none is attributable: `agree` and
 * `dissent` are counts, `spread` is a distance, and the smallest set that can
 * report a split at all is four answers.
 *
 * @param {number[]} values normalized 0-100 ratings, one per respondent
 * @returns {{n:number, mean:number, sd:number, min:number, max:number,
 *            agree:number, dissent:number, split:boolean, consensus:string}}
 */
export function ratingShape(values) {
  const xs = (Array.isArray(values) ? values : []).filter((v) => Number.isFinite(v));
  const n = xs.length;
  if (!n) {
    return { n: 0, mean: 0, sd: 0, min: 0, max: 0, agree: 0, dissent: 0, split: false, consensus: 'unknown' };
  }

  const mean = xs.reduce((sum, v) => sum + v, 0) / n;
  const variance = xs.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);

  // "Agrees with the headline" means within 15 points of it — close enough
  // that the average is describing this person's experience too.
  const agree = xs.filter((v) => Math.abs(v - mean) <= 15).length;

  // A split needs a real minority, not one outlier: at least a fifth of the
  // room, at least two people, and at least 20 points away from the middle.
  const far = xs.filter((v) => Math.abs(v - mean) > 20).length;
  const split = n >= 4 && far >= 2 && far >= n / 5;

  const consensus = n < 3 ? 'thin' : sd <= 10 ? 'unanimous' : sd <= 18 ? 'settled' : split ? 'split' : 'scattered';

  return {
    n,
    mean: Math.round(mean),
    sd: Math.round(sd),
    min: Math.round(Math.min(...xs)),
    max: Math.round(Math.max(...xs)),
    agree,
    dissent: n - agree,
    split,
    consensus,
  };
}

export function calculateCampaignTraitMetrics(campaignRows, responses) {
  const safeCampaignRows = Array.isArray(campaignRows) ? campaignRows : [];
  const safeResponses = Array.isArray(responses) ? responses : [];
  const calculatedData = {};
  const gaps = [];

  safeCampaignRows.forEach((traitRow, traitIndex) => {
    const traitRatings = { efficacy: [], effort: [] };

    safeResponses.forEach((response) => {
      for (let i = 0; i < 5; i += 1) {
        const statementIndex = traitIndex * 5 + i;
        const rating = response?.ratings?.[statementIndex] || response?.ratings?.[String(statementIndex)];
        if (rating) {
          traitRatings.efficacy.push(normalizeDashboardScore(rating?.efficacy));
          traitRatings.effort.push(normalizeDashboardScore(rating?.effort));
        }
      }
    });

    const avgEfficacy = traitRatings.efficacy.length
      ? traitRatings.efficacy.reduce((sum, val) => sum + val, 0) / traitRatings.efficacy.length
      : 0;
    const avgEffort = traitRatings.effort.length
      ? traitRatings.effort.reduce((sum, val) => sum + val, 0) / traitRatings.effort.length
      : 0;
    const delta = Math.abs(avgEffort - avgEfficacy);
    const lepScore = (avgEfficacy * 2 + avgEffort) / 3;

    const statements = Array.from({ length: 5 }, (_, idx) => {
      const statement = traitRow?.statements?.[idx] || '';
      const statementIndex = traitIndex * 5 + idx;
      const stmtEfficacy = safeResponses
        .map((response) => normalizeDashboardScore(
          response?.ratings?.[statementIndex]?.efficacy ?? response?.ratings?.[String(statementIndex)]?.efficacy
        ))
        .filter((value) => Number.isFinite(value));
      const stmtEffort = safeResponses
        .map((response) => normalizeDashboardScore(
          response?.ratings?.[statementIndex]?.effort ?? response?.ratings?.[String(statementIndex)]?.effort
        ))
        .filter((value) => Number.isFinite(value));
      const avgStmtEfficacy = stmtEfficacy.length
        ? stmtEfficacy.reduce((sum, val) => sum + val, 0) / stmtEfficacy.length
        : 0;
      const avgStmtEffort = stmtEffort.length
        ? stmtEffort.reduce((sum, val) => sum + val, 0) / stmtEffort.length
        : 0;
      const stmtDelta = Math.abs(avgStmtEffort - avgStmtEfficacy);

      return {
        text: statement,
        efficacy: avgStmtEfficacy,
        effort: avgStmtEffort,
        delta: stmtDelta,
        lepScore: (avgStmtEfficacy * 2 + avgStmtEffort) / 3,
        // How much the room agreed, on each axis. Aggregates only — see
        // ratingShape. Sentiment reads these; everything else ignores them.
        shape: {
          efficacy: ratingShape(stmtEfficacy),
          effort: ratingShape(stmtEffort),
        },
      };
    });

    calculatedData[traitRow.trait] = {
      efficacy: avgEfficacy,
      effort: avgEffort,
      delta,
      lepScore,
      statements,
      shape: {
        efficacy: ratingShape(traitRatings.efficacy),
        effort: ratingShape(traitRatings.effort),
      },
    };

    if (delta > 30 || (avgEffort > 70 && avgEfficacy < 50)) {
      gaps.push({
        trait: traitRow.trait,
        effort: avgEffort,
        efficacy: avgEfficacy,
        delta,
        insight: avgEffort > avgEfficacy
          ? 'High effort but low impact-consider refining approach'
          : 'High impact but low effort-opportunity to scale this strength',
      });
    }
  });

  return {
    traitData: calculatedData,
    criticalGaps: gaps.sort((a, b) => b.delta - a.delta),
  };
}
