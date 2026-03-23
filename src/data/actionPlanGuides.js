/**
 * Static copy for the staging Action Plan builder.
 * Tied to subtrait (capability), not to individual user results — no agent/API.
 * Placeholders for the three dev-dashboard campaign subtraits; extend the map as the library grows.
 */

const DEFAULT_GUIDE = {
  friendlyNudge:
    'This area is about how your leadership shows up in day-to-day work. Use the questions below to name one concrete move, not a vague intention.',
  pressureLens:
    'Under load, good intentions compress. A useful plan names what might break first when time is short.',
  aimOfPlan:
    'End with something observable: a behavior your team could notice without you having to explain it.',
  guidedSteps: [
    {
      id: 'g1',
      prompt: 'What is the recurring situation where this capability matters most for your team right now?',
      placeholder: 'Describe the moment, channel, or meeting…',
    },
    {
      id: 'g2',
      prompt: 'What tends to go wrong there today — even slightly?',
      placeholder: 'Name the friction, not a person…',
    },
    {
      id: 'g3',
      prompt: 'What would “good enough” look like in that same situation next week?',
      placeholder: 'Keep it behavioral and specific…',
    },
    {
      id: 'g4',
      prompt: 'What is the smallest change you could try that would test whether you are on the right track?',
      placeholder: 'One move you could repeat…',
    },
    {
      id: 'commitment',
      prompt: 'In one clear sentence, what are you committing to do?',
      placeholder: 'I will…',
    },
  ],
};

/** @type {Record<string, typeof DEFAULT_GUIDE>} */
export const ACTION_PLAN_GUIDES_BY_SUBTRAIT = {
  Clarity: {
    friendlyNudge:
      'Clarity is about reducing competing interpretations: one thread people can follow, fewer hidden assumptions, and expectations that land the same way for everyone who heard them.',
    pressureLens:
      'When time is tight, messages get shorter — and ambiguity often grows. Plans for clarity should survive a bad week, not only a calm one.',
    aimOfPlan:
      'Your plan should make “understood” easier to verify than to debate.',
    guidedSteps: [
      {
        id: 'c1',
        prompt:
          'Where do people most often leave a conversation with a different read on priorities or next steps than you intended?',
        placeholder: 'e.g. staff meetings, Slack threads, handoffs to another team…',
      },
      {
        id: 'c2',
        prompt: 'What is one message or expectation you repeat that still produces follow-up questions?',
        placeholder: '',
      },
      {
        id: 'c3',
        prompt: 'What would a “clean close” look like at the end of that moment (what would everyone walk away knowing)?',
        placeholder: '',
      },
      {
        id: 'c4',
        prompt: 'What single habit could you add (or remove) to make that clean close more reliable?',
        placeholder: 'e.g. one-sentence recap, written summary, explicit owner + deadline…',
      },
      {
        id: 'commitment',
        prompt: 'In one sentence, what are you committing to do differently for clarity?',
        placeholder: 'I will…',
      },
    ],
  },
  'Decision Quality': {
    friendlyNudge:
      'Decision quality is not only the call you make — it is how tradeoffs are surfaced, how reasoning becomes visible, and how the team learns what “good enough” decision-making looks like here.',
    pressureLens:
      'Under pressure, decisions can tilt toward speed or safety alone. A strong plan acknowledges which bias shows up for you when the clock is loud.',
    aimOfPlan:
      'Your plan should make how you decide easier for others to follow than to second-guess in silence.',
    guidedSteps: [
      {
        id: 'd1',
        prompt: 'What kind of decision currently creates the most rework, hesitation, or hallway alignment on your team?',
        placeholder: 'e.g. prioritization, resourcing, go/no-go…',
      },
      {
        id: 'd2',
        prompt: 'What information (or perspective) is usually missing or late when those decisions get made?',
        placeholder: '',
      },
      {
        id: 'd3',
        prompt: 'What would “decided well” look like for that type of decision — even if the outcome were imperfect?',
        placeholder: '',
      },
      {
        id: 'd4',
        prompt: 'What lightweight practice could make the reasoning or criteria more visible without slowing everything down?',
        placeholder: 'e.g. decision log, criteria stated up front, explicit dissent…',
      },
      {
        id: 'commitment',
        prompt: 'In one sentence, what are you committing to do differently for decision quality?',
        placeholder: 'I will…',
      },
    ],
  },
  Prioritization: {
    friendlyNudge:
      'Prioritization is the courage to protect focus: what earns attention, what waits, and what gets a clear “not now” so the team is not carrying infinite top priorities.',
    pressureLens:
      'When demand spikes, the list swells. Useful plans here name what you will stop pretending is equally important.',
    aimOfPlan:
      'Your plan should make the real top few priorities obvious enough that tradeoffs hurt a little — in a good way.',
    guidedSteps: [
      {
        id: 'p1',
        prompt: 'What competing priorities are currently creating the most drag or thrash for your team?',
        placeholder: '',
      },
      {
        id: 'p2',
        prompt: 'What are you saying “yes” to today that you know is not truly top-tier?',
        placeholder: '',
      },
      {
        id: 'p3',
        prompt: 'If you could only protect three outcomes this month, what would they be — and what would explicitly wait?',
        placeholder: '',
      },
      {
        id: 'p4',
        prompt: 'What is one ritual or artifact that would make those choices visible (and revisitable) for the team?',
        placeholder: 'e.g. weekly stack rank, protected focus blocks, published “not doing” list…',
      },
      {
        id: 'commitment',
        prompt: 'In one sentence, what are you committing to do differently for prioritization?',
        placeholder: 'I will…',
      },
    ],
  },
};

export function getActionPlanGuide(subTraitName) {
  const key = String(subTraitName || '').trim();
  return ACTION_PLAN_GUIDES_BY_SUBTRAIT[key] || DEFAULT_GUIDE;
}
