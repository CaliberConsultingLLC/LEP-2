// Sentiment — the three questions and the answers behind them.
//
// One trait, three fixed questions, in a fixed order that walks the leader
// toward the empathize moment: what it is like to be led by them → what they
// are getting right → what their team sees that they do not.
//
// Every answer is five parts, and the order never changes:
//   verdict      one line, no numbers, said the way the team would say it
//   definition   what the trait is — the teaching, before the reading
//   reading      what is: the picture their team actually described
//   consequence  what that means from here, on hard data rather than hope
//   chart        the same facts drawn, because a number belongs in a picture
//
// The order is deliberate and it changed. This page used to open with a
// paragraph of scores and close with the teaching, which put the arithmetic in
// front of the meaning and made a page about being led read like a report. It
// now names the trait, describes what their team lives, and then says what
// that leaves open — the shape the intake uses at the trail markers and the
// hazards, run against results instead of predictions.
//
// One rule holds the prose together: **numbers live in the chart, people live
// in the sentences.** "Four of your twenty-one" is a fact a leader can picture.
// "63" is not, and the picture underneath is already saying it better.
//
// Everything derives from the same rows Evidence reads, so the prose and the
// picture under it can never drift apart.

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

const WORDS = [
  'nobody', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve',
];
/** Small counts read as words; a leader thinks in people, not integers. */
const count = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));

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
 * The definition read back as a sentence, so it can open the answer:
 * "Clarity is the ability to break down complex concepts…"
 */
function definitionClause(sub, label) {
  const raw = String(sub?.definition || sub?.shortDescription || '').trim();
  if (!raw) return `${label} is the part of your leadership your team feels before they can name it.`;
  const body = raw.replace(/\.$/, '');
  const lead = /^[A-Z][a-z]/.test(body) ? body.charAt(0).toLowerCase() + body.slice(1) : body;
  return `${label} is ${lead}.`;
}

// ---------------------------------------------------------------------------
// How much the room agreed.
//
// The single most useful thing in this data set and the one that used to be
// thrown away: every respondent's answer is averaged and the spread around
// that average is discarded. A room that all says the same thing about you and
// a room that is split down the middle produce the same score and are not the
// same situation to lead through.
//
// Nothing individual is read here. `agree` and `dissent` are counts, `min` and
// `max` are the ends of a range, and the smallest set that can report a split
// at all is four answers.
// ---------------------------------------------------------------------------

const emptyRoom = { n: 0, agree: 0, dissent: 0, min: 0, max: 0, consensus: 'unknown', split: false };

const roomOn = (statement, axis = 'efficacy') => statement?.shape?.[axis] || emptyRoom;

/** One clause about how the room held together on a statement, or nothing. */
function agreementClause(room, { unanimous, settled, split, scattered }) {
  if (!room || room.n < 3) return '';
  if (room.consensus === 'unanimous') return unanimous || '';
  if (room.consensus === 'settled') return settled || '';
  if (room.consensus === 'split') return split || '';
  if (room.consensus === 'scattered') return scattered || '';
  return '';
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
//   Picture: all five statements, ranked, each with the range the room gave.
// ---------------------------------------------------------------------------

function buildQ01(ctx) {
  const { label, statements, zone, definition } = ctx;
  const ranked = [...statements].sort((a, b) => b.efficacy - a.efficacy);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const spread = top.efficacy - bottom.efficacy;
  const voice = LIVED_EXPERIENCE[zone.id] || LIVED_EXPERIENCE.missing;

  const bottomRoom = roomOn(bottom);
  const topRoom = roomOn(top);
  const lower = label.toLowerCase();

  // What is — the experience, described. The heights are in the chart.
  const shapeLine =
    spread >= 12
      ? `Being led by you on ${lower} is not one experience. It is five, and they do not stand at the same height. ${quote(top.text)} is the part of it your team can lean on without thinking. ${quote(bottom.text)} is where it thins out. Nobody on your team lives at the average of those two — on the week that actually tests you, they live at the bottom of that list.`
      : `Your team describes ${lower} the same way five times over. ${quote(top.text)} reads highest and ${quote(bottom.text)} lowest, but not by much. There is no weak spot hiding in here; this is one consistent experience of you, repeated.`;

  const roomLine =
    agreementClause(bottomRoom, {
      split: `And they are not even of one mind about the thin part. ${count(bottomRoom.dissent)} of your ${bottomRoom.n} answered a long way from where the rest landed, which means this is not something your team has a shared view of — it is arriving differently depending on who you are talking to.`,
      scattered: `Their answers on that thinner part are scattered rather than clustered, which usually means it depends: on the week, on the room, on who is asking.`,
      unanimous: `They agree about it too. Near enough every answer landed in the same narrow band, which makes this the most reliable thing in the whole reading.`,
      settled: `They broadly agree about it, which means what you are reading here is a pattern rather than a mood.`,
    }) ||
    agreementClause(topRoom, {
      unanimous: `They are of one mind about the strongest part of it, which is worth as much as the height.`,
    });

  const consequence =
    spread >= 12
      ? `${voice.teach} Which means the thing to hold is not the headline. It is the distance between the top of that list and the bottom — that distance is what your team is bracing for, and it is the only part of this you can actually move.`
      : `${voice.teach} Consistency like this is an asset and a ceiling at the same time: nothing here will fail you unexpectedly, and nothing here will lift on its own either.`;

  return {
    verdict: voice.verdict,
    definition,
    reading: [shapeLine, roomLine].filter(Boolean).join(' '),
    consequence,
    chart: {
      kind: 'spread',
      caption: 'What your team rated, highest first',
      rows: ranked.map((s) => {
        const room = roomOn(s);
        return { text: s.text, value: s.efficacy, min: room.min, max: room.max };
      }),
      footer: ctx.respondents
        ? `The dot is where your ${ctx.respondents} answers averaged. The line is how far apart they actually were.`
        : 'The dot is the average. The line is how far apart the answers actually were.',
    },
  };
}

// ---------------------------------------------------------------------------
// Q02 · What parts of this am I getting right?
//   Picture: the top three, effort beside effectiveness.
// ---------------------------------------------------------------------------

function buildQ02(ctx) {
  const { label, statements, definition } = ctx;
  const ranked = [...statements].sort((a, b) => b.efficacy - a.efficacy).slice(0, 3);
  const [first, second] = ranked;
  const lower = label.toLowerCase();
  const room = roomOn(first);

  const verdict =
    first.efficacy >= 65
      ? 'This is the part of you they would defend to somebody else.'
      : first.efficacy >= 45
        ? 'There is ground here they can stand on.'
        : 'Even at its strongest this is thin — but it is real, and it is yours.';

  const cheap = first.efficacy >= first.effort;
  const reading = [
    `The steadiest thing you do in ${lower} is ${quote(first.text)}${
      second ? `, with ${quote(second.text)} close behind it` : ''
    }.`,
    cheap
      ? 'It also costs you less than it returns — you are not straining for this one, and it lands anyway.'
      : 'It costs you more than it returns, and it is still the strongest thing you do here. Worth knowing what you are paying for it.',
    agreementClause(room, {
      unanimous: `Your team is unanimous about it, which is rarer than a high number and harder to argue with.`,
      settled: `Enough of them said the same thing that this is not one person's good week.`,
      split: `${count(room.dissent)} of your ${room.n} do not see it that way, though. Even your best ground here is not level for everybody.`,
      scattered: `Their answers are spread, so this reads as something they get from you sometimes rather than reliably.`,
    }),
  ]
    .filter(Boolean)
    .join(' ');

  const consequence = `What sits at the top of that list is what your team can predict about you, and predictability is most of what this trait buys. They are not calling these moments remarkable. They are saying these are the ones they no longer brace for — which is the ground the third question is going to ask you to stand on.`;

  return {
    verdict,
    definition,
    reading,
    consequence,
    chart: {
      kind: 'paired',
      caption: 'What it costs you, beside what it returns',
      rows: ranked.map((s) => ({ text: s.text, effort: s.effort, efficacy: s.efficacy })),
      footer: 'Two bars, one scale. When the lower bar is longer, the trait is giving back more than you are putting in.',
    },
  };
}

// ---------------------------------------------------------------------------
// Q03 · What does my team see that I don't?
//   Picture: the three widest splits, your mark against theirs.
// ---------------------------------------------------------------------------

function q03Chart(ranked, footer) {
  return {
    kind: 'dumbbell',
    caption: 'Your reading against theirs, widest first',
    rows: ranked.map((s) => ({ text: s.text, self: s.efficacySelf, team: s.efficacy })),
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
  const lower = label.toLowerCase();

  const footer = !hasSelfData
    ? 'Your own rating of this trait is missing, so there is nothing to hold theirs against.'
    : traitGap > 0
      ? 'Where the line runs warm, they read you higher than you read yourself.'
      : traitGap < 0
        ? 'Where the line runs cool, you read yourself higher than they read you.'
        : 'Your reading and theirs land on the same number across the trait.';

  if (!hasSelfData) {
    return {
      verdict: 'They answered. You have not, so there is nothing yet to hold it against.',
      definition,
      reading: `This question is the distance between your reading of ${lower} and theirs, statement by statement. Your team has given all five. Your own is the half that is missing, so the picture below has only one mark on each line.`,
      consequence:
        'Their rating measures what arrived; yours measures what you intended. The distance between the two is the only place this question can be answered, and it opens the moment you take your own assessment.',
      chart: q03Chart(ranked, footer),
    };
  }

  if (widest < 8) {
    return {
      verdict: 'Nothing hidden here. You and they are reading the same page.',
      definition,
      reading: `There is no blind spot in ${lower} to find. The furthest your reading and theirs get from each other is on ${quote(first.text)}, and even there they are describing the same thing in almost the same words. Nothing else in the trait separates further than that.`,
      consequence: `Alignment on a trait is worth as much as a high score on it: it means your instrument is calibrated. What you feel about ${lower} is what lands, so you can trust your own sense of when it slips instead of waiting to be told.`,
      chart: q03Chart(ranked, footer),
    };
  }

  const overread = first.gap < 0;
  const room = roomOn(first);
  const repeat =
    second && Math.abs(second.gap) >= 6
      ? ` It repeats, smaller, on ${quote(second.text)} — the same direction, the same misread.`
      : '';

  const roomLine = agreementClause(room, {
    unanimous: ' And they are unanimous about it, so this is not one person with a grievance.',
    settled: ' Enough of them agree about it that this is a pattern rather than a bad week.',
    split: ` Though ${count(room.dissent)} of your ${room.n} are somewhere else entirely on it, so it may be landing for some people and not others.`,
  });

  return {
    verdict: overread
      ? 'Something you count as handled that they are still carrying.'
      : 'They think better of you here than you do.',
    definition,
    reading: overread
      ? `The widest distance in the trait is on ${quote(first.text)}, and it runs the wrong way: you marked it well above where they did.${repeat}${roomLine} The moment you consider finished is the one they do not feel finished.`
      : `The widest distance in the trait is on ${quote(first.text)}, and it runs in your favour — they marked it well above where you did.${repeat}${roomLine} You are discounting something they can name.`,
    consequence: overread
      ? 'This trait is judged from the receiving end, not the giving end. Your rating measures what you intended and what it cost you; theirs measures what actually arrived. When the two separate this far, the arrival is the fact, and their number is the one to plan against.'
      : 'You are grading yourself on the moments you noticed yourself fall short, because those are the ones you remember. Your team is grading the whole record, and they hold more of it than you do. Their number is not flattery — it is a longer sample.',
    chart: q03Chart(ranked, footer),
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
  // How many people are behind the reading.
  //
  // Off a statement, not off the trait: the trait's shape is built from every
  // rating in it, which is five per person, so reading `n` there would tell a
  // leader with twenty-one teammates that a hundred and five people answered.
  const respondents = statements?.[0]?.shape?.efficacy?.n || 0;

  const ctx = { label, statements, zone, definition, hasSelfData, traitGap, respondents };

  return {
    label,
    zone,
    respondents,
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
