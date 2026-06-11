import { getQuadrant } from './quadrants.js';

// ----------------------------------------------------------------------------
// Signal Debrief content — trait roles, narrative stories, check-in reactions,
// and close copy. All narratives are derived from live useBenchmarkData() rows
// (zone via getQuadrant), never hardcoded to a trait index.
// ----------------------------------------------------------------------------

export const fmtGap = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

export const gapOf = (row) => ({
  compass: Math.round((row.self?.lepScore || 0) - (row.team?.lepScore || 0)),
  efficacy: Math.round((row.self?.efficacy || 0) - (row.team?.efficacy || 0)),
  effort: Math.round((row.self?.effort || 0) - (row.team?.effort || 0)),
});

// ----------------------------------------------------------------------------
// Trait roles — lifting / held strength / edge, derived from the data.
//   edge:     the trait most asking for attention (lowest Compass)
//   lifting:  the most "natural gift"-shaped of the rest (efficacy − effort)
//   strength: whatever remains (highest Compass first)
// Walk order is strongest ground first: lifting → strength(s) → edge.
// ----------------------------------------------------------------------------
export function deriveTraitRoles(rows) {
  const withTeam = rows.filter((r) => r.team);
  if (!withTeam.length) return { lifting: null, strength: null, edge: null, ordered: [] };

  const byCompass = [...withTeam].sort((a, b) => a.team.lepScore - b.team.lepScore);
  const edge = byCompass[0];

  const rest = withTeam.filter((r) => r.trait !== edge.trait);
  const byLift = [...rest].sort(
    (a, b) => (b.team.efficacy - b.team.effort) - (a.team.efficacy - a.team.effort)
  );
  const lifting = byLift[0] || edge;
  const strengths = rest
    .filter((r) => r.trait !== lifting.trait)
    .sort((a, b) => b.team.lepScore - a.team.lepScore);
  const strength = strengths[0] || null;

  const ordered = [lifting, ...strengths, edge].filter(
    (r, i, arr) => r && arr.findIndex((x) => x.trait === r.trait) === i
  );
  return { lifting, strength, edge, ordered };
}

const ROLE_EYEBROWS = {
  lifting: "What's Lifting",
  strength: 'The Held Strength',
  edge: 'The Edge',
};

// Zone-keyed narrative templates for the trait walk.
const zoneStory = (row) => {
  const label = row.subTrait || row.trait;
  const e = Math.round(row.team.efficacy);
  const f = Math.round(row.team.effort);
  const zone = getQuadrant(row.team.effort, row.team.efficacy);
  switch (zone.id) {
    case 'naturalGift':
      return {
        headline: `${label} is your natural gift.`,
        serif: `Your team feels the results — and what's striking is how little it seems to cost you. Efficacy of ${e} on effort of just ${f}: you're effective here almost effortlessly.`,
        sans: 'Treat it as leverage. Name it, lean on it, and add just enough intention that it keeps growing instead of quietly coasting. This strength is real — and you\u2019ll need it for what comes next.',
      };
    case 'fullStrength':
      return {
        headline: `${label} is strong because you make it strong.`,
        serif: `Real effort, real results. Your team rates the work at ${f} and the payoff at ${e} — they see you working at this, and they feel it landing.`,
        sans: 'This is the strongest place a trait can be — and the most expensive. Protect it: notice what\u2019s working so you can repeat it, and guard against burnout so a peak doesn\u2019t slowly erode.',
      };
    case 'offTarget':
      return {
        headline: `${label} is working hard — and not landing.`,
        serif: `Here's the hard one, and it deserves honest framing: your team sees the effort (${f}) but isn't feeling the results (${e}). The work is real. The aim needs adjusting.`,
        sans: 'This is not a character flaw — it\u2019s a targeting problem. Don\u2019t add more effort; change the approach. Ask your team what would actually help, and redirect the energy you\u2019re already spending.',
      };
    case 'untapped':
    default:
      return {
        headline: `${label} is quiet ground, not yet claimed.`,
        serif: `Neither much effort (${f}) nor much result (${e}) is showing up here yet. It's not a failure — it's unclaimed ground.`,
        sans: 'Decide whether this trait matters for where you\u2019re headed. If it does, a small, deliberate investment can move it quickly — quiet ground moves fastest.',
      };
  }
};

export function buildTraitStories(roles) {
  return roles.ordered.map((row) => {
    const role =
      row.trait === roles.edge?.trait
        ? 'edge'
        : row.trait === roles.lifting?.trait
        ? 'lifting'
        : 'strength';
    const story = zoneStory(row);
    return {
      row,
      role,
      eyebrow: ROLE_EYEBROWS[role],
      headline: story.headline,
      paras: [story.serif, story.sans],
      zone: getQuadrant(row.team.effort, row.team.efficacy),
    };
  });
}

// ----------------------------------------------------------------------------
// Gap stories — undersell / aligned / oversell, derived per trait.
// ----------------------------------------------------------------------------
const ALIGNED_THRESHOLD = 12;

const gapStoryFor = (row) => {
  const label = (row.subTrait || row.trait).toLowerCase();
  const g = gapOf(row);
  const big = Math.max(Math.abs(g.efficacy), Math.abs(g.effort));

  if (big < ALIGNED_THRESHOLD) {
    return {
      headline: `On ${label}, you see it the same way.`,
      serif: 'Your read and your team\u2019s are close — that shared picture is something to trust.',
      sans: 'The gaps here stay small. When a leader and a team agree this closely, the trait is being practiced in the open — keep doing exactly what makes it visible.',
    };
  }

  if (Math.abs(g.efficacy) >= Math.abs(g.effort)) {
    if (g.efficacy < 0) {
      return {
        headline: `You undersell ${label}.`,
        serif:
          'You\u2019re giving yourself less credit here than your team gives you' +
          (g.effort > 0 ? ' — and carrying more effort than they can see. It\u2019s okay to name that cost out loud.' : ' — let their read land.'),
        sans: `You rated your impact ${Math.abs(g.efficacy)} points below your team's read${
          g.effort > 0 ? `, while feeling ${Math.abs(g.effort)} points more strain` : ''
        }. The strength is more visible to them than it feels to you.`,
      };
    }
    return {
      headline: `You and your team see ${label} differently.`,
      serif:
        'You feel more is landing here than your team is reflecting back — worth getting curious about what they aren\u2019t yet feeling.',
      sans: `You rated your own impact at ${Math.round(row.self.efficacy)}; your team felt ${Math.round(
        row.team.efficacy
      )}. That ${fmtGap(g.efficacy)}-point distance isn't a contradiction — it's the space between what you intend and what arrives, and the most useful conversations live exactly there.`,
    };
  }

  if (g.effort > 0) {
    return {
      headline: `You feel ${label} costing more than they see.`,
      serif: 'You\u2019re carrying more effort than your team can see — it\u2019s okay to name that cost out loud.',
      sans: `You rated the effort ${g.effort} points above their read. Strain that stays invisible doesn't get acknowledged — naming it is part of the practice.`,
    };
  }
  return {
    headline: `Your team feels the work in ${label} more than you do.`,
    serif: 'Their read of your effort is higher than your own — their experience of the work is asking to be acknowledged.',
    sans: `They rated your effort ${Math.abs(g.effort)} points above your own read. The work is landing harder than you think — let that count for something.`,
  };
};

export function buildGapStories(roles) {
  return roles.ordered
    .filter((row) => row.self)
    .map((row) => ({
      row,
      eyebrow: `The Gap · ${row.subTrait || row.trait}`,
      ...gapStoryFor(row),
    }));
}

// ----------------------------------------------------------------------------
// Check-in reactions + tailored guide lines / pause copy / close tones
// ----------------------------------------------------------------------------
export const REACTIONS = [
  {
    id: 'resonates',
    label: 'It resonates',
    sub: 'This matches something I already sensed',
    guideLine:
      'That instinct is worth trusting. When the signal confirms what you sensed, you can move sooner — you\u2019re not starting from zero.',
    pausePage: {
      title: 'You already knew.',
      body: 'Some part of you sensed this before the numbers said it. That matters — it means your read on your own leadership is fundamentally sound, and the signal is sharpening it, not correcting it. The question now isn\u2019t whether the pattern is real. It\u2019s what you want to do with a pattern you can finally see clearly.',
    },
    closeTone: 'steady',
  },
  {
    id: 'surprises',
    label: 'It surprises me',
    sub: 'I didn\u2019t expect this picture',
    guideLine:
      'Surprise is information. The gap between what you expected and what came back is usually where the most useful conversation with your team lives.',
    pausePage: {
      title: 'Surprise is a doorway.',
      body: 'When the picture that comes back isn\u2019t the one you expected, it usually means your team has been experiencing something they haven\u2019t had the words — or the safety — to say directly. That\u2019s not a verdict on you. It\u2019s an invitation to get curious about the difference between what you intend and what lands.',
    },
    closeTone: 'curious',
  },
  {
    id: 'stings',
    label: 'It stings',
    sub: 'This is hard to read',
    guideLine:
      'Let it sting for a minute — that\u2019s not weakness, that\u2019s the feedback mattering to you. We\u2019ll walk the rest of this slowly, and none of it is a verdict.',
    pausePage: {
      title: 'It\u2019s supposed to be heavy.',
      body: 'Feedback only stings when you care about the people giving it. Sit with that for a second: the sting is proof of investment, not failure. Your team didn\u2019t write you off — they showed up and told you the truth, which is what teams do when they still believe the relationship can grow. Take a breath. The next pages are about what to do, not what went wrong.',
    },
    closeTone: 'gentle',
  },
  {
    id: 'disagree',
    label: 'I don\u2019t see it',
    sub: 'This doesn\u2019t match my experience',
    guideLine:
      'Fair — don\u2019t take the signal on faith. The Evidence room holds every statement and every number behind this read. Verify it, then decide what you think.',
    pausePage: {
      title: 'Don\u2019t take it on faith.',
      body: 'Disagreement is a legitimate place to stand — but it deserves the same rigor you\u2019d ask of the signal itself. Every claim in this debrief traces back to specific statements your team rated. Before you set the read aside, look at the receipts. If it still doesn\u2019t match your experience, that gap is itself the most important thing to explore.',
    },
    closeTone: 'verifying',
  },
];

export const reactionById = (id) => REACTIONS.find((r) => r.id === id) || null;

export function closeCopyFor(reaction, edgeRow) {
  const edgeLabel = edgeRow ? edgeRow.subTrait || edgeRow.trait : 'your edge trait';
  const lower = edgeLabel.toLowerCase();
  const COPY = {
    steady: {
      headline: 'One trait is asking for your attention.',
      lead: `The signal is clear and your read is steady. ${edgeLabel} is where redirected energy pays off fastest — not more effort, better aim.`,
    },
    curious: {
      headline: 'The surprise is the starting point.',
      lead: `The gap between what you expected and what came back is the conversation to have. Start with ${lower} — ask your team what would actually help, and listen with the gift you already have.`,
    },
    gentle: {
      headline: 'Nothing here needs fixing today.',
      lead: `Sit with the signal as long as you need — it will keep. When you're ready, ${lower} is one small place to begin, and you won't be starting from zero: your team already trusts you to hear them.`,
    },
    verifying: {
      headline: 'Go check the receipts.',
      lead: `Every claim in this debrief traces to statements your team rated. Open the evidence room and read them in their words — then decide what you think about ${lower}.`,
    },
  };
  const tone = reactionById(reaction)?.closeTone || 'steady';
  return COPY[tone] || COPY.steady;
}

// ----------------------------------------------------------------------------
// Per-chapter guide lines (fed to the existing guide via setPageMessage)
// ----------------------------------------------------------------------------
export const SIGNAL_GUIDE = {
  threshold:
    'The signal is what your team is reflecting back. Hold it lightly — patterns matter more than any one number.',
  traits:
    'Three traits, one at a time — strongest ground first. The arrow walks you down; nothing is hidden, just paced.',
  gap: 'Three gaps, one at a time. When your read and your team\u2019s diverge, neither is wrong — the distance itself is the finding.',
  checkin:
    'However this is landing for you is the right answer. I just want to know where you are.',
  close: 'A debrief should end in a door, not a number. Pick the one that matches where you are.',
  snapshot:
    'This is your signal at rest. Walk it again any time — or go verify it in the evidence room.',
};
