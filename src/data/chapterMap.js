/**
 * Canonical chapter map for the Compass chapter header.
 *
 * chapter.purpose  → drawer column 1 ("What this chapter is for"), one or two sentences.
 * step.whatHappens → drawer column 2 ("What happens here"), scoped to the ACTIVE STEP.
 *                    Short fragments, not sentences. 2-3 per step, no period.
 *                    They tell the leader what this screen is, not what the chapter is.
 *
 * Single source of truth for chapter numbers, names, step lists, and drawer copy.
 * Numbering is of VII.
 */

export const CHAPTER_TOTAL = 7;

export const CHAPTERS = [
  {
    id: 'profile',
    num: 'I',
    name: 'Profile Creation',
    purpose:
      'The Compass reads your context before it reads your leadership. These details shape every insight that follows.',
    steps: [
      {
        id: 'context',
        label: 'Your Context',
        path: '/user-info',
        whatHappens: ['Industry, team size, tenure', 'Context, not scoring', 'Editable later'],
      },
      {
        id: 'guide',
        label: 'Choose Your Guide',
        path: '/guide-select',
        whatHappens: ['Six voices, one pick', 'Gut answer', 'Swappable any time'],
      },
    ],
  },
  {
    id: 'behaviors',
    num: 'II',
    name: 'Behaviors & Instincts',
    purpose:
      'These questions are about how you normally lead day to day, not who you wish you were. They are the raw material every later chapter reads from.',
    steps: [
      {
        id: 'context',
        label: 'Your Context',
        path: '/form?step=1',
        whatHappens: ['A few details about your role', 'Shapes how your guide reads you'],
      },
      {
        id: 'habits',
        label: 'Daily Leadership Habits',
        path: '/form?step=2',
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
    id: 'insights',
    num: 'III',
    name: 'Leadership Reflection',
    purpose:
      'Your answers have been read back to you as a reflection. This chapter turns that reading into a decision: the three traits your next campaign will measure.',
    steps: [
      {
        id: 'summary',
        label: 'Summary',
        path: '/summary',
        whatHappens: ['Four stages, read in order', 'Written from your own answers', 'Nothing to choose yet'],
      },
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
        whatHappens: ['Statements written per trait', 'Your edits, your language', 'Sends when you approve'],
      },
    ],
  },
  {
    id: 'campaign',
    num: 'IV',
    name: 'Campaign Creation',
    purpose:
      'A campaign is the set of statements your team will answer. This chapter is where you approve the language before anyone sees it.',
    steps: [
      { id: 'intro', label: 'Campaign Intro', path: '/campaign-intro', whatHappens: ['What your team will see', 'No edits here'] },
      { id: 'build', label: 'Build Statements', path: '/campaign-builder', whatHappens: ['Statements per trait', 'Edit anything that sounds off'] },
      { id: 'verify', label: 'Review & Send', path: '/campaign-verify', whatHappens: ['Who is invited', 'How long the window stays open', 'Last look before it sends'] },
    ],
  },
  {
    id: 'self',
    num: 'V',
    name: 'Self-Assess',
    purpose:
      'You answer the same statements your team is answering. The difference between the two readings is the most useful number in the tool.',
    steps: [
      {
        id: 'self',
        label: 'Self-Assessment',
        path: '/campaign/self',
        whatHappens: ['The same statements your team sees', 'Answered before you see theirs', 'Private, shown only as a comparison'],
      },
    ],
  },
  {
    id: 'team',
    num: 'VI',
    name: 'Team Assess',
    purpose:
      'This chapter belongs to your team. Your only job is to keep the window open long enough for everyone to answer.',
    steps: [
      { id: 'status', label: 'Response Status', path: '/dashboard?tab=journey', whatHappens: ['Counts only, no answers', 'Reminders you can send'] },
      { id: 'close', label: 'Close the Window', path: '/dashboard?tab=journey', whatHappens: ['Closing opens the reading', 'Partial results are a sketch'] },
    ],
  },
  {
    id: 'review',
    num: 'VII',
    name: 'Review & Act',
    purpose:
      'Your team has answered on the traits you chose. This chapter is where you understand what came back, check it against the statements behind it, and decide what you will practice.',
    steps: [
      { id: 'today', label: 'Today', path: '/dashboard?tab=today', whatHappens: ['Where you are this week', 'One habit to mark'] },
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
      {
        id: 'practice',
        label: 'Practice',
        path: '/dashboard?tab=practice',
        gated: true,
        whatHappens: ['One visible behavior per trait', 'Small enough to hold', 'Held until the next check-in'],
      },
      { id: 'journey', label: 'Journey', path: '/dashboard?tab=journey', whatHappens: ['The whole map', 'Where you have been'] },
    ],
  },
];

const DASHBOARD_TABS = ['today', 'signal', 'evidence', 'practice', 'journey'];

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);
export const chapterByStep = (stepId) =>
  CHAPTERS.find((c) => c.steps.some((s) => s.id === stepId));
export const stepIn = (chapterId, stepId) =>
  chapterById(chapterId)?.steps.find((s) => s.id === stepId);
export const chapterIndexOf = (id) => {
  const index = CHAPTERS.findIndex((c) => c.id === id);
  return index < 0 ? 0 : index;
};

export function resolveFromLocation(pathname = '', search = '') {
  const params = new URLSearchParams(search || '');
  const tab = String(params.get('tab') || '').trim().toLowerCase();
  const step = String(params.get('step') || '').trim();
  const stage = String(params.get('stage') || '').trim().toLowerCase();

  if (pathname.startsWith('/user-info')) return { chapterId: 'profile', activeStepId: 'context' };
  if (pathname.startsWith('/guide-select')) return { chapterId: 'profile', activeStepId: 'guide' };
  if (pathname.startsWith('/form')) {
    if (step === '1' || stage === 'profile') return { chapterId: 'behaviors', activeStepId: 'context' };
    if (step === '3') return { chapterId: 'behaviors', activeStepId: 'insights' };
    return { chapterId: 'behaviors', activeStepId: 'habits' };
  }
  if (pathname.startsWith('/summary')) return { chapterId: 'insights', activeStepId: 'summary' };
  if (pathname.startsWith('/trait-selection')) return { chapterId: 'insights', activeStepId: 'traits' };
  if (pathname.startsWith('/campaign-intro')) return { chapterId: 'campaign', activeStepId: 'intro' };
  if (pathname.startsWith('/campaign-builder')) return { chapterId: 'campaign', activeStepId: 'build' };
  if (pathname.startsWith('/campaign-verify')) return { chapterId: 'campaign', activeStepId: 'verify' };
  if (pathname.startsWith('/campaign/')) return { chapterId: 'self', activeStepId: 'self' };
  if (pathname.startsWith('/dashboard')) {
    const active = DASHBOARD_TABS.includes(tab) ? tab : 'today';
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
