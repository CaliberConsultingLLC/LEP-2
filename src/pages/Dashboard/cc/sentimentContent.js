// Sentiment — the three questions and the answers behind them.
//
// One trait, three fixed questions, in a fixed order that walks the leader
// toward the empathize moment: what it is like to be led by them → what they
// are getting right → what their team sees that they do not.
//
// Every answer is four parts, and the order never changes:
//   verdict   one sentence, no numbers, said the way the team would say it
//   para1     the data in the team's terms — statements and scores, cited
//   para2     the trait taught through that lived experience
//   evidence  the rows the two paragraphs were written from
//
// Data always comes before teaching. Nothing here is a to-do; Practice owns
// those. Everything derives from the same rows Evidence reads, so the prose
// and the numbers under it can never drift apart.

import traitSystem from '../../../data/traitSystem.js';
import { zoneFor } from './evidenceDial.js';

// ---------------------------------------------------------------------------
// The questions — fixed set, fixed order, identical across every trait.
// ---------------------------------------------------------------------------

export const SENTIMENT_QUESTIONS = [
  { id: 'q01', num: '01', text: 'What is it like being led by me?' },
  { id: 'q02', num: '02', text: 'What parts of this am I getting right?' },
  { id: 'q03', num: '03', text: 'What does my team see that I don’t?' },
];

export const SENTIMENT_FOOTNOTE =
  'Every answer is built from the five statements your team rated in Evidence. Ask a question of your own in the guide.';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const round = (n) => Math.round(Number(n) || 0);
const quote = (s) => `“${String(s || '').trim().replace(/\.$/, '')}”`;

export const signedGap = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

/** Trait-level definition, pulled from the same system the statements come from. */
function subTraitFor(row) {
  const norm = (v) => String(v || '').trim().toLowerCase();
  const traits = traitSystem?.CORE_TRAITS || [];
  const trait = traits.find((t) => t.id === row?.traitId || norm(t.name) === norm(row?.trait));
  if (!trait) return null;
  return (
    trait.subTraits?.find((s) => s.id === row?.subTraitId || norm(s.name) === norm(row?.subTrait)) || null
  );
}

/**
 * The definition read back as a sentence, so it can open the teaching
 * paragraph: "Clarity is the ability to break down complex concepts…"
 */
function definitionClause(sub, label) {
  const raw = String(sub?.definition || sub?.shortDescription || '').trim();
  if (!raw) return `${label} is the part of your leadership your team feels before they can name it.`;
  const body = raw.replace(/\.$/, '');
  const lead = /^[A-Z][a-z]/.test(body) ? body.charAt(0).toLowerCase() + body.slice(1) : body;
  return `${label} is ${lead}.`;
}

// ---------------------------------------------------------------------------
// Zone-keyed voice. The zone sets tone — candid on the off-target side,
// protective on the natural side — and never changes the structure.
// ---------------------------------------------------------------------------

const LIVED_EXPERIENCE = {
  honed: {
    verdict: 'Dependable. They know what they are getting from you here.',
    teach:
      'When the work and the result both read high, people stop rationing what they bring you. That is the return on effort in this trait — not the score, the traffic.',
  },
  natural: {
    verdict: 'Easy to be around on this, and they do not see you straining for it.',
    teach:
      'A trait that lands without visible effort stops looking like a skill to the people receiving it. It holds right up until the week you are stretched thin and stop doing it by reflex.',
  },
  offtarget: {
    verdict: 'They can see you working at this, and it is not reaching them.',
    teach:
      'This trait is judged on what settles afterward, not on the effort during. Your team is describing the quiet after, which is the harder half to see from where you stand — and the more accurate measure of it.',
  },
  missing: {
    verdict: 'Quiet. This part of you does not show up in their week.',
    teach:
      'Where a trait does not register, people fill the space with their own guess about what you want. That guess is what they are actually being led by.',
  },
};

// ---------------------------------------------------------------------------
// Q01 · What is it like being led by me?
//   Evidence: all five statements, sorted by team effectiveness, descending.
// ---------------------------------------------------------------------------

function buildQ01(ctx) {
  const { label, statements, zone, definition } = ctx;
  const ranked = [...statements].sort((a, b) => b.efficacy - a.efficacy);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const spread = top.efficacy - bottom.efficacy;
  const avg = round(ranked.reduce((s, x) => s + x.efficacy, 0) / (ranked.length || 1));
  const voice = LIVED_EXPERIENCE[zone.id] || LIVED_EXPERIENCE.missing;

  const para1 =
    spread >= 12
      ? `The five statements behind ${label} do not land at the same height. Your team rates ${quote(top.text)} at ${top.efficacy} and ${quote(bottom.text)} at ${bottom.efficacy} — a ${spread}-point spread inside one trait. Averaged, the five come to ${avg}, but nobody experiences an average. They experience the bottom of that list on the days it matters.`
      : `The five statements behind ${label} land at close to the same height. ${quote(top.text)} reads highest at ${top.efficacy}, ${quote(bottom.text)} lowest at ${bottom.efficacy}, and the five average ${avg}. There is no single weak spot here — this is one consistent experience, repeated five times.`;

  return {
    verdict: voice.verdict,
    para1,
    para2: `${definition} ${voice.teach}`,
    evidence: {
      descriptor: 'all five statements, as your team rated them',
      columns: ['team'],
      rows: ranked.map((s) => ({
        text: s.text,
        team: s.efficacy,
        cited: s === top || s === bottom,
      })),
      footer: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Q02 · What parts of this am I getting right?
//   Evidence: the top three by team effectiveness.
// ---------------------------------------------------------------------------

function buildQ02(ctx) {
  const { label, statements, definition } = ctx;
  const ranked = [...statements].sort((a, b) => b.efficacy - a.efficacy).slice(0, 3);
  const [first, second] = ranked;

  const verdict =
    first.efficacy >= 65
      ? 'This is the part of you they would defend to somebody else.'
      : first.efficacy >= 45
        ? 'There is ground here they can stand on.'
        : 'Even at its strongest this is thin — but it is real, and it is yours.';

  const effortLine =
    first.efficacy >= first.effort
      ? `You get more back than you put in on that one: effort reads ${first.effort}, effectiveness ${first.efficacy}.`
      : `It costs you — effort reads ${first.effort} against effectiveness of ${first.efficacy} — and it is still the strongest thing you do here.`;

  const para1 = `Your team's highest read in ${label} is ${quote(first.text)} at ${first.efficacy}${
    second ? `, with ${quote(second.text)} behind it at ${second.efficacy}` : ''
  }. ${effortLine}`;

  const para2 = `${definition} What sits at the top of that list is what your team can predict about you, and predictability is most of what this trait buys. They are not saying these moments were remarkable. They are saying these are the ones they no longer brace for.`;

  return {
    verdict,
    para1,
    para2,
    evidence: {
      descriptor: 'what your team rates highest',
      columns: ['effort', 'team'],
      rows: ranked.map((s, i) => ({
        text: s.text,
        effort: s.effort,
        team: s.efficacy,
        cited: i < 2,
      })),
      footer: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Q03 · What does my team see that I don't?
//   Evidence: the three widest splits between the leader's rating and theirs.
//   Gap is team minus self, so it reads negative when the team scores lower.
// ---------------------------------------------------------------------------

function q03Evidence(ranked, footer) {
  return {
    descriptor: 'the widest splits between your rating and theirs',
    columns: ['self', 'team', 'gap'],
    rows: ranked.map((s, i) => ({
      text: s.text,
      self: s.efficacySelf,
      team: s.efficacy,
      gap: s.gap,
      cited: i < 2,
    })),
    footer,
  };
}

function buildQ03(ctx) {
  const { label, statements, definition, hasSelfData, traitGap } = ctx;

  const ranked = [...statements]
    .map((s) => ({ ...s, gap: s.efficacy - s.efficacySelf }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 3);
  const [first, second] = ranked;
  const widest = Math.abs(first?.gap || 0);

  const footer = !hasSelfData
    ? 'Your own rating of this trait is missing, so there is nothing to hold theirs against.'
    : traitGap > 0
      ? `Across the whole trait you read yourself ${traitGap} points lower than your team does.`
      : traitGap < 0
        ? `Across the whole trait you read yourself ${Math.abs(traitGap)} points higher than your team does.`
        : 'Across the whole trait your reading and theirs land on the same number.';

  if (!hasSelfData) {
    return {
      verdict: 'They answered. You have not, so there is nothing yet to hold it against.',
      para1: `This question is the distance between your rating of ${label} and theirs, statement by statement. Your team has given all five — the rows below are what they said. Your own reading is the half that is missing.`,
      para2: `${definition} Their rating measures what arrived; yours measures what you intended. The distance between the two is the only place this question can be answered, and it opens the moment you take your own assessment.`,
      evidence: q03Evidence(ranked, footer),
    };
  }

  if (widest < 8) {
    return {
      verdict: 'Nothing hidden here. You and they are reading the same page.',
      para1: `The widest split in ${label} is ${widest} points, on ${quote(first.text)} — you at ${first.efficacySelf}, them at ${first.efficacy}. Nothing else in the trait separates further than that. Your read and theirs are describing the same thing.`,
      para2: `${definition} Alignment on a trait is worth as much as a high score on it: it means your instrument is calibrated. What you feel about ${label.toLowerCase()} is what lands, so you can trust your own sense of when it slips instead of waiting to be told.`,
      evidence: q03Evidence(ranked, footer),
    };
  }

  const overread = first.gap < 0;
  const repeat =
    second && Math.abs(second.gap) >= 6
      ? ` It repeats, smaller, on ${quote(second.text)} — ${Math.abs(second.gap)} points in the same direction.`
      : '';

  return {
    verdict: overread
      ? 'Something you count as handled that they are still carrying.'
      : 'They think better of you here than you do.',
    para1: overread
      ? `You rated yourself ${first.efficacySelf} on ${quote(first.text)}. Your team rated the same statement ${first.efficacy}. That ${widest}-point split is the widest in the trait.${repeat} The moment you consider finished is the one they do not feel finished.`
      : `You rated yourself ${first.efficacySelf} on ${quote(first.text)}. Your team rated it ${first.efficacy} — ${widest} points above your own reading, and the widest split in the trait.${repeat} You are discounting something they can name.`,
    para2: overread
      ? `${definition} It is judged from the receiving end, not the giving end. Your rating measures what you intended and what it cost you; theirs measures what actually arrived. When the two separate this far, the arrival is the fact, and their number is the one to plan against.`
      : `${definition} You are grading yourself on the moments you noticed yourself fall short, because those are the ones you remember. Your team is grading the whole record, and they hold more of it than you do. Their number is not flattery — it is a longer sample.`,
    evidence: q03Evidence(ranked, footer),
  };
}

// ---------------------------------------------------------------------------
// Guide — how to read the question, never a restatement of the answer.
// ---------------------------------------------------------------------------

const GUIDE_LINES = {
  q01: {
    text: 'Read the spread before the average. The bottom of that list is what a hard week with you feels like.',
    pose: 'read',
  },
  q02: {
    text: 'Not a victory lap. This is the ground the third question asks you to stand on.',
    pose: 'lantern',
  },
  q03: {
    text: 'Sit with this one. It is the question your team answered loudest, and the one Practice picks up next.',
    pose: 'point',
  },
};

export function sentimentGuideLine(questionId) {
  return GUIDE_LINES[questionId] || GUIDE_LINES.q01;
}

// ---------------------------------------------------------------------------
// The whole page's copy for one trait.
// ---------------------------------------------------------------------------

/**
 * @param {object}  row         a useBenchmarkData() row (needs row.team)
 * @param {Array}   statements  mapRowStatements(row) — five, team and self
 * @param {boolean} hasSelfData whether the leader's own assessment exists
 */
export function buildSentiment(row, statements, hasSelfData) {
  const label = row?.subTrait || row?.trait || 'This trait';
  const zone = zoneFor(round(row?.team?.effort), round(row?.team?.efficacy));
  const definition = definitionClause(subTraitFor(row), label);
  const traitGap = hasSelfData ? round(row?.team?.efficacy) - round(row?.self?.efficacy) : 0;

  const ctx = { label, statements, zone, definition, hasSelfData, traitGap };

  return {
    label,
    zone,
    scores: {
      compass: round(row?.team?.lepScore),
      effort: round(row?.team?.effort),
      efficacy: round(row?.team?.efficacy),
    },
    answers: {
      q01: buildQ01(ctx),
      q02: buildQ02(ctx),
      q03: buildQ03(ctx),
    },
  };
}
