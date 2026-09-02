import { flattenGuideSummary } from '../utils/guideSummary.js';

// Three scenes, not two — one per tension, in the same order the tensions are
// named. The third is deliberately the one about someone else's growth: it is
// the thread that a single-tension readout used to swallow whole.
const SHARED_MARKERS = [
  'In a high-stakes meeting, the room slows while people wait for your final read before they commit.',
  'Under deadline pressure, you over-explain to keep everyone aligned, and urgency thins out while the team decodes the extra context.',
  'When quality is genuinely at risk, you take the hard piece back and finish it yourself, while the person who was two weeks from being able to do it watches you work.',
];

// Each hazard lands on a person, not on a deliverable. The failure worth naming
// is not a late launch — it is a good person who stays and stops growing.
const SHARED_HAZARDS = [
  'A year into that meeting pattern, the people who stay stop bringing you a call before it is finished. They wait for your read, so the judgment they were supposed to be building never gets built.',
  'A year into the deadline pattern, they over-ask for permission and work around the risk instead of naming it. The ones who were closest to ready stay exactly as ready as they are today.',
  'A year of taking the hard part back and your strongest person is still your strongest person, and nobody behind them has moved. You did not lose anyone. You just stopped growing them.',
];

export const STAGING_GUIDE_SUMMARIES = {
  mentor: {
    trailhead: [
      'Alex, sit with this for a moment. You already lead with a collaborative instinct that makes complex work feel simple, and people can feel the "why" when you are at your best. That gift for alignment is real.',
      'Quietly underneath it is a pull to keep talking until every edge is smooth — even when the room needed a decision more than another round of context. And when the stakes get high enough, you stop handing the hard part over at all.',
      'None of those three are the same problem. They just happen to share a cause: you are carrying certainty for everyone in the room.',
    ],
    markers: {
      framing: [
        'Pay attention here. These are not future problems.',
        'They are the moments your pattern already shows up, in an ordinary week, with people who are already used to it.',
      ],
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: [
        'If that keeps running for a year, the cost is not who leaves. It is what the people who stay learn to do around you.',
        'They will still be here. They will still be good. They will be exactly as good as they are right now.',
      ],
      examples: SHARED_HAZARDS,
    },
    newTrail: [
      'The leader you could become still makes the complex feel simple — and also lets a call land before the room goes quiet waiting.',
      'Alignment stays. The extra circling does not. The hard piece gets handed to the person who is nearly ready for it, while you are still close enough to catch it.',
      'That version of you is already in the work; it just needs to be chosen on purpose.',
    ],
  },
  catalyst: {
    trailhead: [
      'Alex — the spark is obvious. You get a team moving around a shared why, and you make messy work feel simple. That is a live asset.',
      'The drag is the extra lap of context when the moment already wanted a call. Momentum stalls while you keep aligning.',
      'And the third one is quieter than both: when it really matters, you keep the hard piece. Nobody grows into work you never let go of.',
    ],
    markers: {
      framing: [
        'Look. You can already catch this in the week you are in.',
        'Three tells, all fast, all this week.',
      ],
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: [
        'Leave it running a year and the team does not explode. They adapt.',
        'That is worse. An adapted team is a team that stopped getting better and did not tell you.',
      ],
      examples: SHARED_HAZARDS,
    },
    newTrail: [
      'The next version of you still builds the why — then moves. Same gift. Less stall.',
      'And the hard piece goes to the person who is close, not the person who is certain.',
      'The team feels the difference in the meeting after the meeting.',
    ],
  },
  challenger: {
    trailhead: [
      'Alex, you already know this one. You are strong at making complex work simple and getting people around a why.',
      'You also keep talking until the edges disappear, even when the room needed a decision. Stop dressing that up as thoroughness.',
      'And when it counts, you take the hard part back. That one you have never called anything at all.',
    ],
    markers: {
      framing: [
        'These are the tells. You have seen all three.',
        'Name them when they happen, in the moment, out loud.',
      ],
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: [
        'If you leave it, people stay. They just stop bringing you the real thing.',
        'And the person you were counting on to be ready next year is going to be exactly this ready next year.',
      ],
      examples: SHARED_HAZARDS,
    },
    newTrail: [
      'You do not need a new personality. You need the same clarity without using more words as a shield.',
      'Make the call. Let the room keep its unfinished thinking. Hand over the piece you are best at.',
      'That is the trail.',
    ],
  },
  bestFriend: {
    trailhead: [
      'Alex, I know this one on you. You are the person who can make a messy project feel simple, and people actually get the why. That is why they trust you.',
      'The tell is that extra lap of explanation when you are a little unsure the room is with you — and the decision waits while you keep them comfortable.',
      'The one you will not like: when it gets hard, you take it back. Not because they cannot. Because it is faster and you can carry it.',
    ],
    markers: {
      framing: [
        'You have watched all three of these happen.',
        'I am just putting language on them so you cannot shrug them off.',
      ],
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: [
        'If this keeps being the move, the people who stick around learn a quieter, smaller way of working with you.',
        'They stay. They just stop getting bigger, and you will not notice for about a year.',
      ],
      examples: SHARED_HAZARDS,
    },
    newTrail: [
      'You get to keep being the person who brings people with you. You also get to let a call land without narrating every side of it.',
      'And you get to hand somebody the hard thing while you are still standing right there.',
      'That version of you is kinder to the team than the extra context ever was.',
    ],
  },
  mother: {
    trailhead: [
      'Alex, I will not skip the good part. You make complex work feel simple, and you care whether people understand the why. That matters.',
      'I also will not let you abandon the other truth: when pressure rises, you keep talking to keep everyone safe, and the decision waits. Care is not the same thing as circling.',
      'And the third one is the tenderest. You take the hard piece back to protect them from failing at it. That is love doing the wrong job.',
    ],
    markers: {
      framing: [
        'Watch these three moments.',
        'They are where your care turns into delay, and the people who count on you feel it before you do.',
      ],
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: [
        'If this stays the pattern, the people who remain will protect themselves instead of trusting you with unfinished thought.',
        'And the ones you were protecting will still be waiting for the work that would have grown them. That is not the standard you mean to set.',
      ],
      examples: SHARED_HAZARDS,
    },
    newTrail: [
      'The leader you can be still holds people close — and still lets a clear call land.',
      'You also let someone struggle with the hard piece a little longer than is comfortable, because that is where they grow.',
      'You do not have to choose between care and clarity. I will not let you pretend those are opposites.',
    ],
  },
  roaster: {
    trailhead: [
      'Alex, cute story: if you just explain it one more time, the room will magically decide itself. Plot twist — they are waiting on you.',
      'The real thing is you already make complex work feel simple. That is the gift. The extra lap of context is not thoroughness. It is a stall wearing a nice coat.',
      'Bonus round: when it actually gets hard, you take it back and do it yourself. Very heroic. Nobody learned anything.',
    ],
    markers: {
      framing: [
        'Here are the three scenes.',
        'If you have never seen them, you have not been paying attention.',
      ],
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: [
        'A year of that and nobody storms out. They just stop bringing you the messy truth.',
        'Your bench also stays exactly where it is. Congratulations on the world’s most loyal, least developed team.',
      ],
      examples: SHARED_HAZARDS,
    },
    newTrail: [
      'Keep the gift. Drop the coat.',
      'The leader you could be still brings people with you — and does not use twelve more sentences as a security blanket, and does not steal the hard part on the way out.',
      'That is the actual thing.',
    ],
  },
};

export function stagingFlattenedSummary(guideId = 'mentor') {
  const summary = STAGING_GUIDE_SUMMARIES[guideId] || STAGING_GUIDE_SUMMARIES.mentor;
  return flattenGuideSummary(summary);
}
