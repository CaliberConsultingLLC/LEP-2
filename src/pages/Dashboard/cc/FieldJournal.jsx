import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Dialog, DialogContent, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { deriveTraitRoles } from './debriefContent.js';
import { useGuide } from '../../../context/GuideContext';
import { spokenGuide } from '../../../data/guideContent';
import FieldJournalGuide from './FieldJournalGuide.jsx';
import { useCairnTheme } from '../../../config/runtimeFlags';
import { isDemoSession } from '../../../utils/demoMode';
import { readTraitNotes } from './traitRoomNotes.js';
import JournalBook, { BOOK_KEYFRAMES, LAND_MS, TURN_MS, usePrefersReducedMotion } from './JournalBook.jsx';
import {
  EMPTY_PLAN,
  PAPER,
  STEP_DEFS,
  STEP_KEYS,
  TRAIT_ACCENTS,
  defaultGoal,
  firstUnfilledStep,
  goalMin,
  page1Done,
  page2Done,
  planComplete,
  selectTraitInsights,
  stepFilled,
} from './fieldJournalUtils.js';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

// The rail always calls the closing entry step 3, whatever the campaign's trait
// count turns out to be, so that is what gets written to the phase page too.
const LEDGER_RAIL = 3;
const COMPLETE_TURN_MS = 2400;

const shortDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const longDate = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function traitRole(row, roles) {
  if (row.trait === roles.edge?.trait) return 'edge';
  if (row.trait === roles.lifting?.trait) return 'lifting';
  return 'strength';
}

const FIELD_FALLBACKS = {
  envisionExperience:
    'Sit in their seat for a minute. Say what they expect the way they would say it — not the way you would defend it.',
  envisionWant:
    'Underneath the expectation is a want. It is usually simpler than the complaint. One sentence.',
  branchBehavior:
    'Behaviors, not intentions. If you want a place to start: the recap email, the check-back, the owner-and-date at the end of a meeting.',
  branchSignal:
    'Intentions drift. Give this a slot on the calendar, a way to measure it, and a person who will notice if it slips.',
  commitGoal:
    'Honest, not heroic. Six to ten points in a cycle is a change people actually feel.',
  commitMessage:
    'This is the line they will hold you to. Short enough to remember, specific enough to check.',
};

const ADJUST_STEPS = ['branchBehavior', 'branchSignal', 'commitGoal', 'commitMessage'];

function guideForContext(ctx) {
  const { personaId, role, editing, isLedger, isOpen, allDone, signed, row, traitLabel, respondents, plan } = ctx;

  if (!isOpen) {
    const spoken = spokenGuide(
      personaId,
      'dashboardPractice',
      'closed-book',
      'Your field journal. Everything the team told you is already inside. Open it when you are ready to write.',
      'read'
    );
    return { text: spoken.text, pose: spoken.pose, eyebrow: 'Field journal' };
  }

  if (isLedger) {
    const key = signed ? 'ledger-signed' : allDone ? 'ledger-complete' : 'ledger-incomplete';
    const fb = signed
      ? 'Signed. Your team sees these three lines at the next check-in — nothing else from this journal.'
      : allDone
        ? 'Three pages, in your handwriting. Read them once the way your team will read them, then sign.'
        : 'One page is still open. The commitment only counts when it covers all three.';
    const spoken = spokenGuide(personaId, 'dashboardPractice', key, fb, 'lantern');
    return { text: spoken.text, pose: spoken.pose, eyebrow: 'The Commitment' };
  }

  const onAdjust = editing ? ADJUST_STEPS.includes(editing) : page1Done(plan);
  const eyebrow = `${traitLabel} · ${onAdjust ? 'Adjust' : 'Empathize'}`;

  if (editing && FIELD_FALLBACKS[editing]) {
    const spoken = spokenGuide(
      personaId,
      'dashboardPractice',
      `field-${editing}`,
      FIELD_FALLBACKS[editing],
      onAdjust ? 'map' : 'think'
    );
    return { text: spoken.text, pose: spoken.pose, eyebrow };
  }

  if (planComplete(plan)) {
    const spoken = spokenGuide(
      personaId,
      'dashboardPractice',
      'sealed-p2',
      'That is a real commitment. Turn to the next trait, or read it back once more.',
      'map'
    );
    return { text: spoken.text, pose: spoken.pose, eyebrow };
  }

  if (page1Done(plan)) {
    const spoken = spokenGuide(
      personaId,
      'dashboardPractice',
      'sealed-p1',
      'Good. You know what they were carrying. Now do something with it.',
      'map'
    );
    return { text: spoken.text, pose: spoken.pose, eyebrow };
  }

  const team = Math.round(row?.team?.lepScore || 0);
  const self = Math.round(row?.self?.lepScore || 0);
  const pageKey = `${role}-p1`;
  const fallbacks = {
    'edge-p1': `${respondents || 'Your team'} put you at ${team} here, and you put yourself at ${self}. Read what they wrote before you decide what it means.`,
    'lifting-p1': 'They hear you. They just leave holding different versions of what you said. Sit with their words a minute.',
    'strength-p1': 'This one is a strength, and they told you so. Read it anyway — strengths slip quietly.',
  };
  const spoken = spokenGuide(personaId, 'dashboardPractice', pageKey, fallbacks[pageKey] || fallbacks['edge-p1'], 'think');
  return { text: spoken.text, pose: spoken.pose, eyebrow };
}

function NoteModal({ note, onClose }) {
  if (!note) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: PAPER.page, borderRadius: '14px', border: '1px solid #eee4d0', boxShadow: shadows.overlay, maxWidth: 460 } }}
    >
      <DialogContent sx={{ p: '28px 30px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: colors.orangeDeep }}>
          {note.who}
        </Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.6, color: PAPER.ink2, mt: 1.25, textWrap: 'pretty' }}>
          {note.text}
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={onClose}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            mt: 2.5,
            bgcolor: colors.navy900,
            color: PAPER.buttonText,
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 12.5,
            px: 2.25,
            py: 1.1,
            borderRadius: radii.pill,
          }}
        >
          Close
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function FieldJournal({ t, phases, onAdvancePhase, traitIndex, onTraitIndexChange, resultsAnalysis = null }) {
  const { loaded, rows, teamResponses } = useBenchmarkData();
  const { persona, personaId, setSuppress } = useGuide();
  const reducedMotion = usePrefersReducedMotion();

  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  const orderedRows = useMemo(() => {
    if (!roles.ordered.length) return [];
    if (!roles.edge) return roles.ordered;
    return [roles.edge, ...roles.ordered.filter((r) => r.trait !== roles.edge.trait)];
  }, [roles]);
  const traitCount = orderedRows.length;
  const ledgerSpread = traitCount;

  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const campaignRecords = useMemo(() => readJson('campaignRecords', {}), []);
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const ownerName = String(userInfo?.name || '').trim() || 'Your name';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';
  const planKeyFor = useCallback(
    (traitKey) => `practiceStudio_${campaignKey}_${userKey}_${traitKey}`,
    [campaignKey, userKey]
  );

  const mode = phases.modeFor('practice');
  const readOnly = mode === 'snapshot' && !isDemoSession();

  const [spread, setSpread] = useState(() => {
    const saved = Number(phases.pages.practice);
    if (!Number.isFinite(saved)) return 0;
    return Math.max(0, Math.min(LEDGER_RAIL, Math.round(saved)));
  });
  const [open, setOpen] = useState(false);
  const [landed, setLanded] = useState(false);
  const [flip, setFlip] = useState(null);
  const [plans, setPlans] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [guideMsg, setGuideMsg] = useState({ text: '', pose: 'think', eyebrow: '' });
  // The guide introduces each spread once per reading, held in a ref scoped to
  // the mounted page rather than storage that outlives it.
  const [introOpen, setIntroOpen] = useState(false);
  const [introMsg, setIntroMsg] = useState(null);
  const introSeenRef = useRef({});

  const landTimer = useRef(null);
  const flipTimer = useRef(null);
  const completeTimer = useRef(null);
  const prevRailRef = useRef(traitIndex);

  const isLedger = spread >= ledgerSpread && traitCount > 0;
  const traitIdx = traitCount ? Math.min(Math.max(spread, 0), traitCount - 1) : 0;
  const row = orderedRows[traitIdx];
  const plan = useMemo(
    () => (row ? { ...EMPTY_PLAN, ...(plans[row.trait] || {}) } : EMPTY_PLAN),
    [row, plans]
  );
  const traitLabel = row ? row.subTrait || row.trait : '';
  const role = row ? traitRole(row, roles) : 'edge';
  const respondents = teamResponses?.length || 0;

  const allDone = traitCount > 0 && orderedRows.every((r) => planComplete({ ...EMPTY_PLAN, ...(plans[r.trait] || {}) }));
  const signed = traitCount > 0 && orderedRows.every((r) => Boolean(plans[r.trait]?.savedAt));

  // The journal draws its own guide beside the book, and it is the one that
  // speaks here — interruptions included. The corner owl stays down for the
  // whole room rather than appearing in the opposite corner to deliver a line
  // the guide on screen should be delivering.
  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress]);

  useEffect(() => {
    if (!orderedRows.length) return;
    setPlans((prev) => {
      const next = { ...prev };
      orderedRows.forEach((r) => {
        if (!next[r.trait]) {
          next[r.trait] = { ...EMPTY_PLAN, ...(readJson(planKeyFor(r.trait), null) || {}) };
        }
      });
      return next;
    });
  }, [orderedRows, planKeyFor]);

  // A signed entry opens straight to the ledger, already open and read-only.
  useEffect(() => {
    if (!readOnly || !traitCount) return;
    setOpen(true);
    setLanded(true);
    setSpread(ledgerSpread);
    onTraitIndexChange(LEDGER_RAIL);
    prevRailRef.current = LEDGER_RAIL;
  }, [readOnly, traitCount, ledgerSpread, onTraitIndexChange]);

  useEffect(() => () => {
    clearTimeout(landTimer.current);
    clearTimeout(flipTimer.current);
    clearTimeout(completeTimer.current);
  }, []);

  const patchPlan = useCallback(
    (traitKey, patch) => {
      setPlans((prev) => {
        const nextPlan = { ...EMPTY_PLAN, ...(prev[traitKey] || {}), ...patch };
        writeJson(planKeyFor(traitKey), nextPlan);
        return { ...prev, [traitKey]: nextPlan };
      });
    },
    [planKeyFor]
  );

  const planFor = useCallback(
    (i) => ({ ...EMPTY_PLAN, ...(plans[orderedRows[i]?.trait] || {}) }),
    [plans, orderedRows]
  );

  const landSpread = useCallback(
    (next) => {
      setSpread(next);
      setFlip(null);
      setDraft('');
      setNotesOpen(false);
      const rail = next >= ledgerSpread ? LEDGER_RAIL : next;
      prevRailRef.current = rail;
      phases.setPhasePage('practice', rail);
      onTraitIndexChange(rail);
    },
    [ledgerSpread, onTraitIndexChange, phases]
  );

  const flipTo = useCallback(
    (next) => {
      if (!open || flip || next === spread || next < 0 || next > ledgerSpread) return;
      clearTimeout(completeTimer.current);
      const dir = next > spread ? 'fwd' : 'back';
      setEditing(null);
      setNotesOpen(false);
      if (reducedMotion) {
        landSpread(next);
        return;
      }
      setFlip({ dir, to: next });
      clearTimeout(flipTimer.current);
      flipTimer.current = setTimeout(() => landSpread(next), TURN_MS);
    },
    [open, flip, spread, ledgerSpread, reducedMotion, landSpread]
  );

  const openBook = useCallback(() => {
    if (open) return;
    setOpen(true);
    if (reducedMotion) {
      setLanded(true);
      return;
    }
    clearTimeout(landTimer.current);
    landTimer.current = setTimeout(() => setLanded(true), LAND_MS);
  }, [open, reducedMotion]);

  // Header rail — react only when the rail selection changes, not page turns.
  useEffect(() => {
    if (!traitCount || readOnly || flip) return;
    if (traitIndex === prevRailRef.current) return;
    prevRailRef.current = traitIndex;
    const target = traitIndex >= LEDGER_RAIL ? ledgerSpread : Math.min(traitIndex, ledgerSpread);
    if (!open) {
      // A rail click before the cover is opened opens it on that page.
      setSpread(target);
      openBook();
      return;
    }
    flipTo(target);
  }, [traitIndex, traitCount, readOnly, flip, open, ledgerSpread, flipTo, openBook]);

  // The open step is always the first one with nothing written in it.
  useEffect(() => {
    if (readOnly || isLedger || !row || flip || !open) return;
    if (editing) return;
    setEditing(firstUnfilledStep(plan));
  }, [readOnly, isLedger, row, flip, open, editing, plan]);

  const currentScore = row ? Math.round(row.team.lepScore) : 0;
  const goalVal = Number.isFinite(plan.commitGoal) ? plan.commitGoal : defaultGoal(currentScore);

  const handleSave = useCallback(
    (key) => {
      if (!row || readOnly) return;
      const patch =
        key === 'commitGoal'
          ? { commitGoal: goalVal, goalSet: true }
          : { [key]: String(draft || '').trim() };
      if (key !== 'commitGoal' && !patch[key]) return;
      patchPlan(row.trait, patch);
      const nextPlan = { ...plan, ...patch };
      const after = STEP_KEYS.slice(STEP_KEYS.indexOf(key) + 1).find((q) => !stepFilled(nextPlan, q));
      const nextStep = after || firstUnfilledStep(nextPlan);
      setEditing(nextStep);
      setDraft('');
      // The entry closes itself: the stamp lands, then the page turns.
      if (!nextStep && planComplete(nextPlan)) {
        clearTimeout(completeTimer.current);
        completeTimer.current = setTimeout(() => flipTo(spread + 1), COMPLETE_TURN_MS);
      }
    },
    [row, readOnly, goalVal, draft, patchPlan, plan, flipTo, spread]
  );

  const handleFocus = useCallback(
    (key) => {
      if (readOnly) return;
      setEditing((prev) => {
        if (prev !== key) setDraft(String(plan[key] || ''));
        return key;
      });
    },
    [plan, readOnly]
  );

  const handleEdit = useCallback(
    (key) => {
      if (readOnly) return;
      clearTimeout(completeTimer.current);
      setEditing(key);
      setDraft(key === 'commitGoal' ? '' : String(plan[key] || ''));
    },
    [plan, readOnly]
  );

  const handleGoal = useCallback(
    (v) => {
      if (!row || readOnly) return;
      patchPlan(row.trait, { commitGoal: v });
    },
    [row, readOnly, patchPlan]
  );

  const onSign = useCallback(() => {
    if (!allDone || readOnly) return;
    const stamp = new Date().toISOString();
    orderedRows.forEach((r) => {
      const p = { ...EMPTY_PLAN, ...(plans[r.trait] || {}), savedAt: stamp };
      writeJson(planKeyFor(r.trait), p);
    });
    setPlans((prev) => {
      const next = { ...prev };
      orderedRows.forEach((r) => {
        next[r.trait] = { ...EMPTY_PLAN, ...(next[r.trait] || {}), savedAt: stamp };
      });
      return next;
    });
    onAdvancePhase();
  }, [allDone, readOnly, orderedRows, plans, planKeyFor, onAdvancePhase]);

  // --- Evidence notes -------------------------------------------------------
  const notes = useMemo(() => {
    if (!row || isLedger) return [];
    return readTraitNotes(row.trait).map((n) => ({
      ...n,
      meta: `${Number.isInteger(n.statementIdx) ? `Statement ${n.statementIdx + 1}` : 'Trait view'} · ${shortDate(new Date(n.ts))}`,
    }));
  }, [row, isLedger]);

  const useNote = useCallback(
    (n) => {
      if (readOnly) return;
      const key = editing || firstUnfilledStep(plan);
      if (!key || key === 'commitGoal') return;
      setEditing(key);
      setDraft((prev) => {
        const base = editing === key ? String(prev || '') : String(plan[key] || '');
        return base.trim() ? `${base.trim()} ${n.text}` : n.text;
      });
    },
    [editing, plan, readOnly]
  );

  // --- Guide ----------------------------------------------------------------
  const guideCtx = useMemo(
    () => ({
      personaId,
      role,
      editing,
      isLedger,
      isOpen: open,
      allDone,
      signed: signed || readOnly,
      row,
      traitLabel,
      respondents,
      plan,
    }),
    [personaId, role, editing, isLedger, open, allDone, signed, readOnly, row, traitLabel, respondents, plan]
  );

  useEffect(() => {
    if (!traitCount) return;
    const msg = guideForContext(guideCtx);
    setGuideMsg(msg);
  }, [guideCtx, traitCount]);

  useEffect(() => {
    introSeenRef.current = {};
  }, [personaId]);

  const introKey = !open ? 'closed' : isLedger ? 'ledger' : `trait-${traitIdx}`;

  useEffect(() => {
    if (!useCairnTheme || readOnly || !traitCount || flip) return;
    if (introSeenRef.current[introKey]) return;
    const msg = guideForContext({ ...guideCtx, editing: null });
    setIntroMsg(msg);
    setIntroOpen(true);
  }, [introKey, flip, readOnly, traitCount, guideCtx]);

  const dismissIntro = useCallback(() => {
    introSeenRef.current[introKey] = true;
    setIntroOpen(false);
  }, [introKey]);

  // --- Page props -----------------------------------------------------------
  const pagePropsFor = useCallback(
    (s, side, ghost) => {
      const ledger = s >= ledgerSpread;
      const i = Math.min(Math.max(s, 0), Math.max(traitCount - 1, 0));
      const r = orderedRows[i];
      const acc = TRAIT_ACCENTS[i % TRAIT_ACCENTS.length];
      const p = planFor(i);
      const label = r ? r.subTrait || r.trait : '';
      const base = { accent: acc.accent, accentHi: acc.accentHi, ghost: Boolean(ghost), readOnly };

      if (side === 'left') {
        return {
          ...base,
          kind: 'blank',
          blankLabel: ledger ? 'Field journal · closing entry' : `Field journal · ${label}`,
        };
      }

      if (ledger) {
        const firstOpen = orderedRows.findIndex((x) => !planComplete({ ...EMPTY_PLAN, ...(plans[x.trait] || {}) }));
        return {
          ...base,
          kind: 'ledger',
          folio: String(ledgerSpread + 1),
          ledger: orderedRows.map((tr, j) => {
            const lp = planFor(j);
            const cur = Math.round(tr.team.lepScore);
            const g = Number.isFinite(lp.commitGoal) ? lp.commitGoal : defaultGoal(cur);
            return {
              label: tr.subTrait || tr.trait,
              range: `${cur} → ${g}`,
              done: planComplete(lp),
              message: String(lp.commitMessage || '').trim() ? `“${lp.commitMessage}”` : 'No commitment written yet.',
            };
          }),
          allDone,
          signed: signed || readOnly,
          signLabel: signed
            ? 'Signed ✓'
            : allDone
              ? 'Sign the entry'
              : `Finish ${orderedRows[firstOpen]?.subTrait || orderedRows[firstOpen]?.trait || 'the pages'} first`,
          onSign: () => {
            if (!allDone) {
              if (firstOpen >= 0) flipTo(firstOpen);
              return;
            }
            onSign();
          },
          onOpenTrait: (j) => flipTo(j),
          signatureName: ownerName,
          signedDate: signed
            ? longDate(new Date(plans[orderedRows[0]?.trait]?.savedAt || Date.now()))
            : 'Awaiting signature',
          backLabel: 'Previous',
          onBack: () => flipTo(ledgerSpread - 1),
        };
      }

      const defs = STEP_DEFS(label);
      const activeKey = ghost ? null : editing;
      const steps = defs
        .map((d, k) => ({ def: d, n: k + 1, value: p[d.key] || '', active: activeKey === d.key }))
        .filter((s2) => s2.active || stepFilled(p, s2.def.key));
      const cur = r ? Math.round(r.team.lepScore) : 0;

      return {
        ...base,
        kind: 'trait',
        trait: {
          label,
          team: cur,
          effort: r ? Math.round(r.team.effort) : 0,
          efficacy: r ? Math.round(r.team.efficacy) : 0,
        },
        insights: selectTraitInsights({ row: r, rowIndex: i, analysis: resultsAnalysis, respondents }),
        respondents,
        steps,
        draft,
        traitDone: planComplete(p),
        stampDate: shortDate(new Date()),
        folio: String(s + 1),
        dots: STEP_KEYS.map((k) => stepFilled(p, k)),
        goal: Number.isFinite(p.commitGoal) ? p.commitGoal : defaultGoal(cur),
        goalSet: Boolean(p.goalSet),
        goalMin: goalMin(cur),
        current: cur,
        onDraft: setDraft,
        onFocus: handleFocus,
        onEdit: handleEdit,
        onSave: handleSave,
        onGoal: handleGoal,
        onReadAll: (card) => setModal({ who: card.who, text: card.text }),
        backLabel: i > 0 ? 'Previous' : '',
        onBack: () => flipTo(s - 1),
        fwdLabel: 'Next',
        onFwd: () => flipTo(s + 1),
        fwdReady: planComplete(p),
      };
    },
    [
      ledgerSpread,
      traitCount,
      orderedRows,
      planFor,
      readOnly,
      plans,
      allDone,
      signed,
      ownerName,
      flipTo,
      onSign,
      editing,
      draft,
      resultsAnalysis,
      respondents,
      handleFocus,
      handleEdit,
      handleSave,
      handleGoal,
    ]
  );

  if (!loaded && !orderedRows.length) {
    return (
      <Box sx={{ px: 3, py: 3 }}>
        <Typography sx={{ color: t.inkSoft }}>Loading practice…</Typography>
      </Box>
    );
  }

  if (!orderedRows.length) {
    return (
      <Box sx={{ px: 3, py: 3 }}>
        <Typography sx={{ color: t.inkSoft }}>Practice will open once your campaign is set up.</Typography>
      </Box>
    );
  }

  const interrupting = introOpen && Boolean(introMsg);
  const forward = flip?.dir === 'fwd';
  const leftS = flip ? (forward ? spread : flip.to) : spread;
  const rightS = flip ? (forward ? flip.to : spread) : spread;

  return (
    <Box sx={{ ...BOOK_KEYFRAMES, position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {useCairnTheme && (
        <FieldJournalGuide
          persona={persona}
          eyebrow={interrupting ? introMsg?.eyebrow : guideMsg.eyebrow}
          text={interrupting ? introMsg?.text || '' : guideMsg.text}
          pose={interrupting ? introMsg?.pose : guideMsg.pose}
          interrupting={interrupting}
          onDone={dismissIntro}
        />
      )}

      <JournalBook
        open={open}
        landed={landed}
        onOpen={openBook}
        spread={spread}
        flip={flip}
        ownerName={ownerName}
        traitLabels={orderedRows.slice(0, 3).map((r) => r.subTrait || r.trait)}
        left={pagePropsFor(leftS, 'left', Boolean(flip))}
        right={pagePropsFor(rightS, 'right', Boolean(flip))}
        sheetFront={flip ? pagePropsFor(forward ? spread : flip.to, 'right', true) : {}}
        sheetBack={flip ? pagePropsFor(forward ? flip.to : spread, 'left', true) : {}}
        leftKey={`L${leftS}`}
        rightKey={`R${rightS}`}
        notes={notes}
        notesOpen={notesOpen}
        onToggleNotes={() => !isLedger && setNotesOpen((v) => !v)}
        onUseNote={useNote}
        notesTraitLabel={isLedger ? 'all traits' : traitLabel}
        onBookmark={(i) => (open ? flipTo(i) : (setSpread(i), openBook()))}
        reducedMotion={reducedMotion}
      />

      <NoteModal note={modal} onClose={() => setModal(null)} />
    </Box>
  );
}

export { planComplete, page1Done, page2Done, EMPTY_PLAN };
