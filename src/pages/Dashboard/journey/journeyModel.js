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
    label: 'Profile & Intake',
    title: 'Leader Profile',
    subtitle: 'Name the context that shapes the leadership work in front of you.',
    kind: 'phase',
    blurb: 'Where it begins — you told the Compass who you are and what you lead.',
  },
  {
    key: 'behaviors',
    label: 'Behaviors & Instincts',
    title: 'Instincts Under Pressure',
    subtitle: 'Name the instincts that shape how you show up — honestly, not aspirationally.',
    kind: 'phase',
    blurb: 'You named the instincts that shape how you show up under pressure.',
  },
  {
    key: 'campaign',
    label: 'Campaign Creation',
    title: 'Growth Campaign',
    subtitle: 'Choose the signal you are ready to hear from your team.',
    kind: 'phase',
    blurb: 'You chose the traits to listen for and invited your team to weigh in.',
  },
  {
    key: 'assessment',
    label: 'Self & Team Assessment',
    title: 'First Signal Reading',
    subtitle: 'Invite the first clear reading of how your leadership is landing.',
    kind: 'assessment',
    campaign: 'team',
    blurb: 'The first real signal — how you and your team each read your leadership.',
  },
  {
    key: 'reflect',
    label: 'Review & Reflect',
    title: 'Signal Reflection',
    subtitle: 'Sit with the signal long enough for the pattern to become clear.',
    kind: 'phase',
    blurb: 'Sitting with the signal before acting — letting the gaps speak.',
  },
  {
    key: 'action',
    label: 'Action Plan',
    title: 'Practice Commitment',
    subtitle: 'Turn insight into one practice your team can actually feel.',
    kind: 'action',
    blurb: 'Turning insight into a practice your team can actually feel.',
  },
  {
    key: 'checkin',
    label: 'Check-In Assessment',
    title: 'Check-In Reading',
    subtitle: 'Take a second reading and notice whether the practice is landing.',
    kind: 'assessment',
    campaign: 'checkin',
    blurb: 'A second reading — is the practice landing the way you hoped?',
  },
  {
    key: 'revise',
    label: 'Revise Action Plan',
    title: 'Practice Revision',
    subtitle: 'Keep what is working and adjust what is asking for a truer path.',
    kind: 'action',
    blurb: 'Adjusting the climb — keep what is working, change what is not.',
  },
  {
    key: 'final',
    label: 'Final Assessment',
    title: 'Summit Reading',
    subtitle: 'Gather the summit reading and name the growth your team can feel.',
    kind: 'assessment',
    campaign: 'final',
    blurb: 'The summit reading — proof of how far your team has felt you grow.',
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

  return [
    Boolean(String(userInfo?.name || userInfo?.email || '').trim()),
    Boolean(intakeData || aiSummary),
    campaignCreated,
    Boolean(selfComplete || teamComplete),
    Boolean(teamComplete),
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
  const path = pathname || '';

  if (path.startsWith('/user-info') || path.startsWith('/guide-select')) return 0;
  if (path.startsWith('/form') || path.startsWith('/summary')) return 1;
  if (path.startsWith('/trait-selection') || path.startsWith('/campaign-intro') || path.startsWith('/campaign-builder') || path.startsWith('/campaign-verify')) return 2;
  if (path.startsWith('/campaign/')) return 3;
  if (path.startsWith('/dashboard')) {
    if (['growth-plan', 'plan', 'practice'].includes(tab)) return 5;
    if (['my-journey', 'journey'].includes(tab)) return getCurrentJourneyIndexFromState();
    if (['campaign-results', 'results', 'signals', 'detailed-results', 'detailed', 'evidence'].includes(tab)) return 4;
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
  if (pathname.startsWith('/trait-selection')) return { label: 'Selected', value: `${selectedTraits.length || 0}/3` };
  if (pathname.startsWith('/campaign-builder')) return { label: 'Traits', value: `${currentCampaign.length || selectedTraits.length || 0}/3` };
  if (pathname.startsWith('/campaign-verify')) return { label: 'Invites', value: 'Ready' };
  if (pathname.startsWith('/campaign/')) return { label: 'Assessment', value: 'Live' };
  if (pathname.startsWith('/dashboard')) {
    if (['growth-plan', 'plan', 'practice'].includes(tab)) return { label: 'Practice', value: 'Active' };
    if (['my-journey', 'journey'].includes(tab)) return { label: 'Chapters', value: '9' };
    return { label: 'Signal', value: 'Current' };
  }
  return null;
}
