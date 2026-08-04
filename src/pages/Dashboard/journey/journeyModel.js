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
    title: 'Leader Profile',
    subtitle: 'Name the context that shapes the leadership work in front of you.',
    kind: 'phase',
    blurb: 'Where it begins — you told the Compass who you are and what you lead.',
    completeBlurb: 'You set up your profile, shared the details that shape your context, and chose a guide for the road ahead.',
    arriveHint: 'Daily leadership habits — answer as you normally show up.',
  },
  {
    key: 'behaviors',
    label: 'Behaviors & Instincts',
    title: 'Daily Leadership Habits',
    subtitle: 'These questions help the Compass understand how you normally lead — answer honestly, not aspirationally. The feedback is here to help you grow.',
    kind: 'phase',
    blurb: 'You named the habits and instincts that shape how you show up day to day.',
    completeBlurb: 'You finished the behaviors and instincts stretch — a clear read on how you lead in the flow of real work.',
    arriveHint: 'Reflection & creation — your summary, traits, and growth campaign.',
  },
  {
    key: 'campaign',
    label: 'Reflection & Creation',
    title: 'Reflection & Creation',
    subtitle: 'Take your first internal look, then choose traits and build the growth campaign your team will help you run.',
    kind: 'phase',
    blurb: 'You reflected on the pattern, chose traits to grow, and shaped a campaign your team can answer.',
    completeBlurb: 'You reflected on the trailhead, chose what to grow, and set your campaign in motion.',
    arriveHint: 'Self & team assessment — the first clear signal reading.',
  },
  {
    key: 'assessment',
    label: 'Self & Team Assessment',
    title: 'Self-Assessment',
    subtitle: 'Invite the first clear reading of how your leadership is landing — from you, then from your team.',
    kind: 'assessment',
    campaign: 'team',
    blurb: 'The first real signal — how you and your team each read your leadership.',
    completeBlurb: 'You completed the self and team assessment — the first signal is in.',
    arriveHint: 'Review & reflect — sit with Signal and Evidence before you act.',
  },
  {
    key: 'reflect',
    label: 'Review & Reflect',
    title: 'Review & Reflect',
    subtitle: 'Sit with the signal long enough for the pattern to become clear — Signal, then Evidence.',
    kind: 'phase',
    blurb: 'Sitting with the signal before acting — letting the gaps speak.',
    completeBlurb: 'You walked Signal and Evidence — the pattern is clear enough to act on.',
    arriveHint: 'Action plan — turn insight into practice your team can feel.',
  },
  {
    key: 'action',
    label: 'Action Plan',
    title: 'Action Plan',
    subtitle: 'Turn insight into one practice your team can actually feel.',
    kind: 'action',
    blurb: 'Turning insight into a practice your team can actually feel.',
    completeBlurb: 'You set your bearing and committed to a practice the team can feel.',
    arriveHint: 'Check-in assessment — a second reading of whether the practice is landing.',
  },
  {
    key: 'checkin',
    label: 'Check-In Assessment',
    title: 'Check-In Reading',
    subtitle: 'Take a second reading and notice whether the practice is landing.',
    kind: 'assessment',
    campaign: 'checkin',
    blurb: 'A second reading — is the practice landing the way you hoped?',
    completeBlurb: 'You took the check-in reading — proof of what is landing and what still needs work.',
    arriveHint: 'Revise your action plan — keep what works, adjust what does not.',
  },
  {
    key: 'revise',
    label: 'Revise Action Plan',
    title: 'Practice Revision',
    subtitle: 'Keep what is working and adjust what is asking for a truer path.',
    kind: 'action',
    blurb: 'Adjusting the climb — keep what is working, change what is not.',
    completeBlurb: 'You revised the plan — a truer path for the next stretch.',
    arriveHint: 'Final assessment — the summit reading.',
  },
  {
    key: 'final',
    label: 'Final Assessment',
    title: 'Summit Reading',
    subtitle: 'Gather the summit reading and name the growth your team can feel.',
    kind: 'assessment',
    campaign: 'final',
    blurb: 'The summit reading — proof of how far your team has felt you grow.',
    completeBlurb: 'You reached the summit reading — growth your team can feel.',
    arriveHint: 'The trail continues — carry what you learned forward.',
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

export const chapterText = (index) => `Chapter ${JOURNEY_ROMAN[index] || JOURNEY_ROMAN[0]} of IX`;
export const chapterEyebrow = (index) => `${chapterText(index)} · ${JOURNEY_STATIONS[index]?.label || JOURNEY_STATIONS[0].label}`;

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
  if (path.startsWith('/user-info') || path.startsWith('/guide-select')) return 0;
  if (path.startsWith('/form') && stage === 'profile') return 0;

  // Chapter II — behaviors & instincts (intake)
  if (path.startsWith('/form')) return 1;

  // Chapter III — reflection & creation (summary → traits → campaign)
  if (
    path.startsWith('/summary')
    || path.startsWith('/trait-selection')
    || path.startsWith('/campaign-intro')
    || path.startsWith('/campaign-builder')
    || path.startsWith('/campaign-verify')
  ) return 2;

  // Chapter IV — self & team assessment
  if (path.startsWith('/campaign/')) return 3;

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
  if (pathname.startsWith('/campaign-verify')) return { label: 'Invites', value: 'Ready' };
  if (pathname.startsWith('/campaign/')) return { label: 'Assessment', value: 'Live' };
  if (pathname.startsWith('/dashboard')) {
    if (['growth-plan', 'plan', 'practice'].includes(tab)) return { label: 'Practice', value: 'Active' };
    if (['my-journey', 'journey'].includes(tab)) return { label: 'Chapters', value: '9' };
    return { label: 'Signal', value: 'Current' };
  }
  return null;
}
