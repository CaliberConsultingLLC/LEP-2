export const SUMMARY_BRIEFING_STAGES = ['trailhead', 'markers', 'hazards', 'new-trail'];

export const SUMMARY_BRIEFINGS = {
  trailhead: {
    mentor: '{name}, read this slowly. Notice what resonates and what chafes — both are meaningful. This is not a label, a score, or a diagnosis. It is a reflection that will prove valuable.',
    catalyst: '{name} — before you skim: this is the current picture, not a to-do list. Read it once. Notice the spark and the drag. Then we keep moving.',
    challenger: '{name}, do not skim this to stay comfortable. The parts you want to argue with are usually the parts you needed to see. This is not a score. It is a mirror. Look.',
    bestFriend: '{name}, I am going to show you something. Read it like I am sitting next to you — not like a report. Notice what feels true. Notice what stings. Both count.',
    mother: '{name}, I want you to read this with care, including the parts that are hard to sit with. This is not a label or a verdict. It is a clear look, and I will not let you rush past it.',
    roaster: '{name}, before you perform "thoughtful leader reading a summary" — actually read it. If a line makes you wince, that is the line. Not a score. Not a roast for sport. A mirror.',
  },
  markers: {
    mentor: '{name}, these are not future problems. They are moments you can already recognize. Sit with the ones that feel familiar.',
    catalyst: '{name}, two live tells. You have seen them this month. Catch them in the week you are in — not in theory.',
    challenger: '{name}, these are the tells. You have watched both happen. Do not pretend they are hypothetical.',
    bestFriend: '{name}, I am just putting language on scenes you already know. If one of them is too accurate, stay there a second.',
    mother: '{name}, watch these two moments. They are where your pattern meets the people who count on you. Do not look away.',
    roaster: '{name}, here come the two scenes. If you have never seen them, you have not been paying attention.',
  },
  hazards: {
    mentor: '{name}, if those markers keep running for a year, this is what hardens in the people who stay. Take it seriously without turning it into doom.',
    catalyst: '{name}, leave that pattern running and the team does not explode. They adapt. That is the part to feel.',
    challenger: '{name}, nobody has to quit for this to get expensive. The people who stay will learn a smaller way of working with you.',
    bestFriend: '{name}, this is the "if we keep doing this" version. Not to scare you. So you cannot say you were not told.',
    mother: '{name}, I will not soften this: if the pattern stays, the people who remain will protect themselves. That is not the standard you mean to set.',
    roaster: '{name}, a year of that and nobody storms out. They just stop bringing you the messy truth. Not the flex you think.',
  },
  'new-trail': {
    mentor: '{name}, this is not a prescription. It is a picture of who you could become if you pivot with intention. Let it pull you — then you will choose what to grow.',
    catalyst: '{name}, this is the turn. Not a plan. A picture of you in motion. Feel it, then pick where to build.',
    challenger: '{name}, this is the version of you that stops hiding in the old pattern. No steps yet. Just look at it honestly.',
    bestFriend: '{name}, this last part is the hopeful one, and I mean it. Read it as someone who is still on your side.',
    mother: '{name}, I want you to see who you can be without abandoning what already matters. Then we will choose the work.',
    roaster: '{name}, last beat: who you could be if you drop the cute story. No homework yet. Just look.',
  },
};

export function fillBriefing(template, firstName) {
  const name = String(firstName || '').trim() || 'there';
  return String(template || '').replaceAll('{name}', name);
}

export function getSummaryBriefing(stageId, guideId, firstName) {
  const stage = SUMMARY_BRIEFINGS[stageId] || SUMMARY_BRIEFINGS.trailhead;
  const template = stage[guideId] || stage.mentor;
  return fillBriefing(template, firstName);
}
