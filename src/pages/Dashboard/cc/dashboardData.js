import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import fakeData from '../../../data/fakeData.js';
import { useFakeDashboardData } from '../../../config/runtimeFlags';
import { isDemoSession } from '../../../utils/demoMode';
import { TEAM_WINDOW_CHANGED_EVENT } from '../../../utils/lockTeamCampaign';
import {
  calculateCampaignTraitMetrics,
  getDashboardCampaignRows,
  normalizeDashboardScore,
  parseDashboardJson,
} from '../../../utils/dashboardData.js';

const toPercent = (value) => normalizeDashboardScore(value);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Where each trait's team read sits on the dial, and how far the leader's own
 * read drifts from it.
 *
 * This was two sets of multiply-and-shift profiles — `effortBias: 1.42,
 * effortLift: 18` and so on — applied to the team's raw ratings and then AGAIN,
 * at full strength, when the self read was synthesized from the result. Two
 * things were wrong with that, and neither showed up in the numbers as anything
 * but plausible-looking scores.
 *
 * A multiplier big enough to move a statement across the quadrant is big enough
 * to send half the set out of range, and the clamp piled those on 0 and 100.
 * And the self profile, written as though it applied to raw ratings, landed on
 * already-biased ones: Clarity took a 22-point push down on effort to seat the
 * team in the low-effort corner, then a further 16 for the self read, so every
 * one of its five statements came out with a self effort of exactly zero. The
 * compass weights effectiveness double and effort once, which pinned the
 * leader's own score under 67 whatever they had "answered", against a team
 * score of 80 — a 13-point gap manufactured entirely by the fixture.
 *
 * So the trait is PLACED rather than scaled. `effort` and `efficacy` say where
 * its centre goes, in points. `KEEP` is how much of each statement's own
 * variation survives the move, small enough that the widest raw answer still
 * lands well inside the dial, large enough that the five statements of a trait
 * remain five different statements. And the self read is a drift from the
 * team's, in points — which is the thing being demonstrated, and is now the
 * thing that is written down.
 */
const TRAIT_SCENES = [
  // natural strength: lands without much push, and the leader over-reads it
  { effort: 36, efficacy: 68, selfEffort: -7, selfEfficacy: 11 },
  // strain: real work, thin return, and the leader under-reads what arrives
  { effort: 70, efficacy: 44, selfEffort: 8, selfEfficacy: -14 },
  // heavy lift: costly, and it works — the two readings nearly agree
  { effort: 66, efficacy: 62, selfEffort: -4, selfEfficacy: 5 },
];
const KEEP = 0.42;

// The fixture stops short of each end of the scale. A 0 is what an unrated
// axis averages to and a 100 is a claim nobody makes five times running, so
// either one reads as a data fault rather than as an answer.
const rate = (n, scale) => clamp(n, scale * 0.06, scale * 0.94);

// A raw rating moved to sit around `centre`, keeping `KEEP` of its own
// distance from the middle. Centres are in points; the data may be on a 0-10
// scale, so both halves are converted before they meet.
function place(raw, centre, scale) {
  const k = scale / 100;
  return rate(centre * k + (Number(raw) - 50 * k) * KEEP, scale);
}

// When team data is fake, seat the three traits in three different parts of
// the quadrant so the picture carries meaning during preview.
function spreadResponsesAcrossTraits(responses, campaignRows) {
  if (!responses?.length || !campaignRows?.length) return responses;
  return responses.map((r) => {
    const ratings = { ...(r?.ratings || {}) };
    Object.keys(ratings).forEach((key) => {
      const stmtIdx = Number(key);
      if (!Number.isFinite(stmtIdx)) return;
      const scene = TRAIT_SCENES[Math.floor(stmtIdx / 5) % TRAIT_SCENES.length];
      if (!scene) return;
      const v = ratings[key];
      if (!v || typeof v.efficacy !== 'number') return;
      const scale = v.efficacy <= 10 ? 10 : 100;
      // Per-statement tilt, in points, so the five dots of a trait sit apart
      // rather than on one spot: the trait leans one way on effort and the
      // other on effect as you go down its list.
      const tilt = ((stmtIdx % 5) - 2) * 4;
      ratings[key] = {
        ...v,
        efficacy: place(v.efficacy, scene.efficacy + tilt, scale),
        effort: place(v.effort, scene.effort - tilt, scale),
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

    const scene = TRAIT_SCENES[Math.floor(stmtIdx / 5) % TRAIT_SCENES.length];
    const scale = avgEfficacy <= 10 ? 10 : 100;
    const k = scale / 100;
    // Statement-level wobble, in points, so the leader's five marks do not all
    // sit the same distance from their team's.
    const wobbleEff = ((stmtIdx % 5) - 2) * 3;
    const wobbleEffort = (((stmtIdx + 1) % 5) - 2) * 3;

    // The self read is the team's, moved by the drift this trait is meant to
    // demonstrate. Nothing is multiplied, so nothing can overshoot the scale.
    ratings[String(stmtIdx)] = {
      efficacy: rate(avgEfficacy + (scene.selfEfficacy + wobbleEff) * k, scale),
      effort: rate(avgEffort + (scene.selfEffort + wobbleEffort) * k, scale),
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
  const [liveResponseCount, setLiveResponseCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [windowTick, setWindowTick] = useState(0);

  useEffect(() => {
    const onChanged = () => setWindowTick((n) => n + 1);
    window.addEventListener(TEAM_WINDOW_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(TEAM_WINDOW_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    let active = true;
    let unsub = null;

    const load = async () => {
      try {
        const nextRows = getDashboardCampaignRows();
        if (active && nextRows.length) setCampaignRows(nextRows);

        const records = parseDashboardJson(localStorage.getItem('campaignRecords'), {});
        const teamCampaignId = records?.teamCampaignId;
        const selfCampaignId = records?.selfCampaignId;
        const ownerUid = auth?.currentUser?.uid || null;
        const campaignClosed = String(records?.teamCampaignClosed || '').toLowerCase() === 'true';

        const applyClosedPreview = () => {
          const rowsForSynth = nextRows.length ? nextRows : campaignRows;
          const fakeTeam = (useFakeDashboardData || isDemoSession()) ? fakeData.responses : [];
          const spreadTeam = spreadResponsesAcrossTraits(fakeTeam, rowsForSynth);
          setTeamResponses(spreadTeam);
          setSelfResponses(synthesizeSelfResponses(spreadTeam, rowsForSynth));
          setLiveResponseCount(spreadTeam.length);
          setLoaded(true);
        };

        // Demo sessions need team-shaped rows for Signal/Evidence/Practice even
        // before the campaign window is locked — there is no real team to wait on.
        if (!campaignClosed && isDemoSession()) {
          if (active) {
            if ((nextRows.length ? nextRows : campaignRows).length) applyClosedPreview();
            else {
              setTeamResponses([]);
              setSelfResponses([]);
              setLiveResponseCount(0);
              setLoaded(true);
            }
          }
          return;
        }

        if (!campaignClosed) {
          if (active) {
            setTeamResponses([]);
            setSelfResponses([]);
          }
          if (!teamCampaignId || !ownerUid) {
            if (active) {
              setLiveResponseCount(0);
              setLoaded(true);
            }
            return;
          }
          const listenQuery = query(
            collection(db, 'surveyResponses'),
            where('campaignId', '==', teamCampaignId),
            where('ownerUid', '==', ownerUid)
          );
          unsub = onSnapshot(
            listenQuery,
            (snap) => {
              if (!active) return;
              setLiveResponseCount(snap.docs.filter((d) => d.data()?.ratings).length);
              setLoaded(true);
            },
            (err) => {
              console.warn('useBenchmarkData: live count failed', err);
              if (active) {
                setLiveResponseCount(0);
                setLoaded(true);
              }
            }
          );
          return;
        }

        if (!teamCampaignId || !ownerUid) {
          if (active) {
            if (useFakeDashboardData || isDemoSession()) applyClosedPreview();
            else {
              setTeamResponses([]);
              setSelfResponses([]);
              setLiveResponseCount(0);
              setLoaded(true);
            }
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
        setLiveResponseCount(teamDocs.length);
        if (teamDocs.length) {
          setTeamResponses(teamDocs);
          setSelfResponses(selfDocs.length ? selfDocs : []);
          setLoaded(true);
          return;
        }
        if (useFakeDashboardData || isDemoSession()) {
          applyClosedPreview();
          return;
        }
        setTeamResponses([]);
        setSelfResponses(selfDocs);
        setLoaded(true);
      } catch (err) {
        console.warn('useBenchmarkData: load failed', err);
        if (active) {
          setTeamResponses([]);
          setSelfResponses([]);
          setLiveResponseCount(0);
          setLoaded(true);
        }
      }
    };
    load();
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [windowTick]);

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
        // No self responses, no self block. The averager builds a trait out of
        // an empty response set quite happily — every axis 0, every score 0 —
        // and that object is indistinguishable from a leader who rated
        // themselves zero on everything. Downstream, `row.self` has always
        // been treated as nullable and every reader already guards it; it was
        // simply never null, so a leader who had not taken the self assessment
        // was shown a mirror of minus their own team score.
        const self = selfResponses.length
          ? selfMetrics?.traitData?.[row.trait] || null
          : null;
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
                // How much the room agreed, on each axis. Team only — a self
                // assessment is one voice, and one voice has no spread.
                shape: team.shape || null,
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
    [campaignRows, teamMetrics, selfMetrics, selfResponses]
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
    liveResponseCount,
    selfResponses,
    teamMetrics: teamMetrics?.traitData || {},
    selfMetrics: selfMetrics?.traitData || {},
    criticalGaps: teamMetrics?.criticalGaps || [],
  };
}

export { synthesizeSelfResponses };
