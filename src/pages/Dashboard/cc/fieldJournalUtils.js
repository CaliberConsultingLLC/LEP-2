import { mapRowStatements } from './EvidenceView.jsx';

export const EMPTY_PLAN = {
  envisionExperience: '',
  envisionWant: '',
  rootSelection: '',
  rootCustom: '',
  branchBehavior: '',
  branchSignal: '',
  commitGoal: null,
  commitMessage: '',
  savedAt: '',
};

export const page1Done = (p) =>
  Boolean(String(p?.envisionExperience || '').trim() && String(p?.envisionWant || '').trim());

export const page2Done = (p) =>
  Boolean(
    String(p?.branchBehavior || '').trim() &&
      String(p?.branchSignal || '').trim() &&
      String(p?.commitMessage || '').trim()
  );

export const planComplete = (p) => page1Done(p) && page2Done(p) && Number.isFinite(p?.commitGoal);

export const defaultGoal = (current) => Math.min(96, Math.round(current) + 8);

export const goalMin = (current) => Math.max(0, Math.round(current) - 5);

const NOTE_TILTS = ['-0.5deg', '0.4deg', '-0.3deg'];

export function pickEvidenceNotes(row) {
  const stmts = mapRowStatements(row);
  const ranked = [...stmts]
    .map((s, i) => ({
      who: `Statement ${i + 1}`,
      text: String(s.text || '').trim(),
      gap: Math.abs(Math.round(s.compassSelf || s.compass) - Math.round(s.compass)),
    }))
    .filter((s) => s.text)
    .sort((a, b) => b.gap - a.gap);
  return ranked.slice(0, 3).map((s, i) => ({
    who: s.who,
    text: s.text,
    tilt: NOTE_TILTS[i] || '0deg',
  }));
}

export function truncateNote(text, max = 86) {
  const t = String(text || '').trim();
  if (t.length <= max) return { short: t, truncated: false };
  return { short: `${t.slice(0, 82).trim()}…`, truncated: true };
}

/** Imperfect paper edge — left binding stays straight. */
export function paperClipPath() {
  const amp = 1.65;
  const wobble = (i, seed) => amp * (Math.sin(i * 0.55 + seed) + 0.45 * Math.sin(i * 1.15 + seed * 0.7));
  const pts = [];
  for (let i = 0; i <= 34; i += 1) {
    const x = (i / 34) * 100;
    pts.push(`${x.toFixed(2)}% ${(2 + wobble(i, 0)).toFixed(2)}px`);
  }
  for (let i = 1; i <= 26; i += 1) {
    const y = (i / 26) * 100;
    pts.push(`calc(100% - ${(0.5 + wobble(i, 1)).toFixed(2)}px) ${y.toFixed(2)}%`);
  }
  for (let i = 33; i >= 0; i -= 1) {
    const x = (i / 34) * 100;
    pts.push(`${x.toFixed(2)}% calc(100% - ${(2 + wobble(i, 2)).toFixed(2)}px)`);
  }
  pts.push('0% 0px');
  return `polygon(${pts.join(',')})`;
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
  waxText: '#f7dcc0',
  buttonText: '#f7f1e4',
  success: '#2f855a',
};

export const BOOKMARK_GRADIENTS = [
  'linear-gradient(180deg, #e07a3f, #c0612a)',
  'linear-gradient(180deg, #2b4a7a, #10223c)',
  'linear-gradient(180deg, #d1a05e, #b07f3c)',
];

export const FIELD_LEAD_INS = {
  envisionExperience: 'From where they sat, ',
  envisionWant: 'What they want most from me is ',
  branchBehavior: 'I will ',
  branchSignal: 'To hold it, ',
};

export const FIELD_PROMPTS = {
  page1: [
    {
      key: 'envisionExperience',
      q: (trait) => `Regarding ${trait}, what are they expecting?`,
      ph: 'From where they sat, it felt…',
    },
    {
      key: 'envisionWant',
      q: () => 'In their words, what do they want most from you?',
      ph: 'They want me to…',
    },
  ],
  page2: [
    {
      key: 'branchBehavior',
      q: (trait) => `Regarding ${trait}, what behavior changes?`,
      ph: 'I will…',
    },
    {
      key: 'branchSignal',
      q: () => 'How and when do you plan to put this into practice?',
      ph: 'Every week I will…',
    },
  ],
};
