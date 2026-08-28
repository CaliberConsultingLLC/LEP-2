/**
 * One guide line per journey station, used by the chapter-transition ceremony
 * on the arrive beat. Mindset for the phase they are entering — not a task list.
 *
 * Station keys match JOURNEY_STATIONS in journeyModel.js.
 * Header chapter ids (of VII) map onto those keys via CHAPTER_ID_TO_STATION_KEY.
 * Missing guide ids fall back to mentor, same as guideBriefings.js.
 */

export const GUIDE_CHAPTER_LINE_STATIONS = [
  'intake',
  'behaviors',
  'campaign',
  'assessment',
  'reflect',
  'action',
  'checkin',
  'revise',
  'final',
];

export const CHAPTER_ID_TO_STATION_KEY = {
  profile: 'intake',
  behaviors: 'behaviors',
  reflect: 'campaign',
  campaign: 'campaign',
  self: 'assessment',
  assessments: 'assessment',
  review: 'reflect',
  action: 'action',
};

export const GUIDE_CHAPTER_LINES = {
  intake: {
    mentor: 'Before any score, name the ground you stand on. Who you are here is context, not a verdict.',
    catalyst: 'Name the work and the room, then we move. This is the starting line, not the test.',
    challenger: 'Do not dress up the role. Put down the real context — everything later reads from this.',
    bestFriend: 'This is just you, telling me where you actually stand. No performance — I already like you here.',
    mother: 'Start with what is true about the work you lead. I will not let you skip the ground you stand on.',
    roaster: 'Before the fancy reflection: who are you and what do you actually run. Skip the LinkedIn version.',
  },
  behaviors: {
    mentor: 'Answer as the leader you are on a normal Tuesday. Honesty here is the whole gift.',
    catalyst: 'Gut answers — how you actually lead, not the version you pitch. Keep moving through them.',
    challenger: 'If you hedge, you are lying. Pick the answer your team would recognize.',
    bestFriend: 'Nobody sees these but you. Give me the real Tuesday, not the interview.',
    mother: 'I want the true pattern, including the parts you would rather not write down. That is the care.',
    roaster: 'This is not a brand survey. Answer like your team is in the hallway — because they are.',
  },
  campaign: {
    mentor: 'A picture of how you lead is about to sit in front of you. Recognition first, choices after.',
    catalyst: 'The writeup, then three traits, then the ask. Read once, pick, and do not camp here.',
    challenger: 'You are about to see the pattern in writing. Do not shop for a kinder version of it.',
    bestFriend: 'I am going to show you something that sounds like you. Sit with it before you start building.',
    mother: 'Read what was written from your own answers. I will not let you rush past the parts that sting.',
    roaster: 'Here comes the mirror you asked for. Read it, then pick what you will actually put in front of people.',
  },
  assessment: {
    mentor: 'You are about to see your leadership through someone else\'s eyes. What lands here is not a verdict — it is the distance between what you intend and what they feel.',
    catalyst: 'Same sentences — you first, then the team. The gap is the point; do not flinch when it shows.',
    challenger: 'You answer, then they do. If you already know what they will say and still brace, that is the work.',
    bestFriend: 'You go first, then the people who actually see you. I will sit with you when it comes back.',
    mother: 'You will rate yourself, then invite the people who live with your leadership. That takes courage, and I am here.',
    roaster: 'You fill it out, then they do. If you already rehearsed their answers, congratulations — you already know.',
  },
  team: {
    mentor: 'This link is how they see you. Hand it to them yourself — anonymity is the point, not a loophole.',
    catalyst: 'Copy the link, send it, then wait. Do not hover. The reading comes back as a pattern, not a roster.',
    challenger: 'If you only send it to the people who already like you, you already know the result is fake.',
    bestFriend: 'Different link than yours. Send it to the people who actually see you lead. I will sit with what comes back.',
    mother: 'You send it by hand so no one is tracked. That is care for them, and for the truth of the reading.',
    roaster: 'You are the mailroom now. Send the password. Then resist the urge to ask who finished.',
  },
  reflect: {
    mentor: 'The numbers are not the story. Sit with Signal, then Evidence, until the pattern has a face.',
    catalyst: 'Signal first, Evidence second, then you will know what to move. Do not skip to the plan.',
    challenger: 'Look at where they disagreed with you. That is the page — do not start with the compliment.',
    bestFriend: 'This is the part where their view sits next to yours. Stay with it; I am not going anywhere.',
    mother: 'Read what came back before you decide anything. I will not let you turn away from the hard trait.',
    roaster: 'The scoreboard is in. Find the number you want to explain away, and start there.',
  },
  action: {
    mentor: 'One practice your team can actually feel, small enough for a normal week. That is the work now.',
    catalyst: 'One behavior, visible, this week — not a vision deck. Pick it and run.',
    challenger: 'If nobody would notice it by Friday, it is not a practice. Choose the real one.',
    bestFriend: 'We are not building a self-improvement pile. One thing they can feel, and I will hold you to kind-and-real.',
    mother: 'Choose the behavior that would change the room for the people who count on you. Then keep it.',
    roaster: 'A list of goals is how leaders hide. One move your team can see — shockingly unglamorous, and correct.',
  },
  checkin: {
    mentor: 'Another reading of the same ground. Notice what shifted and what did not; both are information.',
    catalyst: 'Same traits, later moment — look for motion, not a perfect score. Then we adjust.',
    challenger: 'Do not come here hunting proof you were right. Come to see whether anything actually changed.',
    bestFriend: 'Second pass. I care less about a glow-up than about what got a little truer.',
    mother: 'We look again, with care. What is landing, and what still asks something of you.',
    roaster: 'Pop quiz, later in the year. Did the practice happen, or did it become a slide?',
  },
  revise: {
    mentor: 'Keep what is working and change what is not. Loyalty to the practice, not to the first draft.',
    catalyst: 'Edit the move. Do not protect the original plan out of pride — tighter, then go.',
    challenger: 'If it is not landing, stop defending it. Revise: the traits stay, the tactic does not have to.',
    bestFriend: 'We can change the plan without making you a flake. Keep the true parts and drop the costume.',
    mother: 'I will not let you cling to a plan that is not serving the people you lead. Adjust with care.',
    roaster: 'The plan is not a personality. If it flopped, change it — that is called leading, not quitting.',
  },
  final: {
    mentor: 'The last reading of this stretch. Name the growth your team can feel, and what still asks for you.',
    catalyst: 'Summit check: what moved, and what did not. Then you decide whether to run it again.',
    challenger: 'No victory lap until you can name what they felt. If nothing changed, say that.',
    bestFriend: 'Last look together. I want the honest version of the year, including the unfinished parts.',
    mother: 'We close this reading with clear eyes. Celebrate what is true, and do not abandon what remains.',
    roaster: 'Final exam energy, minus the costume. Did they feel it — that is the only score that counts.',
  },
};

export function resolveCeremonyStationKey({ stationKey, chapterId, index } = {}) {
  if (stationKey && GUIDE_CHAPTER_LINES[stationKey]) return stationKey;
  if (chapterId && CHAPTER_ID_TO_STATION_KEY[chapterId]) {
    return CHAPTER_ID_TO_STATION_KEY[chapterId];
  }
  if (Number.isInteger(index) && GUIDE_CHAPTER_LINE_STATIONS[index]) {
    return GUIDE_CHAPTER_LINE_STATIONS[index];
  }
  return 'intake';
}

export function getGuideChapterLine(stationKey, guideId) {
  const station = GUIDE_CHAPTER_LINES[stationKey] || GUIDE_CHAPTER_LINES.intake;
  return station[guideId] || station.mentor;
}
