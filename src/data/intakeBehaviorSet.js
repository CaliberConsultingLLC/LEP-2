// The Daily Behaviors chapter, in the approved order.
//
// Choices up front, the three ranking questions batched at 6-8, the
// pick-several family at 9-11, a run of single choices, the sliders, then the
// three open stories behind their own intro screen. New-question definitions
// live in intakeTraitCoverageV2.js so wording and trait signals cannot drift.
//
// This lived inside IntakeForm as a `useMemo(..., [])` — one array for the
// life of the mount, because rebuilding it each render re-fired two effects
// that write context state and that was the "Maximum update depth exceeded"
// storm. Nothing in it reads component state, so a module constant is the same
// fix and a stronger one: it is now built once for the life of the tab.
//
// It moved out because the read-only ledger needs it too. ReviewAndLock reads
// every question back from this array, and /revisit/intake draws that ledger
// without mounting the form — so the questions a leader is shown on the way
// out have to be the same objects they were shown on the way in, not a second
// copy that can drift.

import { buildNewQuestionEntry, STORY_INTRO_ENTRY } from './newIntakeQuestions';

export const INTAKE_BEHAVIOR_SET = [
  {
    id: 'resourcePick',
    theme: 'The Quick Pick',
    prompt: 'When resources are tight, which do you usually adjust first?',
    type: 'radio',
    options: ['Time', 'Budget', 'Expectations', 'Scope'],
  },
  {
    id: 'projectApproach',
    theme: 'The Team Puzzle',
    prompt: "You're given a complex project with a tight deadline. Choose the action you'd most likely take first.",
    type: 'radio',
    options: [
      'Create a detailed plan to guide the team.',
      'Dive into the most challenging aspect to lead by example.',
      'Gather the team for a collaborative brainstorming session.',
      'Focus on identifying and mitigating the biggest risks.',
      'Distribute ownership with clear check-ins and criteria.',
      'Ask clarifying questions before diving in.',
    ],
  },
  buildNewQuestionEntry('directionChange'),
  buildNewQuestionEntry('slippingDate'),
  {
    id: 'energyDrains',
    theme: 'The Energy Drain',
    prompt: 'Which three situations would you most prefer to minimize throughout the day?',
    type: 'multi-select',
    options: [
      'Repeating myself to ensure understanding',
      'Following up when someone misses a commitment',
      'Decoding unspoken concerns from the team',
      'Navigating frequent changes in priorities',
      'Meetings with limited or no outcomes',
      'Mediating conflicts within the team',
      'Pursuing goals that lack clear direction',
      'Balancing differing expectations from stakeholders',
    ],
    limit: 3,
    minSelections: 3,
  },
  {
    id: 'crisisResponse',
    theme: 'The Fire Drill',
    prompt: 'A crisis hits your team unexpectedly. Rank the following responses:',
    type: 'ranking',
    options: [
      'Maintain composure and provide clear, decisive direction to the team.',
      'Immediately gather the team to collaborate on potential solutions.',
      "Clarify what is known, what's open, and what's next.",
      'Delegate ownership to team members while providing support from the sidelines.',
      'Jump in directly to handle the most critical aspects myself.',
    ],
    scale: { top: 'like me', bottom: 'like me' },
  },
  buildNewQuestionEntry('uphillPitch'),
  {
    id: 'leaderFuel',
    theme: "The Leader's Fuel",
    prompt: 'Rank the following outcomes that energize you most.',
    type: 'ranking',
    options: [
      'Seeing the team gel and succeed together',
      'Closing out a tough project completely',
      'Solving a problem no one else could',
      'Hearing the team say they learned something',
      'My team getting the recognition it deserves',
      'Turning chaos into quality',
    ],
    scale: { top: 'Energize Me Most', bottom: 'Energize Me Least' },
  },
  buildNewQuestionEntry('stalledAsk'),
  buildNewQuestionEntry('recurringProblem'),
  {
    id: 'pushbackFeeling',
    theme: 'The Pushback Moment',
    prompt:
      'When someone challenges your authority, questions your judgment, or pushes back on your plan — what emotions do you feel in the moment? (Select all that apply.)',
    type: 'multi-select',
    options: [
      'Defensive', 'Frustrated', 'Curious', 'Dismissive', 'Apprehensive',
      'Motivated', 'Insecure', 'Irritated', 'Open', 'Doubtful',
      'Calm', 'Competitive', 'Humbled', 'Surprised', 'Relieved',
      'Proud', 'Confused', 'Nothing'
    ],
  },
  {
    id: 'roleModelTrait',
    theme: 'The Role Model',
    prompt:
      'Think of a leader you admire (real or fictional) and complete this sentence:',
    type: 'radio',
    options: [
      'communicated',
      'made decisions',
      'thought strategically',
      'executed & followed through',
      'developed their team',
      'shaped culture',
      'built relationships',
      'handled challenges',
      'inspired others',
      'balanced priorities',
    ],
  },
  {
    id: 'warningLabel',
    theme: 'The Warning Label',
    prompt: 'If your leadership style had a "warning label," what would it be?',
    type: 'radio',
    options: [
      'Caution: May keep polishing past the finish line',
      'Warning: Moves fast—keep up!',
      'Winding Road: Comfortable moving before the path is clear',
      'Flammable: Sparks fly under pressure',
      'Fragile: Avoid too much pushback',
      'Falling Rocks: Tendency to over-delegate',
      'Deer Crossing: May jump into your lane',
      'Wrong Way: My way or the highway',
    ],
  },
  {
    id: 'visibilityComfort',
    theme: 'The Spotlight',
    prompt:
      'How comfortable are you leading in high-visibility situations (presentations, crises, or leadership reviews)?',
    type: 'radio',
    options: [
      'I thrive in the spotlight.',
      'I can handle it but prefer smaller settings.',
        "I don't think much about it either way.",
      'I prefer to lead behind the scenes.',
    ],
  },
  {
    id: 'decisionPace',
    theme: 'The Lesson Loop',
    prompt: 'When something goes wrong, what do you prioritize?',
    type: 'radio',
    options: [
      { primary: 'The Fix', secondary: 'Get things back on track' },
      { primary: 'The Feedback', secondary: 'Learn where things went wrong' },
      { primary: 'The Standard', secondary: 'Protect the quality bar before moving on' },
    ],
  },
  {
    id: 'teamPerception',
    theme: 'The Performance Check',
    prompt: 'When a team member is not meeting expectations, what do you do first?',
    type: 'radio',
    options: [
      'Name the gap in a private conversation and reset the expectation.',
      'Observe for patterns and gather context before taking action.',
      'Provide support and resources, then confirm the new bar together.',
      'Reassign tasks or adjust their responsibilities to better fit their strengths.',
      'Set clear expectations, an owner, and a check-in date to close the gap.',
      'Involve HR or escalate to higher management for guidance.',
    ],
  },
  {
    id: 'behaviorDichotomies',
    theme: 'The Balance Line',
    prompt:
      'Consider the following behaviors and select where you most naturally fit on the scale.',
    type: 'sliders',
    sliders: [
      { left: 'Prone to listen', right: 'Prone to speak', min: 1, max: 10, step: 1 },
      { left: 'Critical', right: 'Encouraging', min: 1, max: 10, step: 1 },
      { left: 'Detail-Oriented', right: 'Big-picture-oriented', min: 1, max: 10, step: 1 },
      { left: 'Directive', right: 'Empowering', min: 1, max: 10, step: 1 },
      { left: 'Prefer clarity before moving', right: 'Move forward while clarity forms', min: 1, max: 10, step: 1 },
      { left: 'Thorough communicator', right: 'Concise communicator', min: 1, max: 10, step: 1 },
    ],
  },
  STORY_INTRO_ENTRY,
  buildNewQuestionEntry('honestRewind'),
  {
    id: 'proudMoment',
    theme: 'The Highlight Reel',
    prompt: 'Consider a significant team accomplishment and describe how your contribution made it possible.',
    type: 'text',
  },
  buildNewQuestionEntry('shelvedIdea'),
];

export default INTAKE_BEHAVIOR_SET;
