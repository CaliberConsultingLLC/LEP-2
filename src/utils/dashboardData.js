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

    const statements = (traitRow?.statements || []).map((statement, idx) => {
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
      };
    });

    calculatedData[traitRow.trait] = {
      efficacy: avgEfficacy,
      effort: avgEffort,
      delta,
      lepScore,
      statements,
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
