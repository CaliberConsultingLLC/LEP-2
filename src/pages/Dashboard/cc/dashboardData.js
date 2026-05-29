import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import fakeData from '../../../data/fakeData.js';
import { useFakeDashboardData } from '../../../config/runtimeFlags';
import {
  calculateCampaignTraitMetrics,
  getDashboardCampaignRows,
  normalizeDashboardScore,
  parseDashboardJson,
} from '../../../utils/dashboardData.js';

const toPercent = (value) => normalizeDashboardScore(value);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * When real self-assessment responses don't exist yet, synthesize a single
 * deterministic "self" response from the team data so the Self/Team toggle
 * remains testable in staging. Each trait gets a distinct profile so the
 * three dots actually spread across the quadrant rather than clustering.
 *
 *   trait 0: overconfident — self sees more impact, less effort
 *   trait 1: under-credited — self sees less impact, more effort
 *   trait 2: largely aligned — small drift from team read
 */
const TRAIT_SELF_PROFILES = [
  // trait 0: overconfident in a natural-strength area
  { efficacyBias: 1.55, effortBias: 0.62, effLift: 14, effortLift: -16 },
  // trait 1: imposter-leaning — sees less impact, way more strain
  { efficacyBias: 0.55, effortBias: 1.55, effLift: -22, effortLift: 18 },
  // trait 2: roughly aligned with team
  { efficacyBias: 1.06, effortBias: 1.08, effLift: 4, effortLift: 6 },
];

// When team data is fake/synthesized, spread the three traits across the quadrant
// so the visual carries real meaning during preview.
const TEAM_SPREAD_PROFILES = [
  // trait 0 — natural strength corner (low effort, high impact)
  { efficacyBias: 1.32, effortBias: 0.55, effLift: 12, effortLift: -22 },
  // trait 1 — strain zone (high effort, low impact)
  { efficacyBias: 0.52, effortBias: 1.42, effLift: -22, effortLift: 18 },
  // trait 2 — heavy lift (high effort, high impact)
  { efficacyBias: 1.05, effortBias: 1.30, effLift: 6, effortLift: 14 },
];

function spreadResponsesAcrossTraits(responses, profiles, campaignRows) {
  if (!responses?.length || !campaignRows?.length) return responses;
  return responses.map((r) => {
    const ratings = { ...(r?.ratings || {}) };
    Object.keys(ratings).forEach((key) => {
      const stmtIdx = Number(key);
      if (!Number.isFinite(stmtIdx)) return;
      const traitIdx = Math.floor(stmtIdx / 5);
      const profile = profiles[traitIdx % profiles.length];
      if (!profile) return;
      const v = ratings[key];
      if (!v || typeof v.efficacy !== 'number') return;
      const scale = v.efficacy <= 10 ? 10 : 100;
      const liftScale = scale === 10 ? 0.1 : 1;
      // Per-statement noise so dots within a trait don't pile up
      const stmtNoise = ((stmtIdx % 5) - 2) * 0.06;
      ratings[key] = {
        ...v,
        efficacy: clamp(
          v.efficacy * (profile.efficacyBias + stmtNoise) + profile.effLift * liftScale,
          0,
          scale
        ),
        effort: clamp(
          v.effort * (profile.effortBias - stmtNoise) + profile.effortLift * liftScale,
          0,
          scale
        ),
      };
    });
    return { ...r, ratings, _spreadApplied: true };
  });
}

function synthesizeSelfResponses(teamResponses, campaignRows) {
  if (!teamResponses?.length || !campaignRows?.length) return [];
  const statementCount = campaignRows.length * 5;
  const ratings = {};
  for (let stmtIdx = 0; stmtIdx < statementCount; stmtIdx++) {
    const teamValues = teamResponses
      .map((r) => r?.ratings?.[String(stmtIdx)])
      .filter((v) => v && typeof v.efficacy === 'number' && typeof v.effort === 'number');
    if (!teamValues.length) continue;
    const avgEfficacy =
      teamValues.reduce((sum, v) => sum + Number(v.efficacy || 0), 0) / teamValues.length;
    const avgEffort =
      teamValues.reduce((sum, v) => sum + Number(v.effort || 0), 0) / teamValues.length;

    const traitIdx = Math.floor(stmtIdx / 5);
    const profile = TRAIT_SELF_PROFILES[traitIdx % TRAIT_SELF_PROFILES.length];
    // Statement-level wobble so dots within a trait don't sit on top of each other
    const stmtNoiseEff = ((stmtIdx % 5) - 2) * 0.07;
    const stmtNoiseEffort = (((stmtIdx + 1) % 5) - 2) * 0.08;
    const scale = avgEfficacy <= 10 ? 10 : 100;
    const liftScale = scale === 10 ? 0.1 : 1; // shift values when in 0-10 space

    ratings[String(stmtIdx)] = {
      efficacy: clamp(
        avgEfficacy * (profile.efficacyBias + stmtNoiseEff) + profile.effLift * liftScale,
        0,
        scale
      ),
      effort: clamp(
        avgEffort * (profile.effortBias + stmtNoiseEffort) + profile.effortLift * liftScale,
        0,
        scale
      ),
    };
  }
  return [{ ratings, _synthetic: true, ownerUid: 'staging-fixture' }];
}

export function averageMetricForIndexes(responses, statementIndexes, metric) {
  if (!Array.isArray(responses) || !responses.length || !statementIndexes?.length) return null;
  const values = [];
  responses.forEach((response) => {
    statementIndexes.forEach((stmtIdx) => {
      const raw = response?.ratings?.[String(stmtIdx)]?.[metric];
      if (typeof raw === 'number') values.push(toPercent(raw));
    });
  });
  if (!values.length) return null;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function getStatementIndexesForTrait(campaignRows, traitKey) {
  const idx = campaignRows.findIndex((item) => item.trait === traitKey);
  if (idx === -1 || idx == null) return [];
  return Array.from({ length: 5 }, (_, i) => idx * 5 + i);
}

/**
 * Loads team + self responses for the active campaign and computes shared
 * trait metrics. Returns a stable shape for both the Signal and Evidence views.
 */
export function useBenchmarkData() {
  const [campaignRows, setCampaignRows] = useState(() => getDashboardCampaignRows());
  const [teamResponses, setTeamResponses] = useState(() =>
    useFakeDashboardData ? fakeData.responses : []
  );
  const [selfResponses, setSelfResponses] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextRows = getDashboardCampaignRows();
        if (active && nextRows.length) setCampaignRows(nextRows);

        const records = parseDashboardJson(localStorage.getItem('campaignRecords'), {});
        const teamCampaignId = records?.teamCampaignId;
        const selfCampaignId = records?.selfCampaignId;
        const ownerUid = auth?.currentUser?.uid || null;

        if (!teamCampaignId || !ownerUid) {
          if (active) {
            const rowsForSynth = nextRows.length ? nextRows : campaignRows;
            const fakeTeam = useFakeDashboardData ? fakeData.responses : [];
            const spreadTeam = spreadResponsesAcrossTraits(fakeTeam, TEAM_SPREAD_PROFILES, rowsForSynth);
            setTeamResponses(spreadTeam);
            setSelfResponses(synthesizeSelfResponses(spreadTeam, rowsForSynth));
            setLoaded(true);
          }
          return;
        }

        const [teamSnap, selfSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'surveyResponses'),
              where('campaignId', '==', teamCampaignId),
              where('ownerUid', '==', ownerUid)
            )
          ),
          selfCampaignId
            ? getDocs(
                query(
                  collection(db, 'surveyResponses'),
                  where('campaignId', '==', selfCampaignId),
                  where('ownerUid', '==', ownerUid)
                )
              )
            : Promise.resolve({ docs: [] }),
        ]);

        const teamDocs = teamSnap.docs.map((d) => d.data()).filter((d) => d?.ratings);
        const selfDocs = selfSnap.docs.map((d) => d.data()).filter((d) => d?.ratings);

        if (!active) return;
        const rowsForSynth = nextRows.length ? nextRows : campaignRows;
        const usingFakeTeam = !teamDocs.length && useFakeDashboardData;
        const baseTeam = teamDocs.length ? teamDocs : (useFakeDashboardData ? fakeData.responses : []);
        const finalTeam = usingFakeTeam
          ? spreadResponsesAcrossTraits(baseTeam, TEAM_SPREAD_PROFILES, rowsForSynth)
          : baseTeam;
        const finalSelf = selfDocs.length
          ? selfDocs
          : synthesizeSelfResponses(finalTeam, rowsForSynth);
        setTeamResponses(finalTeam);
        setSelfResponses(finalSelf);
        setLoaded(true);
      } catch (err) {
        console.warn('useBenchmarkData: load failed', err);
        if (active) {
          const fakeTeam = useFakeDashboardData ? fakeData.responses : [];
          const spreadTeam = spreadResponsesAcrossTraits(fakeTeam, TEAM_SPREAD_PROFILES, campaignRows);
          setTeamResponses(spreadTeam);
          setSelfResponses(synthesizeSelfResponses(spreadTeam, campaignRows));
          setLoaded(true);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const teamMetrics = useMemo(
    () => calculateCampaignTraitMetrics(campaignRows, teamResponses),
    [campaignRows, teamResponses]
  );
  const selfMetrics = useMemo(
    () => calculateCampaignTraitMetrics(campaignRows, selfResponses),
    [campaignRows, selfResponses]
  );

  // Build a shared row shape per trait that both views consume
  const rows = useMemo(
    () =>
      campaignRows.map((row) => {
        const team = teamMetrics?.traitData?.[row.trait] || null;
        const self = selfMetrics?.traitData?.[row.trait] || null;
        return {
          trait: row.trait,
          subTrait: row.subTrait || row.trait,
          traitId: row.traitId,
          subTraitId: row.subTraitId,
          team: team
            ? {
                efficacy: Number(team.efficacy || 0),
                effort: Number(team.effort || 0),
                delta: Number(team.delta || 0),
                lepScore: Number(team.lepScore || 0),
                statements: team.statements || [],
              }
            : null,
          self: self
            ? {
                efficacy: Number(self.efficacy || 0),
                effort: Number(self.effort || 0),
                delta: Number(self.delta || 0),
                lepScore: Number(self.lepScore || 0),
                statements: self.statements || [],
              }
            : null,
        };
      }),
    [campaignRows, teamMetrics, selfMetrics]
  );

  const hasRealSelf = selfResponses.some((r) => !r?._synthetic);
  const hasSelfData = selfResponses.length > 0;
  const hasTeamData = teamResponses.length > 0;
  const selfDataSource = hasRealSelf ? 'real' : hasSelfData ? 'simulated' : 'none';

  return {
    loaded,
    campaignRows,
    rows,
    hasSelfData,
    hasTeamData,
    selfDataSource,
    teamResponses,
    selfResponses,
    teamMetrics: teamMetrics?.traitData || {},
    selfMetrics: selfMetrics?.traitData || {},
    criticalGaps: teamMetrics?.criticalGaps || [],
  };
}

export { synthesizeSelfResponses };
