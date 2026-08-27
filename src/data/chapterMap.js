/**
 * Canonical chapter map for the Compass chapter header.
 *
 * chapter.purpose        → drawer column 1, and the "begin" side of a chapter popup.
 * chapter.completeBlurb  → "complete" side of the popup when leaving this chapter.
 * chapter.arriveHint     → one-line "next" hint on the begin card.
 * step.whatHappens       → drawer column 2, scoped to the ACTIVE STEP.
 *
 * Numbering is of VII. Popups fire only when chapterId changes, not on tab changes.
 */

export const CHAPTER_TOTAL = 7;

export const CHAPTERS = [
  {
    id: 'profile',
    num: 'I',
    name: 'Leader Profile',
    purpose:
      'Building your leader profile: who you are as a leader. Account, guide, then the role and industry that shape every later reading.',
    completeBlurb:
      'Your account is set, you chose a guide, and your context is in. Nothing has been scored yet — that is next.',
    arriveHint: 'About 32 questions on how you actually lead. Answer as you normally show up, not as you wish you did.',
    steps: [
      {
        id: 'account',
        label: 'Your Account',
        path: '/user-info',
        whatHappens: ['Name, email, password', 'A login, not a score', 'You can sign back in later'],
      },
      {
        id: 'guide',
        label: 'Choose Your Guide',
        path: '/guide-select',
        whatHappens: ['Six voices, one pick', 'Gut answer', 'Swappable any time'],
      },
      {
        id: 'context',
        label: 'Your Context',
        path: '/form?stage=profile',
        whatHappens: ['Industry, role, tenure', 'Context, not scoring', 'Shapes how your guide reads you'],
      },
    ],
  },
  {
    id: 'behaviors',
    num: 'II',
    name: 'Daily Leadership Behaviors',
    purpose:
      'These questions are about how you normally lead day to day, not who you wish you were. They are the raw material every later chapter reads from.',
    completeBlurb:
      'You finished the intake — how you actually lead, not a type. Those answers are what the reflection is built from.',
    arriveHint: 'Your written reflection is ready. Read it in four short parts. Nothing to choose yet.',
    steps: [
      {
        id: 'habits',
        label: 'Daily Leadership Habits',
        path: '/form?stage=intake',
        whatHappens: ['32 questions, one at a time', 'Never-to-Always scale', 'Your normal behavior, not your best day'],
      },
      {
        id: 'insights',
        label: 'Leadership Insights',
        path: '/form?step=3',
        whatHappens: ['Same chapter, different scale', 'Private to you'],
      },
    ],
  },
  {
    id: 'reflect',
    num: 'III',
    name: 'Reflect and Digest',
    purpose:
      'Your answers have been read back to you as a reflection. Sit with it long enough to recognize yourself before you build anything.',
    completeBlurb:
      'You have the writeup from your intake. Next you choose the traits and language your year will run on.',
    arriveHint: 'Pick three traits, then review the statements your team will actually rate.',
    steps: [
      {
        id: 'trailhead',
        label: 'Trailhead',
        shortLabel: 'Trailhead',
        path: '/summary?stage=trailhead',
        whatHappens: ['Current-state mirror', 'Written from your own answers', 'Nothing to choose yet'],
      },
      {
        id: 'markers',
        label: 'Trail Markers',
        shortLabel: 'Markers',
        path: '/summary?stage=markers',
        whatHappens: ['Recurring moments', 'Patterns your team already feels'],
      },
      {
        id: 'hazards',
        label: 'Future Hazards',
        shortLabel: 'Hazards',
        path: '/summary?stage=hazards',
        whatHappens: ['Preventable costs', 'What this may cost if left unmanaged'],
      },
      {
        id: 'new-trail',
        label: 'A New Trail',
        shortLabel: 'New Trail',
        path: '/summary?stage=new-trail',
        whatHappens: ['Growth leverage', 'Where to build forward'],
      },
    ],
  },
  {
    id: 'campaign',
    num: 'IV',
    name: 'Growth Campaign',
    purpose:
      'A growth campaign is the set of statements your team will answer. Choose the three traits, shape the language, then send.',
    completeBlurb:
      'You chose the traits and locked the sentences. Next you rate yourself on the same statements, then invite the team.',
    arriveHint: 'Rate yourself first on the same sentences your team will see. About five minutes.',
    steps: [
      {
        id: 'traits',
        label: 'Trait Selection',
        path: '/trait-selection',
        whatHappens: ['Three traits from the reflection', 'One at a time', 'Changeable until you build'],
      },
      {
        id: 'builder',
        label: 'Campaign Builder',
        path: '/campaign-builder',
        whatHappens: ['Statements written per trait', 'Your edits, your language', 'Keep what feels fair'],
      },
      {
        id: 'verify',
        label: 'Review & Send',
        path: '/campaign-verify',
        whatHappens: ['Last look before it sends', 'Then you answer first', 'Team link unlocks after that'],
      },
    ],
  },
  {
    id: 'assessments',
    num: 'V',
    name: 'Self and Team Assessments',
    purpose:
      'You answer the same statements your team will answer. Then you keep the window open long enough for everyone else.',
    completeBlurb:
      'Your benchmark is in and the team has had a chance to answer. The first signal is a reading, not a verdict.',
    arriveHint: 'Sit with Signal first, then Evidence. Those two rooms explain the numbers before you choose a practice.',
    steps: [
      {
        id: 'self',
        label: 'Self-Assessment',
        path: '/campaign/self',
        whatHappens: ['The same statements your team sees', 'Answered before you see theirs', 'Private, shown only as a comparison'],
      },
      {
        id: 'team',
        label: 'Team Assessment',
        path: '/dashboard?tab=journey',
        whatHappens: ['Counts only, no answers', 'A different link than yours', 'Closing opens the reading'],
      },
    ],
  },
  {
    id: 'review',
    num: 'VI',
    name: 'Review & Act',
    purpose:
      'This is the deeper review. Read what came back, trait by trait, then the statements behind it, before you commit to a practice.',
    completeBlurb:
      'You walked Signal and Evidence. The pattern is clear enough to choose one practice your team can feel.',
    arriveHint: 'Turn one insight into a practice — not a list of goals. One behavior your team should notice.',
    steps: [
      {
        id: 'today',
        label: 'Today',
        path: '/dashboard?tab=today',
        whatHappens: ['Where you are this week', 'One habit to mark'],
      },
      {
        id: 'signal',
        label: 'Signal',
        path: '/dashboard?tab=signal',
        gated: true,
        whatHappens: ['Team score, trait by trait', 'Where their read differs from yours', 'Reading only — nothing to commit here'],
      },
      {
        id: 'evidence',
        label: 'Evidence',
        path: '/dashboard?tab=evidence',
        gated: true,
        whatHappens: ['Every statement behind the signal', 'Sourced, not styled', 'Opens Practice when read'],
      },
    ],
  },
  {
    id: 'action',
    num: 'VII',
    name: 'Action',
    purpose:
      'Turn the reading into one visible practice, then keep the map in view so you know where you are in the year.',
    completeBlurb:
      'You committed to a practice. The next reading will tell you whether it is landing.',
    arriveHint: 'Keep it small enough to fit a normal week. The map holds the rest.',
    steps: [
      {
        id: 'practice',
        label: 'Practice',
        path: '/dashboard?tab=practice',
        gated: true,
        whatHappens: ['One visible behavior per trait', 'Small enough to hold', 'Held until the next check-in'],
      },
      {
        id: 'journey',
        label: 'Journey',
        path: '/dashboard?tab=journey',
        whatHappens: ['The whole map', 'Where you have been'],
      },
    ],
  },
];

const REVIEW_TABS = ['today', 'signal', 'evidence'];

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);
export const chapterByStep = (stepId) =>
  CHAPTERS.find((c) => c.steps.some((s) => s.id === stepId));
export const stepIn = (chapterId, stepId) =>
  chapterById(chapterId)?.steps.find((s) => s.id === stepId);
export const chapterIndexOf = (id) => {
  const index = CHAPTERS.findIndex((c) => c.id === id);
  return index < 0 ? 0 : index;
};

function teamWindowClosed() {
  try {
    const records = JSON.parse(localStorage.getItem('campaignRecords') || '{}');
    if (String(records?.teamCampaignClosed || '').toLowerCase() === 'true') return true;
  } catch {
    /* ignore */
  }
  return localStorage.getItem('teamCampaignClosed') === 'true';
}

function selfAssessmentComplete() {
  try {
    const records = JSON.parse(localStorage.getItem('campaignRecords') || '{}');
    const selfId = String(records?.selfCampaignId || '').trim();
    if (selfId && localStorage.getItem(`selfCampaignCompleted_${selfId}`) === 'true') return true;
    if (records?.selfCompleted) return true;
  } catch {
    /* ignore */
  }
  return localStorage.getItem('selfCampaignCompleted') === 'true';
}

export function resolveFromLocation(pathname = '', search = '') {
  const params = new URLSearchParams(search || '');
  const tab = String(params.get('tab') || '').trim().toLowerCase();
  const step = String(params.get('step') || '').trim();
  const stage = String(params.get('stage') || '').trim().toLowerCase();

  if (pathname.startsWith('/user-info')) return { chapterId: 'profile', activeStepId: 'account' };
  if (pathname.startsWith('/guide-select')) return { chapterId: 'profile', activeStepId: 'guide' };
  if (pathname.startsWith('/form')) {
    if (step === '1' || stage === 'profile') return { chapterId: 'profile', activeStepId: 'context' };
    if (step === '3') return { chapterId: 'behaviors', activeStepId: 'insights' };
    return { chapterId: 'behaviors', activeStepId: 'habits' };
  }
  if (pathname.startsWith('/summary-static')) return { chapterId: 'reflect', activeStepId: 'trailhead' };
  if (pathname.startsWith('/summary')) {
    const reflectStages = ['trailhead', 'markers', 'hazards', 'new-trail'];
    const active = reflectStages.includes(stage) ? stage : 'trailhead';
    return { chapterId: 'reflect', activeStepId: active };
  }
  if (pathname.startsWith('/trait-selection')) return { chapterId: 'campaign', activeStepId: 'traits' };
  if (pathname.startsWith('/campaign-intro')) return { chapterId: 'campaign', activeStepId: 'builder' };
  if (pathname.startsWith('/campaign-builder')) return { chapterId: 'campaign', activeStepId: 'builder' };
  if (pathname.startsWith('/campaign-verify')) {
    if (selfAssessmentComplete()) return { chapterId: 'assessments', activeStepId: 'team' };
    return { chapterId: 'campaign', activeStepId: 'verify' };
  }
  if (pathname.startsWith('/campaign/')) return { chapterId: 'assessments', activeStepId: 'self' };
  if (pathname.startsWith('/dashboard')) {
    if (tab === 'practice') return { chapterId: 'action', activeStepId: 'practice' };
    if (tab === 'journey') {
      if (!teamWindowClosed()) return { chapterId: 'assessments', activeStepId: 'team' };
      return { chapterId: 'action', activeStepId: 'journey' };
    }
    const active = REVIEW_TABS.includes(tab) ? tab : 'today';
    return { chapterId: 'review', activeStepId: active };
  }
  return null;
}

export const MARKETING_PATHS = ['/', '/landing', '/pricing', '/faq', '/sign-in', '/pay', '/pay/success'];

export function isMarketingPath(pathname = '') {
  if (MARKETING_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/pay')) return true;
  return false;
}
