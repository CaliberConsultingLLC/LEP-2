/**
 * Staging seed — populates localStorage with realistic fixture data so every
 * page in the Cairn (staging) theme has what it needs to render without
 * requiring real Firebase auth or a completed user flow.
 *
 * Only imported / executed when useCairnTheme === true.
 */

export const STAGING_USER_ID   = 'staging-test-uid-001';
export const STAGING_EMAIL     = 'alex@staging.test';
export const STAGING_SELF_ID   = 'staging-self-001';
export const STAGING_TEAM_ID   = 'staging-team-001';
export const STAGING_BUNDLE_ID = 'staging-bundle-001';

// Keys written by the seed so clearStagingData() can remove them precisely.
const SEED_KEYS = [
  'userInfo',
  'latestFormData',
  'intakeDraft',
  'intakeStatus',
  'aiSummary',
  'focusAreas',
  'selectedTraits',
  'currentCampaign',
  'campaignRecords',
  `campaign_${STAGING_SELF_ID}`,
  `campaign_${STAGING_TEAM_ID}`,
  `selfCampaignCompleted_${STAGING_SELF_ID}`,
  'selfCampaignCompleted',
  'teamCampaignCompleted',
  'actionPlansByCampaign',
  '__cairn_seeded__',
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
    resourcePick: 'innovation',
    projectApproach: 'collaborative',
    energyDrains: ['micromanagement', 'unclear goals', 'conflict avoidance'],
    crisisResponse: ['delegate', 'communicate'],
    pushbackFeeling: ['frustrated', 'curious'],
    roleModelTrait: 'communication',
    roleModelTraitElaboration: 'They always made complex things feel simple and never talked down to the team.',
    warningLabel: 'May over-communicate under pressure and lose decisiveness',
    leaderFuel: ['meaningful impact', 'team growth'],
    decisionPace: 'deliberate',
    teamPerception: 'collaborative',
    responsibilities: 'Product roadmap, cross-functional alignment, and team development',
    visibilityComfort: 'moderate',
    societalResponses: [7, 6, 8, 5, 7, 9, 6, 8, 7, 6],
    selectedAgent: 'balancedMentor',
  };
  localStorage.setItem('latestFormData', JSON.stringify(formData));

  localStorage.setItem('intakeDraft', JSON.stringify({
    formData,
    societalResponses: formData.societalResponses,
    currentStep: 4,
    reflectionNumber: 3,
    reflectionText: '',
    societalQuestionIndex: 9,
  }));

  localStorage.setItem('intakeStatus', JSON.stringify({
    started: true,
    complete: true,
    totalSteps: 4,
    updatedAt: now,
  }));

  localStorage.setItem('aiSummary', [
    'Alex Rivera leads with a collaborative instinct and a strong drive for meaningful impact. As a Director with 5–10 years of experience in the Technology sector, Alex navigates a mid-sized team of 10–25 people through a landscape defined by rapid change and cross-functional complexity. The profile that emerges is one of a leader who values clarity and alignment above all — someone who believes that when people understand the "why," execution takes care of itself.',

    'Behaviorally, Alex draws energy from team growth and purpose-driven outcomes, and tends to process pushback as a signal worth investigating rather than a threat to deflect. Under pressure, the natural pull is toward over-communication — a pattern that can dilute urgency or slow momentum when speed matters more than consensus. The instinct to collaborate is a genuine strength, but it occasionally competes with the need to make decisive calls in ambiguous situations.',

    'The leadership reflection points to three areas with the highest leverage for growth: communication clarity, follow-through on timelines, and the ability to paint a credible long-term picture for the team. These are not weaknesses so much as underdeveloped edges — places where Alex\'s impact is already significant but could be sharpened to match the scale of the role.',

    'The campaign ahead is designed around these three focus areas. The goal is not transformation but calibration — helping Alex close the gap between intent and impact in the moments that matter most. The team will be asked to reflect on what they experience, not what they expect. That feedback, held alongside Alex\'s own self-assessment, will form the foundation for a growth plan built on evidence rather than assumption.',
  ].join('\n\n'));

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
    selfCompleted: false,
    createdAt: now,
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
    surveyClosed: false,
    createdAt: now,
  };
  localStorage.setItem(`campaign_${STAGING_TEAM_ID}`, JSON.stringify(teamCampaign));

  localStorage.setItem('actionPlansByCampaign', JSON.stringify({
    [STAGING_BUNDLE_ID]: {
      [STAGING_EMAIL]: {
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
      },
    },
  }));

  localStorage.setItem('__cairn_seeded__', 'true');
}

export function clearStagingData() {
  SEED_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function autoSeedIfNeeded() {
  if (!localStorage.getItem('__cairn_seeded__')) {
    seedStagingData();
  }
}
