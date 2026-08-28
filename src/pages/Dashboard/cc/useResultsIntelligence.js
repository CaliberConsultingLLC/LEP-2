// Runs once when a campaign's results land, then never again for that result set.
//
// Two things happen here, in order:
//   1. /api/get-results-analysis reads the whole result set against the intake
//      insight map and scores the predictions that map made before the team was
//      ever asked.
//   2. /api/get-guide-lines regenerates the 34 dashboard screens so the guide
//      can speak to what the team actually said, instead of to the map alone.
//
// Both are cached in Firestore against a signature of the scores themselves.
// Late responses change the signature and correctly trigger a rebuild; a plain
// revisit does not, because regenerating this on every dashboard load would be
// pure waste and would also let the copy drift under the leader mid-session.

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { GUIDE_STEPS } from '../../../data/guideCopy.generated.js';
import { setGeneratedGuideLines } from '../../../data/generatedGuideLines.js';
import {
  buildCampaignResults,
  campaignResultsSignature,
  hasUsableResults,
} from '../../../utils/campaignResults.js';

const DASHBOARD_STEP_KEYS = Object.keys(GUIDE_STEPS).filter((k) => k.startsWith('dashboard'));

async function postJson(url, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {object} args
 * @param {Array}  args.rows            from useBenchmarkData()
 * @param {boolean} args.loaded         whether the dashboard finished loading
 * @param {boolean} args.hasTeamData    whether any team responses exist
 * @param {boolean} args.hasSelfData
 * @param {number}  args.responseCount
 */
export function useResultsIntelligence({ rows, loaded, hasTeamData, hasSelfData, responseCount }) {
  const [resultsAnalysis, setResultsAnalysis] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | unavailable
  const attemptedRef = useRef(new Set());

  useEffect(() => {
    if (!loaded || !hasTeamData) return undefined;

    const campaignResults = buildCampaignResults(rows, responseCount, hasSelfData);
    if (!hasUsableResults(campaignResults)) return undefined;

    const signature = campaignResultsSignature(campaignResults);
    if (!signature || attemptedRef.current.has(signature)) return undefined;
    attemptedRef.current.add(signature);

    let active = true;

    (async () => {
      setStatus('loading');
      const uid = String(auth?.currentUser?.uid || '').trim();
      let stored = null;

      if (uid) {
        try {
          const snap = await getDoc(doc(db, 'responses', uid));
          stored = snap.exists() ? snap.data() : null;
        } catch (err) {
          console.warn('Could not read stored results intelligence:', err?.message || err);
        }
      }

      const cached = stored?.resultsIntelligence;
      if (cached?.signature === signature && cached?.resultsAnalysis) {
        if (!active) return;
        setResultsAnalysis(cached.resultsAnalysis);
        if (cached.dashboardLinesByGuide) {
          setGeneratedGuideLines(cached.dashboardLinesByGuide, { basedOnResults: true });
        }
        setStatus('ready');
        return;
      }

      const insightProfile = stored?.insightProfile || null;
      if (!insightProfile?.evidence?.leadershipMirror) {
        // No map means no predictions to score and nothing to personalize from.
        // The dashboard keeps its existing behavior rather than half-running.
        if (active) setStatus('unavailable');
        return;
      }

      let analysis = null;
      try {
        const payload = await postJson('/api/get-results-analysis', {
          insightProfile,
          campaignResults,
          guideIds: [],
        }, 280000);
        analysis = payload?.resultsAnalysis || null;
      } catch (err) {
        console.warn('Results analysis failed:', err?.name || err?.message || err);
      }

      if (!active) return;
      if (!analysis) {
        setStatus('unavailable');
        return;
      }
      setResultsAnalysis(analysis);
      setStatus('ready');

      // Second pass: re-voice the dashboard screens now that there is something
      // real to say. Failure here is silent by design — the map-based lines
      // generated at summary time remain in place.
      let dashboardLinesByGuide = null;
      try {
        const linesPayload = await postJson('/api/get-guide-lines', {
          insightProfile,
          resultsAnalysis: analysis,
          stepKeys: DASHBOARD_STEP_KEYS,
        }, 280000);
        dashboardLinesByGuide = linesPayload?.linesByGuide || null;
        if (dashboardLinesByGuide && Object.keys(dashboardLinesByGuide).length) {
          setGeneratedGuideLines(dashboardLinesByGuide, { basedOnResults: true });
        }
      } catch (err) {
        console.warn('Dashboard guide line refresh failed:', err?.name || err?.message || err);
      }

      if (uid) {
        try {
          await setDoc(
            doc(db, 'responses', uid),
            {
              resultsIntelligence: {
                signature,
                resultsAnalysis: analysis,
                dashboardLinesByGuide: dashboardLinesByGuide || null,
                savedAt: new Date().toISOString(),
              },
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not persist results intelligence:', err?.message || err);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loaded, hasTeamData, hasSelfData, responseCount, rows]);

  return { resultsAnalysis, status };
}

export { DASHBOARD_STEP_KEYS };
