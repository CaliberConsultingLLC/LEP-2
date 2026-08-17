import { flattenGuideSummary } from '../utils/guideSummary.js';

const SHARED_MARKERS = [
  'In a high-stakes meeting, the room slows while people wait for your final read before they commit.',
  'Under deadline pressure, you over-explain to keep everyone aligned, and urgency thins out while the team decodes the extra context.',
];

const SHARED_HAZARDS = [
  'A year into that meeting pattern, people who stay learn to withhold unfinished thinking and wait for your signal before they own a call.',
  'A year into the deadline pattern, people who stay build quiet workarounds, over-ask for permission, and protect themselves more than they escalate risk.',
];

export const STAGING_GUIDE_SUMMARIES = {
  mentor: {
    trailhead: 'Alex, sit with this for a moment. You already lead with a collaborative instinct that makes complex work feel simple, and people can feel the "why" when you are at your best. That gift for alignment is real. Quietly underneath it is a pull to keep talking until every edge is smooth — even when the room needed a decision more than another round of context.',
    markers: {
      framing: 'Pay attention here. These are not future problems. They are the moments your pattern already shows up.',
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: 'If that keeps running for a year, the cost is not who leaves. It is what the people who stay learn to do around you.',
      examples: SHARED_HAZARDS,
    },
    newTrail: 'The leader you could become still makes the complex feel simple — and also lets a call land before the room goes quiet waiting. Alignment stays. The extra circling does not. That version of you is already in the work; it just needs to be chosen on purpose.',
  },
  catalyst: {
    trailhead: 'Alex — the spark is obvious. You get a team moving around a shared why, and you make messy work feel simple. That is a live asset. The drag is the extra lap of context when the moment already wanted a call. Momentum stalls while you keep aligning.',
    markers: {
      framing: 'Look. You can already catch this in the week you are in. Two tells, both fast.',
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: 'Leave it running a year and the team does not explode. They adapt. That is worse.',
      examples: SHARED_HAZARDS,
    },
    newTrail: 'The next version of you still builds the why — then moves. Same gift. Less stall. The team feels the difference in the meeting after the meeting.',
  },
  challenger: {
    trailhead: 'Alex, you already know this one. You are strong at making complex work simple and getting people around a why. You also keep talking until the edges disappear, even when the room needed a decision. Stop dressing the second part up as thoroughness.',
    markers: {
      framing: 'These are the tells. You have seen both. Name them when they happen.',
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: 'If you leave it, people stay. They just stop bringing you the real thing.',
      examples: SHARED_HAZARDS,
    },
    newTrail: 'You do not need a new personality. You need the same clarity without using more words as a shield. Make the call. Let the room keep its unfinished thinking. That is the trail.',
  },
  bestFriend: {
    trailhead: 'Alex, I know this one on you. You are the person who can make a messy project feel simple, and people actually get the why. That is why they trust you. The tell is that extra lap of explanation when you are a little unsure the room is with you — and the decision waits while you keep them comfortable.',
    markers: {
      framing: 'You have watched this happen. I am just putting language on it so you cannot shrug it off.',
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: 'If this keeps being the move, the people who stick around learn a quieter, smaller way of working with you.',
      examples: SHARED_HAZARDS,
    },
    newTrail: 'You get to keep being the person who brings people with you. You also get to let a call land without narrating every side of it. That version of you is kinder to the team than the extra context ever was.',
  },
  mother: {
    trailhead: 'Alex, I will not skip the good part. You make complex work feel simple, and you care whether people understand the why. That matters. I also will not let you abandon the other truth: when pressure rises, you keep talking to keep everyone safe, and the decision waits. Care is not the same thing as circling.',
    markers: {
      framing: 'Watch these two moments. They are where your care turns into delay, and the people who count on you feel it.',
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: 'If this stays the pattern, the people who remain will protect themselves instead of trusting you with unfinished thought. That is not the standard you mean to set.',
      examples: SHARED_HAZARDS,
    },
    newTrail: 'The leader you can be still holds people close — and still lets a clear call land. You do not have to choose between care and clarity. I will not let you pretend those are opposites.',
  },
  roaster: {
    trailhead: 'Alex, cute story: if you just explain it one more time, the room will magically decide itself. Plot twist — they are waiting on you. The real thing is you already make complex work feel simple. That is the gift. The extra lap of context is not thoroughness. It is a stall wearing a nice coat.',
    markers: {
      framing: 'Here are the two scenes. If you have never seen them, you have not been paying attention.',
      examples: SHARED_MARKERS,
    },
    hazards: {
      framing: 'A year of that and nobody storms out. They just stop bringing you the messy truth. Not the flex you think.',
      examples: SHARED_HAZARDS,
    },
    newTrail: 'Keep the gift. Drop the coat. The leader you could be still brings people with you — and does not use twelve more sentences as a security blanket. That is the actual thing.',
  },
};

export function stagingFlattenedSummary(guideId = 'mentor') {
  const summary = STAGING_GUIDE_SUMMARIES[guideId] || STAGING_GUIDE_SUMMARIES.mentor;
  return flattenGuideSummary(summary);
}
