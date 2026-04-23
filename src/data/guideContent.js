// Placeholder guide copy keyed by route key + persona id.
// Each entry is a short piece the overlay displays in its speech bubble.
// No AI yet — these are hand-written placeholders written in each persona's
// voice so the overlay feels alive while the real copy is developed.
//
// Route keys are matched by the `resolveRouteKey` helper in GuideOverlay,
// which maps `location.pathname` (and the `?tab=` query string on the
// Dashboard) to a key below. Add new keys + translations as pages are added.

const DEFAULT_TITLE = 'A word before you start';

export const GUIDE_CONTENT = {
  default: {
    title: DEFAULT_TITLE,
    mentor: {
      text: 'Take a breath. You belong here. Nothing on this page needs to be perfect — it just needs to be honest.',
      cta: 'Okay, Mentor',
    },
    catalyst: {
      text: 'Hey — good to see you. Let’s keep moving. First instinct usually wins.',
      cta: 'Let’s go',
    },
    challenger: {
      text: 'Don’t stall on me. Put the first real thing down and we’ll sharpen it later.',
      cta: 'Fine',
    },
  },

  landing: {
    title: 'Welcome',
    mentor: {
      text: 'This is a place to look at your leadership clearly. Start when you’re ready — there’s no wrong door.',
      cta: 'Begin',
    },
    catalyst: {
      text: 'Ready? One good hour today saves you a hundred confused meetings later. Hit start.',
      cta: 'Start',
    },
    challenger: {
      text: 'You didn’t come here to browse. Pick a door and walk through it.',
      cta: 'Enter',
    },
  },

  signIn: {
    title: 'Signing in',
    mentor: {
      text: 'Welcome back. Take the next step at your own pace.',
      cta: 'Thanks',
    },
    catalyst: {
      text: 'Good. Sign in, and we’ll get you back in motion.',
      cta: 'Got it',
    },
    challenger: {
      text: 'Sign in. We left work unfinished.',
      cta: 'Okay',
    },
  },

  userInfo: {
    title: 'Profile creation',
    mentor: {
      text: 'Start with what’s steady: your name, your role, the team you lead. The harder things come later.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Quick fill. Name, email, role — you know these. Thirty seconds and we’re through.',
      cta: 'On it',
    },
    challenger: {
      text: 'Use the name you answer to in real life. Don’t dress it up.',
      cta: 'Got it',
    },
  },

  intake: {
    title: 'Behaviors & instincts',
    mentor: {
      text: 'Answer as the leader you actually are, not the one you’d like to be seen as. We do more with honest than with impressive.',
      cta: 'Understood',
    },
    catalyst: {
      text: 'Gut answer first. You can always revisit — but don’t sit on a question too long.',
      cta: 'Okay',
    },
    challenger: {
      text: 'If you’re hedging, you’re lying. Pick the answer that makes you a little uncomfortable.',
      cta: 'Fine',
    },
  },

  traitSelection: {
    title: 'Choosing your focus',
    mentor: {
      text: 'Pick the traits where growth would change the most for the people you lead — not the ones that look best on paper.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Three traits. Go with what lights up first — we’ll sequence them together.',
      cta: 'Pick',
    },
    challenger: {
      text: 'Choose the ones you’ve been avoiding. Those are the real ones.',
      cta: 'Alright',
    },
  },

  summary: {
    title: 'Your reflection',
    mentor: {
      text: 'Read it slowly. Notice what resonates and what chafes — both are signal.',
      cta: 'Reading',
    },
    catalyst: {
      text: 'Skim for the highlights, then pick one thing to act on this week. Don’t drown in the detail.',
      cta: 'Got it',
    },
    challenger: {
      text: 'The parts you want to argue with are usually the parts you needed to see.',
      cta: 'Okay',
    },
  },

  campaignIntro: {
    title: 'Starting a campaign',
    mentor: {
      text: 'A campaign is a small, bounded experiment. You’re not fixing yourself — you’re running a test.',
      cta: 'Got it',
    },
    catalyst: {
      text: 'Name it, ship it, iterate. Three weeks beats three months of planning.',
      cta: 'Ready',
    },
    challenger: {
      text: 'Pick something you’ll actually do. Not something that sounds ambitious in a meeting.',
      cta: 'Fine',
    },
  },

  campaignBuilder: {
    title: 'Building your campaign',
    mentor: {
      text: 'Keep scope small enough that it fits inside a normal week. If it needs heroics, shrink it.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Tight scope beats big vision. One behavior, one team, three weeks.',
      cta: 'Setting',
    },
    challenger: {
      text: 'If you can’t name who’ll notice the change, it’s not real work.',
      cta: 'Got it',
    },
  },

  campaignVerify: {
    title: 'Confirming your setup',
    mentor: {
      text: 'Last look before you invite anyone. Read like you’re the person opening that email.',
      cta: 'Reading',
    },
    catalyst: {
      text: 'Looks right? Ship it. You can edit messaging later — it’s not chiseled in stone.',
      cta: 'Ship',
    },
    challenger: {
      text: 'If it feels mushy, rewrite the behavior before you send this to humans.',
      cta: 'Okay',
    },
  },

  campaignRun: {
    title: 'Running the survey',
    mentor: {
      text: 'Answer in your voice, not the voice of the form. The specific beats the tidy.',
      cta: 'Got it',
    },
    catalyst: {
      text: 'One pass, quickly. You’ll thank yourself for not agonizing.',
      cta: 'Going',
    },
    challenger: {
      text: 'Don’t game the scale. Pick the score that matches what you’d say about someone else in your position.',
      cta: 'Alright',
    },
  },

  campaignComplete: {
    title: 'You finished',
    mentor: {
      text: 'Well done. Let it settle for a minute before you jump to what’s next.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Done. Good. Now hand the next one to your team before the energy dies.',
      cta: 'Next',
    },
    challenger: {
      text: 'You finished the easy part. The real work starts when results come back.',
      cta: 'Understood',
    },
  },

  dashboard: {
    title: 'Your dashboard',
    mentor: {
      text: 'Look for the one thing you keep avoiding. That’s usually where the leverage is.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Pick one card to act on today. Don’t leave this page without a move.',
      cta: 'Picking',
    },
    challenger: {
      text: 'Bad news first. Open the tab you wish you didn’t have to.',
      cta: 'Fine',
    },
  },

  dashboardGrowth: {
    title: 'Growth plan',
    mentor: {
      text: 'Small commitments kept beat big commitments dropped. One behavior, one week at a time.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Block 20 minutes on your calendar right now for the top item. Future-you will be relieved.',
      cta: 'Got it',
    },
    challenger: {
      text: 'Which of these have you already told yourself you’d do — and haven’t? Start there.',
      cta: 'Alright',
    },
  },

  dashboardCampaign: {
    title: 'Campaign details',
    mentor: {
      text: 'Listen for what your team is saying beneath the numbers. Patterns live in the margins.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Find the one response that surprised you. Reply to that person — even a short note.',
      cta: 'Going',
    },
    challenger: {
      text: 'You don’t get points for reading. You get points for what you change on Monday.',
      cta: 'Understood',
    },
  },

  dashboardResults: {
    title: 'Results',
    mentor: {
      text: 'Hold the highs and the lows side by side. Both are partial views of the same leader.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Celebrate one high, then pick one gap to close this month. Keep it to those two.',
      cta: 'Got it',
    },
    challenger: {
      text: 'The gap you rationalize is the gap your team talks about when you’re not in the room.',
      cta: 'Fine',
    },
  },

  faq: {
    title: 'Questions',
    mentor: {
      text: 'Good questions mean you’re paying attention. Browse freely — nothing here is a test.',
      cta: 'Okay',
    },
    catalyst: {
      text: 'Skim. Pick the two you most need. Come back for the rest.',
      cta: 'Got it',
    },
    challenger: {
      text: 'Read the one you’re most tempted to skip.',
      cta: 'Fine',
    },
  },
};

// Resolve a route + optional tab string to a content key.
export function resolveRouteKey(pathname = '', search = '') {
  const p = String(pathname || '').toLowerCase();
  const qs = new URLSearchParams(search || '');
  const tab = String(qs.get('tab') || '').toLowerCase();

  if (p === '/' || p.startsWith('/landing')) return 'landing';
  if (p.startsWith('/sign-in')) return 'signIn';
  if (p.startsWith('/user-info')) return 'userInfo';
  if (p.startsWith('/form')) return 'intake';
  if (p.startsWith('/summary')) return 'summary';
  if (p.startsWith('/trait-selection')) return 'traitSelection';
  if (p.startsWith('/campaign-intro')) return 'campaignIntro';
  if (p.startsWith('/campaign-builder')) return 'campaignBuilder';
  if (p.startsWith('/campaign-verify')) return 'campaignVerify';
  if (p.startsWith('/campaign/') && p.endsWith('/complete')) return 'campaignComplete';
  if (p.startsWith('/campaign/') && p.endsWith('/survey')) return 'campaignRun';
  if (p.startsWith('/campaign/')) return 'campaignRun';
  if (p.startsWith('/faq')) return 'faq';
  if (p.startsWith('/dashboard')) {
    if (tab.includes('growth')) return 'dashboardGrowth';
    if (tab.includes('campaign')) return 'dashboardCampaign';
    if (tab.includes('result')) return 'dashboardResults';
    return 'dashboard';
  }
  return 'default';
}

export function getGuideMessage(routeKey, personaId) {
  const bucket = GUIDE_CONTENT[routeKey] || GUIDE_CONTENT.default;
  const fallback = GUIDE_CONTENT.default[personaId] || GUIDE_CONTENT.default.mentor;
  const entry = bucket[personaId] || fallback;
  return {
    title: bucket.title || GUIDE_CONTENT.default.title,
    text: entry.text,
    cta: entry.cta || 'Okay',
  };
}
