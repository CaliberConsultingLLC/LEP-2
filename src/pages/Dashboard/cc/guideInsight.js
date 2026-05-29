import { useEffect, useRef, useState } from 'react';
import traitSystem from '../../../data/traitSystem.js';

const { CORE_TRAITS } = traitSystem;

const trimToChars = (text, max = 480) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const sliced = normalized.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 240 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
};

function summarizeTraitLibraryContext(trait, subTrait) {
  const parts = [
    trait?.name,
    trait?.description,
    subTrait?.name,
    subTrait?.description,
    subTrait?.summary,
    subTrait?.default,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
  return parts.join(' | ').slice(0, 600);
}

function buildPayload({ view, rows, focusRow, hasSelfData, selectedAgent, intakeData }) {
  if (!focusRow?.team) return null;
  const traitDef = CORE_TRAITS.find((t) => String(t?.name || '').toLowerCase() === String(focusRow.trait || '').toLowerCase());
  const subTraitDef = traitDef?.subTraits?.find(
    (st) => String(st?.name || '').toLowerCase() === String(focusRow.subTrait || '').toLowerCase()
  );

  const focusEfficacy = focusRow.team.efficacy;
  const focusEffort = focusRow.team.effort;
  const focusDelta = focusRow.team.delta;
  const focusLep = focusRow.team.lepScore;

  const selfEfficacy = focusRow.self?.efficacy ?? null;
  const selfEffort = focusRow.self?.effort ?? null;
  const efficacyGap = selfEfficacy != null ? focusEfficacy - selfEfficacy : null;
  const effortGap = selfEffort != null ? focusEffort - selfEffort : null;

  const allTraitsLine = rows
    .filter((r) => r.team)
    .map(
      (r) =>
        `${r.subTrait || r.trait}: efficacy ${r.team.efficacy.toFixed(1)} · effort ${r.team.effort.toFixed(1)} · delta ${r.team.delta.toFixed(1)}`
    )
    .join(' || ');

  return {
    view_type: view === 'detailed' ? 'detailed_results' : 'campaign_results',
    selectedAgent: selectedAgent || intakeData?.selectedAgent || 'balancedMentor',
    overall_summary: `traits ${rows.length} · focus ${focusRow.subTrait || focusRow.trait}`,
    trait_summary: allTraitsLine,
    focus_trait: focusRow.trait,
    focus_subtrait: focusRow.subTrait,
    focus_metrics: {
      efficacy: focusEfficacy,
      effort: focusEffort,
      delta: focusDelta,
      lepScore: focusLep,
      efficacyGap,
      effortGap,
    },
    has_self_data: Boolean(hasSelfData),
    trait_library_context: summarizeTraitLibraryContext(traitDef, subTraitDef),
    intake_summary: intakeData ? 'Intake data captured.' : 'No intake context.',
  };
}

/**
 * Pulls a single agent insight from the same /api/get-agent-insight endpoint
 * the legacy ResultsTab uses. Re-fetches when key inputs change.
 */
export function useGuideInsight({ view, rows, focusRow, hasSelfData, selectedAgent, intakeData }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);

  const cacheKey = (() => {
    if (!focusRow?.team) return '';
    return [
      view,
      selectedAgent || 'balancedMentor',
      focusRow.trait,
      Math.round(focusRow.team.efficacy),
      Math.round(focusRow.team.effort),
      Math.round(focusRow.team.delta),
      hasSelfData ? 'self' : 'team',
    ].join('|');
  })();

  useEffect(() => {
    if (!cacheKey) {
      setInsight('');
      return undefined;
    }

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setInsight(cached);
      setError('');
      setLoading(false);
      return undefined;
    }

    const payload = buildPayload({ view, rows, focusRow, hasSelfData, selectedAgent, intakeData });
    if (!payload) return undefined;

    if (abortRef.current) abortRef.current.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    const id = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/get-agent-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctl.signal,
        });
        if (!res.ok) throw new Error(`Insight request failed (${res.status})`);
        const data = await res.json();
        const text = trimToChars(data?.insight || 'No interpretation available yet.');
        cacheRef.current.set(cacheKey, text);
        setInsight(text);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setError('The guide is quiet for a moment.');
        console.warn('useGuideInsight: error', err);
      } finally {
        setLoading(false);
      }
    }, 240);

    return () => {
      window.clearTimeout(id);
      ctl.abort();
    };
  }, [cacheKey]);

  return { insight, loading, error };
}
