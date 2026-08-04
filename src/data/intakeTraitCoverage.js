/**
 * Intake → trait coverage map (versioned).
 * Encodes which intake signals evidence which subtraits, and which subtraits
 * are scored vs libraryOnly vs levelDependent for middle-manager intake.
 *
 * Confidence goals mirror the Trait Audit spreadsheet (intake evidence only).
 */

export const COVERAGE_VERSION = '2026-07-intake-v1';

export const CONFIDENCE_GOALS = {
  communication: 65,
  decisionMaking: 65,
  strategicThinking: 45,
  execution: 65,
  teamDevelopment: 60,
  emotionalIntelligence: 65,
  accountability: 60,
  changeAdaptability: 60,
  collaboration: 45,
  culture: 60,
};

/** Subtrait scoring roles for middle-manager intake. */
export const SUBTRAIT_ROLES = {
  // Communication
  clarity: 'scored',
  brevity: 'scored',
  influence: 'scored',
  listening: 'scored',
  empathy: 'scored',
  audienceAdaptability: 'libraryOnly',
  executivePresence: 'scored',
  // Decision-Making
  qualityAndPace: 'scored',
  underUncertainty: 'scored',
  stakeholderConsideration: 'scored',
  learningFromOutcomes: 'scored',
  // Strategic Thinking
  vision: 'scored',
  systemsThinking: 'scored',
  futureOrientation: 'levelDependent',
  patternRecognition: 'scored',
  longTermPlanning: 'levelDependent',
  competitiveIntelligence: 'levelDependent',
  resourceAllocation: 'scored',
  // Execution
  projectManagement: 'scored',
  prioritization: 'scored',
  deadlineManagement: 'scored',
  qualityStandards: 'scored',
  followThrough: 'scored',
  processImprovement: 'scored',
  resultsOrientation: 'scored',
  // Team Development
  talentIdentification: 'scored',
  coaching: 'scored',
  mentoring: 'levelDependent',
  delegation: 'scored',
  feedback: 'scored',
  careerDevelopment: 'scored',
  performanceManagement: 'scored',
  teamBuilding: 'scored',
  // Emotional Intelligence
  selfAwareness: 'scored',
  selfRegulation: 'scored',
  // empathy already listed under communication; EI empathy shares name — use core+id in consumers
  socialAwareness: 'scored',
  relationshipManagement: 'scored',
  stressManagement: 'scored',
  // Accountability
  personalAccountability: 'scored',
  holdingOthersAccountable: 'scored',
  transparency: 'scored',
  integrity: 'scored',
  ownership: 'scored',
  reliability: 'scored',
  // Change
  adaptability: 'scored',
  changeLeadership: 'scored',
  resilience: 'scored',
  innovation: 'scored',
  learningAgility: 'scored',
  comfortWithAmbiguity: 'scored',
  // Collaboration
  partnershipBuilding: 'levelDependent',
  stakeholderManagement: 'scored',
  conflictResolution: 'scored',
  crossFunctionalCollaboration: 'scored',
  negotiation: 'levelDependent',
  // Culture
  cultureShaping: 'scored',
  normSetting: 'scored',
  psychologicalSafety: 'scored',
  inclusion: 'scored',
  valuesAlignment: 'scored',
  employeeExperience: 'scored',
  organizationalLearning: 'scored',
};

/**
 * Primary/secondary subtrait weights for behavior questions.
 * Weights are relative signal strength for fallback scoring and AI guidance.
 */
export const BEHAVIOR_SIGNAL_MAP = {
  resourcePick: {
    Time: [{ coreId: 'execution', subId: 'prioritization', weight: 1 }],
    Budget: [{ coreId: 'strategicThinking', subId: 'resourceAllocation', weight: 1 }],
    Expectations: [{ coreId: 'accountability', subId: 'holdingOthersAccountable', weight: 1 }],
    Scope: [{ coreId: 'execution', subId: 'prioritization', weight: 1 }],
  },
  projectApproach: {
    'Create a detailed plan to guide the team.': [
      { coreId: 'execution', subId: 'projectManagement', weight: 1.2 },
    ],
    'Dive into the most challenging aspect to lead by example.': [
      { coreId: 'execution', subId: 'resultsOrientation', weight: 1 },
    ],
    'Gather the team for a collaborative brainstorming session.': [
      { coreId: 'collaboration', subId: 'conflictResolution', weight: 0.6 },
      { coreId: 'teamDevelopment', subId: 'teamBuilding', weight: 0.8 },
    ],
    'Focus on identifying and mitigating the biggest risks.': [
      { coreId: 'decisionMaking', subId: 'underUncertainty', weight: 1 },
    ],
    'Distribute ownership with clear check-ins and criteria.': [
      { coreId: 'execution', subId: 'followThrough', weight: 1.4 },
      { coreId: 'teamDevelopment', subId: 'delegation', weight: 1.2 },
    ],
    'Ask clarifying questions before diving in.': [
      { coreId: 'communication', subId: 'clarity', weight: 1 },
    ],
  },
  energyDrains: {
    'Repeating myself to ensure understanding': [
      { coreId: 'communication', subId: 'clarity', weight: 1 },
      { coreId: 'communication', subId: 'brevity', weight: 0.8 },
    ],
    'Following up when someone misses a commitment': [
      { coreId: 'accountability', subId: 'holdingOthersAccountable', weight: 1.5 },
    ],
    'Decoding unspoken concerns from the team': [
      { coreId: 'emotionalIntelligence', subId: 'socialAwareness', weight: 1 },
    ],
    'Navigating frequent changes in priorities': [
      { coreId: 'changeAdaptability', subId: 'adaptability', weight: 1 },
    ],
    'Meetings with limited or no outcomes': [
      { coreId: 'execution', subId: 'resultsOrientation', weight: 0.8 },
    ],
    'Mediating conflicts within the team': [
      { coreId: 'collaboration', subId: 'conflictResolution', weight: 1.2 },
    ],
    'Pursuing goals that lack clear direction': [
      { coreId: 'strategicThinking', subId: 'vision', weight: 1 },
    ],
    'Balancing differing expectations from stakeholders': [
      { coreId: 'collaboration', subId: 'stakeholderManagement', weight: 1.2 },
    ],
  },
  crisisResponse: {
    'Maintain composure and provide clear, decisive direction to the team.': [
      { coreId: 'emotionalIntelligence', subId: 'selfRegulation', weight: 1.2 },
      { coreId: 'communication', subId: 'executivePresence', weight: 1 },
    ],
    'Immediately gather the team to collaborate on potential solutions.': [
      { coreId: 'teamDevelopment', subId: 'teamBuilding', weight: 1 },
    ],
    "Clarify what is known, what's open, and what's next.": [
      { coreId: 'changeAdaptability', subId: 'comfortWithAmbiguity', weight: 1.5 },
      { coreId: 'communication', subId: 'clarity', weight: 0.8 },
    ],
    'Delegate ownership to team members while providing support from the sidelines.': [
      { coreId: 'teamDevelopment', subId: 'delegation', weight: 1.2 },
    ],
    'Jump in directly to handle the most critical aspects myself.': [
      { coreId: 'accountability', subId: 'ownership', weight: 1 },
    ],
  },
  roleModelTrait: {
    communicated: [{ coreId: 'communication', subId: 'clarity', weight: 1.5 }],
    'made decisions': [{ coreId: 'decisionMaking', subId: 'qualityAndPace', weight: 1.5 }],
    'thought strategically': [{ coreId: 'strategicThinking', subId: 'vision', weight: 1.5 }],
    'executed & followed through': [{ coreId: 'execution', subId: 'followThrough', weight: 1.5 }],
    'developed their team': [{ coreId: 'teamDevelopment', subId: 'coaching', weight: 1.5 }],
    'shaped culture': [{ coreId: 'culture', subId: 'cultureShaping', weight: 1.5 }],
    'built relationships': [{ coreId: 'emotionalIntelligence', subId: 'relationshipManagement', weight: 1.5 }],
    'handled challenges': [{ coreId: 'changeAdaptability', subId: 'resilience', weight: 1.5 }],
    'inspired others': [{ coreId: 'communication', subId: 'executivePresence', weight: 1.2 }],
    'balanced priorities': [{ coreId: 'execution', subId: 'prioritization', weight: 1.5 }],
  },
  warningLabel: {
    'Caution: May keep polishing past the finish line': [
      { coreId: 'execution', subId: 'qualityStandards', weight: 1.4 },
    ],
    'Warning: Moves fast—keep up!': [
      { coreId: 'decisionMaking', subId: 'qualityAndPace', weight: 1 },
    ],
    'Winding Road: Comfortable moving before the path is clear': [
      { coreId: 'changeAdaptability', subId: 'comfortWithAmbiguity', weight: 1.5 },
    ],
    'Flammable: Sparks fly under pressure': [
      { coreId: 'emotionalIntelligence', subId: 'stressManagement', weight: 1.2 },
    ],
    'Fragile: Avoid too much pushback': [
      { coreId: 'emotionalIntelligence', subId: 'selfRegulation', weight: 1 },
    ],
    'Falling Rocks: Tendency to over-delegate': [
      { coreId: 'teamDevelopment', subId: 'delegation', weight: 1.2 },
    ],
    'Deer Crossing: May jump into your lane': [
      { coreId: 'accountability', subId: 'ownership', weight: 1 },
    ],
    'Wrong Way: My way or the highway': [
      { coreId: 'communication', subId: 'listening', weight: 1 },
    ],
  },
  leaderFuel: {
    'Seeing the team gel and succeed together': [
      { coreId: 'teamDevelopment', subId: 'teamBuilding', weight: 1.2 },
    ],
    'Closing out a tough project completely': [
      { coreId: 'execution', subId: 'followThrough', weight: 1.5 },
    ],
    'Solving a problem no one else could': [
      { coreId: 'decisionMaking', subId: 'qualityAndPace', weight: 1.2 },
    ],
    'Hearing the team say they learned something': [
      { coreId: 'teamDevelopment', subId: 'coaching', weight: 1.2 },
    ],
    'My team getting the recognition it deserves': [
      { coreId: 'teamDevelopment', subId: 'talentIdentification', weight: 1 },
    ],
    'Turning chaos into quality': [
      { coreId: 'execution', subId: 'qualityStandards', weight: 1.5 },
    ],
  },
  decisionPace: {
    'The Fix': [{ coreId: 'execution', subId: 'followThrough', weight: 1.2 }],
    'The Feedback': [{ coreId: 'decisionMaking', subId: 'learningFromOutcomes', weight: 1.2 }],
    'The Standard': [{ coreId: 'execution', subId: 'qualityStandards', weight: 1.5 }],
  },
  visibilityComfort: {
    'I thrive in the spotlight.': [
      { coreId: 'communication', subId: 'executivePresence', weight: 1.2 },
    ],
    'I can handle it but prefer smaller settings.': [
      { coreId: 'communication', subId: 'executivePresence', weight: 0.6 },
    ],
    "I don't think much about it either way.": [],
    'I prefer to lead behind the scenes.': [
      { coreId: 'execution', subId: 'followThrough', weight: 0.8 },
    ],
  },
  teamPerception: {
    'Name the gap in a private conversation and reset the expectation.': [
      { coreId: 'accountability', subId: 'holdingOthersAccountable', weight: 1.6 },
    ],
    'Observe for patterns and gather context before taking action.': [
      { coreId: 'decisionMaking', subId: 'qualityAndPace', weight: 0.8 },
    ],
    'Provide support and resources, then confirm the new bar together.': [
      { coreId: 'accountability', subId: 'holdingOthersAccountable', weight: 1.2 },
      { coreId: 'teamDevelopment', subId: 'coaching', weight: 0.8 },
    ],
    'Reassign tasks or adjust their responsibilities to better fit their strengths.': [
      { coreId: 'teamDevelopment', subId: 'talentIdentification', weight: 1 },
    ],
    'Set clear expectations, an owner, and a check-in date to close the gap.': [
      { coreId: 'accountability', subId: 'holdingOthersAccountable', weight: 1.6 },
      { coreId: 'execution', subId: 'followThrough', weight: 0.8 },
    ],
    'Involve HR or escalate to higher management for guidance.': [
      { coreId: 'teamDevelopment', subId: 'performanceManagement', weight: 1 },
    ],
  },
};

/** Balance Line slider index → subtrait (0-based). */
export const BALANCE_LINE_SIGNALS = [
  { left: 'listening', right: 'executivePresence', coreId: 'communication' },
  { left: null, right: 'empathy', coreId: 'emotionalIntelligence', note: 'Critical↔Encouraging' },
  { left: 'clarity', right: 'vision', coreIds: ['communication', 'strategicThinking'] },
  { left: null, right: 'delegation', coreId: 'teamDevelopment', note: 'Directive↔Empowering' },
  {
    leftSub: { coreId: 'changeAdaptability', subId: 'comfortWithAmbiguity', pole: 'left' },
    rightSub: { coreId: 'changeAdaptability', subId: 'comfortWithAmbiguity', pole: 'right' },
    note: 'Prefer clarity before moving ↔ Move forward while clarity forms',
  },
  {
    leftSub: { coreId: 'communication', subId: 'brevity', pole: 'left', invert: true },
    rightSub: { coreId: 'communication', subId: 'brevity', pole: 'right' },
    note: 'Thorough ↔ Concise communicator',
  },
];

export function getSubTraitRole(subId, scoringRoleFromTrait) {
  if (scoringRoleFromTrait) return scoringRoleFromTrait;
  return SUBTRAIT_ROLES[subId] || 'scored';
}

export function isEligibleForFocusRecommendation(subTrait) {
  const role = getSubTraitRole(subTrait?.id, subTrait?.scoringRole);
  return role === 'scored';
}

/**
 * Score core traits from intake answers using the coverage map.
 * Returns { scores: { coreId: number }, subScores: { 'coreId:subId': number } }
 */
export function scoreIntakeAgainstCoverage(data = {}) {
  const scores = {};
  const subScores = {};
  const add = (coreId, subId, weight = 1) => {
    if (!coreId) return;
    scores[coreId] = (scores[coreId] || 0) + weight;
    if (subId) {
      const key = `${coreId}:${subId}`;
      subScores[key] = (subScores[key] || 0) + weight;
    }
  };

  const applyOptionMap = (fieldId, value) => {
    const map = BEHAVIOR_SIGNAL_MAP[fieldId];
    if (!map || value == null) return;
    const values = Array.isArray(value) ? value : [value];
    values.forEach((v) => {
      const key = String(v || '').trim();
      // decisionPace may be stored as primary only
      const signals = map[key] || map[Object.keys(map).find((k) => key.includes(k)) || ''];
      (signals || []).forEach((s) => add(s.coreId, s.subId, s.weight));
    });
  };

  applyOptionMap('resourcePick', data.resourcePick);
  applyOptionMap('projectApproach', data.projectApproach);
  applyOptionMap('energyDrains', data.energyDrains);
  applyOptionMap('crisisResponse', Array.isArray(data.crisisResponse) ? data.crisisResponse.slice(0, 2) : data.crisisResponse);
  applyOptionMap('roleModelTrait', data.roleModelTrait);
  applyOptionMap('warningLabel', data.warningLabel);
  applyOptionMap('leaderFuel', Array.isArray(data.leaderFuel) ? data.leaderFuel.slice(0, 1) : data.leaderFuel);
  applyOptionMap('decisionPace', data.decisionPace);
  applyOptionMap('visibilityComfort', data.visibilityComfort);
  applyOptionMap('teamPerception', data.teamPerception);

  // Balance Line: index 4 = ambiguity, index 5 = brevity
  const dichotomies = data.behaviorDichotomies;
  if (Array.isArray(dichotomies)) {
    const ambiguity = Number(dichotomies[4]);
    if (Number.isFinite(ambiguity)) {
      // Higher = more comfort moving while clarity forms
      const weight = Math.abs(ambiguity - 5.5) / 4.5;
      add('changeAdaptability', 'comfortWithAmbiguity', 0.8 + weight);
    }
    const brevity = Number(dichotomies[5]);
    if (Number.isFinite(brevity)) {
      const weight = Math.abs(brevity - 5.5) / 4.5;
      add('communication', 'brevity', 1.0 + weight);
    }
  }

  return { scores, subScores };
}

export default {
  COVERAGE_VERSION,
  CONFIDENCE_GOALS,
  SUBTRAIT_ROLES,
  BEHAVIOR_SIGNAL_MAP,
  BALANCE_LINE_SIGNALS,
  getSubTraitRole,
  isEligibleForFocusRecommendation,
  scoreIntakeAgainstCoverage,
};
