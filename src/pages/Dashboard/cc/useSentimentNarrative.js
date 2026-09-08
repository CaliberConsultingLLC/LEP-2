// The generated half of the Sentiment page.
//
// Sentiment always has a complete answer to all three questions for all three
// traits, assembled in `sentimentContent.js` from the same rows Evidence reads.
// That version is honest and it is never wrong — but it is assembled, and a
// leader reading three traits in a row can feel the seams.
//
// This asks for the same nine answers to be written instead of assembled, in
// the guide's own voice, from the whole picture at once: the scores, the self
// gaps, how much the room agreed on each statement, and what the full-results
// analysis already found across every trait.
//
// It is strictly an overlay. Every failure mode — no key, no network, a partial
// response, a stale cache — lands the reader on the assembled answers with
// nothing visibly missing. Nothing on this page waits for it.
//
// Cached in Firestore against a signature of the scores themselves, per guide.
// Late responses change the signature and correctly rebuild; a plain revisit
// costs nothing, and switching guide asks once for the new voice and keeps it.

import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import {
  buildCampaignResults,
  campaignResultsSignature,
  hasUsableResults,
  traitKeyFor,
} from '../../../utils/campaignResults.js';
import { mapRowStatements } from './EvidenceView.jsx';
import { zoneFor } from './evidenceDial.js';

const TIMEOUT_MS = 240000;

const round = (n) => Math.round(Number(n) || 0);

/** Only the aggregate fields the prompt is allowed to reason from. */
const roomOut = (shape) =>
  shape
    ? {
        n: shape.n,
        min: shape.min,
        max: shape.max,
        agree: shape.agree,
        dissent: shape.dissent,
        consensus: shape.consensus,
      }
    : null;

/**
 * What the model is shown. Deliberately narrow: scores, statement text, and the
 * aggregate shape of the room. No individual response is included and none can
 * be reconstructed from what is.
 */
export function buildSentimentPayload(rows, hasSelfData) {
  return (rows || [])
    .filter((row) => row?.team)
    .map((row, i) => {
      const statements = mapRowStatements(row);
      return {
        key: traitKeyFor(row, i),
        name: row.subTrait || row.trait || `Trait ${i + 1}`,
        zone: zoneFor(round(row.team.effort), round(row.team.efficacy)).label,
        team: {
          compass: round(row.team.lepScore),
          effort: round(row.team.effort),
          efficacy: round(row.team.efficacy),
        },
        self: hasSelfData && row.self
          ? {
              compass: round(row.self.lepScore),
              effort: round(row.self.effort),
              efficacy: round(row.self.efficacy),
            }
          : null,
        statements: statements.map((s) => ({
          text: s.text,
          effort: s.effort,
          efficacy: s.efficacy,
          effortSelf: hasSelfData ? s.effortSelf : null,
          efficacySelf: hasSelfData ? s.efficacySelf : null,
          room: {
            effort: roomOut(s.shape?.effort),
            efficacy: roomOut(s.shape?.efficacy),
          },
        })),
      };
    });
}

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
 * @param {object}  args
 * @param {Array}   args.rows            from useBenchmarkData()
 * @param {boolean} args.loaded
 * @param {boolean} args.hasTeamData
 * @param {boolean} args.hasSelfData
 * @param {number}  args.responseCount
 * @param {string}  args.personaId       the guide whose voice to write in
 * @param {object}  args.resultsAnalysis from useResultsIntelligence, or null
 * @returns {{answersByTrait: object|null, status: string}}
 */
export function useSentimentNarrative({
  rows,
  loaded,
  hasTeamData,
  hasSelfData,
  responseCount,
  personaId,
  resultsAnalysis,
}) {
  const [answersByTrait, setAnswersByTrait] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | unavailable
  const attemptedRef = useRef(new Set());

  const signature = useMemo(() => {
    if (!loaded || !hasTeamData) return '';
    const campaignResults = buildCampaignResults(rows, responseCount, hasSelfData);
    if (!hasUsableResults(campaignResults)) return '';
    return campaignResultsSignature(campaignResults) || '';
  }, [rows, loaded, hasTeamData, hasSelfData, responseCount]);

  useEffect(() => {
    if (!signature || !personaId) return undefined;

    // One attempt per (result set, voice). Regenerating on every visit would
    // let the copy drift under a leader mid-session, which is worse than any
    // improvement a second roll could bring.
    const attemptKey = `${signature}:${personaId}`;
    if (attemptedRef.current.has(attemptKey)) return undefined;
    attemptedRef.current.add(attemptKey);

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
          console.warn('Could not read stored sentiment narrative:', err?.message || err);
        }
      }

      const cached = stored?.sentimentNarrative;
      if (cached?.signature === signature && cached?.guideId === personaId && cached?.answersByTrait) {
        if (!active) return;
        setAnswersByTrait(cached.answersByTrait);
        setStatus('ready');
        return;
      }

      const traits = buildSentimentPayload(rows, hasSelfData);
      if (!traits.length) {
        if (active) setStatus('unavailable');
        return;
      }

      let payload = null;
      try {
        payload = await postJson(
          '/api/get-sentiment-narrative',
          {
            traits,
            guideId: personaId,
            hasSelfData,
            respondents: responseCount,
            resultsAnalysis: resultsAnalysis || null,
          },
          TIMEOUT_MS
        );
      } catch (err) {
        console.warn('Sentiment narrative failed:', err?.name || err?.message || err);
      }

      if (!active) return;
      const generated = payload?.answersByTrait || null;
      if (!generated || !Object.keys(generated).length) {
        setStatus('unavailable');
        return;
      }

      setAnswersByTrait(generated);
      setStatus('ready');

      if (uid) {
        try {
          await setDoc(
            doc(db, 'responses', uid),
            {
              sentimentNarrative: {
                signature,
                guideId: personaId,
                answersByTrait: generated,
                savedAt: new Date().toISOString(),
              },
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not persist sentiment narrative:', err?.message || err);
        }
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, personaId]);

  return { answersByTrait, status };
}
