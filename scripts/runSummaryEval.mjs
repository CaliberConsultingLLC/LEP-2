import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://staging.northstarpartners.org';
const ENDPOINT = `${BASE_URL}/api/get-ai-summary`;

const DIRECTIVE_RE = /\b(you should|should|must|need to|have to|try to|focus on|start with|begin by|by\s+[a-z]+ing)\b/i;
const BANNED_PHRASES = [
  /unlock potential/i,
  /effective leader/i,
  /growth mindset/i,
  /improve communication/i,
  /high-performing team/i,
  /be more strategic/i,
];

const AGENTS = [
  'bluntPracticalFriend',
  'formalEmpatheticCoach',
  'balancedMentor',
  'comedyRoaster',
  'pragmaticProblemSolver',
  'highSchoolCoach',
];

const CASES = [
  {
    caseId: 'C01_fast_operator',
    payload: {
      sessionId: 'eval-c01',
      industry: 'Technology',
      department: 'Operations',
      role: 'Operations Manager',
      responsibilities: 'Ensure on-time, high-quality delivery.',
      birthYear: '1986',
      teamSize: 8,
      leadershipExperience: 6,
      careerExperience: 10,
      resourcePick: 'Time',
      projectApproach: 'Jump in directly to handle the most critical aspects myself.',
      energyDrains: ['Meetings with limited or no outcomes', 'Navigating frequent changes in priorities', 'Balancing differing expectations from stakeholders'],
      crisisResponse: [
        'Jump in directly to handle the most critical aspects myself.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'First verify all facts and details before taking any action.',
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
      ],
      pushbackFeeling: ['Defensive', 'Irritated', 'Motivated'],
      roleModelTrait: 'executed & followed through',
      warningLabel: 'Warning: Moves fast—keep up!',
      leaderFuel: ['Nailing a tough project on time', 'Turning chaos into order', 'Solving a problem no one else could'],
      proudMoment: 'Delivered a critical launch by clearing blockers and driving daily execution.',
      behaviorDichotomies: [4, 3, 5, 4, 7],
      visibilityComfort: 'I thrive in the spotlight.',
      decisionPace: 'The Fix — Get things back on track',
      teamPerception: 'Address it directly and immediately in a private conversation.',
      selectedAgent: AGENTS[0],
      societalResponses: [2, 3, 3, 6, 4, 3, 2, 6, 7, 3],
    },
  },
  {
    caseId: 'C02_steady_builder',
    payload: {
      sessionId: 'eval-c02',
      industry: 'Education',
      department: 'Programs',
      role: 'Program Manager',
      responsibilities: 'Improve processes and team health.',
      birthYear: '1984',
      teamSize: 4,
      leadershipExperience: 4,
      careerExperience: 7,
      resourcePick: 'Scope',
      projectApproach: 'Create a detailed plan to guide the team.',
      energyDrains: ['Meetings with limited or no outcomes', 'Pursuing goals that lack clear direction', 'Balancing differing expectations from stakeholders'],
      crisisResponse: [
        'First verify all facts and details before taking any action.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Calm', 'Curious', 'Open'],
      roleModelTrait: 'thought strategically',
      warningLabel: 'Caution: May overthink the details',
      leaderFuel: ['Seeing the team gel and succeed together', 'Nailing a tough project on time', 'Turning chaos into order'],
      proudMoment: 'Delivered a predictable cadence that raised team confidence and morale.',
      behaviorDichotomies: [6, 6, 4, 5, 3],
      visibilityComfort: "I don't think much about it either way.",
      decisionPace: 'The Feedback — Learn where things went wrong',
      teamPerception: 'Observe for patterns and gather context before taking action.',
      selectedAgent: AGENTS[1],
      societalResponses: [6, 6, 5, 6, 5, 5, 6, 5, 6, 5],
    },
  },
  {
    caseId: 'C03_bold_visionary',
    payload: {
      sessionId: 'eval-c03',
      industry: 'Media',
      department: 'Product',
      role: 'Innovation Lead',
      responsibilities: 'Champion experimentation and learning loops.',
      birthYear: '1990',
      teamSize: 9,
      leadershipExperience: 5,
      careerExperience: 8,
      resourcePick: 'Expectations',
      projectApproach: 'Gather the team for a collaborative brainstorming session.',
      energyDrains: ['Pursuing goals that lack clear direction', 'Meetings with limited or no outcomes', 'Decoding unspoken concerns from the team'],
      crisisResponse: [
        'Immediately gather the team to collaborate on potential solutions.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'First verify all facts and details before taking any action.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Motivated', 'Competitive', 'Curious'],
      roleModelTrait: 'inspired others',
      warningLabel: 'Flammable: Sparks fly under pressure',
      leaderFuel: ['Solving a problem no one else could', 'Turning chaos into order', 'Seeing the team gel and succeed together'],
      proudMoment: 'Took a risky idea and rallied stakeholders into a successful pilot.',
      behaviorDichotomies: [7, 5, 8, 6, 8],
      visibilityComfort: 'I thrive in the spotlight.',
      decisionPace: 'The Fix — Get things back on track',
      teamPerception: 'Set clear expectations and create a performance improvement plan.',
      selectedAgent: AGENTS[2],
      societalResponses: [8, 7, 8, 6, 7, 6, 8, 7, 8, 6],
    },
  },
  {
    caseId: 'C04_quiet_strategist',
    payload: {
      sessionId: 'eval-c04',
      industry: 'Finance',
      department: 'Strategy',
      role: 'Strategy Lead',
      responsibilities: 'Balance short-term wins with long-term bets.',
      birthYear: '1976',
      teamSize: 3,
      leadershipExperience: 7,
      careerExperience: 13,
      resourcePick: 'Scope',
      projectApproach: 'Focus on identifying and mitigating the biggest risks.',
      energyDrains: ['Navigating frequent changes in priorities', 'Pursuing goals that lack clear direction', 'Repeating myself to ensure understanding'],
      crisisResponse: [
        'First verify all facts and details before taking any action.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Doubtful', 'Curious', 'Calm'],
      roleModelTrait: 'thought strategically',
      warningLabel: 'Winding Road: we change directions quickly',
      leaderFuel: ['Turning chaos into order', 'Nailing a tough project on time', 'My team getting the recognition it deserves'],
      proudMoment: 'Clarified a long-term bet and earned alignment across departments.',
      behaviorDichotomies: [3, 6, 8, 5, 4],
      visibilityComfort: 'I prefer to lead behind the scenes.',
      decisionPace: 'The Feedback — Learn where things went wrong',
      teamPerception: 'Observe for patterns and gather context before taking action.',
      selectedAgent: AGENTS[3],
      societalResponses: [4, 5, 6, 4, 6, 5, 4, 5, 6, 4],
    },
  },
  {
    caseId: 'C05_relationship_anchor',
    payload: {
      sessionId: 'eval-c05',
      industry: 'Nonprofit',
      department: 'Customer Success',
      role: 'Customer Success Lead',
      responsibilities: 'Communicate progress and risks.',
      birthYear: '1988',
      teamSize: 6,
      leadershipExperience: 6,
      careerExperience: 9,
      resourcePick: 'Expectations',
      projectApproach: 'Ask clarifying questions before diving in.',
      energyDrains: ['Decoding unspoken concerns from the team', "Addressing a team member's inconsistent contributions", 'Mediating conflicts within the team'],
      crisisResponse: [
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'First verify all facts and details before taking any action.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Open', 'Humbled', 'Curious'],
      roleModelTrait: 'built relationships',
      warningLabel: 'Fragile: Avoid too much pushback',
      leaderFuel: ['Seeing the team gel and succeed together', 'Hearing the team say they learned something', 'My team getting the recognition it deserves'],
      proudMoment: 'Helped a struggling teammate regain confidence and momentum.',
      behaviorDichotomies: [4, 8, 6, 7, 3],
      visibilityComfort: 'I can handle it but prefer smaller settings.',
      decisionPace: 'The Feedback — Learn where things went wrong',
      teamPerception: 'Provide additional support and resources to help them improve.',
      selectedAgent: AGENTS[4],
      societalResponses: [7, 8, 6, 7, 8, 7, 6, 7, 8, 7],
    },
  },
  {
    caseId: 'C06_data_driver',
    payload: {
      sessionId: 'eval-c06',
      industry: 'Technology',
      department: 'Engineering',
      role: 'Data Team Lead',
      responsibilities: 'Represent the team’s work to executives.',
      birthYear: '1981',
      teamSize: 7,
      leadershipExperience: 5,
      careerExperience: 9,
      resourcePick: 'Time',
      projectApproach: 'First verify all facts and details before taking any action.',
      energyDrains: ['Navigating frequent changes in priorities', 'Meetings with limited or no outcomes', 'Decoding unspoken concerns from the team'],
      crisisResponse: [
        'First verify all facts and details before taking any action.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Doubtful', 'Calm', 'Curious'],
      roleModelTrait: 'made decisions',
      warningLabel: 'Caution: May overthink the details',
      leaderFuel: ['Nailing a tough project on time', 'Turning chaos into order', 'Solving a problem no one else could'],
      proudMoment: 'Created a data narrative that unlocked funding for the roadmap.',
      behaviorDichotomies: [5, 4, 7, 4, 5],
      visibilityComfort: "I don't think much about it either way.",
      decisionPace: 'The Feedback — Learn where things went wrong',
      teamPerception: 'Observe for patterns and gather context before taking action.',
      selectedAgent: AGENTS[5],
      societalResponses: [5, 6, 5, 6, 5, 6, 5, 6, 5, 6],
    },
  },
  {
    caseId: 'C07_adaptive_firefighter',
    payload: {
      sessionId: 'eval-c07',
      industry: 'Logistics',
      department: 'Operations',
      role: 'Operations Manager',
      responsibilities: 'Ensure on-time, high-quality delivery.',
      birthYear: '1987',
      teamSize: 9,
      leadershipExperience: 7,
      careerExperience: 11,
      resourcePick: 'Time',
      projectApproach: 'Dive into the most challenging aspect to lead by example.',
      energyDrains: ['Navigating frequent changes in priorities', 'Meetings with limited or no outcomes', 'Balancing differing expectations from stakeholders'],
      crisisResponse: [
        'Jump in directly to handle the most critical aspects myself.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'First verify all facts and details before taking any action.',
        'Delegate ownership to team members while providing support from the sidelines.',
      ],
      pushbackFeeling: ['Irritated', 'Motivated', 'Defensive'],
      roleModelTrait: 'handled challenges',
      warningLabel: 'Warning: Moves fast—keep up!',
      leaderFuel: ['Turning chaos into order', 'Nailing a tough project on time', 'Solving a problem no one else could'],
      proudMoment: 'Stabilized a major disruption by coordinating rapid decisions.',
      behaviorDichotomies: [4, 3, 5, 4, 7],
      visibilityComfort: 'I thrive in the spotlight.',
      decisionPace: 'The Fix — Get things back on track',
      teamPerception: 'Address it directly and immediately in a private conversation.',
      selectedAgent: AGENTS[1],
      societalResponses: [3, 4, 4, 5, 4, 3, 4, 5, 4, 3],
    },
  },
  {
    caseId: 'C08_people_first',
    payload: {
      sessionId: 'eval-c08',
      industry: 'Healthcare',
      department: 'HR',
      role: 'People Manager',
      responsibilities: 'Coach and develop team members.',
      birthYear: '1982',
      teamSize: 5,
      leadershipExperience: 8,
      careerExperience: 12,
      resourcePick: 'Expectations',
      projectApproach: 'Gather the team for a collaborative brainstorming session.',
      energyDrains: ['Decoding unspoken concerns from the team', "Addressing a team member's inconsistent contributions", 'Mediating conflicts within the team'],
      crisisResponse: [
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'First verify all facts and details before taking any action.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Curious', 'Open', 'Humbled'],
      roleModelTrait: 'developed their team',
      warningLabel: 'Fragile: Avoid too much pushback',
      leaderFuel: ['Seeing the team gel and succeed together', 'Hearing the team say they learned something', 'My team getting the recognition it deserves'],
      proudMoment: 'Helped a teammate step into a larger role through steady coaching and support.',
      behaviorDichotomies: [3, 7, 6, 8, 4],
      visibilityComfort: 'I can handle it but prefer smaller settings.',
      decisionPace: 'The Feedback — Learn where things went wrong',
      teamPerception: 'Provide additional support and resources to help them improve.',
      selectedAgent: AGENTS[2],
      societalResponses: [4, 6, 5, 8, 7, 8, 5, 6, 7, 8],
    },
  },
  {
    caseId: 'C09_strategic_navigator',
    payload: {
      sessionId: 'eval-c09',
      industry: 'Professional Services',
      department: 'Strategy',
      role: 'Strategy Lead',
      responsibilities: 'Align cross-functional teams and clear roadblocks.',
      birthYear: '1989',
      teamSize: 6,
      leadershipExperience: 5,
      careerExperience: 9,
      resourcePick: 'Scope',
      projectApproach: 'Focus on identifying and mitigating the biggest risks.',
      energyDrains: ['Navigating frequent changes in priorities', 'Pursuing goals that lack clear direction', 'Balancing differing expectations from stakeholders'],
      crisisResponse: [
        'First verify all facts and details before taking any action.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      pushbackFeeling: ['Curious', 'Doubtful', 'Open'],
      roleModelTrait: 'thought strategically',
      warningLabel: 'Winding Road: we change directions quickly',
      leaderFuel: ['Turning chaos into order', 'Solving a problem no one else could', 'Nailing a tough project on time'],
      proudMoment: 'Aligned stakeholders around a new direction and simplified the plan.',
      behaviorDichotomies: [6, 4, 7, 6, 5],
      visibilityComfort: 'I prefer to lead behind the scenes.',
      decisionPace: 'The Feedback — Learn where things went wrong',
      teamPerception: 'Observe for patterns and gather context before taking action.',
      selectedAgent: AGENTS[3],
      societalResponses: [5, 4, 6, 5, 6, 4, 5, 4, 6, 5],
    },
  },
  {
    caseId: 'C10_hands_on_fixer',
    payload: {
      sessionId: 'eval-c10',
      industry: 'Manufacturing',
      department: 'Engineering',
      role: 'Technical Lead',
      responsibilities: 'Improve processes and team health.',
      birthYear: '1979',
      teamSize: 10,
      leadershipExperience: 9,
      careerExperience: 15,
      resourcePick: 'Budget',
      projectApproach: 'Dive into the most challenging aspect to lead by example.',
      energyDrains: ['Repeating myself to ensure understanding', 'Meetings with limited or no outcomes', 'Balancing differing expectations from stakeholders'],
      crisisResponse: [
        'Jump in directly to handle the most critical aspects myself.',
        'First verify all facts and details before taking any action.',
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'Delegate ownership to team members while providing support from the sidelines.',
      ],
      pushbackFeeling: ['Competitive', 'Defensive', 'Motivated'],
      roleModelTrait: 'made decisions',
      warningLabel: 'Falling Rocks: Tendency to over-delegate',
      leaderFuel: ['Turning chaos into order', 'Nailing a tough project on time', 'Solving a problem no one else could'],
      proudMoment: 'Rebuilt a broken process and stabilized delivery within two weeks.',
      behaviorDichotomies: [4, 3, 6, 4, 6],
      visibilityComfort: 'I thrive in the spotlight.',
      decisionPace: 'The Fix — Get things back on track',
      teamPerception: 'Set clear expectations and create a performance improvement plan.',
      selectedAgent: AGENTS[4],
      societalResponses: [3, 3, 4, 4, 3, 4, 3, 5, 6, 4],
    },
  },
];

function splitSections(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sentenceCount(text) {
  const matches = String(text || '').match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  return (matches || []).map((s) => s.trim()).filter(Boolean).length;
}

function startsWithExactMarkerLead(section) {
  return String(section || '').startsWith('A few scenarios you may find yourself in at times:');
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function distanceFromRange(value, min, max) {
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}

function intervalScore({ value, min, max, maxScore, minScore = 1, stepPenalty = 2, hasOutput = true }) {
  if (!hasOutput) return 0;
  const d = distanceFromRange(value, min, max);
  return clamp(minScore, maxScore, maxScore - (d * stepPenalty));
}

function countDirectiveHits(text) {
  const patterns = [
    /\byou should\b/gi,
    /\bneed to\b/gi,
    /\bhave to\b/gi,
    /\bfocus on\b/gi,
    /\bstart with\b/gi,
    /\bbegin by\b/gi,
    /\bby\s+[a-z]+ing\b/gi,
    /\bmust\b/gi,
  ];
  return patterns.reduce((acc, re) => acc + (String(text || '').match(re) || []).length, 0);
}

function splitSummaryForCsv(summaryText) {
  const sections = splitSections(summaryText);
  while (sections.length < 4) sections.push('');
  return {
    summary_trailhead: sections[0] || '',
    summary_trail_markers: sections[1] || '',
    summary_trajectory: sections[2] || '',
    summary_new_trail: sections[3] || '',
  };
}

function computeReliabilityScore({ status, attemptCount, latencyMs }) {
  if (status === 'request_error') return 0;
  const retries = Math.max(0, Number(attemptCount || 1) - 1);
  const retryPenalty = retries * 12;
  const latencyPenalty = latencyMs <= 25000
    ? 0
    : Math.min(30, Math.round((latencyMs - 25000) / 4000) * 3);
  return clamp(40, 100, 100 - retryPenalty - latencyPenalty);
}

function evaluateCase(summaryText, payload) {
  const sections = splitSections(summaryText);
  const [trailhead = '', markers = '', trajectory = '', newTrail = ''] = sections;
  const markerBullets = markers.split('\n').filter((l) => l.trim().startsWith('- '));
  const trajectoryParts = trajectory.split('\n').map((s) => s.trim()).filter(Boolean);
  const newTrailBullets = newTrail.split('\n').filter((l) => l.trim().startsWith('- '));

  const trailheadCount = sentenceCount(trailhead);
  const trajectoryRiskCount = sentenceCount(trajectoryParts[0] || '');
  const trajectoryOptimisticCount = sentenceCount(trajectoryParts[1] || '');

  const directiveHits = countDirectiveHits(`${trailhead} ${trajectory}`);
  const hasDirective = directiveHits > 0 || DIRECTIVE_RE.test(`${trailhead} ${trajectory}`);
  const bannedHits = BANNED_PHRASES.reduce(
    (acc, re) => acc + (re.test(summaryText) ? 1 : 0),
    0,
  );
  const hasBanned = bannedHits > 0;

  const contextTokens = [
    payload.industry,
    payload.role,
    payload.responsibilities,
    payload.warningLabel,
    payload.roleModelTrait,
  ]
    .map((v) => String(v || '').toLowerCase())
    .filter(Boolean);

  const normalizedSummary = String(summaryText || '').toLowerCase();
  const contextHits = contextTokens.filter((token) => token.length > 3 && normalizedSummary.includes(token.split(' ')[0])).length;

  const hasOutput = Boolean(String(summaryText || '').trim());
  const structureScore = intervalScore({
    value: sections.length,
    min: 4,
    max: 4,
    maxScore: 15,
    minScore: 1,
    stepPenalty: 5,
    hasOutput,
  });
  const trailheadScore = intervalScore({
    value: trailheadCount,
    min: 6,
    max: 7,
    maxScore: 15,
    minScore: 1,
    stepPenalty: 4,
    hasOutput,
  });
  const markerLeadScore = hasOutput
    ? startsWithExactMarkerLead(markers)
      ? 10
      : /^a few scenarios/i.test(markers)
        ? 8
        : /scenarios you may find yourself/i.test(markers)
          ? 6
          : markerBullets.length > 0
            ? 3
            : 1
    : 0;
  const markerBulletsScore = intervalScore({
    value: markerBullets.length,
    min: 3,
    max: 5,
    maxScore: 10,
    minScore: 1,
    stepPenalty: 3,
    hasOutput,
  });
  const trajectoryRiskScore = intervalScore({
    value: trajectoryRiskCount,
    min: 4,
    max: 4,
    maxScore: 7,
    minScore: 1,
    stepPenalty: 2,
    hasOutput,
  });
  const trajectoryOptimisticScore = intervalScore({
    value: trajectoryOptimisticCount,
    min: 2,
    max: 2,
    maxScore: 5,
    minScore: 1,
    stepPenalty: 2,
    hasOutput,
  });
  const trajectoryStructureScore = hasOutput ? (trajectoryParts.length >= 2 ? 3 : 1) : 0;
  const trajectoryScore = clamp(1, 15, trajectoryRiskScore + trajectoryOptimisticScore + trajectoryStructureScore);
  const newTrailScore = intervalScore({
    value: newTrailBullets.length,
    min: 5,
    max: 5,
    maxScore: 10,
    minScore: 1,
    stepPenalty: 2,
    hasOutput,
  });
  const directiveScore = hasOutput ? clamp(1, 10, 10 - (directiveHits * 3)) : 0;
  const bannedScore = hasOutput ? clamp(1, 5, 5 - (bannedHits * 2)) : 0;
  const contextScore = hasOutput ? clamp(1, 10, Math.round((contextHits / 5) * 10)) : 0;

  const qualityTotal = structureScore + trailheadScore + markerLeadScore + markerBulletsScore + trajectoryScore + newTrailScore + directiveScore + bannedScore + contextScore;

  let sentiment = 'Balanced';
  if (/(friction|risk|drift|strain|erode|stall|confusion)/i.test(summaryText) && !/(could|might|would)/i.test(summaryText)) {
    sentiment = 'Risk-heavy';
  } else if (/(momentum|confidence|clarity|growth|strong|trusted)/i.test(summaryText)) {
    sentiment = 'Constructive';
  }

  const notes = [];
  if (sections.length !== 4) notes.push('section-count');
  if (!(trailheadCount >= 6 && trailheadCount <= 7)) notes.push(`trailhead-sentences:${trailheadCount}`);
  if (!startsWithExactMarkerLead(markers)) notes.push('marker-lead');
  if (!(markerBullets.length >= 3 && markerBullets.length <= 5)) notes.push(`marker-bullets:${markerBullets.length}`);
  if (!(trajectoryParts.length >= 2 && trajectoryRiskCount >= 4 && trajectoryOptimisticCount >= 2)) notes.push(`trajectory:${trajectoryRiskCount}+${trajectoryOptimisticCount}`);
  if (newTrailBullets.length !== 5) notes.push(`newtrail-bullets:${newTrailBullets.length}`);
  if (hasDirective) notes.push('directive-language');
  if (hasBanned) notes.push('banned-phrase');
  if (contextHits < 2) notes.push(`context-hits:${contextHits}`);

  return {
    qualityTotal,
    sentiment,
    structureScore,
    trailheadScore,
    markerLeadScore,
    markerBulletsScore,
    trajectoryScore,
    newTrailScore,
    directiveScore,
    bannedScore,
    contextScore,
    sections: sections.length,
    trailheadCount,
    markerBullets: markerBullets.length,
    trajectoryRiskCount,
    trajectoryOptimisticCount,
    newTrailBullets: newTrailBullets.length,
    hasDirective,
    hasBanned,
    directiveHits,
    bannedHits,
    contextHits,
  };
}

function flattenPayload(payload) {
  const p = payload || {};
  const b = Array.isArray(p.behaviorDichotomies) ? p.behaviorDichotomies : [];
  const s = Array.isArray(p.societalResponses) ? p.societalResponses : [];
  const e = Array.isArray(p.energyDrains) ? p.energyDrains : [];
  const c = Array.isArray(p.crisisResponse) ? p.crisisResponse : [];
  const pb = Array.isArray(p.pushbackFeeling) ? p.pushbackFeeling : [];
  const lf = Array.isArray(p.leaderFuel) ? p.leaderFuel : [];

  return {
    answer_industry: p.industry || '',
    answer_department: p.department || '',
    answer_role: p.role || '',
    answer_responsibilities: p.responsibilities || '',
    answer_birthYear: p.birthYear || '',
    answer_teamSize: p.teamSize ?? '',
    answer_leadershipExperience: p.leadershipExperience ?? '',
    answer_careerExperience: p.careerExperience ?? '',
    answer_resourcePick: p.resourcePick || '',
    answer_projectApproach: p.projectApproach || '',
    answer_energyDrains_1: e[0] || '',
    answer_energyDrains_2: e[1] || '',
    answer_energyDrains_3: e[2] || '',
    answer_crisisResponse_1: c[0] || '',
    answer_crisisResponse_2: c[1] || '',
    answer_crisisResponse_3: c[2] || '',
    answer_crisisResponse_4: c[3] || '',
    answer_crisisResponse_5: c[4] || '',
    answer_pushbackFeeling_1: pb[0] || '',
    answer_pushbackFeeling_2: pb[1] || '',
    answer_pushbackFeeling_3: pb[2] || '',
    answer_roleModelTrait: p.roleModelTrait || '',
    answer_warningLabel: p.warningLabel || '',
    answer_leaderFuel_1: lf[0] || '',
    answer_leaderFuel_2: lf[1] || '',
    answer_leaderFuel_3: lf[2] || '',
    answer_leaderFuel_4: lf[3] || '',
    answer_leaderFuel_5: lf[4] || '',
    answer_leaderFuel_6: lf[5] || '',
    answer_proudMoment: p.proudMoment || '',
    answer_behaviorDichotomies_1: b[0] ?? '',
    answer_behaviorDichotomies_2: b[1] ?? '',
    answer_behaviorDichotomies_3: b[2] ?? '',
    answer_behaviorDichotomies_4: b[3] ?? '',
    answer_behaviorDichotomies_5: b[4] ?? '',
    answer_visibilityComfort: p.visibilityComfort || '',
    answer_decisionPace: p.decisionPace || '',
    answer_teamPerception: p.teamPerception || '',
    answer_selectedAgent: p.selectedAgent || '',
    answer_societalResponses_1: s[0] ?? '',
    answer_societalResponses_2: s[1] ?? '',
    answer_societalResponses_3: s[2] ?? '',
    answer_societalResponses_4: s[3] ?? '',
    answer_societalResponses_5: s[4] ?? '',
    answer_societalResponses_6: s[5] ?? '',
    answer_societalResponses_7: s[6] ?? '',
    answer_societalResponses_8: s[7] ?? '',
    answer_societalResponses_9: s[8] ?? '',
    answer_societalResponses_10: s[9] ?? '',
  };
}

async function requestSummary(payload, timeoutMs = 90000) {
  const fetchPromise = fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out at ${Math.round(timeoutMs / 1000)}s`)), timeoutMs);
  });
  const res = await Promise.race([fetchPromise, timeoutPromise]);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return String(data?.aiSummary || '');
}

function toCsvValue(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => toCsvValue(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function run() {
  const outDir = path.join(process.cwd(), 'reports');
  await mkdir(outDir, { recursive: true });

  const jobs = [];
  const repeatsPerPersona = 10;
  let batchCounter = 1;
  for (const item of CASES) {
    for (let runIdx = 1; runIdx <= repeatsPerPersona; runIdx += 1) {
      jobs.push({
        batchNumber: `B${String(batchCounter).padStart(3, '0')}`,
        personaName: item.caseId,
        runWithinPersona: runIdx,
        payload: {
          ...item.payload,
          sessionId: `${item.payload.sessionId}-r${runIdx}`,
        },
      });
      batchCounter += 1;
    }
  }

  const results = [];
  const concurrency = 2;
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= jobs.length) return;

      const job = jobs[idx];
      const startedAt = Date.now();
      let aiSummary = '';
      let status = 'ok';
      let error = '';
      let attemptCount = 0;

      try {
        attemptCount += 1;
        aiSummary = await requestSummary(job.payload, 90000);
      } catch (e1) {
        try {
          attemptCount += 1;
          aiSummary = await requestSummary(job.payload, 90000);
          status = 'ok_after_retry';
        } catch (e2) {
          status = 'request_error';
          error = String(e2?.message || e2 || e1?.message || e1);
        }
      }

      const evalResult = aiSummary
        ? evaluateCase(aiSummary, job.payload)
        : {
            qualityTotal: 0,
            sentiment: 'No output',
            structureScore: 0,
            trailheadScore: 0,
            markerLeadScore: 0,
            markerBulletsScore: 0,
            trajectoryScore: 0,
            newTrailScore: 0,
            directiveScore: 0,
            bannedScore: 0,
            contextScore: 0,
            sections: 0,
            trailheadCount: 0,
            markerBullets: 0,
            trajectoryRiskCount: 0,
            trajectoryOptimisticCount: 0,
            newTrailBullets: 0,
            hasDirective: false,
            hasBanned: false,
            directiveHits: 0,
            bannedHits: 0,
            contextHits: 0,
          };
      const latencyMs = Date.now() - startedAt;
      const reliabilityScore = computeReliabilityScore({ status, attemptCount, latencyMs });
      const deliveryTotal = status === 'request_error'
        ? 0
        : Math.round((evalResult.qualityTotal * reliabilityScore) / 100);

      results.push({
        batchNumber: job.batchNumber,
        personaName: job.personaName,
        ...flattenPayload(job.payload),
        ...splitSummaryForCsv(aiSummary),
        rubric_structure: evalResult.structureScore,
        rubric_trailhead: evalResult.trailheadScore,
        rubric_markerLead: evalResult.markerLeadScore,
        rubric_markerBullets: evalResult.markerBulletsScore,
        rubric_trajectory: evalResult.trajectoryScore,
        rubric_newTrail: evalResult.newTrailScore,
        rubric_noDirective: evalResult.directiveScore,
        rubric_noBannedPhrase: evalResult.bannedScore,
        rubric_contextGrounding: evalResult.contextScore,
        rubric_total: evalResult.qualityTotal,
        reliability_score: reliabilityScore,
        delivery_total: deliveryTotal,
        request_status: status,
        attempt_count: attemptCount,
        latency_ms: latencyMs,
        error_message: error,
      });
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  results.sort((a, b) => String(a.batchNumber).localeCompare(String(b.batchNumber)));

  const headers = [
    'batchNumber',
    'personaName',
    'answer_industry',
    'answer_department',
    'answer_role',
    'answer_responsibilities',
    'answer_birthYear',
    'answer_teamSize',
    'answer_leadershipExperience',
    'answer_careerExperience',
    'answer_resourcePick',
    'answer_projectApproach',
    'answer_energyDrains_1',
    'answer_energyDrains_2',
    'answer_energyDrains_3',
    'answer_crisisResponse_1',
    'answer_crisisResponse_2',
    'answer_crisisResponse_3',
    'answer_crisisResponse_4',
    'answer_crisisResponse_5',
    'answer_pushbackFeeling_1',
    'answer_pushbackFeeling_2',
    'answer_pushbackFeeling_3',
    'answer_roleModelTrait',
    'answer_warningLabel',
    'answer_leaderFuel_1',
    'answer_leaderFuel_2',
    'answer_leaderFuel_3',
    'answer_leaderFuel_4',
    'answer_leaderFuel_5',
    'answer_leaderFuel_6',
    'answer_proudMoment',
    'answer_behaviorDichotomies_1',
    'answer_behaviorDichotomies_2',
    'answer_behaviorDichotomies_3',
    'answer_behaviorDichotomies_4',
    'answer_behaviorDichotomies_5',
    'answer_visibilityComfort',
    'answer_decisionPace',
    'answer_teamPerception',
    'answer_selectedAgent',
    'answer_societalResponses_1',
    'answer_societalResponses_2',
    'answer_societalResponses_3',
    'answer_societalResponses_4',
    'answer_societalResponses_5',
    'answer_societalResponses_6',
    'answer_societalResponses_7',
    'answer_societalResponses_8',
    'answer_societalResponses_9',
    'answer_societalResponses_10',
    'summary_trailhead',
    'summary_trail_markers',
    'summary_trajectory',
    'summary_new_trail',
    'rubric_structure',
    'rubric_trailhead',
    'rubric_markerLead',
    'rubric_markerBullets',
    'rubric_trajectory',
    'rubric_newTrail',
    'rubric_noDirective',
    'rubric_noBannedPhrase',
    'rubric_contextGrounding',
    'rubric_total',
    'reliability_score',
    'delivery_total',
    'request_status',
    'attempt_count',
    'latency_ms',
    'error_message',
  ];

  const csv = toCsv(results, headers);
  const csvPath = path.join(outDir, 'summary_eval_100.csv');
  await writeFile(csvPath, csv, 'utf8');

  const okRows = results.filter((r) => String(r.request_status) !== 'request_error');
  const avgQuality = okRows.length
    ? (okRows.reduce((acc, r) => acc + Number(r.rubric_total || 0), 0) / okRows.length).toFixed(1)
    : '0.0';
  const avgDelivery = okRows.length
    ? (okRows.reduce((acc, r) => acc + Number(r.delivery_total || 0), 0) / okRows.length).toFixed(1)
    : '0.0';
  const fails = results.filter((r) => String(r.request_status) === 'request_error').length;

  const highRiskPatterns = results
    .filter((r) => Number(r.rubric_noDirective) < 10 || Number(r.rubric_noBannedPhrase) < 5)
    .map((r) => `${r.batchNumber}:dir=${r.rubric_noDirective},ban=${r.rubric_noBannedPhrase}`);

  const overview = [
    `# Summary Eval (100 cases)`,
    ``,
    `- Endpoint: ${ENDPOINT}`,
    `- Cases executed: ${results.length}`,
    `- Successful responses: ${okRows.length}`,
    `- Failed responses: ${fails}`,
    `- Average quality score (0-100): ${avgQuality}`,
    `- Average delivery score (0-100): ${avgDelivery}`,
    `- Concurrency: ${concurrency}`,
    ``,
    `## High-risk pattern flags`,
    highRiskPatterns.length ? highRiskPatterns.map((x) => `- ${x}`).join('\n') : '- none',
    ``,
    `CSV: ${csvPath}`,
  ].join('\n');

  const mdPath = path.join(outDir, 'summary_eval_100_overview.md');
  await writeFile(mdPath, overview, 'utf8');

  console.log(JSON.stringify({ csvPath, mdPath, avgQuality, avgDelivery, failed: fails }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
