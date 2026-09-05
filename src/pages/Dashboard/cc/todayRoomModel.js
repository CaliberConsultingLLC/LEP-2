/**
 * What the Today room needs to draw itself, and where it comes from.
 *
 * The room is one component across four moments and two themes. Everything
 * that changes between them — the pose, the eyebrow, the headline, which card
 * sits under the headline, what the footer counts — is decided here so the
 * component itself only has to lay things out.
 *
 * Two builders produce the same shape: `buildTodayView` reads the running
 * session, `demoTodayView` returns the fixture the mockups were drawn from.
 * The catalog uses the second so a design change can be looked at without
 * playing a year of the product to reach the state.
 */

import { guideImage } from '../../../data/guideArt';
import { JOURNEY_STATIONS } from '../journey/journeyModel.js';

export const MOMENTS = ['listening', 'reading', 'notes', 'plan'];
export const THEMES = ['night', 'day'];

/** The clock picks the theme. Lantern hours run 18:00–06:00. */
export function themeForClock(date = new Date()) {
  const hour = date.getHours();
  return hour >= 18 || hour < 6 ? 'night' : 'day';
}

const WATCH = { night: 'Night watch', day: 'Day watch' };

/**
 * Where each moment sits on the year. The station list highlights this row and
 * counts the ones behind it as walked.
 */
const STATION_FOR_MOMENT = {
  listening: 3, // Campaign Assessment
  reading: 4,   // Review & Reflect
  notes: 5,     // Action Plan
  plan: 6,      // Check-In Assessment
};

/** Owl pose per moment. `plan` changes pose with the light — the mocks do. */
const POSE_FOR_MOMENT = {
  listening: () => 'armsCross',
  reading: () => 'read',
  notes: () => 'lantern',
  plan: (theme) => (theme === 'night' ? 'point' : 'idle'),
};

const ASIDE = {
  listening: {
    night: 'Nothing to read yet. That is the point of a listening window.',
    day: 'Nothing to read yet. Go run your day; the window runs itself.',
  },
  reading: {
    night: 'Reading is the work tonight. The plan comes after — not before.',
    day: 'Reading is the work this morning. The plan comes after — not before.',
  },
  notes: {
    night: 'Writing it down is not the same as doing it. But it is where doing starts.',
    day: 'Writing it down is not the same as doing it. But it is where doing starts.',
  },
  plan: {
    night: 'We’ll email this to you. Come back when the check-in opens — or don’t. Both are fine.',
    day: 'We’ll email this to you. Come back when the check-in opens — or don’t. Both are fine.',
  },
};

const FOOTER_LABEL = {
  listening: () => 'Team link',
  reading: () => 'Read so far',
  notes: () => 'Practices written',
  plan: (theme) => (theme === 'night' ? 'Tonight’s log' : 'Today’s log'),
};

const NUMBER_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const spellLower = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0 || v > 12) return String(n ?? '');
  return NUMBER_WORD[v];
};
const spell = (n) => {
  const word = spellLower(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const LOCK_PHRASE = 'Finalize Assessment';

/** Progressive feedback under the lock-in field. Empty until they start typing. */
export function lockHint(text, ready, outstanding = 0) {
  if (ready) {
    return outstanding > 0
      ? `Ready. This closes the window for the ${outstanding === 1 ? 'one who has' : `${spellLower(outstanding)} who have`} not answered.`
      : 'Ready. This calculates the results and closes the window.';
  }
  return String(text || '').trim() ? 'Keep typing — the phrase has to match exactly.' : '';
}

const list = (names) => {
  const clean = names.filter(Boolean);
  if (clean.length <= 1) return clean[0] || '';
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
};

/**
 * The guide's line. It reads the same state the leader is looking at, so it
 * names the trait they skipped rather than a trait the fixture happened to
 * hard-code.
 */
function owlLineFor(moment, theme, view) {
  const traits = view.traits || [];
  switch (moment) {
    case 'listening': {
      const out = Math.max(0, (view.invited || 0) - (view.responded || 0));
      if (!out) return 'Everyone answered. Lock it and go read what they said.';
      return `${out === 1 ? 'One is' : `${spell(out)} are`} still out. You can wait, or you can lock it. Either way, do not refresh the page like it owes you money.`;
    }
    case 'reading': {
      const read = traits.filter((t) => t.read).map((t) => t.name);
      const unread = traits.filter((t) => !t.read);
      if (!unread.length) return 'All three read. Now the part that costs something — deciding what to do about it.';
      if (!read.length) return 'None of it read yet. Start anywhere. Start with the dim one, if you want my opinion.';
      return `You read ${list(read)} and skipped the one with the gap. I noticed. So will they.`;
    }
    case 'notes':
      return 'Good notes. Honest ones. Now pick the one sentence your team could actually see you do.';
    case 'plan':
    default:
      return theme === 'night'
        ? 'Nobody climbs at night. Sit. Look at the three rings. The dim one is the one your team is talking about.'
        : 'Morning. Coffee first, then the rings. The dim one is the one your team is talking about.';
  }
}

/** The headline, split so the room can italicise the amber half. */
function headlineFor(moment, theme, view) {
  const name = view.name || 'there';
  switch (moment) {
    case 'listening': {
      // Counts read as words at the sizes a team actually is, and as digits
      // past that — "21 of ten" is worse than either form on its own. A leader
      // who never declared how many they invited gets no denominator at all
      // rather than one we made up.
      const back = Number(view.responded) || 0;
      const out = Number(view.invited) || 0;
      const asWords = back <= 12 && out <= 12;
      const backLabel = asWords ? spell(back) : String(back);
      const outLabel = asWords ? spellLower(out) : String(out);
      return {
        lead: `The team is answering, ${name}.`,
        em: out > 0 ? `${backLabel} of ${outLabel} so far.` : `${backLabel} so far.`,
      };
    }
    case 'reading': {
      const stop = view.traits.find((t) => !t.read) || view.traits[0] || {};
      return { lead: 'You stopped reading at', em: `${stop.name || 'the evidence'}.`, tail: 'Interesting place to stop.' };
    }
    case 'notes':
      return { lead: `You wrote it down, ${name}.`, em: 'Now write what you’ll do.' };
    case 'plan':
    default:
      return {
        lead: `Nothing to unlock ${theme === 'night' ? 'tonight' : 'this morning'}, ${name}.`,
        em: 'Just three things to keep.',
      };
  }
}

function eyebrowFor(moment, theme, view) {
  // The plan moment counts down to the check-in. When there is no close date to
  // count from — a session sealed before that timestamp was recorded — it says
  // what is true instead of inventing a number.
  const days = Number(view.daysToCheckIn);
  const tail = moment === 'listening'
    ? 'the listening window'
    : moment === 'plan'
      ? (Number.isFinite(days) && days > 0 ? `${days} days to the check-in` : 'the plan you are keeping')
      : JOURNEY_STATIONS[STATION_FOR_MOMENT[moment]]?.label || '';
  return `${WATCH[theme]} · Chapter VI · ${tail}`;
}

/**
 * Assembles the view. Callers hand in the raw pieces; everything derived —
 * pose, copy, station index, footer — is filled in here so the two builders
 * cannot drift apart.
 */
function finish(moment, theme, partial) {
  const view = {
    moment,
    theme,
    stationIndex: STATION_FOR_MOMENT[moment],
    daysToCheckIn: 69,
    traits: [],
    ...partial,
  };
  return {
    ...view,
    headline: headlineFor(moment, theme, view),
    eyebrow: eyebrowFor(moment, theme, view),
    owlLine: owlLineFor(moment, theme, view),
    owlSrc: guideImage(view.guideId || 'mentor', POSE_FOR_MOMENT[moment](theme)),
    footerLabel: FOOTER_LABEL[moment](theme),
    aside: ASIDE[moment][theme],
  };
}

// ---------------------------------------------------------------------------
// The fixture the eight mockups were drawn from.
// ---------------------------------------------------------------------------

const DEMO_TRAITS = [
  {
    key: 'clarity',
    name: 'Clarity',
    team: 71,
    self: 77,
    read: true,
    statement: 'When priorities shift, I hear it from Jordan before I hear it from someone else.',
    practice: 'Close every meeting by restating the one thing that changed.',
    notes: [
      'I say the priority changed in the standup and assume that counts as telling people.',
      'Two people asked me the same question on Thursday. That is on me.',
    ],
  },
  {
    key: 'delegation',
    name: 'Delegation',
    team: 58,
    self: 72,
    read: false,
    statement: 'Decisions leave the room with a clear owner and a date.',
    practice: 'Hand off one decision a week I would normally keep — and say so out loud.',
    notes: [
      'I keep the vendor decisions because I am scared of the cleanup if they go wrong.',
      'Priya could own the roadmap call. I know that. I have known that for a year.',
    ],
  },
  {
    key: 'accountability',
    name: 'Accountability',
    team: 64,
    self: 61,
    read: true,
    statement: 'Jordan names a miss before anyone else has to.',
    practice: 'Name the miss first, in the room, without the softener.',
    notes: ['I waited for Sam to bring up the missed date. He should not have had to.'],
  },
];

export function demoTodayView(moment = 'listening', theme = 'night', guideId = 'mentor') {
  return finish(moment, theme, {
    guideId,
    name: 'Jordan',
    responded: 9,
    invited: 11,
    teamLink: 'compass.app/c/9K2F-TEAM',
    traits: DEMO_TRAITS.map((t) => ({ ...t, hasPractice: moment === 'plan' })),
    readingBody: 'Two of three traits read. Nothing written yet, and that is fine — Practice stays shut until the evidence is read. Ten minutes, roughly.',
  });
}

// ---------------------------------------------------------------------------
// The running session.
// ---------------------------------------------------------------------------

/**
 * Which of the four moments the leader is actually in. Reading order matters:
 * the window has to be shut before anything is worth reading, the evidence has
 * to be read before a practice can be written, and three written practices are
 * the only thing that gets you to the last one.
 */
export function momentFor({ campaignClosed, evidenceRead, practiceCount = 0 }) {
  if (!campaignClosed) return 'listening';
  if (!evidenceRead) return 'reading';
  if (practiceCount >= 3) return 'plan';
  return 'notes';
}

/**
 * Builds the view from the pieces the dashboard already has in hand. Nothing
 * here reads storage — the caller does, so the room stays testable and the
 * catalog can hand it a fixture instead.
 */
export function buildTodayView({
  moment,
  theme,
  guideId = 'mentor',
  name = '',
  responded = 0,
  invited = 0,
  teamLink = '',
  traits = [],
  daysToCheckIn = 69,
  readingBody = '',
}) {
  const safeTraits = traits.length
    ? traits
    : DEMO_TRAITS.map((t) => ({ ...t, notes: [], hasPractice: false }));
  const readCount = safeTraits.filter((t) => t.read).length;
  return finish(moment, theme, {
    guideId,
    name: String(name || '').trim().split(/\s+/)[0] || 'there',
    responded,
    invited,
    teamLink,
    traits: safeTraits,
    daysToCheckIn,
    readingBody: readingBody
      || `${spell(readCount)} of ${spellLower(safeTraits.length)} traits read. Practice stays shut until the evidence is read. Ten minutes, roughly.`,
  });
}
