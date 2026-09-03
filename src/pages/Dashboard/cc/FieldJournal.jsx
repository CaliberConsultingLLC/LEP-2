import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Dialog, DialogContent, Slider, Stack, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { deriveTraitRoles } from './debriefContent.js';
import { useGuide } from '../../../context/GuideContext';
import { spokenGuide } from '../../../data/guideContent';
import FieldJournalGuide from './FieldJournalGuide.jsx';
import { useCairnTheme } from '../../../config/runtimeFlags';
import {
  EMPTY_PLAN,
  FIELD_LEAD_INS,
  FIELD_PROMPTS,
  PAPER,
  defaultGoal,
  goalMin,
  page1Done,
  page2Done,
  paperClipPath,
  pickEvidenceNotes,
  planComplete,
  truncateNote,
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

const FLIP_MS = 780;
const CLIP = paperClipPath();

function viewFromPhase(saved) {
  if (!Number.isFinite(saved)) return { kind: 'trait', traitIndex: 0, page: 0 };
  if (saved >= 6) return { kind: 'ledger' };
  return { kind: 'trait', traitIndex: Math.floor(saved / 2), page: saved % 2 };
}

function viewToPhase(view) {
  if (view.kind === 'ledger') return 6;
  return view.traitIndex * 2 + view.page;
}

function viewToRail(view) {
  return view.kind === 'ledger' ? 3 : view.traitIndex;
}

function viewsEqual(a, b) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'ledger') return true;
  return a.traitIndex === b.traitIndex && a.page === b.page;
}

function viewDir(from, to) {
  return viewToPhase(to) >= viewToPhase(from) ? 'fwd' : 'back';
}

const journalKeyframes = {
  '@keyframes fjInkIn': {
    from: { opacity: 0, filter: 'blur(3px)', transform: 'translateY(2px)' },
    to: { opacity: 1, filter: 'blur(0)', transform: 'none' },
  },
  '@keyframes fjStampIn': {
    '0%': { opacity: 0, transform: 'scale(1.6) rotate(-16deg)' },
    '60%': { opacity: 1, transform: 'scale(0.93) rotate(-7deg)' },
    '100%': { opacity: 1, transform: 'scale(1) rotate(-7deg)' },
  },
  '@keyframes fjFlipSheet': {
    '0%': { transform: 'rotateY(0deg)', opacity: 1 },
    '50%': { transform: 'rotateY(-92deg)' },
    '82%': { opacity: 1 },
    '100%': { transform: 'rotateY(-178deg)', opacity: 0 },
  },
  '@keyframes fjFlipSheetBack': {
    '0%': { transform: 'rotateY(-178deg)', opacity: 0 },
    '14%': { opacity: 1 },
    '50%': { transform: 'rotateY(-88deg)' },
    '100%': { transform: 'rotateY(0deg)', opacity: 1 },
  },
  '@keyframes fjFlipShade': {
    '0%': { opacity: 0 },
    '45%': { opacity: 0.6 },
    '100%': { opacity: 0 },
  },
  '@keyframes fjFlipLift': {
    '0%': { transform: 'translateY(0)' },
    '45%': { transform: 'translateY(-6px)' },
    '100%': { transform: 'translateY(0)' },
  },
  '@keyframes fjPageSettle': {
    '0%': { transform: 'translateY(-4px) scale(0.995)' },
    '60%': { transform: 'translateY(1px) scale(1.002)' },
    '100%': { transform: 'none' },
  },
};

function traitRole(row, roles) {
  if (row.trait === roles.edge?.trait) return 'edge';
  if (row.trait === roles.lifting?.trait) return 'lifting';
  return 'strength';
}

function guideForContext(ctx) {
  const {
    personaId,
    role,
    page,
    editing,
    sealed,
    isLedger,
    allDone,
    signed,
    row,
    traitLabel,
    respondents,
  } = ctx;

  const section = page === 0 ? 'Empathize' : 'Adjust';
  const eyebrow = isLedger ? 'The Commitment' : `${traitLabel} · ${section}`;

  const fieldFallbacks = {
    envisionExperience: 'Say it in their words. Describe it — do not fix it yet.',
    envisionWant: 'The simplest thing they are hoping you would do or say. One sentence is enough.',
    branchBehavior: 'One thing you will do differently, starting this week. Something they could watch you do.',
    branchSignal: 'A ritual with a time attached. Habits without a slot on the calendar do not survive.',
    commitMessage: 'This is the accountability line. Your team reads it at the next check-in — nothing else from this journal.',
    commitGoal: 'Honest, not heroic. Six to ten points in a cycle is a change people actually feel.',
  };

  if (editing && fieldFallbacks[editing]) {
    const spoken = spokenGuide(personaId, 'dashboardPractice', `field-${editing}`, fieldFallbacks[editing], page === 0 ? 'think' : 'map');
    return { text: spoken.text, pose: spoken.pose, eyebrow };
  }

  if (isLedger) {
    const key = signed ? 'ledger-signed' : allDone ? 'ledger-complete' : 'ledger-incomplete';
    const fb = signed
      ? 'Signed. Your team sees these three lines at the next check-in — nothing else from this journal.'
      : allDone
        ? 'Three pages, in your handwriting. Read them once the way your team will read them, then sign.'
        : 'One page is still open. The commitment only counts when it covers all three.';
    const spoken = spokenGuide(personaId, 'dashboardPractice', key, fb, 'lantern');
    return { text: spoken.text, pose: spoken.pose, eyebrow };
  }

  if (sealed) {
    const fb = page === 0
      ? 'Good. You know what they were carrying. Now do something with it.'
      : 'That is a real commitment. Turn to the next trait, or read it back once more.';
    const spoken = spokenGuide(personaId, 'dashboardPractice', `sealed-p${page + 1}`, fb, page === 0 ? 'think' : 'map');
    return { text: spoken.text, pose: spoken.pose, eyebrow };
  }

  const team = Math.round(row?.team?.lepScore || 0);
  const self = Math.round(row?.self?.lepScore || 0);
  const pageKey = `${role}-p${page + 1}`;
  const fallbacks = {
    'edge-p1': `${respondents || 'Your team'} put you at ${team} here, and you put yourself at ${self}. Read what they wrote before you decide what it means.`,
    'edge-p2': 'This is the part that changes something. Not the score — the behavior they will actually see next week.',
    'lifting-p1': 'They hear you. They just leave holding different versions of what you said. Sit with their words a minute.',
    'lifting-p2': 'Clarity is a habit with a shape. Give it one your team can see from across the room.',
    'strength-p1': 'This one is a strength, and they told you so. Read it anyway — strengths slip quietly.',
    'strength-p2': 'Protecting a strength is still a change. Make it deliberate enough to survive a busy quarter.',
  };
  const spoken = spokenGuide(personaId, 'dashboardPractice', pageKey, fallbacks[pageKey] || fallbacks['edge-p1'], page === 0 ? 'think' : 'map');
  return { text: spoken.text, pose: spoken.pose, eyebrow };
}

function WaxDot() {
  return (
    <Box
      sx={{
        width: 14,
        height: 14,
        borderRadius: radii.circle,
        flexShrink: 0,
        background: 'radial-gradient(circle at 32% 26%, #c85a30, #8d3418 72%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
      }}
    />
  );
}

function WaxSeal({ roman }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: radii.circle,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 32% 26%, #c85a30, #8d3418 72%)',
        boxShadow: '0 4px 10px rgba(15,28,46,0.32), inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.25)',
        fontFamily: fonts.brand,
        fontWeight: 700,
        fontSize: 12.5,
        color: PAPER.waxText,
        animation: 'fjStampIn 480ms cubic-bezier(0.2,0.9,0.3,1.2) both',
      }}
    >
      {roman}
    </Box>
  );
}

function SectionLabel({ children, sealed, roman }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
      <Typography
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: children === 'What they told us' ? PAPER.sepia : colors.orangeDeep,
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: PAPER.hairline }} />
      {sealed && roman ? <WaxSeal roman={roman} /> : null}
    </Stack>
  );
}

function PromptBlock({
  prompt,
  traitLabel,
  value,
  editing,
  draft,
  onDraft,
  onFocus,
  onSave,
  onEdit,
  fieldH,
}) {
  const key = prompt.key;
  const isOpen = editing === key;
  const isWritten = Boolean(String(value || '').trim()) && !isOpen;
  const lead = FIELD_LEAD_INS[key] || '';

  return (
    <Box>
      <Typography sx={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 18.5, lineHeight: 1.32, color: PAPER.ink, textWrap: 'pretty' }}>
        {typeof prompt.q === 'function' ? prompt.q(traitLabel) : prompt.q}
      </Typography>
      {isWritten && (
        <Typography sx={{ mt: 1, fontFamily: fonts.serif, fontSize: 17, lineHeight: 1.7, color: PAPER.ink2 }}>
          <Box component="span">{lead}</Box>
          <Box
            component="button"
            type="button"
            onClick={() => onEdit(key)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 17,
              lineHeight: 1.75,
              color: PAPER.ink,
              borderBottom: `1.5px dotted ${PAPER.dotted}`,
              animation: 'fjInkIn 560ms ease both',
            }}
          >
            {value}
          </Box>
        </Typography>
      )}
      {isOpen && (
        <Stack direction="row" spacing={1.25} alignItems="flex-end" sx={{ mt: 1.1 }}>
          <Box
            component="textarea"
            value={draft}
            placeholder={prompt.ph}
            onChange={(e) => onDraft(e.target.value)}
            onFocus={() => onFocus(key)}
            sx={{
              flex: 1,
              minWidth: 0,
              height: fieldH,
              boxSizing: 'border-box',
              resize: 'none',
              fontFamily: fonts.serif,
              fontSize: 15.5,
              lineHeight: 1.55,
              color: PAPER.ink,
              bgcolor: PAPER.field,
              border: `1px solid ${PAPER.rule}`,
              borderRadius: radii.md,
              p: '12px 15px',
              outline: 'none',
              '&:focus': { borderColor: colors.orangeDeep },
              '&::placeholder': { color: PAPER.muted, opacity: 0.55 },
            }}
          />
          <Box
            component="button"
            type="button"
            onClick={onSave}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: colors.navy900,
              color: PAPER.buttonText,
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 13,
              px: 2.5,
              py: 1.5,
              borderRadius: radii.pill,
              boxShadow: shadows.buttonPrimary,
              '&:hover': { bgcolor: colors.navy700 },
            }}
          >
            Write it in →
          </Box>
        </Stack>
      )}
    </Box>
  );
}

function FlipOverlay({ flipping, flipDir }) {
  if (!flipping) return null;
  const forward = flipDir === 'fwd';
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: '-1px',
        zIndex: 6,
        pointerEvents: 'none',
        perspective: '2200px',
        animation: 'fjFlipLift 820ms ease both',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
          animation: `${forward ? 'fjFlipSheet' : 'fjFlipSheetBack'} 820ms cubic-bezier(0.42,0,0.18,1) both`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #fffdf8 0%, #faf4e4 55%, #e9dcbf 100%)',
            border: '1px solid #eee4d0',
            boxShadow: '-18px 0 40px rgba(15,28,46,0.28)',
            backfaceVisibility: 'hidden',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(270deg, #f6efdd 0%, #ede3cb 60%, #e2d5b6 100%)',
            border: '1px solid #e6dac2',
            boxShadow: '18px 0 40px rgba(15,28,46,0.22)',
            backfaceVisibility: 'hidden',
          }}
        />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: forward
            ? 'linear-gradient(90deg, rgba(15,28,46,0.34), transparent 58%)'
            : 'linear-gradient(270deg, rgba(15,28,46,0.28), transparent 62%)',
          animation: 'fjFlipShade 820ms ease both',
        }}
      />
    </Box>
  );
}

function NoteModal({ note, onClose }) {
  if (!note) return null;
  return (
    <Dialog open onClose={onClose} PaperProps={{ sx: { bgcolor: PAPER.page, borderRadius: '14px', border: '1px solid #eee4d0', boxShadow: shadows.overlay, maxWidth: 460 } }}>
      <DialogContent sx={{ p: '28px 30px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: colors.orangeDeep }}>
          {note.who}
        </Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.6, color: PAPER.ink2, mt: 1.25, textWrap: 'pretty' }}>
          &#8220;{note.text}&#8221;
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

export default function FieldJournal({ t, phases, onAdvancePhase, traitIndex, onTraitIndexChange }) {
  const { loaded, rows, teamResponses } = useBenchmarkData();
  const { persona, personaId, setSuppress } = useGuide();
  const roles = useMemo(() => deriveTraitRoles(rows), [rows]);
  const orderedRows = useMemo(() => {
    if (!roles.ordered.length) return [];
    if (!roles.edge) return roles.ordered;
    return [roles.edge, ...roles.ordered.filter((r) => r.trait !== roles.edge.trait)];
  }, [roles]);

  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const campaignRecords = useMemo(() => readJson('campaignRecords', {}), []);
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const campaignKey =
    campaignRecords?.bundleId ||
    campaignRecords?.teamCampaignId ||
    campaignRecords?.selfCampaignId ||
    '123';
  const planKeyFor = useCallback(
    (traitKey) => `practiceStudio_${campaignKey}_${userKey}_${traitKey}`,
    [campaignKey, userKey]
  );

  const flipTimer = useRef(null);
  const prevRailRef = useRef(traitIndex);
  const recoveredPhase = useRef(false);
  const mode = phases.modeFor('practice');
  const readOnly = mode === 'snapshot';

  const [view, setView] = useState(() => {
    const base = viewFromPhase(phases.pages.practice);
    return base;
  });
  const [plans, setPlans] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState('fwd');
  const [noteOpen, setNoteOpen] = useState(null);
  const [settleKey, setSettleKey] = useState(0);
  const [guideMsg, setGuideMsg] = useState({ text: '', pose: 'think', eyebrow: '' });

  const showLedger = view.kind === 'ledger';
  const traitIdx = showLedger ? 0 : Math.min(Math.max(view.traitIndex, 0), Math.max(orderedRows.length - 1, 0));
  const page = showLedger ? 0 : view.page;
  const row = orderedRows[traitIdx];
  const plan = row ? { ...EMPTY_PLAN, ...(plans[row.trait] || {}) } : EMPTY_PLAN;
  const traitLabel = row ? row.subTrait || row.trait : '';
  const role = row ? traitRole(row, roles) : 'edge';
  const respondents = teamResponses?.length || 0;

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress]);

  useEffect(() => {
    if (readOnly) {
      setView({ kind: 'ledger' });
      onTraitIndexChange(3);
    }
  }, [readOnly, onTraitIndexChange]);

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

  // Recover from a stale saved page index (6 = ledger) left by the old dual-state bug.
  useEffect(() => {
    if (recoveredPhase.current || readOnly || !orderedRows.length) return;
    const saved = phases.pages.practice;
    if (!Number.isFinite(saved) || saved < 6) return;
    const allComplete = orderedRows.every((r) => {
      const p = plans[r.trait] || readJson(planKeyFor(r.trait), null);
      return planComplete({ ...EMPTY_PLAN, ...p });
    });
    if (allComplete) return;
    recoveredPhase.current = true;
    const idx = orderedRows.findIndex((r) => {
      const p = plans[r.trait] || readJson(planKeyFor(r.trait), null);
      return !planComplete({ ...EMPTY_PLAN, ...p });
    });
    const nextView =
      idx >= 0 ? { kind: 'trait', traitIndex: idx, page: 0 } : { kind: 'ledger' };
    setView(nextView);
    phases.setPhasePage('practice', viewToPhase(nextView));
    onTraitIndexChange(viewToRail(nextView));
    prevRailRef.current = viewToRail(nextView);
  }, [orderedRows, plans, readOnly, phases, planKeyFor, onTraitIndexChange]);

  const patchPlan = useCallback(
    (traitKey, patch) => {
      setPlans((prev) => {
        const nextPlan = { ...(prev[traitKey] || EMPTY_PLAN), ...patch };
        writeJson(planKeyFor(traitKey), nextPlan);
        return { ...prev, [traitKey]: nextPlan };
      });
    },
    [planKeyFor]
  );

  const applyView = useCallback(
    (nextView) => {
      setView(nextView);
      setEditing(null);
      setSettleKey((k) => k + 1);
      phases.setPhasePage('practice', viewToPhase(nextView));
      onTraitIndexChange(viewToRail(nextView));
    },
    [onTraitIndexChange, phases]
  );

  const flipTo = useCallback(
    (nextView, dir) => {
      if (flipTimer.current) clearTimeout(flipTimer.current);
      setFlipDir(dir);
      setFlipping(true);
      flipTimer.current = setTimeout(() => {
        applyView(nextView);
        setFlipping(false);
      }, FLIP_MS);
    },
    [applyView]
  );

  const navigateTo = useCallback(
    (nextView) => {
      if (viewsEqual(view, nextView)) return;
      flipTo(nextView, viewDir(view, nextView));
    },
    [view, flipTo]
  );

  // Header rail — react only when the rail selection changes, not internal page turns.
  useEffect(() => {
    if (flipping || !orderedRows.length || readOnly) return;
    if (traitIndex === prevRailRef.current) return;
    prevRailRef.current = traitIndex;
    const target =
      traitIndex >= 3
        ? { kind: 'ledger' }
        : { kind: 'trait', traitIndex, page: 0 };
    navigateTo(target);
  }, [traitIndex, orderedRows.length, flipping, readOnly, navigateTo]);

  useEffect(() => () => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
  }, []);

  const p1Sealed = page1Done(plan);
  const p2Sealed = page2Done(plan);
  const pageSealed = page === 0 ? p1Sealed : p2Sealed;
  const allDone = orderedRows.every((r) => planComplete({ ...EMPTY_PLAN, ...(plans[r.trait] || {}) }));
  const signed = orderedRows.every((r) => Boolean(plans[r.trait]?.savedAt));

  useEffect(() => {
    if (!orderedRows.length) return undefined;
    const msg = guideForContext({
      personaId,
      role,
      page,
      editing,
      sealed: pageSealed,
      isLedger: showLedger,
      allDone,
      signed: signed || readOnly,
      row,
      traitLabel,
      respondents,
    });
    setGuideMsg({ text: msg.text, pose: msg.pose, eyebrow: msg.eyebrow });
    return undefined;
  }, [personaId, role, page, editing, pageSealed, showLedger, allDone, signed, readOnly, row, traitLabel, respondents, orderedRows.length]);

  const currentScore = row ? Math.round(row.team.lepScore) : 0;
  const goalVal = Number.isFinite(plan.commitGoal) ? plan.commitGoal : defaultGoal(currentScore);

  useEffect(() => {
    if (page === 1 && row && !Number.isFinite(plan.commitGoal)) {
      patchPlan(row.trait, { commitGoal: defaultGoal(currentScore) });
    }
  }, [page, row, plan.commitGoal, currentScore, patchPlan]);

  const firstUnanswered = useCallback((pg) => {
    const fields = pg === 0 ? FIELD_PROMPTS.page1 : FIELD_PROMPTS.page2;
    const p = row ? { ...EMPTY_PLAN, ...(plans[row.trait] || {}) } : EMPTY_PLAN;
    const hit = fields.find((f) => !String(p[f.key] || '').trim());
    return hit?.key || null;
  }, [row, plans]);

  const saveField = (key) => {
    if (!row) return;
    patchPlan(row.trait, { [key]: draft.trim() });
    setEditing(null);
    setDraft('');
    const pg = ['envisionExperience', 'envisionWant'].includes(key) ? 0 : 1;
    setTimeout(() => setEditing(firstUnanswered(pg)), 0);
  };

  const openEdit = (key) => {
    if (!row) return;
    const p = plans[row.trait] || EMPTY_PLAN;
    setEditing(key);
    setDraft(String(p[key] || ''));
  };

  const onSign = () => {
    const stamp = new Date().toISOString();
    orderedRows.forEach((r) => {
      const p = { ...(plans[r.trait] || EMPTY_PLAN), savedAt: stamp };
      writeJson(planKeyFor(r.trait), p);
    });
    setPlans((prev) => {
      const next = { ...prev };
      orderedRows.forEach((r) => {
        next[r.trait] = { ...(next[r.trait] || EMPTY_PLAN), savedAt: stamp };
      });
      return next;
    });
    onAdvancePhase();
  };

  const nextIncompleteTrait = orderedRows.findIndex((r) => !planComplete({ ...EMPTY_PLAN, ...(plans[r.trait] || {}) }));

  useEffect(() => {
    if (readOnly || showLedger || pageSealed || editing) return;
    const first = firstUnanswered(page);
    if (first) setEditing(first);
  }, [page, view.traitIndex, readOnly, showLedger, pageSealed, editing, firstUnanswered]);

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

  const cardPad = showLedger ? '30px 50px 26px' : page === 0 ? '30px 50px 26px' : '22px 50px 18px';

  const goForward = () => {
    if (showLedger || readOnly) return;
    if (page === 0) navigateTo({ kind: 'trait', traitIndex: traitIdx, page: 1 });
    else if (traitIdx < orderedRows.length - 1) navigateTo({ kind: 'trait', traitIndex: traitIdx + 1, page: 0 });
    else navigateTo({ kind: 'ledger' });
  };

  const goBack = () => {
    if (showLedger) {
      navigateTo({ kind: 'trait', traitIndex: orderedRows.length - 1, page: 1 });
      return;
    }
    if (page === 1) navigateTo({ kind: 'trait', traitIndex: traitIdx, page: 0 });
    else if (traitIdx > 0) navigateTo({ kind: 'trait', traitIndex: traitIdx - 1, page: 1 });
  };

  const forwardLabel = page === 0
    ? 'Turn to the adjustment →'
    : traitIdx < orderedRows.length - 1
      ? `Turn the page → ${orderedRows[traitIdx + 1].subTrait || orderedRows[traitIdx + 1].trait}`
      : 'To the Commitment →';

  const notes = row ? pickEvidenceNotes(row) : [];

  return (
    <Box sx={{ ...journalKeyframes, position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {useCairnTheme && (
        <FieldJournalGuide
          persona={persona}
          eyebrow={guideMsg.eyebrow}
          text={guideMsg.text}
          pose={guideMsg.pose}
        />
      )}
      <Box
        sx={{
          position: 'relative',
          pl: { xs: 0, md: 28, lg: 36, xl: 42 },
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxWidth: 720, width: '100%', ml: { xs: 0, md: 'auto' }, mr: { xs: 0, md: 0 }, pt: '15px', pb: '8px', px: '10px' }}>
        {!showLedger && (
          <Stack direction="row" spacing={0.75} alignItems="flex-end" sx={{ pl: '14px', flexShrink: 0 }}>
            {[
              { roman: 'I', label: 'Empathize', pg: 0, sealed: p1Sealed },
              { roman: 'II', label: 'Adjust & Commit', pg: 1, sealed: p2Sealed },
            ].map((tab) => {
              const active = page === tab.pg;
              return (
                <Box
                  key={tab.label}
                  component="button"
                  type="button"
                  onClick={() => !readOnly && navigateTo({ kind: 'trait', traitIndex: traitIdx, page: tab.pg })}
                  sx={{
                    all: 'unset',
                    cursor: readOnly ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.1,
                    border: `1px solid ${PAPER.rule}`,
                    borderBottom: 'none',
                    borderRadius: '10px 10px 0 0',
                    bgcolor: active ? PAPER.page : PAPER.cream,
                    px: active ? '18px' : '16px',
                    pt: active ? '9px' : '7px',
                    pb: active ? '10px' : '8px',
                    boxShadow: '0 -6px 16px rgba(15,28,46,0.08)',
                  }}
                >
                  <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em', color: colors.orangeDeep }}>
                    {tab.roman}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 12.5, color: active ? PAPER.ink : PAPER.tabMuted }}>
                    {tab.label}
                  </Typography>
                  {tab.sealed ? <WaxDot /> : null}
                </Box>
              );
            })}
          </Stack>
        )}

        <Box sx={{ position: 'relative', flex: 1, minHeight: 0, filter: 'drop-shadow(0 1px 1px rgba(15,28,46,0.16)) drop-shadow(0 22px 34px rgba(15,28,46,0.15))' }}>
          {!showLedger &&
            orderedRows.map((r, i) => {
              const active = i === traitIdx;
              return (
                <Box
                  key={r.trait}
                  component="button"
                  type="button"
                  title={r.subTrait || r.trait}
                  onClick={() => !readOnly && navigateTo({ kind: 'trait', traitIndex: i, page: 0 })}
                  sx={{
                    all: 'unset',
                    cursor: readOnly ? 'default' : 'pointer',
                    position: 'absolute',
                    top: -15,
                    right: [104, 74, 44][i],
                    width: active ? 19 : 17,
                    height: active ? 58 : 19,
                    background: BOOKMARK_GRADIENTS[i],
                    clipPath: active ? 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)' : 'none',
                    borderRadius: active ? 0 : '2px 2px 0 0',
                    boxShadow: active ? '0 5px 10px rgba(15,28,46,0.28)' : 'inset 0 -3px 4px rgba(15,28,46,0.22)',
                    zIndex: active ? 3 : 1,
                  }}
                />
              );
            })}

          <Box
            key={settleKey}
            sx={{
              position: 'relative',
              zIndex: 2,
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              clipPath: CLIP,
              bgcolor: PAPER.page,
              backgroundImage: 'radial-gradient(circle at 18% 24%, rgba(15,28,46,0.02) 0%, transparent 40%), radial-gradient(circle at 82% 76%, rgba(15,28,46,0.022) 0%, transparent 45%)',
              boxShadow: 'inset 12px 0 18px -12px rgba(15,28,46,0.42)',
              p: cardPad,
              boxSizing: 'border-box',
              animation: 'fjPageSettle 420ms cubic-bezier(0.2,0.8,0.2,1) both',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 6,
                left: -7,
                bottom: 8,
                width: 11,
                background: `repeating-linear-gradient(to bottom, ${PAPER.page} 0 2px, ${PAPER.ring} 2px 3px)`,
                borderRadius: '3px 0 0 3px',
                boxShadow: '-3px 0 8px rgba(15,28,46,0.16)',
                zIndex: 1,
              },
            }}
          >
            <FlipOverlay flipping={flipping} flipDir={flipDir} />

            <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2.75} sx={{ flexShrink: 0 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: colors.orangeDeep }}>
                  {showLedger ? 'Field journal · closing entry' : `Field journal · ${traitLabel} · page ${page + 1} of 2`}
                </Typography>
                <Typography sx={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 31, letterSpacing: '-0.02em', color: PAPER.ink, mt: 0.6, lineHeight: 1.1 }}>
                  {showLedger ? 'The Commitment' : page === 0 ? 'Their Side of It' : 'The Adjustment'}
                </Typography>
                {showLedger && (
                  <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 14.5, color: PAPER.muted, mt: 0.6 }}>
                    Three promises, one signature.
                  </Typography>
                )}
              </Box>
              {!showLedger && row && (
                <Stack direction="row" spacing={2.75} sx={{ flexShrink: 0 }}>
                  {[
                    { label: 'Compass', value: Math.round(row.team.lepScore) },
                    { label: 'Effort', value: Math.round(row.team.effort) },
                    { label: 'Efficacy', value: Math.round(row.team.efficacy) },
                  ].map((s) => (
                    <Stack key={s.label} alignItems="flex-end" spacing={0.4}>
                      <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: PAPER.sepia }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em', color: PAPER.ink2, fontVariantNumeric: 'tabular-nums' }}>
                        {s.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>

            <Box sx={{ height: '1px', bgcolor: PAPER.rule, mt: 2.75, flexShrink: 0 }} />

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {!showLedger && page === 0 && (
                <Box sx={{ mt: 3, flexShrink: 0 }}>
                  <SectionLabel sealed={p1Sealed} roman="I">What they told us</SectionLabel>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))', gap: 1.25, mt: 1.5 }}>
                    {notes.map((n) => {
                      const { short, truncated } = truncateNote(n.text);
                      return (
                        <Box
                          key={n.who}
                          sx={{
                            bgcolor: PAPER.field,
                            border: `1px solid ${PAPER.noteBorder}`,
                            borderRadius: '3px',
                            p: '11px 12px 10px',
                            boxShadow: '0 5px 12px rgba(15,28,46,0.07)',
                            transform: `rotate(${n.tilt})`,
                          }}
                        >
                          <Typography sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.orangeDeep }}>
                            {n.who}
                          </Typography>
                          <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.45, color: PAPER.ink2, mt: 0.75 }}>
                            {short}
                          </Typography>
                          {truncated && (
                            <Box component="button" type="button" onClick={() => setNoteOpen(n)} sx={{ all: 'unset', cursor: 'pointer', fontFamily: fonts.sans, fontSize: 11, fontWeight: 700, color: colors.orangeDeep, mt: 0.5 }}>
                              Read all →
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {!showLedger && (
                <Box sx={{ mt: page === 0 ? 3 : 2, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <SectionLabel sealed={pageSealed} roman={page === 0 ? 'I' : 'II'}>
                        {page === 0 ? 'I · Stand where they stand' : 'II · Adjust'}
                      </SectionLabel>
                  <Stack spacing={page === 0 ? 2.25 : 2} sx={{ mt: page === 0 ? 2.25 : 2, flex: 1, minHeight: 0 }}>
                    {(page === 0 ? FIELD_PROMPTS.page1 : FIELD_PROMPTS.page2).map((prompt) => (
                      <PromptBlock
                        key={prompt.key}
                        prompt={prompt}
                        traitLabel={traitLabel}
                        value={plan[prompt.key]}
                        editing={readOnly ? null : editing}
                        draft={draft}
                        onDraft={setDraft}
                        onFocus={(key) => {
                          setEditing(key);
                          if (!draft && plan[key]) setDraft(plan[key]);
                        }}
                        onSave={() => saveField(prompt.key)}
                        onEdit={openEdit}
                        fieldH={page === 0 ? 'clamp(66px, 11vh, 132px)' : 'clamp(54px, 5.6vh, 96px)'}
                      />
                    ))}
                  </Stack>

                  {page === 1 && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${PAPER.rule}`, flexShrink: 0 }}>
                      <SectionLabel>The commitment</SectionLabel>
                      <Stack spacing={2} sx={{ mt: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 18.5, color: PAPER.ink }}>
                            Where will this land next cycle?
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                            <Stack direction="row" alignItems="baseline" spacing={1.1} sx={{ flexShrink: 0 }}>
                              <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 22, color: PAPER.sepia, fontVariantNumeric: 'tabular-nums' }}>
                                {currentScore}
                              </Typography>
                              <Typography sx={{ fontFamily: fonts.mono, fontSize: 11, color: PAPER.sepia }}>→</Typography>
                              <Typography sx={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: PAPER.ink2, fontVariantNumeric: 'tabular-nums' }}>
                                {goalVal}
                              </Typography>
                            </Stack>
                            <Slider
                              min={goalMin(currentScore)}
                              max={100}
                              value={goalVal}
                              disabled={readOnly}
                              onChange={(_, v) => {
                                patchPlan(row.trait, { commitGoal: v });
                                setEditing('commitGoal');
                              }}
                              sx={{ flex: 1, color: colors.orangeDeep, minWidth: 0 }}
                            />
                          </Stack>
                        </Box>
                        <Box>
                          <Typography sx={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 18.5, lineHeight: 1.32, color: PAPER.ink }}>
                            How would you like to communicate your commitment to your team?{' '}
                            <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: PAPER.sepia }}>
                              (they will see this)
                            </Box>
                          </Typography>
                          {String(plan.commitMessage || '').trim() && editing !== 'commitMessage' ? (
                            <Box sx={{ mt: 1.25, bgcolor: PAPER.field, borderLeft: `3px solid ${colors.orangeDeep}`, pl: 2, pr: 2, py: 1.5, borderRadius: '0 8px 8px 0' }}>
                              <Box
                                component="button"
                                type="button"
                                onClick={() => openEdit('commitMessage')}
                                sx={{
                                  all: 'unset',
                                  cursor: readOnly ? 'default' : 'pointer',
                                  fontFamily: fonts.serif,
                                  fontStyle: 'italic',
                                  fontSize: 18,
                                  lineHeight: 1.6,
                                  color: PAPER.ink,
                                  animation: 'fjInkIn 560ms ease both',
                                }}
                              >
                                &#8220;{plan.commitMessage}&#8221;
                              </Box>
                            </Box>
                          ) : !readOnly && (
                            <Stack direction="row" spacing={1.1} alignItems="flex-end" sx={{ mt: 1.1 }}>
                              <Box
                                component="textarea"
                                value={editing === 'commitMessage' ? draft : plan.commitMessage}
                                placeholder="Expect me to…"
                                onChange={(e) => {
                                  setEditing('commitMessage');
                                  setDraft(e.target.value);
                                }}
                                onFocus={() => {
                                  setEditing('commitMessage');
                                  setDraft(plan.commitMessage || '');
                                }}
                                sx={{
                                  flex: 1,
                                  height: 'clamp(70px, 7vh, 110px)',
                                  resize: 'none',
                                  fontFamily: fonts.serif,
                                  fontSize: 15.5,
                                  lineHeight: 1.55,
                                  bgcolor: PAPER.field,
                                  border: `1px solid ${PAPER.rule}`,
                                  borderRadius: radii.md,
                                  p: '12px 15px',
                                  outline: 'none',
                                  '&:focus': { borderColor: colors.orangeDeep },
                                }}
                              />
                              <Box component="button" type="button" onClick={() => saveField('commitMessage')} sx={{ all: 'unset', cursor: 'pointer', bgcolor: colors.navy900, color: PAPER.buttonText, fontFamily: fonts.sans, fontWeight: 700, fontSize: 12.5, px: 2, py: 1.4, borderRadius: radii.pill, boxShadow: shadows.buttonPrimary }}>
                                Write it in →
                              </Box>
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {showLedger && (
                <Box sx={{ mt: 1, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.65, color: PAPER.ink2 }}>
                    {readOnly || signed
                      ? 'Signed and dated. These hold until the next reading of the signal.'
                      : 'This is the whole entry. Three traits, three numbers, three sentences your team will actually hear.'}
                  </Typography>
                  {orderedRows.map((r) => {
                    const p = { ...EMPTY_PLAN, ...(plans[r.trait] || {}) };
                    const cur = Math.round(r.team.lepScore);
                    const goal = Number.isFinite(p.commitGoal) ? p.commitGoal : defaultGoal(cur);
                    const name = r.subTrait || r.trait;
                    return (
                      <Box key={r.trait} sx={{ mt: 2.75, pb: 2.25, borderBottom: `1px solid ${PAPER.hairline}` }}>
                        <Stack direction="row" alignItems="baseline" spacing={1.75}>
                          <Typography sx={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 13.5, color: PAPER.ink }}>{name}</Typography>
                          <Typography sx={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.orangeDeep }}>
                            {cur} → {goal}
                          </Typography>
                          <Box sx={{ flex: 1, height: '1px', bgcolor: PAPER.hairline }} />
                          {!readOnly && (
                            <Box
                              component="button"
                              type="button"
                              onClick={() => {
                                const idx = orderedRows.findIndex((x) => x.trait === r.trait);
                                navigateTo({ kind: 'trait', traitIndex: idx, page: 1 });
                              }}
                              sx={{ all: 'unset', cursor: 'pointer', fontFamily: fonts.sans, fontSize: 11.5, fontWeight: 700, color: PAPER.muted }}
                            >
                              Open the page →
                            </Box>
                          )}
                        </Stack>
                        <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.6, color: PAPER.ink2, mt: 1.1 }}>
                          {String(p.commitMessage || '').trim() ? `“${p.commitMessage}”` : 'No commitment written yet.'}
                        </Typography>
                      </Box>
                    );
                  })}
                  {!readOnly && (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2.5} sx={{ mt: 3.25, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 14, color: PAPER.sepia, maxWidth: 420 }}>
                        {signed
                          ? 'Sent to your next check-in. Your team sees the three commitments — not your notes.'
                          : 'Signing sends the three commitments to your team at the next check-in. The rest of this journal stays yours.'}
                      </Typography>
                      <Box
                        component="button"
                        type="button"
                        disabled={!allDone && !signed}
                        onClick={() => {
                          if (!allDone) {
                            if (nextIncompleteTrait >= 0) navigateTo({ kind: 'trait', traitIndex: nextIncompleteTrait, page: 0 });
                            return;
                          }
                          onSign();
                        }}
                        sx={{
                          all: 'unset',
                          cursor: allDone ? 'pointer' : 'pointer',
                          opacity: allDone ? 1 : 0.5,
                          bgcolor: colors.navy900,
                          color: PAPER.buttonText,
                          fontFamily: fonts.sans,
                          fontWeight: 700,
                          fontSize: 14.5,
                          letterSpacing: '0.03em',
                          px: 3.75,
                          py: 1.75,
                          borderRadius: radii.pill,
                          boxShadow: '0 10px 24px rgba(15,28,46,0.28)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signed ? 'Signed ✓' : allDone ? 'Sign the entry' : `Finish ${orderedRows[nextIncompleteTrait]?.subTrait || orderedRows[nextIncompleteTrait]?.trait || 'trait'} first`}
                      </Box>
                    </Stack>
                  )}
                </Box>
              )}
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{
                flexShrink: 0,
                mt: showLedger ? 4 : page === 0 ? 2.25 : 1.5,
                pt: 1.75,
                borderTop: `1px solid ${PAPER.rule}`,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={goBack}
                disabled={!showLedger && traitIdx === 0 && page === 0}
                sx={{
                  all: 'unset',
                  cursor: showLedger || traitIdx > 0 || page > 0 ? 'pointer' : 'default',
                  opacity: !showLedger && traitIdx === 0 && page === 0 ? 0.45 : 1,
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: PAPER.muted,
                }}
              >
                ‹{' '}
                {showLedger
                  ? `Back to ${orderedRows[orderedRows.length - 1].subTrait || orderedRows[orderedRows.length - 1].trait}`
                  : page === 1
                    ? 'Back to their side of it'
                    : traitIdx > 0
                      ? `Back to ${orderedRows[traitIdx - 1].subTrait || orderedRows[traitIdx - 1].trait}`
                      : 'Back to the reading'}
              </Box>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: PAPER.sepia, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showLedger ? (signed || readOnly ? 'Entry signed' : 'Awaiting signature') : `Page ${page + 1} of 2`}
              </Typography>
              {!showLedger && !readOnly && (
                <Box
                  component="button"
                  type="button"
                  onClick={goForward}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    opacity: pageSealed ? 1 : 0.55,
                    bgcolor: colors.navy900,
                    color: PAPER.buttonText,
                    fontFamily: fonts.sans,
                    fontWeight: 700,
                    fontSize: 14,
                    px: 3.25,
                    py: 1.5,
                    borderRadius: radii.pill,
                    boxShadow: '0 10px 24px rgba(15,28,46,0.28)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {forwardLabel}
                </Box>
              )}
              {(showLedger || readOnly) && <Box sx={{ width: 120 }} />}
            </Stack>
          </Box>
        </Box>
      </Box>
      </Box>
      <NoteModal note={noteOpen} onClose={() => setNoteOpen(null)} />
    </Box>
  );
}

export { planComplete, page1Done, page2Done, EMPTY_PLAN };
