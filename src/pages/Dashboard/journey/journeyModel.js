import { COMPASS_TRAIL } from './trail-data.js';

export const JOURNEY_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
export const JOURNEY_CHAPTER_COUNT = 9;
export const JOURNEY_BASE_SRC = '/journey-base.png';
export const JOURNEY_IMAGE = {
  width: COMPASS_TRAIL.W,
  height: COMPASS_TRAIL.H,
};

const STATION_META = [
  {
    key: 'intake',
    label: 'Profile',
    title: 'Profile',
    subtitle: 'Name the context that shapes the leadership work in front of you.',
    kind: 'phase',
    blurb: 'This is setup: who you are, the work you lead, and the voice that will talk to you along the way.',
    completeBlurb: 'Your account is set, your context is in, and you chose a guide. Nothing has been scored yet — that is next.',
    arriveHint: 'About 23 questions on how you actually lead. Roughly 15 minutes. Answer as you normally show up, not as you wish you did. When you finish, Compass writes your reflection.',
  },
  {
    key: 'behaviors',
    label: 'Behaviors & Instincts',
    title: 'Daily Leadership Habits',
    subtitle: 'These questions help the Compass understand how you normally lead — answer honestly, not aspirationally. The feedback is here to help you grow.',
    kind: 'phase',
    blurb: 'Next is the intake: about 23 questions on how you lead under real conditions. Not a personality quiz. Honest answers make a better writeup.',
    completeBlurb: 'You finished the intake — how you actually lead, not a type. Those answers are what the reflection is built from.',
    arriveHint: 'Your written reflection is ready. You will read it in four short parts, then choose three traits, then build the campaign your team will answer.',
  },
  {
    key: 'campaign',
    label: 'Reflection & Creation',
    title: 'Reflection & Creation',
    subtitle: 'Take your first internal look, then choose traits and build the growth campaign your team will help you run.',
    kind: 'phase',
    blurb: 'Your answers are in. Next you will read a four-part writeup of how you lead, pick three traits to grow, then build the campaign your team can answer.',
    completeBlurb: 'You read the reflection, chose three traits, and set the sentences your team will rate. Next you rate yourself, then send a separate link to the team.',
    arriveHint: 'Rate yourself on the same sentences your team will see, then invite them. About five minutes each. You will see the aggregate — never individuals.',
  },
  {
    key: 'assessment',
    label: 'Campaign Assessment',
    title: 'Campaign Assessment',
    subtitle: 'Rate yourself first, then invite your team with a different link you send by hand.',
    kind: 'assessment',
    campaign: 'team',
    blurb: 'Rate yourself first on the same statements your team will see. Then invite them. Effort is how much you try this; Efficacy is how well it lands.',
    completeBlurb: 'You rated yourself. Next you send a separate link — by hand — so the team reading stays anonymous.',
    arriveHint: 'You go first on the same fifteen statements. Then you invite the team with a different link.',
  },
  {
    key: 'reflect',
    label: 'Review & Reflect',
    title: 'Review & Reflect',
    subtitle: 'Sit with the signal long enough for the pattern to become clear — Signal, then Evidence.',
    kind: 'phase',
    blurb: 'Read what the team reflected back before you act. Signal first, then Evidence. About five minutes. Patterns matter more than any one number.',
    completeBlurb: 'You walked Signal and Evidence. The pattern is clear enough to choose one practice your team can feel.',
    arriveHint: 'Turn one insight into a practice — not a list of goals. One behavior your team should be able to notice.',
  },
  {
    key: 'action',
    label: 'Action Plan',
    title: 'Action Plan',
    subtitle: 'Turn insight into one practice your team can actually feel.',
    kind: 'action',
    blurb: 'Choose one practice your team can actually feel. Keep it small enough to fit a normal week.',
    completeBlurb: 'You committed to a practice. The next reading will tell you whether it is landing.',
    arriveHint: 'A second survey — same traits, a later moment. Notice what changed and what did not.',
  },
  {
    key: 'checkin',
    label: 'Check-In Assessment',
    title: 'Check-In Reading',
    subtitle: 'Take a second reading and notice whether the practice is landing.',
    kind: 'assessment',
    campaign: 'checkin',
    blurb: 'A second reading of the same traits. Compare it to the first signal, not to an ideal.',
    completeBlurb: 'You took the check-in reading — proof of what is landing and what still needs work.',
    arriveHint: 'Keep what is working. Change what is not. Then one more reading at the summit.',
  },
  {
    key: 'revise',
    label: 'Revise Action Plan',
    title: 'Practice Revision',
    subtitle: 'Keep what is working and adjust what is asking for a truer path.',
    kind: 'action',
    blurb: 'Keep what is working. Adjust what is not. The plan can change; the traits stay.',
    completeBlurb: 'You revised the plan — a truer path for the next stretch.',
    arriveHint: 'Final assessment — the last reading of whether the practice changed what the team feels.',
  },
  {
    key: 'final',
    label: 'Final Assessment',
    title: 'Summit Reading',
    subtitle: 'Gather the summit reading and name the growth your team can feel.',
    kind: 'assessment',
    campaign: 'final',
    blurb: 'The last reading of this year: name what changed, and what still asks for work.',
    completeBlurb: 'You reached the summit reading — growth your team can feel.',
    arriveHint: 'Carry what you learned forward. The trail continues if you run another cycle.',
  },
];
export const JOURNEY_STATIONS = STATION_META.map((station, index) => {
  const point = COMPASS_TRAIL.POINTS[COMPASS_TRAIL.STATION_POINT_INDICES[index]];
  return {
    ...station,
    index,
    chapterNum: JOURNEY_ROMAN[index],
    x: point[0] / COMPASS_TRAIL.W,
    y: point[1] / COMPASS_TRAIL.H,
    point,
  };
});

export const chapterText = (index) => `Chapter ${JOURNEY_ROMAN[Math.min(index, 6)] || JOURNEY_ROMAN[0]} of VII`;
export const chapterEyebrow = (index) => `${chapterText(index)} · ${JOURNEY_STATIONS[index]?.label || JOURNEY_STATIONS[0].label}`;

/** Same-chapter handoffs that still deserve the map popup. */
export const FLOW_HANDOFFS = [
  {
    id: 'profile-to-guide',
    fromPrefix: '/form',
    fromStage: 'profile',
    toPrefix: '/guide-select',
    fromIndex: 0,
    toIndex: 0,
    fromLabel: 'Your context',
    completeBlurb: 'Setup is done: who you are and the work you lead. Next you pick the voice that will talk to you for the year. This does not change your answers — only the tone of the writeup and later notes.',
    toLabel: 'Your guide',
    blurb: 'Choose the guide whose voice fits you. You can change it later.',
    arriveHint: 'Then the intake begins — about 23 questions, roughly 15 minutes.',
  },
  {
    id: 'summary-to-traits',
    fromPrefix: '/summary',
    toPrefix: '/trait-selection',
    fromIndex: 2,
    toIndex: 2,
    fromLabel: 'Your reflection',
    completeBlurb: 'You have the writeup from your intake. The next decision is which three traits your year will run on.',
    toLabel: 'Choose three traits',
    blurb: 'The reflection surfaced five options, each tied to how you lead. Choose three. Those three shape every check-in that follows.',
    arriveHint: 'Pick the three that feel most true, most visible to your team, and most useful for the next stretch.',
  },
  {
    id: 'traits-to-builder',
    fromPrefix: '/trait-selection',
    toPrefix: '/campaign-builder',
    fromIndex: 2,
    toIndex: 2,
    fromLabel: 'Three traits',
    completeBlurb: 'You chose the three traits your year runs on. Next you review the sentences your team will actually rate.',
    toLabel: 'Build the campaign',
    blurb: 'This is not a marketing campaign. Keep the statements that feel fair and useful. Remove anything confusing, unfair, or outside this stretch.',
    arriveHint: 'You will review each trait’s statements, then move to self-assessment and the team invite.',
  },
  {
    id: 'traits-to-intro',
    fromPrefix: '/trait-selection',
    toPrefix: '/campaign-intro',
    fromIndex: 2,
    toIndex: 2,
    fromLabel: 'Three traits',
    completeBlurb: 'You chose the three traits your year runs on. Next you review the sentences your team will actually rate.',
    toLabel: 'Build the campaign',
    blurb: 'This is not a marketing campaign. Keep the statements that feel fair and useful. Remove anything confusing, unfair, or outside this stretch.',
    arriveHint: 'You will review each trait’s statements, then move to self-assessment and the team invite.',
  },
  {
    id: 'builder-to-verify',
    fromPrefix: '/campaign-builder',
    toPrefix: '/campaign-verify',
    fromIndex: 2,
    toIndex: 2,
    fromLabel: 'Campaign statements',
    completeBlurb: 'The sentences are set. Next you lock the campaign, then rate yourself on the same statements.',
    toLabel: 'Review and lock in',
    blurb: 'Read the three traits and fifteen statements. If this is the campaign you will own, lock it in.',
    arriveHint: 'Locking in starts the self-assessment. The team link comes after that.',
  },
  {
    id: 'intro-to-verify',
    fromPrefix: '/campaign-intro',
    toPrefix: '/campaign-verify',
    fromIndex: 2,
    toIndex: 2,
    fromLabel: 'Campaign statements',
    completeBlurb: 'The sentences are set. Next you lock the campaign, then rate yourself on the same statements.',
    toLabel: 'Review and lock in',
    blurb: 'Read the three traits and fifteen statements. If this is the campaign you will own, lock it in.',
    arriveHint: 'Locking in starts the self-assessment. The team link comes after that.',
  },
  {
    id: 'guide-to-pay',
    fromPrefix: '/guide-select',
    toPrefix: '/pay',
    fromIndex: 0,
    toIndex: 0,
    fromLabel: 'Your guide',
    completeBlurb: 'You chose the voice that will talk to you this year. Next is a short payment step, then the intake begins.',
    toLabel: 'Payment',
    blurb: 'This unlocks the year: reflection, campaign, and the team reading. Intro pricing applies to the first set of leaders.',
    arriveHint: 'After this, about 23 questions. Roughly 15 minutes. Honest answers make a better writeup.',
  },
  {
    id: 'pay-to-intake',
    fromPrefix: '/pay',
    toPrefix: '/form',
    toStage: 'intake',
    fromIndex: 0,
    toIndex: 1,
    fromLabel: 'Payment',
    completeBlurb: 'You are in. The next stretch is the intake — how you actually lead, not the version you wish they saw.',
    toLabel: 'Behaviors & instincts',
    blurb: 'About 23 questions, roughly 15 minutes. Answer as you normally show up. When you finish, Compass writes your reflection.',
    arriveHint: 'Sit with anything that surprises you. The discomfort is part of the data.',
  },
  {
    id: 'verify-to-self',
    fromPrefix: '/campaign-verify',
    toPrefix: '/campaign/',
    fromIndex: 2,
    toIndex: 3,
    fromLabel: 'Campaign ready',
    completeBlurb: 'The statements are locked. Next you rate yourself on the same sentences your team will see. Do not send them this link.',
    toLabel: 'Self-assessment',
    blurb: 'About five minutes. Rate how you actually show up, not the version you wish they saw.',
    arriveHint: 'When you finish, you return here to copy the separate team link.',
  },
  {
    id: 'self-complete-to-invite',
    fromPrefix: '/campaign/',
    toPrefix: '/campaign-verify',
    fromIndex: 3,
    toIndex: 2,
    fromLabel: 'Self-assessment',
    completeBlurb: 'Your benchmark is in. The team link is now the thing that matters — a different URL, a different password.',
    toLabel: 'Invite the team',
    blurb: 'Copy the team link only. Wait until everyone has answered, then close the survey. Signal stays empty until then.',
    arriveHint: 'Send it to the people who see you lead. You will not see individuals.',
  },
];

export const matchFlowHandoff = (fromPath = '', toPath = '', fromSearch = '', toSearch = '') => {
  const fromStage = String(new URLSearchParams(fromSearch || '').get('stage') || '').trim().toLowerCase();
  const toStage = String(new URLSearchParams(toSearch || '').get('stage') || '').trim().toLowerCase();
  return FLOW_HANDOFFS.find((step) => {
    if (!fromPath.startsWith(step.fromPrefix) || !toPath.startsWith(step.toPrefix)) return false;
    if (step.fromStage && fromStage !== step.fromStage) return false;
    if (step.toStage && toStage !== step.toStage) return false;
    return true;
  }) || null;
};

export const readJourneyJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function getJourneyCompletion() {
  const userInfo = readJourneyJson('userInfo', {});
  const intakeData = readJourneyJson('latestFormData', null);
  const aiSummary = String(localStorage.getItem('aiSummary') || '').trim();
  const selectedTraits = readJourneyJson('selectedTraits', []);
  const currentCampaign = readJourneyJson('currentCampaign', []);
  const campaignRecords = readJourneyJson('campaignRecords', {});
  const actionPlansByCampaign = readJourneyJson('actionPlansByCampaign', {});
  const userKey = String(userInfo?.email || userInfo?.name || userInfo?.uid || 'anonymous').trim() || 'anonymous';
  const campaignKey = String(
    campaignRecords?.teamCampaignId
      || campaignRecords?.selfCampaignId
      || campaignRecords?.bundleId
      || 'current'
  );
  const planBuckets = actionPlansByCampaign?.[campaignKey]?.[userKey]?.plans || {};
  const hasAnyPlan = Object.values(planBuckets).some((subtraits) => (
    Object.values(subtraits || {}).some((plan) => (
      String(plan?.commitment || plan?.guidedAnswers?.behaviorCommitment || '').trim()
      || (Array.isArray(plan?.items) && plan.items.length > 0)
    ))
  ));
  const selfCampaignId = String(campaignRecords?.selfCampaignId || '').trim();
  const selfComplete = selfCampaignId
    ? localStorage.getItem(`selfCampaignCompleted_${selfCampaignId}`) === 'true' || Boolean(campaignRecords?.selfCompleted)
    : localStorage.getItem('selfCampaignCompleted') === 'true';
  const teamComplete = localStorage.getItem('teamCampaignCompleted') === 'true' || Boolean(campaignRecords?.teamCampaignClosed);
  const campaignCreated = Array.isArray(currentCampaign) && currentCampaign.length > 0
    || Array.isArray(selectedTraits) && selectedTraits.length >= 3
    || Boolean(campaignRecords?.bundleId || campaignRecords?.teamCampaignId || campaignRecords?.selfCampaignId);

  // Ch5 complete only after Signal + Evidence walkthroughs, not merely team survey close.
  const debriefCampaignKey = String(
    campaignRecords?.bundleId
    || campaignRecords?.teamCampaignId
    || campaignRecords?.selfCampaignId
    || '123'
  );
  const debriefDone = readJourneyJson(`signalDebrief_${debriefCampaignKey}_${userKey}_done`, {});
  const reviewReflectComplete = Boolean(debriefDone?.signal && debriefDone?.evidence);

  return [
    Boolean(String(userInfo?.name || userInfo?.email || '').trim()),
    Boolean(intakeData || aiSummary),
    campaignCreated,
    Boolean(selfComplete || teamComplete),
    reviewReflectComplete,
    Boolean(hasAnyPlan),
    false,
    false,
    false,
  ];
}

export function getCurrentJourneyIndexFromState() {
  const completion = getJourneyCompletion();
  const firstOpen = completion.findIndex((complete) => !complete);
  return firstOpen === -1 ? JOURNEY_STATIONS.length - 1 : firstOpen;
}

export function getJourneyIndexForLocation(pathname = '', search = '') {
  const params = new URLSearchParams(search || '');
  const tab = String(params.get('tab') || '').trim().toLowerCase();
  const stage = String(params.get('stage') || '').trim().toLowerCase();
  const path = pathname || '';

  // Chapter I — profile creation, profile details, guide selection
  if (path.startsWith('/user-info') || path.startsWith('/guide-select') || path.startsWith('/pay')) return 0;
  if (path.startsWith('/form') && stage === 'profile') return 0;

  // Chapter II — behaviors & instincts (intake)
  if (path.startsWith('/form')) return 1;

  // Growth campaign lives on the reflection/creation node.
  if (
    path.startsWith('/summary')
    || path.startsWith('/trait-selection')
    || path.startsWith('/campaign-intro')
    || path.startsWith('/campaign-builder')
    || path.startsWith('/campaign-verify')
  ) return 2;

  // Self-assessment and team invite share the next node, right after the campaign.
  if (
    path.startsWith('/self-assessment')
    || path.startsWith('/team-assessment')
    || path.startsWith('/campaign/')
  ) return 3;

  if (path.startsWith('/dashboard')) {
    // Chapter VI — action plan / practice
    if (['growth-plan', 'plan', 'practice'].includes(tab)) return 5;
    if (['my-journey', 'journey'].includes(tab)) return getCurrentJourneyIndexFromState();
    // Chapter V — review & reflect (signal + evidence)
    if (['campaign-results', 'results', 'signals', 'signal', 'detailed-results', 'detailed', 'evidence'].includes(tab)) return 4;
    return getCurrentJourneyIndexFromState();
  }
  return getCurrentJourneyIndexFromState();
}
export function getHeaderMetaForLocation(pathname = '', search = '') {
  const params = new URLSearchParams(search || '');
  const tab = String(params.get('tab') || '').trim().toLowerCase();
  const selectedTraits = readJourneyJson('selectedTraits', []);
  const currentCampaign = readJourneyJson('currentCampaign', []);

  if (pathname.startsWith('/form')) return { label: 'Questions', value: 'In progress' };
  if (pathname.startsWith('/trait-selection')) {
    return { label: 'Selected', current: selectedTraits.length || 0, total: 3, value: `${selectedTraits.length || 0}/3` };
  }
  if (pathname.startsWith('/campaign-builder')) {
    const traitCount = currentCampaign.length || selectedTraits.length || 0;
    return { label: 'Traits', current: traitCount, total: 3, value: `${traitCount}/3` };
  }
  if (pathname.startsWith('/campaign-verify')) return { label: 'Review', value: 'Ready' };
  if (pathname.startsWith('/self-assessment')) return { label: 'Assessment', value: 'Yours' };
  if (pathname.startsWith('/team-assessment')) return { label: 'Invite', value: 'Team' };
  if (pathname.startsWith('/campaign/')) return { label: 'Assessment', value: 'Live' };
  if (pathname.startsWith('/dashboard')) {
    if (['growth-plan', 'plan', 'practice'].includes(tab)) return { label: 'Practice', value: 'Active' };
    if (['my-journey', 'journey'].includes(tab)) return { label: 'Chapters', value: '9' };
    return { label: 'Signal', value: 'Current' };
  }
  return null;
}
