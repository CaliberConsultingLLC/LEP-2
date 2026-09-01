/**
 * Proposed intake → trait coverage, v2. NOT yet wired into the product.
 *
 * Two changes over v1:
 *
 * 1. The ten instinct questions are mapped to SUB-TRAITS. In v1 they carry only
 *    `traitsUndermined` at core-trait level, naming three cores and zero
 *    sub-traits — so questions that plainly ask about psychological safety,
 *    norm setting, and values alignment contributed no evidence to those
 *    sub-traits. The questions already existed; the mapping did not.
 *
 * 2. Seven new behavior questions cover clusters with no signal at all, even
 *    indirect: the Accountability group, the Change group, deadline behavior,
 *    cross-boundary influence, and systems diagnosis.
 *
 * These mappings are a proposal derived from question wording. The taxonomy
 * owner should confirm each before this is treated as authoritative.
 */

// --- 1. Instinct questions, mapped at sub-trait level -----------------------
export const INSTINCT_SUBTRAIT_MAP = {
  norm_leader_answers_1: [
    { coreId: 'teamDevelopment', subId: 'coaching', weight: 1.4, reverse: true },
    { coreId: 'culture', subId: 'psychologicalSafety', weight: 0.8, reverse: true },
  ],
  norm_visible_reaction: [
    { coreId: 'emotionalIntelligence', subId: 'selfRegulation', weight: 1.5, reverse: true },
    { coreId: 'culture', subId: 'psychologicalSafety', weight: 1.0, reverse: true },
  ],
  norm_blanket_corrections: [
    { coreId: 'teamDevelopment', subId: 'feedback', weight: 1.5, reverse: true },
    { coreId: 'culture', subId: 'psychologicalSafety', weight: 1.0, reverse: true },
  ],
  norm_hiring_fit: [
    { coreId: 'culture', subId: 'valuesAlignment', weight: 1.5 },
    { coreId: 'teamDevelopment', subId: 'talentIdentification', weight: 1.0 },
  ],
  norm_dissent_growth: [
    { coreId: 'culture', subId: 'psychologicalSafety', weight: 1.6 },
    { coreId: 'culture', subId: 'normSetting', weight: 0.8 },
  ],
  norm_one_liners: [
    { coreId: 'culture', subId: 'normSetting', weight: 1.5 },
    { coreId: 'culture', subId: 'cultureShaping', weight: 1.0 },
  ],
  norm_more_answers: [
    { coreId: 'teamDevelopment', subId: 'coaching', weight: 1.3, reverse: true },
    { coreId: 'communication', subId: 'listening', weight: 1.0, reverse: true },
  ],
  norm_metrics_control: [
    { coreId: 'teamDevelopment', subId: 'performanceManagement', weight: 1.3 },
    { coreId: 'culture', subId: 'employeeExperience', weight: 0.9 },
  ],
  norm_repeat_vision: [
    { coreId: 'strategicThinking', subId: 'vision', weight: 1.3 },
    { coreId: 'culture', subId: 'normSetting', weight: 0.9 },
  ],
  norm_share_struggles: [
    { coreId: 'accountability', subId: 'transparency', weight: 1.5 },
    { coreId: 'culture', subId: 'psychologicalSafety', weight: 1.2 },
    { coreId: 'emotionalIntelligence', subId: 'selfAwareness', weight: 0.9 },
  ],
};

// --- 2. Seven new behavior questions ----------------------------------------
// Each targets sub-traits that no existing question evidences, directly or
// indirectly. Kept in the same shape as v1's BEHAVIOR_SIGNAL_MAP so the two can
// merge without special-casing.
export const NEW_QUESTIONS = [
  {
    id: 'a2',
    fieldId: 'honestRewind',
    theme: 'The Honest Rewind',
    prompt: 'You got something wrong and the team saw it. What actually happens next?',
    format: 'open',
    targets: ['personalAccountability', 'transparency', 'integrity'],
    signals: [
      { coreId: 'accountability', subId: 'personalAccountability', weight: 1.6 },
      { coreId: 'accountability', subId: 'transparency', weight: 1.2 },
      { coreId: 'accountability', subId: 'integrity', weight: 0.9 },
    ],
  },
  {
    id: 'c1',
    fieldId: 'directionChange',
    theme: 'The Direction Change',
    prompt: 'Direction changes above you and the reason is not explained. What do you do first?',
    format: 'choice',
    options: [
      'Translate it into a plan and give my team the best why I can.',
      'Pass it along as-is — the reasoning is not mine to invent.',
      'Push back through channels until the reason is explained.',
      'Re-plan everything privately before telling anyone.',
      'Keep running the old direction until someone makes me stop.',
      'Adapt fast and move — reasons catch up later.',
    ],
    targets: ['changeLeadership', 'adaptability'],
    signals: [
      { coreId: 'changeAdaptability', subId: 'changeLeadership', weight: 1.6 },
      { coreId: 'changeAdaptability', subId: 'adaptability', weight: 1.1 },
    ],
  },
  {
    id: 'c2',
    fieldId: 'shelvedIdea',
    theme: 'The Shelved Idea',
    prompt: 'Something your team tried did not work. What happens to that idea afterwards?',
    format: 'open',
    targets: ['innovation', 'learningAgility', 'organizationalLearning'],
    signals: [
      { coreId: 'changeAdaptability', subId: 'innovation', weight: 1.4 },
      { coreId: 'changeAdaptability', subId: 'learningAgility', weight: 1.4 },
      { coreId: 'culture', subId: 'organizationalLearning', weight: 1.2 },
    ],
  },
  {
    id: 'e1',
    fieldId: 'slippingDate',
    theme: 'The Slipping Date',
    prompt: 'A date you committed to is going to slip. When and how does anyone find out?',
    format: 'choice',
    options: [
      'I flag it the moment I know, with a revised plan attached.',
      'I say something near the date, once I am certain how bad it is.',
      'I add hours or people and make the date happen somehow.',
      'I quietly cut scope so the date holds.',
      'I renegotiate what done means.',
      'The date passes, then I explain.',
    ],
    targets: ['deadlineManagement', 'transparency'],
    signals: [
      { coreId: 'execution', subId: 'deadlineManagement', weight: 1.6 },
      { coreId: 'accountability', subId: 'transparency', weight: 1.0 },
    ],
  },
  {
    id: 'x1',
    fieldId: 'stalledAsk',
    theme: 'The Stalled Ask',
    prompt: 'You need help from a team you do not manage and they are not moving. What two options describe your approach?',
    format: 'choice',
    select: 2,
    options: [
      'Make the case with data and business impact.',
      'Trade something they need.',
      'Escalate to someone with authority over both of us.',
      'Leverage a current relationship on that team to find a yes.',
      'Make it easy — do part of their work for them.',
      'Create visibility — public status has a way of moving people.',
      'Schedule a one-on-one with this team\u2019s leader to revisit the topic.',
      'Go around this team and seek help elsewhere.',
    ],
    targets: ['crossFunctionalCollaboration', 'stakeholderManagement'],
    signals: [
      { coreId: 'collaboration', subId: 'crossFunctionalCollaboration', weight: 1.6 },
      { coreId: 'collaboration', subId: 'stakeholderManagement', weight: 1.0 },
    ],
  },
  {
    id: 'x2',
    fieldId: 'uphillPitch',
    theme: 'The Uphill Pitch',
    prompt: 'You have to change a mind that outranks you. How do you actually go about it?',
    // Same drag-to-rank interaction as The Fire Drill and The Leader Fuel —
    // one label, one pattern. Scoring reads the extremes: the top is most like
    // them, the bottom least, and the rejection is as diagnostic as the pick.
    format: 'ranking',
    options: [
      'Let the evidence make the case \u2014 data, or a working result.',
      'Pre-wire allies one conversation at a time.',
      'Ask questions until they arrive at it themselves.',
      'Make the case head-on in the room.',
      'Put it in writing and let them sit with it.',
      'Mostly I do not — I execute their call and revisit later.',
    ],
    targets: ['influence', 'stakeholderConsideration'],
    signals: [
      { coreId: 'communication', subId: 'influence', weight: 1.6 },
      { coreId: 'decisionMaking', subId: 'stakeholderConsideration', weight: 1.1 },
    ],
  },
  {
    id: 's1',
    fieldId: 'recurringProblem',
    theme: 'The Boomerang',
    prompt: 'The same problem keeps occurring. What two actions would help the most?',
    format: 'choice',
    select: 2,
    options: [
      'Map the system that keeps producing it before touching anything.',
      'Go watch it happen where it happens.',
      'Ask the people closest to it what they see.',
      'Fix it again, better this time.',
      'Add a check or automation so it gets caught.',
      'Look at who keeps being involved.',
      'Rebuild the process from scratch.',
      'Pull the record on every past occurrence and look for what they share.',
    ],
    targets: ['systemsThinking', 'patternRecognition', 'processImprovement'],
    signals: [
      { coreId: 'strategicThinking', subId: 'systemsThinking', weight: 1.5 },
      { coreId: 'strategicThinking', subId: 'patternRecognition', weight: 1.4 },
      { coreId: 'execution', subId: 'processImprovement', weight: 1.2 },
    ],
  },
];

/** Every sub-trait id v2 adds an evidence path for. */
export function v2ReachableSubIds() {
  const ids = new Set();
  Object.values(INSTINCT_SUBTRAIT_MAP).forEach((sigs) => sigs.forEach((s) => ids.add(s.subId)));
  NEW_QUESTIONS.forEach((q) => q.signals.forEach((s) => ids.add(s.subId)));
  return ids;
}

export default { INSTINCT_SUBTRAIT_MAP, NEW_QUESTIONS, v2ReachableSubIds };
