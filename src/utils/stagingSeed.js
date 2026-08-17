/**
 * Staging seed — populates localStorage with realistic fixture data so every
 * page in the Cairn (staging) theme has what it needs to render without
 * requiring real Firebase auth or a completed user flow.
 *
 * Only imported / executed when useCairnTheme === true.
 */

import { STAGING_GUIDE_SUMMARIES, stagingFlattenedSummary } from '../data/stagingGuideSummaries';

export const STAGING_USER_ID   = 'staging-test-uid-001';
export const STAGING_EMAIL     = 'alex@staging.test';
export const STAGING_SELF_ID   = 'staging-self-001';
export const STAGING_TEAM_ID   = 'staging-team-001';
export const STAGING_BUNDLE_ID = 'staging-bundle-001';
export const STAGING_SEED_VERSION = '2026-08-17-guide-voices-v1';

// Keys written by the seed so clearStagingData() can remove them precisely.
const SEED_KEYS = [
  'userInfo',
  'latestFormData',
  'intakeDraft',
  'intakeStatus',
  'aiSummary',
  'summariesByGuide',
  'focusAreas',
  'trailheadHighlights',
  'selectedAgent',
  'selectedGuideId',
  'selectedTraits',
  'currentCampaign',
  'campaignRecords',
  `campaign_${STAGING_SELF_ID}`,
  `campaign_${STAGING_TEAM_ID}`,
  `teamCampaignAccess_${STAGING_TEAM_ID}`,
  `latestSurveyRatings_${STAGING_SELF_ID}`,
  `latestSurveyRatings_${STAGING_TEAM_ID}`,
  `selfCampaignCompleted_${STAGING_SELF_ID}`,
  'selfCampaignCompleted',
  'teamCampaignCompleted',
  'actionPlansByCampaign',
  'cairn_profile_details_complete',
  '__cairn_seeded__',
  '__cairn_seed_version__',
  'journeyCeremonySeen',
];

const CAMPAIGN_TRAITS = [
  {
    trait: 'Communication',
    subTrait: 'Clarity',
    title: 'Clarity',
    traitId: 'communication',
    traitName: 'Communication',
    statements: [
      'My leader communicates expectations clearly before starting a project.',
      'I rarely need to ask for clarification after receiving direction.',
      'My leader adapts their communication style to different team members.',
      'Complex decisions are explained in a way I can understand and act on.',
      'I feel confident I know what success looks like for my role.',
    ],
  },
  {
    trait: 'Execution & Follow-Through',
    subTrait: 'Deadline Management',
    title: 'Deadline Management',
    traitId: 'execution',
    traitName: 'Execution & Follow-Through',
    statements: [
      'My leader sets realistic timelines and delivers on commitments.',
      'When timelines shift, I am informed early with clear context.',
      'My leader helps remove blockers that affect our team\'s delivery.',
      'Our team consistently meets its commitments to other stakeholders.',
      'I trust that my leader will follow through on what they promise.',
    ],
  },
  {
    trait: 'Strategic Thinking',
    subTrait: 'Vision',
    title: 'Vision',
    traitId: 'strategicThinking',
    traitName: 'Strategic Thinking',
    statements: [
      'I can clearly describe where our team is headed in the next 6–12 months.',
      'My leader connects day-to-day work to a larger purpose or goal.',
      'Strategic priorities are revisited and adjusted when needed.',
      'I understand how my work contributes to the organization\'s direction.',
      'My leader anticipates challenges and prepares the team in advance.',
    ],
  },
];

export function seedStagingData() {
  const now = new Date().toISOString();
  const seededRatings = Array.from({ length: 15 }, (_, idx) => [
    idx,
    {
      effort: 5 + (idx % 3),
      efficacy: 6 + (idx % 2),
    },
  ]).reduce((acc, [idx, value]) => ({ ...acc, [idx]: value }), {});

  localStorage.setItem('userInfo', JSON.stringify({
    name: 'Alex Rivera',
    email: STAGING_EMAIL,
    enteredEmail: STAGING_EMAIL,
    uid: STAGING_USER_ID,
    consent: { terms: true, privacy: true, acceptedAt: now },
  }));

  const formData = {
    name: 'Alex Rivera',
    email: STAGING_EMAIL,
    role: 'Director',
    department: 'Product',
    industry: 'Technology',
    teamSize: '10-25',
    yearsExperience: '5-10',
    yearBorn: '1985',
    // Exact option strings from behaviorSet — wrong values here lock/break the questions
    resourcePick: 'Expectations',
    projectApproach: 'Gather the team for a collaborative brainstorming session.',
    energyDrains: [
      'Meetings with limited or no outcomes',
      'Navigating frequent changes in priorities',
      'Pursuing goals that lack clear direction',
    ],
    crisisResponse: [
      'Maintain composure and provide clear, decisive direction to the team.',
      'Immediately gather the team to collaborate on potential solutions.',
      'First verify all facts and details before taking any action.',
      'Delegate ownership to team members while providing support from the sidelines.',
      'Jump in directly to handle the most critical aspects myself.',
    ],
    pushbackFeeling: ['Frustrated', 'Curious', 'Open'],
    roleModelTrait: 'communicated',
    roleModelTraitElaboration: 'They always made complex things feel simple and never talked down to the team.',
    warningLabel: 'Caution: May overthink the details',
    leaderFuel: [
      'Seeing the team gel and succeed together',
      'Hearing the team say they learned something',
      'Nailing a tough project on time',
      'Solving a problem no one else could',
      'My team getting the recognition it deserves',
      'Turning chaos into order',
    ],
    proudMoment: 'Led a cross-functional initiative that shipped on time, directly improving team delivery velocity by 22%.',
    behaviorDichotomies: [4, 8, 3, 7, 6],
    visibilityComfort: 'I can handle it but prefer smaller settings.',
    decisionPace: 'The Feedback',
    teamPerception: 'Observe for patterns and gather context before taking action.',
    responsibilities: 'Product roadmap, cross-functional alignment, and team development',
    societalResponses: [7, 6, 8, 5, 7, 9, 6, 8, 7, 6],
    selectedAgent: 'mentor',
  };
  localStorage.setItem('latestFormData', JSON.stringify(formData));
  localStorage.setItem('selectedGuideId', 'mentor');
  localStorage.setItem('selectedAgent', 'mentor');

  localStorage.setItem('intakeDraft', JSON.stringify({
    formData,
    societalResponses: formData.societalResponses,
    currentStep: 3,
    reflectionNumber: 1,
    reflectionText: '',
    societalQuestionIndex: 0,
  }));

  localStorage.setItem('intakeStatus', JSON.stringify({
    started: true,
    complete: true,
    totalSteps: 4,
    updatedAt: now,
  }));

  localStorage.setItem('summariesByGuide', JSON.stringify(STAGING_GUIDE_SUMMARIES));
  localStorage.setItem('aiSummary', stagingFlattenedSummary('mentor'));

  localStorage.setItem('focusAreas', JSON.stringify([
    {
      id: 'communication-clarity',
      traitName: 'Communication',
      traitDefinition: 'Communication is the foundation of effective leadership.',
      subTraitName: 'Clarity',
      subTraitDefinition: 'The ability to break down complex concepts into simple, digestible messages.',
      example: 'Team members ask "What do you mean?" after receiving direction.',
      risk: 'Team confidence erodes as members lose trust in your direction.',
      impact: 'When clarity is strong, your team moves with confidence and alignment.',
    },
    {
      id: 'execution-deadlineManagement',
      traitName: 'Execution & Follow-Through',
      traitDefinition: 'The ability to translate plans into action and deliver results consistently.',
      subTraitName: 'Deadline Management',
      subTraitDefinition: 'Meeting commitments and delivering on time.',
      example: 'Deadlines slip without early warning, eroding stakeholder trust.',
      risk: 'You underestimate how long work will take, causing downstream delays.',
      impact: 'Consistent delivery builds credibility and team confidence.',
    },
    {
      id: 'strategicThinking-vision',
      traitName: 'Strategic Thinking',
      traitDefinition: 'The ability to see the big picture and align actions with long-term goals.',
      subTraitName: 'Vision',
      subTraitDefinition: 'Articulating a compelling future state.',
      example: 'Team members cannot describe where the team is heading.',
      risk: 'Decisions seem disconnected or reactive.',
      impact: 'A clear vision energizes the team and guides daily prioritization.',
    },
    {
      id: 'teamDevelopment-performanceManagement',
      traitName: 'Team Development & Coaching',
      traitDefinition: 'The ability to develop, mentor, and grow team members.',
      subTraitName: 'Performance Management',
      subTraitDefinition: 'Setting expectations and managing performance.',
      example: 'People do not know what is expected of them.',
      risk: 'Performance gaps persist unchecked and erode team morale.',
      impact: 'Clear expectations and feedback unlock individual and team potential.',
    },
    {
      id: 'decisionMaking-stakeholderConsideration',
      traitName: 'Decision-Making & Judgment',
      traitDefinition: 'Making sound decisions efficiently by balancing analysis with action.',
      subTraitName: 'Stakeholder Consideration',
      subTraitDefinition: 'Understanding how decisions affect different stakeholders.',
      example: 'Key stakeholders feel excluded and resist decisions.',
      risk: 'Stakeholder relationships deteriorate, creating roadblocks.',
      impact: 'Inclusive decisions generate buy-in and reduce implementation friction.',
    },
  ]));

  localStorage.setItem('selectedTraits', JSON.stringify([
    'communication-clarity',
    'execution-deadlineManagement',
    'strategicThinking-vision',
  ]));

  localStorage.setItem('currentCampaign', JSON.stringify(CAMPAIGN_TRAITS));

  const campaignRecords = {
    bundleId: STAGING_BUNDLE_ID,
    ownerId: STAGING_EMAIL,
    ownerUid: STAGING_USER_ID,
    campaignSignature: 'staging-sig-001',
    selfCampaignId: STAGING_SELF_ID,
    teamCampaignId: STAGING_TEAM_ID,
    selfCampaignLink: `${window.location.origin}/campaign/${STAGING_SELF_ID}`,
    selfCampaignPassword: 'STAGE001',
    teamCampaignLink: `${window.location.origin}/campaign/${STAGING_TEAM_ID}`,
    teamCampaignPassword: 'STAGE002',
    selfCompleted: false,
    teamCampaignClosed: false,
    createdAt: now,
    savedAt: now,
  };
  localStorage.setItem('campaignRecords', JSON.stringify(campaignRecords));

  const selfCampaign = {
    campaignType: 'self',
    campaign: CAMPAIGN_TRAITS,
    ownerId: STAGING_EMAIL,
    ownerUid: STAGING_USER_ID,
    bundleId: STAGING_BUNDLE_ID,
    selfCampaignId: STAGING_SELF_ID,
    teamCampaignId: STAGING_TEAM_ID,
    accessToken: 'stage-self-token',
    surveyClosed: false,
    createdAt: now,
  };
  localStorage.setItem(`campaign_${STAGING_SELF_ID}`, JSON.stringify(selfCampaign));

  const teamCampaign = {
    campaignType: 'team',
    campaign: CAMPAIGN_TRAITS,
    ownerId: STAGING_EMAIL,
    ownerUid: STAGING_USER_ID,
    bundleId: STAGING_BUNDLE_ID,
    selfCampaignId: STAGING_SELF_ID,
    teamCampaignId: STAGING_TEAM_ID,
    accessToken: 'stage-team-token',
    surveyClosed: false,
    createdAt: now,
  };
  localStorage.setItem(`campaign_${STAGING_TEAM_ID}`, JSON.stringify(teamCampaign));
  localStorage.setItem(`teamCampaignAccess_${STAGING_TEAM_ID}`, 'granted');
  localStorage.setItem('teamCampaignCompleted', 'false');
  localStorage.setItem('selfCampaignCompleted', 'false');
  localStorage.setItem(`selfCampaignCompleted_${STAGING_SELF_ID}`, 'false');

  localStorage.setItem(`latestSurveyRatings_${STAGING_SELF_ID}`, JSON.stringify(seededRatings));
  localStorage.setItem(`latestSurveyRatings_${STAGING_TEAM_ID}`, JSON.stringify(seededRatings));

  const actionPlansForUser = {
    plans: {
      'Communication': {
        'Clarity': {
          commitment: 'I will open every team briefing with a single sentence that defines the expected outcome.',
          guidedAnswers: { behaviorCommitment: 'Start with the destination before the details.' },
          items: [
            { text: 'Use the "one sentence test" before each briefing', checked: false },
            { text: 'Follow up written messages with a verbal check-in for critical items', checked: false },
            { text: 'Ask "What questions do you have?" instead of "Do you understand?"', checked: false },
          ],
        },
      },
      'Execution & Follow-Through': {
        'Deadline Management': {
          commitment: 'I will flag timeline risks at least 48 hours before a deadline, not after.',
          guidedAnswers: { behaviorCommitment: 'Proactive transparency over reactive explanation.' },
          items: [
            { text: 'Build a 10% buffer into all team estimates', checked: false },
            { text: 'Set a mid-point check-in for every deliverable over 5 days', checked: false },
            { text: 'Send a weekly "on track / at risk" status update to stakeholders', checked: false },
          ],
        },
      },
      'Strategic Thinking': {
        'Vision': {
          commitment: 'I will connect every major team initiative to our 6-month direction in the kickoff.',
          guidedAnswers: { behaviorCommitment: 'Context before content, every time.' },
          items: [
            { text: 'Open each sprint planning with a 2-minute "why this matters" framing', checked: false },
            { text: 'Post the team\'s top 3 priorities visibly in our shared workspace', checked: false },
            { text: 'Ask "How does this connect to where we\'re headed?" in 1:1s monthly', checked: false },
          ],
        },
      },
    },
  };

  localStorage.setItem('actionPlansByCampaign', JSON.stringify({
    [STAGING_BUNDLE_ID]: {
      [STAGING_EMAIL]: {
        ...actionPlansForUser,
      },
    },
    [STAGING_SELF_ID]: { [STAGING_EMAIL]: actionPlansForUser },
    [STAGING_TEAM_ID]: { [STAGING_EMAIL]: actionPlansForUser },
    123: { [STAGING_EMAIL]: actionPlansForUser },
  }));

  localStorage.setItem('__cairn_seeded__', 'true');
  localStorage.setItem('__cairn_seed_version__', STAGING_SEED_VERSION);
}

export function clearStagingData() {
  SEED_KEYS.forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('journeyCeremonySeen');
}

export function autoSeedIfNeeded() {
  if (
    !localStorage.getItem('__cairn_seeded__')
    || localStorage.getItem('__cairn_seed_version__') !== STAGING_SEED_VERSION
  ) {
    // Drop sticky chapter-popup flags whenever seed refreshes so transitions
    // are visible again after deploy / reset.
    localStorage.removeItem('journeyCeremonySeen');
    seedStagingData();
  }
}
