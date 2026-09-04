import { mapRowStatements } from './EvidenceView.jsx';
import { traitKeyFor, statementIdFor } from '../../../utils/campaignResults.js';

export const EMPTY_PLAN = {
  envisionExperience: '',
  envisionWant: '',
  rootSelection: '',
  rootCustom: '',
  branchBehavior: '',
  branchSignal: '',
  commitGoal: null,
  goalSet: false,
  commitMessage: '',
  savedAt: '',
};

export const page1Done = (p) =>
  Boolean(String(p?.envisionExperience || '').trim() && String(p?.envisionWant || '').trim());

// The target is now a step a leader has to land on rather than a slider that
// silently defaults, so `goalSet` is what proves the number was chosen.
export const page2Done = (p) =>
  Boolean(
    String(p?.branchBehavior || '').trim() &&
      String(p?.branchSignal || '').trim() &&
      String(p?.commitMessage || '').trim() &&
      p?.goalSet
  );

export const planComplete = (p) => page1Done(p) && page2Done(p) && Number.isFinite(p?.commitGoal);

export const defaultGoal = (current) => Math.min(96, Math.round(current) + 8);

export const goalMin = (current) => Math.max(0, Math.round(current) - 5);

// ---------------------------------------------------------------------------
// The six steps of one entry, in the order the thread runs them.
// ---------------------------------------------------------------------------

export const STEP_KEYS = [
  'envisionExperience',
  'envisionWant',
  'branchBehavior',
  'branchSignal',
  'commitGoal',
  'commitMessage',
];

export const STEP_DEFS = (traitLabel) => [
  {
    key: 'envisionExperience',
    kind: 'text',
    title: 'Understanding expectations',
    question: `Put yourself in their seat. Regarding ${traitLabel}, what do they expect from you?`,
    cue: 'Describe it the way they would say it — do not fix it yet.',
    placeholder: 'From where they sit, they expect…',
    lines: 5,
    hint: 'Their words, not yours',
  },
  {
    key: 'envisionWant',
    kind: 'text',
    title: 'Understanding wants and needs',
    question: 'Underneath that, what do they most want from you here?',
    cue: 'The simplest thing they are hoping you would do or say.',
    placeholder: 'More than anything, they want me to…',
    lines: 5,
    hint: 'One honest sentence is enough',
  },
  {
    key: 'branchBehavior',
    kind: 'text',
    title: 'Behavior adjustments',
    question: 'Which of your behaviors will change?',
    cue: 'List them. Concrete enough that someone on the team could watch you do it.',
    placeholder: '• I will…',
    lines: 5,
    bullets: true,
    hint: 'Enter adds a bullet',
  },
  {
    key: 'branchSignal',
    kind: 'text',
    title: 'Accountability',
    question: 'How will you keep your feet on the path?',
    cue: 'The habit, its cadence, and how you will know it is holding — who or what keeps you honest.',
    placeholder: 'Every week I will… and I will know it is holding when…',
    lines: 5,
    hint: 'A ritual with a time attached',
  },
  {
    key: 'commitGoal',
    kind: 'goal',
    title: 'Setting a target',
    question: 'Where will this land next cycle?',
    cue: 'Your team scored you here. Name the number you are working toward.',
  },
  {
    key: 'commitMessage',
    kind: 'quote',
    title: 'Your commitment to the team',
    question: 'In one line, what will you tell your team you are committing to?',
    cue: 'They will read exactly this at the next check-in — nothing else from this journal.',
    placeholder: 'Expect me to…',
    lines: 3,
    hint: 'Say it so they could hold you to it',
  },
];

export const stepFilled = (plan, key) =>
  key === 'commitGoal'
    ? Boolean(plan?.goalSet)
    : Boolean(String(plan?.[key] || '').trim());

/** First step of an entry that has nothing written in it yet. */
export const firstUnfilledStep = (plan) => STEP_KEYS.find((k) => !stepFilled(plan, k)) || null;

// Trait accents double as the bookmark colours — the tab a leader reaches for
// is the same colour as the rules on the page it opens.
export const TRAIT_ACCENTS = [
  { accent: '#c0612a', accentHi: '#e07a3f' },
  { accent: '#10223c', accentHi: '#2b4a7a' },
  { accent: '#b07f3c', accentHi: '#d1a05e' },
];

export const BOOKMARK_GRADIENTS = TRAIT_ACCENTS.map(
  (a) => `linear-gradient(180deg, ${a.accentHi}, ${a.accent})`
);

export function truncateNote(text, max = 86) {
  const t = String(text || '').trim();
  if (t.length <= max) return { short: t, truncated: false };
  return { short: `${t.slice(0, Math.max(0, max - 4)).trim()}…`, truncated: true };
}

// ---------------------------------------------------------------------------
// Insights from your results — the two cards at the top of a trait page.
//
// The leader has already read the evidence; these are not a second reading of
// it. Card one is what the whole result set says about this trait — the
// analysis pass is the only thing that sees every trait at once, so its rollup
// (or a cross-cutting pattern that lands here) is the honest answer. Card two
// is the single sharpest number underneath it: the widest self-versus-team gap
// when there is one worth naming, otherwise the lowest-scoring statement.
//
// With no analysis available both cards come from the statements themselves,
// which is thinner but still true. Nothing here is invented.
// ---------------------------------------------------------------------------

const STANDING_LABEL = {
  strength: 'Sentiment · strength',
  liability: 'Sentiment · liability',
  mixed: 'Narrative theme',
};

const responseLine = (n) => {
  const count = Number(n) || 0;
  if (!count) return '';
  return ` · ${count} ${count === 1 ? 'response' : 'responses'}`;
};

const rankedStatements = (row) =>
  mapRowStatements(row)
    .map((s, i) => ({ ...s, index: i, gap: Math.abs(s.compassSelf - s.compass) }))
    .filter((s) => String(s.text || '').trim());

/**
 * @param {object}  args
 * @param {object}  args.row            one benchmark row
 * @param {number}  args.rowIndex       its index in the campaign's row order
 * @param {object}  args.analysis       resultsAnalysis, or null
 * @param {number}  args.respondents    how many teammates answered
 * @returns {Array<{who: string, text: string}>} at most two cards
 */
export function selectTraitInsights({ row, rowIndex = 0, analysis = null, respondents = 0 }) {
  if (!row) return [];
  const statements = rankedStatements(row);
  const traitKey = traitKeyFor(row, rowIndex);
  const cards = [];

  // --- Card one: what the whole result set says about this trait ------------
  const rollup = (analysis?.traitRollups || []).find((r) => r?.id === traitKey);
  if (rollup?.finding) {
    cards.push({
      who: `${STANDING_LABEL[rollup.standing] || 'Narrative theme'}${responseLine(respondents)}`,
      text: String(rollup.finding).trim(),
    });
  } else {
    const statementIds = new Set(statements.map((s) => statementIdFor(row, rowIndex, s.index)));
    const pattern = (analysis?.crossCuttingPatterns || []).find((p) =>
      (p?.appearsIn || []).some((id) => id === traitKey || statementIds.has(id))
    );
    if (pattern?.pattern) {
      cards.push({
        who: `Pattern across traits${responseLine(respondents)}`,
        text: [pattern.pattern, pattern.implication].filter(Boolean).join(' ').trim(),
      });
    }
  }

  // --- Card two: the sharpest number underneath it --------------------------
  const byGap = [...statements].sort((a, b) => b.gap - a.gap)[0];
  const byLow = [...statements].sort((a, b) => a.compass - b.compass)[0];
  const pick = byGap && byGap.gap >= 10 ? byGap : byLow;
  if (pick) {
    const findingId = statementIdFor(row, rowIndex, pick.index);
    const finding = (analysis?.statementFindings || []).find((f) => f?.id === findingId);
    const isGap = pick === byGap && pick.gap >= 10;
    cards.push({
      who: isGap
        ? `Widest gap · Compass ${pick.compass} vs self ${pick.compassSelf}`
        : `Lowest statement · Compass ${pick.compass}`,
      text: finding?.finding
        ? String(finding.finding).trim()
        : `“${pick.text}”`,
    });
  }

  // --- Nothing from the analysis: fall back to the two widest gaps ----------
  if (cards.length < 2) {
    const gaps = [...statements]
      .sort((a, b) => b.gap - a.gap)
      .filter((s) => !cards.some((c) => c.text.includes(s.text)));
    gaps.slice(0, 2 - cards.length).forEach((s) => {
      cards.unshift({
        who: `Statement ${s.index + 1} · Compass ${s.compass}`,
        text: `“${s.text}”`,
      });
    });
  }

  return cards.slice(0, 2);
}

export const PAPER = {
  page: '#fffdf8',
  field: '#fbf7f0',
  cream: '#f0e7d3',
  rule: '#e8dbc3',
  hairline: '#f2e9d8',
  noteBorder: '#ece0c6',
  ring: '#d9c7a0',
  dotted: '#d1bc93',
  ink: '#0f1c2e',
  ink2: '#22364e',
  muted: '#44566c',
  tabMuted: '#6b7c90',
  sepia: '#8a7a5e',
  sepiaSoft: '#a8977a',
  waxText: '#f7dcc0',
  buttonText: '#f7f1e4',
  success: '#2f855a',
};

export const JOURNAL_ASSETS = {
  leather: '/journal/leather.png',
  paper: '/journal/paper.png',
  deboss: '/journal/logo-deboss.png',
};
